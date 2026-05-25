-- BIZETO-Tunnel: Database Schema Initialization
-- Production: Uses .env
-- Local Dev: Uses .env.dev

-- Extension untuk UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabel Pengguna (Account Management)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT, -- Nullable karena bisa login via OAuth
    google_id VARCHAR(255) UNIQUE,
    avatar_url TEXT,
    full_name VARCHAR(255),
    role VARCHAR(20) DEFAULT 'USER', -- USER, OWNER
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing untuk Performa
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Tabel API Key (Authentication for Agents)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_value VARCHAR(64) UNIQUE NOT NULL,
    label VARCHAR(100), -- misal: "Laptop Kerja", "Server Gudang"
    is_active BOOLEAN DEFAULT TRUE,
    last_hostname VARCHAR(255),
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabel Domain & Konfigurasi Tunnel
CREATE TABLE IF NOT EXISTS domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    domain_name VARCHAR(255) UNIQUE NOT NULL, -- e.g., xyz.bizeto.io or brand.com
    is_custom BOOLEAN DEFAULT FALSE,          -- true jika pakai domain sendiri
    is_verified BOOLEAN DEFAULT FALSE,        -- khusus untuk custom domain
    ssl_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, ISSUED, FAILED
    target_port INTEGER DEFAULT 80,           -- port aplikasi lokal default
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabel Log Sesi (Monitoring & Analytics)
CREATE TABLE IF NOT EXISTS tunnel_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
    api_key_id UUID REFERENCES api_keys(id),
    agent_ip VARCHAR(45),
    agent_version VARCHAR(20),
    hostname VARCHAR(255),
    os_info VARCHAR(100),
    machine_id VARCHAR(255),
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    disconnected_at TIMESTAMP WITH TIME ZONE,
    bytes_in BIGINT DEFAULT 0,
    bytes_out BIGINT DEFAULT 0
);

-- Indexing untuk Performa
CREATE INDEX idx_api_keys_value ON api_keys(key_value);
CREATE INDEX idx_domains_user_id ON domains(user_id);
CREATE INDEX idx_tunnel_sessions_active ON tunnel_sessions(domain_id) WHERE disconnected_at IS NULL;

-- 5. Tabel Pricing Plans
CREATE TABLE IF NOT EXISTS pricing_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL,
    max_tunnels INTEGER NOT NULL,
    custom_domain BOOLEAN DEFAULT FALSE,
    tcp_support BOOLEAN DEFAULT FALSE,
    discount_6_months DECIMAL(5, 2) DEFAULT 0,
    discount_12_months DECIMAL(5, 2) DEFAULT 0,
    discount_24_months DECIMAL(5, 2) DEFAULT 0,
    price_idr DECIMAL(15, 2) DEFAULT 0,
    price_usd DECIMAL(15, 2) DEFAULT 0,
    promo_price_idr DECIMAL(15, 2) DEFAULT 0,
    promo_price_usd DECIMAL(15, 2) DEFAULT 0,
    features_list TEXT DEFAULT '',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabel Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES pricing_plans(id),
    status VARCHAR(50) DEFAULT 'ACTIVE', -- ACTIVE, CANCELLED, PAST_DUE
    exchange_rate DECIMAL(10, 2), -- Kurs IDR saat subscription ini dibuat
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 7. Tabel Exchange Rates
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    rate_idr DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabel Bandwidth Quota (Pay-As-You-Go)
CREATE TABLE IF NOT EXISTS user_bandwidth_quota (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    total_bytes_purchased BIGINT DEFAULT 0,
    total_bytes_used BIGINT DEFAULT 0,
    total_bytes_in BIGINT DEFAULT 0,
    total_bytes_out BIGINT DEFAULT 0,
    is_throttled BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE, -- Untuk bonus 500MB awal (30 hari)
    trial_mac_address VARCHAR(17),        -- MAC Address perangkat trial
    trial_started_at TIMESTAMP WITH TIME ZONE, -- Tanggal mulai trial gratis
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing unik untuk MAC Address guna mencegah penyalahgunaan trial lintas akun
CREATE UNIQUE INDEX IF NOT EXISTS idx_bandwidth_trial_mac ON user_bandwidth_quota(trial_mac_address) WHERE trial_mac_address IS NOT NULL;

-- 9. Tabel Topup Transactions
CREATE TABLE IF NOT EXISTS topup_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount_idr DECIMAL(10, 2) NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 0,
    bytes_added BIGINT NOT NULL,
    xendit_invoice_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PAID, FAILED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE
);

-- Indexing untuk Topup Transactions
-- 10. Tabel Log Trafik (Enterprise Audit & Forensics)
CREATE TABLE IF NOT EXISTS traffic_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
    request_id VARCHAR(36) UNIQUE,         -- Untuk end-to-end tracing
    
    -- Client Info (Accessor)
    remote_ip VARCHAR(45) NOT NULL,
    remote_port INTEGER,
    user_agent TEXT,
    referer TEXT,
    tls_version VARCHAR(10),               -- e.g., TLS 1.3
    ja3_fingerprint VARCHAR(32),           -- Bot/Malware detection fingerprint
    
    -- Request Detail
    method VARCHAR(10) NOT NULL,
    path TEXT NOT NULL,
    query_params TEXT,
    protocol VARCHAR(10),                  -- HTTP/1.1, H2
    
    -- Agent & Infra Metadata (Target)
    agent_hostname VARCHAR(255),
    agent_mac_address VARCHAR(17),
    
    -- Performance & Metrics
    status_code INTEGER,
    bytes_received BIGINT DEFAULT 0,
    bytes_sent BIGINT DEFAULT 0,
    latency_ms INTEGER,                    -- Relay-to-Agent roundtrip
    
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_traffic_logs_domain_id ON traffic_logs(domain_id);
CREATE INDEX IF NOT EXISTS idx_traffic_logs_timestamp ON traffic_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_logs_remote_ip ON traffic_logs(remote_ip);
CREATE INDEX IF NOT EXISTS idx_traffic_logs_request_id ON traffic_logs(request_id);
