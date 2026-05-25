#!/bin/bash
set -e

echo "🚀 Building Bijexa-Tunnel for Production (Artifacts Only)..."

# 1. Build Go Backend (Relay) for Linux amd64
echo "📦 Building Relay binary..."
GOOS=linux GOARCH=amd64 go build -o bijexa-deploy/relay ./cmd/relay

# 1.5 Build Agent binaries for Download
echo "📦 Building Agent binaries for multiple platforms..."
mkdir -p dashboard/public/bin
GOOS=windows GOARCH=amd64 go build -o dashboard/public/bin/bizeto-agent-windows-amd64.exe ./cmd/agent
GOOS=linux GOARCH=amd64 go build -o dashboard/public/bin/bizeto-agent-linux-amd64 ./cmd/agent
GOOS=darwin GOARCH=arm64 go build -o dashboard/public/bin/bizeto-agent-darwin-arm64 ./cmd/agent
GOOS=darwin GOARCH=amd64 go build -o dashboard/public/bin/bizeto-agent-darwin-amd64 ./cmd/agent

# 2. Build Frontend Dashboard
echo "🎨 Building Dashboard..."
cd dashboard
pnpm install
pnpm build
cd ..

# 3. Prepare Artifacts
echo "📂 Packing artifacts..."
cp -r dashboard/dist bijexa-deploy/
mkdir -p bijexa-deploy/internal/db
cp internal/db/*.sql bijexa-deploy/internal/db/
# Sertakan folder infrastruktur baru dan .env
cp -r infra bijexa-deploy/
cp docker-compose.yml bijexa-deploy/
cp .env bijexa-deploy/

# 4. Create Tarball
tar -czf bijexa-deploy.tar.gz bijexa-deploy/

# 5. Send to VPS
echo "🚢 Shipping to vps-server..."
scp bijexa-deploy.tar.gz vps-server:~/

# 6. Remote Deployment
echo "🔧 Cleaning and Restarting on VPS..."
ssh vps-server << 'EOF'
    # Force stop and remove containers (both old bizeto and new bijexa naming)
    sudo docker stop bijexa-haproxy bijexa-traefik bijexa-relay bijexa-dashboard bizeto-haproxy bizeto-traefik bizeto-relay bizeto-dashboard || true
    sudo docker rm -f bijexa-haproxy bijexa-traefik bijexa-relay bijexa-dashboard bizeto-haproxy bizeto-traefik bizeto-relay bizeto-dashboard || true

    # Wipe old directory to ensure fresh config
    rm -rf bijexa-tunnel
    mkdir -p bijexa-tunnel data/letsencrypt data/certs

    # Extract
    tar -xzf bijexa-deploy.tar.gz -C bijexa-tunnel --strip-components=1
    rm bijexa-deploy.tar.gz

    # Launch
    cd bijexa-tunnel

    # Ensure Docker networks exist
    sudo docker network create bijexa-network || true

    echo "🐘 Migrating Database on VPS - Full Schema..."
    sudo docker exec -i jkk-infra-postgres-1 psql -U bijexa_user -d bijexa_db < internal/db/schema.sql

    echo "🛠️ Patching Database Schema (Migrations)..."
    sudo docker exec -i jkk-infra-postgres-1 psql -U bijexa_user -d bijexa_db -c "ALTER TABLE api_keys ADD COLUMN IF NOT EXISTS last_hostname VARCHAR(255);"
    sudo docker exec -i jkk-infra-postgres-1 psql -U bijexa_user -d bijexa_db -c "ALTER TABLE user_bandwidth_quota ADD COLUMN IF NOT EXISTS total_bytes_in BIGINT DEFAULT 0;"
    sudo docker exec -i jkk-infra-postgres-1 psql -U bijexa_user -d bijexa_db -c "ALTER TABLE user_bandwidth_quota ADD COLUMN IF NOT EXISTS total_bytes_out BIGINT DEFAULT 0;"

    echo "🌱 Seeding Subscription Plans..."
    sudo docker exec -i jkk-infra-postgres-1 psql -U bijexa_user -d bijexa_db < internal/db/seed.sql

    echo "🛑 Stopping and Cleaning Bijexa Infrastructure..."
    sudo docker compose -p bijexa down --rmi local || true
    
    echo "🚀 Starting Enterprise Infrastructure (HAProxy + Traefik + Relay)..."
    sudo docker compose -p bijexa up -d --build --force-recreate
    
    echo "🔍 Verifying Container Status..."
    sleep 5
    sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}' | grep bijexa || echo "❌ No Bijexa containers found running!"
    
    # Cek apakah ada yang exited
    EXITED=$(sudo docker ps -a -f status=exited --format '{{.Names}}' | grep bijexa || true)
    if [ ! -z "$EXITED" ]; then
        echo "⚠️ Detected crashed containers: $EXITED"
        echo "📝 Showing logs for crashed containers..."
        for c in $EXITED; do
            echo "--- LOGS FOR $c ---"
            sudo docker logs $c --tail 50
        done
    fi

    echo "🧹 Cleaning up unused Docker resources..."
    sudo docker image prune -f
EOF
echo "✨ Deployment Artifacts Shipped and Launched!"
echo "Dashboard: https://bijexa.samkarsa.com"
echo "API: https://api.samkarsa.com"

