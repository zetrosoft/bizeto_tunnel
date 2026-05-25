package db

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
)

type User struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	FullName  string `json:"full_name"`
	AvatarURL string `json:"avatar_url"`
	GoogleID  string `json:"google_id"`
	Role      string `json:"role"`
	PlanName  string `json:"plan_name"`
	IsActive  bool   `json:"is_active"`
	CreatedAt string `json:"created_at"`
}

type UserFeatures struct {
	MaxTunnels   int  `json:"max_tunnels"`
	CustomDomain bool `json:"custom_domain"`
	TCPSupport   bool `json:"tcp_support"`
}

type PricingPlan struct {
	ID                string  `json:"id"`
	Name              string  `json:"name"`
	Description       string  `json:"description"`
	PriceMonthly      float64 `json:"price_monthly"`
	MaxTunnels        int     `json:"max_tunnels"`
	CustomDomain      bool    `json:"custom_domain"`
	TCPSupport        bool    `json:"tcp_support"`
	Discount6Months   float64 `json:"discount_6_months"`
	Discount12Months  float64 `json:"discount_12_months"`
	Discount24Months  float64 `json:"discount_24_months"`
	PriceIDR          float64 `json:"price_idr"`
	PriceUSD          float64 `json:"price_usd"`
	PromoPriceIDR     float64 `json:"promo_price_idr"`
	PromoPriceUSD     float64 `json:"promo_price_usd"`
	FeaturesList      string  `json:"features_list"`
	IsActive          bool    `json:"is_active"`
}

type TenantUser struct {
	ID                  string  `json:"id"`
	Email               string  `json:"email"`
	FullName            string  `json:"full_name"`
	IsActive            bool    `json:"is_active"`
	Role                string  `json:"role"`
	CreatedAt           string  `json:"created_at"`
	PlanName            string  `json:"plan_name"`
	TotalBytesPurchased int64   `json:"total_bytes_purchased"`
	TotalBytesUsed      int64   `json:"total_bytes_used"`
	IsThrottled         bool    `json:"is_throttled"`
	TotalTopupIDR       float64 `json:"total_topup_idr"`
}

type UserProfile struct {
	User
	PlanName      string `json:"plan_name"`
	MaxTunnels    int    `json:"max_tunnels"`
	TotalTunnels  int    `json:"total_tunnels"`
	TotalBytesIn  int64  `json:"total_bytes_in"`
	TotalBytesOut int64  `json:"total_bytes_out"`
	JoinedAt      string `json:"joined_at"`
}

// UpsertGoogleUser membuat atau memperbarui user berdasarkan data Google.
func (r *Repository) UpsertGoogleUser(ctx context.Context, email, fullName, googleID, avatarURL string) (*User, error) {
	var user User

	// Query untuk upsert
	query := `
		INSERT INTO users (email, full_name, google_id, avatar_url, role)
		VALUES ($1, $2, $3, $4, 'USER')
		ON CONFLICT (email) DO UPDATE 
		SET google_id = EXCLUDED.google_id, 
		    avatar_url = EXCLUDED.avatar_url,
		    full_name = COALESCE(users.full_name, EXCLUDED.full_name),
		    updated_at = NOW()
		RETURNING id, email, COALESCE(full_name, ''), COALESCE(avatar_url, ''), google_id, role`

	err := r.db.QueryRowContext(ctx, query, email, fullName, googleID, avatarURL).Scan(
		&user.ID, &user.Email, &user.FullName, &user.AvatarURL, &user.GoogleID, &user.Role,
	)
	if err != nil {
		return nil, err
	}

	// Ambil status plan
	planQuery := `
		SELECT COALESCE(p.name, 'FREE')
		FROM users u
		LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'ACTIVE'
		LEFT JOIN pricing_plans p ON s.plan_id = p.id
		WHERE u.id = $1`
	
	_ = r.db.QueryRowContext(ctx, planQuery, user.ID).Scan(&user.PlanName)

	return &user, nil
}

// GetUserProfile mengambil profil lengkap user beserta statistik penggunaan.
func (r *Repository) GetUserProfile(ctx context.Context, userID string) (UserProfile, error) {
	var p UserProfile
	query := `
		SELECT 
			u.id, u.email, COALESCE(u.full_name, ''), COALESCE(u.avatar_url, ''), u.role, u.is_active, CAST(u.created_at AS VARCHAR),
			COALESCE(pl.name, 'FREE') as plan_name,
			COALESCE(pl.max_tunnels, 1) as max_tunnels,
			(SELECT COUNT(*) FROM domains WHERE user_id = u.id) as total_tunnels,
			COALESCE((SELECT SUM(bytes_in) FROM tunnel_sessions ts JOIN domains d ON ts.domain_id = d.id WHERE d.user_id = u.id), 0) as total_bytes_in,
			COALESCE((SELECT SUM(bytes_out) FROM tunnel_sessions ts JOIN domains d ON ts.domain_id = d.id WHERE d.user_id = u.id), 0) as total_bytes_out
		FROM users u
		LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'ACTIVE'
		LEFT JOIN pricing_plans pl ON s.plan_id = pl.id
		WHERE u.id = $1`

	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&p.ID, &p.Email, &p.FullName, &p.AvatarURL, &p.Role, &p.IsActive, &p.CreatedAt,
		&p.PlanName, &p.MaxTunnels, &p.TotalTunnels, &p.TotalBytesIn, &p.TotalBytesOut,
	)
	p.JoinedAt = p.CreatedAt
	return p, err
}

// GetUserFeatures mengambil fitur yang diizinkan berdasarkan paket langganan user.
func (r *Repository) GetUserFeatures(ctx context.Context, userID string) (UserFeatures, error) {
	var f UserFeatures

	query := `
		SELECT 
			COALESCE(p.max_tunnels, 1) as max_tunnels, 
			COALESCE(p.custom_domain, FALSE) as custom_domain, 
			TRUE as tcp_support -- Semua paket sekarang mendukung TCP/Raw
		FROM users u
		LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'ACTIVE'
		LEFT JOIN pricing_plans p ON s.plan_id = p.id
		WHERE u.id = $1`

	err := r.db.QueryRowContext(ctx, query, userID).Scan(&f.MaxTunnels, &f.CustomDomain, &f.TCPSupport)
	if err != nil {
		if err == sql.ErrNoRows {
			// Default Free Plan: 1 Tunnel, No Custom Domain, TCP Supported
			return UserFeatures{MaxTunnels: 1, CustomDomain: false, TCPSupport: true}, nil
		}
		return f, err
	}
	return f, nil
}

// SaveAPIKey menyimpan hash dari API Key untuk keamanan (UPSERT).
func (r *Repository) SaveAPIKey(ctx context.Context, userID, keyValue, label string) error {
	// Hash key menggunakan SHA-256
	h := sha256.New()
	h.Write([]byte(keyValue))
	keyHash := hex.EncodeToString(h.Sum(nil))

	query := `
		INSERT INTO api_keys (user_id, key_value, label) 
		VALUES ($1, $2, $3)
		ON CONFLICT (key_value) DO UPDATE SET label = EXCLUDED.label`
	_, err := r.db.ExecContext(ctx, query, userID, keyHash, label)
	return err
}


// SaveDomain mendaftarkan domain baru untuk user (Default subdomain).
func (r *Repository) SaveDomain(ctx context.Context, userID, domainName string) error {
	query := `
		INSERT INTO domains (user_id, domain_name, is_custom) 
		VALUES ($1, $2, FALSE)
		ON CONFLICT (domain_name) DO NOTHING`
	_, err := r.db.ExecContext(ctx, query, userID, domainName)
	return err
}

// SaveCustomDomain mendaftarkan domain kustom baru untuk user.
func (r *Repository) SaveCustomDomain(ctx context.Context, userID, domainName string) error {
	query := `
		INSERT INTO domains (user_id, domain_name, is_custom) 
		VALUES ($1, $2, TRUE)
		ON CONFLICT (domain_name) DO NOTHING`
	_, err := r.db.ExecContext(ctx, query, userID, domainName)
	return err
}

// MarkDomainVerified menandai domain sebagai terverifikasi DNS.
func (r *Repository) MarkDomainVerified(ctx context.Context, domainName string) error {
	_, err := r.db.ExecContext(ctx, "UPDATE domains SET is_verified = TRUE, ssl_status = 'ISSUED' WHERE domain_name = $1", domainName)
	return err
}

// GetUserTunnels mengambil daftar domain/tunnel milik user.
type UserTunnel struct {
	ID           string `json:"id"`
	DomainName   string `json:"domain"`
	Status       string `json:"status"`
	CreatedAt    string `json:"created_at"`
	IsCustom     bool   `json:"is_custom"`
	Hostname     string `json:"hostname"`
	AgentVersion string `json:"agent_version"`
	IP           string `json:"ip"`
}

func (r *Repository) GetUserTunnels(ctx context.Context, userID string) ([]UserTunnel, error) {
	query := `
		SELECT 
			d.id, d.domain_name, d.ssl_status, CAST(d.created_at AS VARCHAR), d.is_custom,
			COALESCE(s.hostname, '') as hostname, 
			COALESCE(s.agent_version, '') as agent_version, 
			COALESCE(s.agent_ip, '') as agent_ip
		FROM domains d
		LEFT JOIN (
			SELECT DISTINCT ON (domain_id) domain_id, hostname, agent_version, agent_ip
			FROM tunnel_sessions
			WHERE disconnected_at IS NULL
			ORDER BY domain_id, connected_at DESC
		) s ON d.id = s.domain_id
		WHERE d.user_id = $1 
		ORDER BY d.created_at DESC`
	
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tunnels []UserTunnel = []UserTunnel{}
	for rows.Next() {
		var t UserTunnel
		if err := rows.Scan(&t.ID, &t.DomainName, &t.Status, &t.CreatedAt, &t.IsCustom, &t.Hostname, &t.AgentVersion, &t.IP); err != nil {
			return nil, err
		}
		tunnels = append(tunnels, t)
	}
	return tunnels, nil
}

// GetAPIKeys mengambil semua API Key milik user.
type APIKey struct {
	ID           string `json:"id"`
	UserID       string `json:"user_id,omitempty"`
	KeyValue     string `json:"key_value"`
	Label        string `json:"label"`
	LastHostname string `json:"last_hostname"`
	LastUsedAt   string `json:"last_used_at"`
	CreatedAt    string `json:"created_at"`
}

func (r *Repository) GetAPIKeys(ctx context.Context, userID string) ([]APIKey, error) {
	query := `
		SELECT 
			id, key_value, COALESCE(label, ''), COALESCE(last_hostname, ''), 
			COALESCE(CAST(last_used_at AS VARCHAR), 'Never'), 
			CAST(created_at AS VARCHAR) 
		FROM api_keys 
		WHERE user_id = $1 
		ORDER BY created_at DESC`
	
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var keys []APIKey = []APIKey{}
	for rows.Next() {
		var k APIKey
		if err := rows.Scan(&k.ID, &k.KeyValue, &k.Label, &k.LastHostname, &k.LastUsedAt, &k.CreatedAt); err != nil {
			return nil, err
		}
		keys = append(keys, k)
	}
	return keys, nil
}

func (r *Repository) GetAPIKeyByID(ctx context.Context, keyID string) (*APIKey, error) {
	var k APIKey
	query := `SELECT id, user_id, key_value, label FROM api_keys WHERE id = $1`
	err := r.db.QueryRowContext(ctx, query, keyID).Scan(&k.ID, &k.UserID, &k.KeyValue, &k.Label)
	if err != nil {
		return nil, err
	}
	return &k, nil
}

func (r *Repository) DeleteAPIKey(ctx context.Context, keyID, userID string) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM api_keys WHERE id = $1 AND user_id = $2", keyID, userID)
	return err
}

func (r *Repository) DeleteDomain(ctx context.Context, domainID, userID string) error {
	_, err := r.db.ExecContext(ctx, "DELETE FROM domains WHERE id = $1 AND user_id = $2", domainID, userID)
	return err
}

func (r *Repository) ToggleUserStatus(ctx context.Context, userID string) error {
	_, err := r.db.ExecContext(ctx, "UPDATE users SET is_active = NOT is_active WHERE id = $1", userID)
	return err
}

func (r *Repository) UpdateUserRole(ctx context.Context, userID, newRole string) error {
	_, err := r.db.ExecContext(ctx, "UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2", newRole, userID)
	return err
}

// UpdateUserProfile memperbarui data profil user.
func (r *Repository) UpdateUserProfile(ctx context.Context, userID, fullName, avatarURL string) error {
	query := `UPDATE users SET full_name = $1, avatar_url = $2, updated_at = NOW() WHERE id = $3`
	_, err := r.db.ExecContext(ctx, query, fullName, avatarURL, userID)
	return err
}
