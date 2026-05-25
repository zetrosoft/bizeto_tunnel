#!/bin/bash
# BIJEXA-Tunnel Deployment Script for JKK Infrastructure
set -e

echo "🚀 Starting Bijexa-Tunnel Deployment..."

# 1. Konfigurasi Database JKK
DB_CONTAINER="jkk-infra-postgres-1"
DB_NAME="bijexa_db"
DB_USER="bijexa_user"
DB_PASS="bijexa_password"

echo "📂 Initializing Database in JKK Infrastructure..."

# Cek apakah database sudah ada
DB_EXISTS=$(docker exec $DB_CONTAINER psql -U jkk -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" != "1" ]; then
    echo "🏗️ Creating database $DB_NAME..."
    docker exec $DB_CONTAINER psql -U jkk -d postgres -c "CREATE DATABASE $DB_NAME;"
    docker exec $DB_CONTAINER psql -U jkk -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
    docker exec $DB_CONTAINER psql -U jkk -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
else
    echo "✅ Database $DB_NAME already exists."
fi

# Terapkan Schema & Seed
echo "📝 Applying Schema and Seed..."
# Postgres 15+ needs explicit permission on public schema
docker exec $DB_CONTAINER psql -U jkk -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < internal/db/schema.sql
docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME < internal/db/seed.sql

# 2. Konfigurasi Nginx SNI Proxy
NGINX_CONF="/etc/nginx/nginx.conf"
STREAM_DIR="/etc/nginx/stream.d"
STREAM_CONF="$STREAM_DIR/bijexa.conf"

echo "🌐 Setting up Nginx SNI Proxy (Bijexa Coexistence Mode)..."

# Pastikan folder stream.d ada
sudo mkdir -p $STREAM_DIR
# Bersihkan config lama jika ada
sudo rm -f /etc/nginx/conf.d/bijexa-stream.conf

# Pastikan modul stream terinstall
if [ ! -f /etc/nginx/modules-enabled/50-mod-stream.conf ] && [ ! -f /usr/share/nginx/modules/ngx_stream_module.so ]; then
    echo "📦 Installing Nginx Stream Module..."
    sudo apt-get update && sudo apt-get install -y libnginx-mod-stream || echo "⚠️ Failed to install libnginx-mod-stream, you might need to install it manually."
fi

# Buat file stream config
sudo tee $STREAM_CONF > /dev/null <<EOF
stream {
    map \$ssl_preread_server_name \$bijexa_backend {
        ~^.*\.bijexa\.samkarsa\.com$  127.0.0.1:4443;
        default                       127.0.0.1:4430;
    }

    server {
        listen 443;
        proxy_pass \$bijexa_backend;
        ssl_preread on;
    }
}
EOF

# Periksa apakah nginx.conf sudah menyertakan stream.d di level top (luar http)
if ! grep -q "include $STREAM_DIR/\*.conf;" "$NGINX_CONF"; then
    echo "🔧 Patching nginx.conf to include stream configs..."
    # Tambahkan include di baris sebelum blok 'http {'
    sudo sed -i "/http {/i include $STREAM_DIR/*.conf;" $NGINX_CONF
fi

# 3. Geser Port Nginx Default agar tidak bentrok (Port 443 -> 4430)
echo "🔄 Shifting existing Nginx SSL ports to 4430..."
sudo find /etc/nginx/sites-available/ -type f -exec sed -i 's/listen 443 ssl/listen 4430 ssl/g' {} +
sudo find /etc/nginx/sites-available/ -type f -exec sed -i 's/listen \[::\]:443 ssl/listen [::]:4430 ssl/g' {} +
# Juga pastikan yang di sites-enabled (jika ada file fisik) terupdate
sudo find /etc/nginx/sites-enabled/ -type f -exec sed -i 's/listen 443 ssl/listen 4430 ssl/g' {} +
sudo find /etc/nginx/sites-enabled/ -type f -exec sed -i 's/listen \[::\]:443 ssl/listen [::]:4430 ssl/g' {} +

echo "♻️ Restarting Nginx..."
sudo nginx -t && sudo systemctl restart nginx

# 4. Launch Bijexa Containers
echo "🐳 Launching Bijexa Containers..."
docker compose -p bijexa down || true
docker compose -p bijexa up -d

echo "✨ Deployment Complete!"
echo "Dashboard: https://dashboard.samkarsa.com"
echo "User Tunnels: *.bijexa.samkarsa.com"
