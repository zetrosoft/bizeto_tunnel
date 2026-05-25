package db

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"

	_ "github.com/lib/pq"
)

// Repository mengelola interaksi dengan PostgreSQL.
type Repository struct {
	db *sql.DB
}

// NewRepository membuat instans baru dari Repository.
func NewRepository(dataSourceName string) (*Repository, error) {
	db, err := sql.Open("postgres", dataSourceName)
	if err != nil {
		return nil, err
	}

	if err := db.Ping(); err != nil {
		return nil, err
	}

	return &Repository{db: db}, nil
}

func (r *Repository) Close() error {
	return r.db.Close()
}

// IsDomainRegistered mengecek apakah domain terdaftar di database.
func (r *Repository) IsDomainRegistered(ctx context.Context, domain string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM domains WHERE domain_name = $1)`
	err := r.db.QueryRowContext(ctx, query, domain).Scan(&exists)
	return exists, err
}

// ValidateKey mengecek validitas API Key (Hashed) dan mengambil domain terkait.
func (r *Repository) ValidateKey(ctx context.Context, apiKey, hostname string) (apiKeyID string, userID string, domain string, err error) {
	// Fase 2: Pencegahan Serangan "Re-Hashing Lockout"
	// Kita hanya mendukung API Key yang sudah di-hash di database. 
	// Logika migrasi otomatis dihapus karena berisiko DoS.
	
	h := sha256.New()
	h.Write([]byte(apiKey))
	keyHash := hex.EncodeToString(h.Sum(nil))

	query := `
		SELECT k.id, k.user_id, d.domain_name 
		FROM api_keys k
		JOIN domains d ON k.user_id = d.user_id
		WHERE k.key_value = $1 AND k.is_active = TRUE
		LIMIT 1`

	err = r.db.QueryRowContext(ctx, query, keyHash).Scan(&apiKeyID, &userID, &domain)
	if err != nil {
		return "", "", "", fmt.Errorf("invalid or inactive API key")
	}

	// Update metadata penggunaan
	_, _ = r.db.ExecContext(ctx, "UPDATE api_keys SET last_used_at = NOW(), last_hostname = $1 WHERE id = $2", hostname, apiKeyID)
	
	return apiKeyID, userID, domain, nil
}

// LogSession mencatat sesi tunnel baru dengan metadata perangkat.
func (r *Repository) LogSession(ctx context.Context, domainName string, apiKeyID string, ip, version, hostname, osInfo, machineID string) (string, error) {
	var sessionID string
	var domainID string

	// Dapatkan Domain ID
	err := r.db.QueryRowContext(ctx, "SELECT id FROM domains WHERE domain_name = $1", domainName).Scan(&domainID)
	if err != nil {
		return "", err
	}

	query := `
		INSERT INTO tunnel_sessions (domain_id, api_key_id, agent_ip, agent_version, hostname, os_info, machine_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`

	err = r.db.QueryRowContext(ctx, query, domainID, apiKeyID, ip, version, hostname, osInfo, machineID).Scan(&sessionID)
	return sessionID, err
}

// CloseSession menandai sesi tunnel telah berakhir.
func (r *Repository) CloseSession(ctx context.Context, sessionID string) error {
	_, err := r.db.ExecContext(ctx, "UPDATE tunnel_sessions SET disconnected_at = NOW() WHERE id = $1", sessionID)
	return err
}

// UpdateSessionStats memperbarui statistik bandwidth untuk sesi yang sedang aktif.
func (r *Repository) UpdateSessionStats(ctx context.Context, domainName string, bytesIn, bytesOut int64) error {
	query := `
		UPDATE tunnel_sessions 
		SET bytes_in = $1, bytes_out = $2 
		WHERE domain_id = (SELECT id FROM domains WHERE domain_name = $3) 
		AND disconnected_at IS NULL`
	_, err := r.db.ExecContext(ctx, query, bytesIn, bytesOut, domainName)
	return err
}

// UpdateSessionStatsIncrement menambah statistik bandwidth untuk sesi yang sedang aktif secara inkremental.
func (r *Repository) UpdateSessionStatsIncrement(ctx context.Context, domainName string, bytesIn, bytesOut int64) error {
	if bytesIn == 0 && bytesOut == 0 {
		return nil
	}
	query := `
		UPDATE tunnel_sessions 
		SET bytes_in = bytes_in + $1, bytes_out = bytes_out + $2 
		WHERE domain_id = (SELECT id FROM domains WHERE domain_name = $3) 
		AND disconnected_at IS NULL`
	_, err := r.db.ExecContext(ctx, query, bytesIn, bytesOut, domainName)
	return err
}

// InsertTrafficLog menyimpan log audit trafik ke database secara permanen.
func (r *Repository) InsertTrafficLog(ctx context.Context, log any) error {
	// Kita gunakan map[string]interface atau struct anonim agar fleksibel dengan Go internal/tunnel.TrafficLog
	// Tapi karena kita ingin type safety, kita asumsikan data sudah divalidasi di level tunnel.
	l := log.(struct {
		Domain        string
		Method        string
		Path          string
		RemoteIP      string
		RemotePort    int
		Status        int
		UserAgent     string
		Referer       string
		Protocol      string
		TLSVersion    string
		LatencyMS     int
		BytesSent     int64
		BytesReceived int64
		AgentHostname string
		AgentMAC      string
	})

	query := `
		INSERT INTO traffic_logs (
			domain_id, remote_ip, remote_port, method, path, status_code, 
			user_agent, referer, tls_version, protocol, 
			agent_hostname, agent_mac_address, bytes_sent, bytes_received, latency_ms
		) VALUES (
			(SELECT id FROM domains WHERE domain_name = $1), 
			$2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
		)`

	_, err := r.db.ExecContext(ctx, query, 
		l.Domain, l.RemoteIP, l.RemotePort, l.Method, l.Path, l.Status,
		l.UserAgent, l.Referer, l.TLSVersion, l.Protocol,
		l.AgentHostname, l.AgentMAC, l.BytesSent, l.BytesReceived, l.LatencyMS,
	)
	return err
}

// GetTrafficLogs mendapatkan riwayat log audit untuk user tertentu.
func (r *Repository) GetTrafficLogs(ctx context.Context, userID string, limit int) ([]map[string]interface{}, error) {
	query := `
		SELECT l.*, d.domain_name 
		FROM traffic_logs l
		JOIN domains d ON l.domain_id = d.id
		WHERE d.user_id = $1
		ORDER BY l.timestamp DESC
		LIMIT $2`

	rows, err := r.db.QueryContext(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		// ... scanning logic based on actual columns
	}
	return results, nil
}

// ActivateSubscription mengaktifkan paket langganan untuk user.
func (r *Repository) ActivateSubscription(ctx context.Context, userID, planID string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Nonaktifkan subscription lama
	_, err = tx.ExecContext(ctx, "DELETE FROM subscriptions WHERE user_id = $1", userID)
	if err != nil {
		return err
	}

	// 2. Tambah subscription baru
	query := `
		INSERT INTO subscriptions (user_id, plan_id, status, started_at, expires_at)
		VALUES ($1, $2, 'ACTIVE', NOW(), NOW() + INTERVAL '31 days')`
	_, err = tx.ExecContext(ctx, query, userID, planID)
	if err != nil {
		return err
	}

	return tx.Commit()
}
