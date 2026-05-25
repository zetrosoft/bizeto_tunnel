package db

import (
	"context"
	"database/sql"
	"fmt"
	"log"
)

// BandwidthStatus merepresentasikan status kuota bandwidth pengguna.
type BandwidthStatus struct {
	Purchased   int64   `json:"total_bytes_purchased"`
	Used        int64   `json:"total_bytes_used"`
	BytesIn     int64   `json:"total_bytes_in"`
	BytesOut    int64   `json:"total_bytes_out"`
	IsThrottled bool    `json:"is_throttled"`
	ExpiresAt   *string `json:"expires_at"`       // Jika null, berarti permanen (sudah pernah topup)
	TrialStart  *string `json:"trial_started_at"` // Waktu mulai trial
}

// GetBandwidthStatus mengambil status kuota pengguna berdasarkan userID.
func (r *Repository) GetBandwidthStatus(ctx context.Context, userID string) (BandwidthStatus, error) {
	var status BandwidthStatus
	query := `
		SELECT total_bytes_purchased, total_bytes_used, total_bytes_in, total_bytes_out, is_throttled, CAST(expires_at AS VARCHAR), CAST(trial_started_at AS VARCHAR)
		FROM user_bandwidth_quota 
		WHERE user_id = $1`
	
	err := r.db.QueryRowContext(ctx, query, userID).Scan(&status.Purchased, &status.Used, &status.BytesIn, &status.BytesOut, &status.IsThrottled, &status.ExpiresAt, &status.TrialStart)
	if err != nil {
		if err == sql.ErrNoRows {
			// Row baru akan dibuat di InitializeTrial saat Agent pertama kali connect dengan MAC Address
			return BandwidthStatus{Purchased: 0, Used: 0, BytesIn: 0, BytesOut: 0, IsThrottled: true}, nil
		}
		return status, err
	}
	
	return status, nil
}

// InitializeTrial mendaftarkan MAC address dan memberikan bonus 1GB (HANYA jika MAC belum pernah terdaftar).
func (r *Repository) InitializeTrial(ctx context.Context, userID, macAddr string) error {
	// 1. Cek apakah MAC sudah pernah dipakai oleh user mana pun (KUNCI UTAMA)
	var existingUserID string
	err := r.db.QueryRowContext(ctx, "SELECT user_id FROM user_bandwidth_quota WHERE trial_mac_address = $1", macAddr).Scan(&existingUserID)
	
	if err == nil {
		// MAC ditemukan. Jika milik user yang berbeda, tolak pemberian bonus/free tier baru.
		if existingUserID != userID {
			log.Printf("[SECURITY] User %s attempted to claim trial using MAC %s already used by user %s", userID, macAddr, existingUserID)
			return fmt.Errorf("this device hardware ID has already claimed a trial/bonus")
		}
		// Jika milik user yang sama, biarkan lewat (mungkin re-koneksi)
		return nil
	}

	if err != sql.ErrNoRows {
		return err
	}

	// 2. MAC belum pernah terdaftar. Berikan Free Tier (1GB Bonus + 30 Days Expiry)
	query := `
		INSERT INTO user_bandwidth_quota (user_id, total_bytes_purchased, expires_at, trial_mac_address, trial_started_at)
		VALUES ($1, 1073741824, NOW() + INTERVAL '30 days', $2, NOW())
		ON CONFLICT (user_id) DO UPDATE SET
			trial_mac_address = EXCLUDED.trial_mac_address,
			trial_started_at = COALESCE(user_bandwidth_quota.trial_started_at, EXCLUDED.trial_started_at)`
	
	_, err = r.db.ExecContext(ctx, query, userID, macAddr)
	return err
}

// GetBandwidthStatusByDomain mengambil status kuota pengguna berdasarkan domain tunnel.
func (r *Repository) GetBandwidthStatusByDomain(ctx context.Context, domain string) (BandwidthStatus, error) {
	var status BandwidthStatus
	query := `
		SELECT q.total_bytes_purchased, q.total_bytes_used, q.total_bytes_in, q.total_bytes_out, q.is_throttled, CAST(q.expires_at AS VARCHAR), CAST(q.trial_started_at AS VARCHAR)
		FROM user_bandwidth_quota q
		JOIN domains d ON q.user_id = d.user_id
		WHERE d.domain_name = $1`
	
	err := r.db.QueryRowContext(ctx, query, domain).Scan(&status.Purchased, &status.Used, &status.BytesIn, &status.BytesOut, &status.IsThrottled, &status.ExpiresAt, &status.TrialStart)
	if err != nil {
		if err == sql.ErrNoRows {
			return BandwidthStatus{Purchased: 0, Used: 0, BytesIn: 0, BytesOut: 0, IsThrottled: true}, nil
		}
		return status, err
	}
	
	return status, nil
}

// AddBandwidthQuota mencatat topup transaksi dan menambahkan kuota user.
func (r *Repository) AddBandwidthQuota(ctx context.Context, userID string, amountIDR, discountPercent float64, bytesAdded int64, invoiceID string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Masukkan ke transaksi
	queryTx := `
		INSERT INTO topup_transactions (user_id, amount_idr, discount_percent, bytes_added, xendit_invoice_id, status, paid_at)
		VALUES ($1, $2, $3, $4, $5, 'PAID', NOW())`
	_, err = tx.ExecContext(ctx, queryTx, userID, amountIDR, discountPercent, bytesAdded, invoiceID)
	if err != nil {
		return err
	}

	// 2. Tambahkan kuota, hapus masa aktif (expires_at = NULL menjadikan bonus 500MB permanen), dan buka throttle
	queryQuota := `
		INSERT INTO user_bandwidth_quota (user_id, total_bytes_purchased, is_throttled, expires_at)
		VALUES ($1, $2, FALSE, NULL)
		ON CONFLICT (user_id) DO UPDATE 
		SET total_bytes_purchased = user_bandwidth_quota.total_bytes_purchased + EXCLUDED.total_bytes_purchased,
		    is_throttled = FALSE,
			expires_at = NULL,
			last_synced_at = NOW()`
	_, err = tx.ExecContext(ctx, queryQuota, userID, bytesAdded)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// UpdateBandwidthUsage dipanggil oleh sync worker untuk memperbarui pemakaian.
// Mengembalikan bool (true jika baru saja menyentuh limit/perlu di throttle).
func (r *Repository) UpdateBandwidthUsage(ctx context.Context, domain string, addIn, addOut int64) (bool, error) {
	additionalBytes := addIn + addOut
	if additionalBytes <= 0 {
		return false, nil
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer tx.Rollback()

	// Ambil data quota
	var userID string
	var purchased, used int64
	var isThrottled, isExpired bool
	var expiresAt *string

	queryData := `
		SELECT q.user_id, q.total_bytes_purchased, q.total_bytes_used, q.is_throttled, 
		       (q.expires_at IS NOT NULL AND NOW() > q.expires_at) as is_expired,
			   CAST(q.expires_at AS VARCHAR)
		FROM user_bandwidth_quota q
		JOIN domains d ON q.user_id = d.user_id
		WHERE d.domain_name = $1`
	
	err = tx.QueryRowContext(ctx, queryData, domain).Scan(&userID, &purchased, &used, &isThrottled, &isExpired, &expiresAt)
	if err != nil {
		return false, err
	}

	// Update pemakaian
	newUsed := used + additionalBytes
	
	// Cek Logika Throttling Berjenjang:
	// 1. Jika sudah lewat 30 hari (is_expired) -> Throttle ON (Max 128kb/s)
	// 2. Jika kuota habis (used >= purchased) -> Throttle ON (Max 128kb/s)
	
	shouldThrottle := isThrottled
	if isExpired || (newUsed >= purchased) {
		shouldThrottle = true
	}

	queryUpdate := `
		UPDATE user_bandwidth_quota 
		SET total_bytes_used = total_bytes_used + $1, 
		    total_bytes_in = total_bytes_in + $2,
		    total_bytes_out = total_bytes_out + $3,
		    last_synced_at = NOW(),
			is_throttled = $4
		WHERE user_id = $5`
	
	_, err = tx.ExecContext(ctx, queryUpdate, additionalBytes, addIn, addOut, shouldThrottle, userID)
	if err != nil {
		return false, err
	}

	if err := tx.Commit(); err != nil {
		return false, err
	}

	return shouldThrottle, nil
}
