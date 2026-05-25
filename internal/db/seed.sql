-- BIZETO-Tunnel: Seed Data untuk Development

-- 1. Buat User Contoh
INSERT INTO users (id, email, password_hash, full_name)
VALUES ('7b3e6462-8e1e-451e-9d33-4050d2766324', 'dev@samkarsa.com', 'hashed_password_here', 'Developer BIZETO');

-- 2. Buat API Key Contoh (Hashed SHA256 dari 'DEV-KEY-123')
INSERT INTO api_keys (user_id, key_value, label)
VALUES ('7b3e6462-8e1e-451e-9d33-4050d2766324', '3864b56d4f8eead5634b67555f2f650872986952688568d5c13c8adaec460d37', 'Local Dev Laptop');

-- 3. Daftarkan Domain Contoh
INSERT INTO domains (user_id, domain_name, is_custom)
VALUES ('7b3e6462-8e1e-451e-9d33-4050d2766324', 'dev.samkarsa.com', FALSE);

-- 4. Pricing Plans
INSERT INTO pricing_plans (id, name, description, price_monthly, max_tunnels, custom_domain, tcp_support, price_idr, price_usd, features_list, is_active)
VALUES 
('11111111-1111-1111-1111-111111111111', 'Free', 'Perfect for experiments and prototypes.', 0.00, 1, FALSE, TRUE, 0, 0, '1 Active Tunnel\n1GB High-Speed Bandwidth\n128kb/s Limit After 30 Days', TRUE),
('44444444-4444-4444-4444-444444444444', 'Pay-As-You-Go', 'Professional infrastructure with zero commitments.', 1.00, 100, TRUE, TRUE, 20000, 4.99, 'Infinite Concurrent Tunnels\nTop Up balance never expires\nPriority Traffic (High QoS)', TRUE);

-- 5. Subscriptions
INSERT INTO subscriptions (user_id, plan_id, status)
VALUES ('7b3e6462-8e1e-451e-9d33-4050d2766324', '11111111-1111-1111-1111-111111111111', 'ACTIVE');

-- Catatan: Secara default di local, host header 'dev.samkarsa.com' 
-- harus diarahkan ke 127.0.0.1 di file /etc/hosts Anda.
