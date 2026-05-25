# Spesifikasi Implementasi (Low-Level Design): BIZETO-Tunnel

**Versi:** 1.0.0  
**Target:** Tim Pengembang (Backend & DevOps)  
**Tujuan:** Panduan koding tanpa ambiguitas.

---

## 1. Struktur Proyek (Standard Go Layout)

Programmer wajib mengikuti struktur folder berikut untuk menjaga modularitas:

```text
bizeto-tunnel/
├── api/                # Definisi Protobuf & gRPC Generated Code
│   └── v1/
│       └── tunnel.proto
├── cmd/                # Entry point aplikasi
│   ├── relay/          # Biner untuk Server Relai
│   │   └── main.go
│   └── agent/          # Biner untuk Agen Lokal
│       └── main.go
├── internal/           # Kode privat (tidak bisa di-import proyek lain)
│   ├── auth/           # Logika Autentikasi & JWT
│   ├── tunnel/         # Core logic Yamux & TCP Handling
│   ├── db/             # Repository pattern untuk SQL
│   ├── redis/          # Client & Logic untuk State Management
│   └── cert/           # Manajemen ACME & SSL Let's Encrypt
├── pkg/                # Kode publik (utilitas yang bisa di-share)
├── scripts/            # Script helper (deployment, docker)
├── configs/            # File konfigurasi default (YAML/JSON)
├── go.mod
└── README.md
```

---

## 2. Kontrak Komunikasi: gRPC Protobuf

File: `api/v1/tunnel.proto`

```protobuf
syntax = "proto3";

package bizeto.v1;

option go_package = "github.com/bizeto/api/v1";

service TunnelService {
  // Handshake awal untuk autentikasi agen
  rpc RegisterAgent(RegisterRequest) returns (RegisterResponse);
  
  // Stream dua arah untuk kontrol (heartbeat, command)
  rpc ControlStream(stream ControlMessage) returns (stream ControlMessage);
}

message RegisterRequest {
  string api_key = 1;
  string version = 2;
  string hostname = 3;
}

message RegisterResponse {
  bool success = 1;
  string assigned_domain = 2;
  string tunnel_token = 3; // Token untuk enkripsi sesi
  string error_message = 4;
}

message ControlMessage {
  enum Type {
    PING = 0;
    PONG = 1;
    RECONNECT = 2;
    CONFIG_UPDATE = 3;
  }
  Type type = 1;
  string payload = 2;
}
```

---

## 3. Skema Database (PostgreSQL)

File: `internal/db/schema.sql`

```sql
-- Tabel Pengguna & Organisasi
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel API Key untuk Agent
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_value VARCHAR(64) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Konfigurasi Domain Kustom
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    domain_name VARCHAR(255) UNIQUE NOT NULL, -- misal: print.brand.com
    is_verified BOOLEAN DEFAULT FALSE,
    ssl_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, ISSUED, FAILED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Log Sesi Tunnel (Audit Trail)
CREATE TABLE tunnel_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID REFERENCES domains(id),
    agent_ip VARCHAR(45),
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    disconnected_at TIMESTAMP WITH TIME ZONE
);
```

---

## 4. Logika Core: Algoritma Multiplexing

Programmer harus menggunakan `hashicorp/yamux` dengan pola implementasi berikut:

### 4.1 Logika Sisi Relay (Data Forwarding)
```go
// Pseudocode implementasi di internal/tunnel/relay.go
func HandleUserRequest(w http.ResponseWriter, r *http.Request) {
    // 1. Dapatkan Domain dari Host Header
    domain := r.Host
    
    // 2. Cari Koneksi Agent di Redis/Memory Map
    agentConn, err := GetActiveAgent(domain)
    if err != nil {
        http.Error(w, "Tunnel Offline", 502)
        return
    }

    // 3. Buka Yamux Stream baru di dalam koneksi yang sudah ada
    stream, err := agentConn.OpenStream()
    if err != nil {
        http.Error(w, "Failed to create stream", 500)
        return
    }
    defer stream.Close()

    // 4. Forward Request HTTP ke Stream tersebut
    r.Write(stream)

    // 5. Baca Response dari Stream dan tulis balik ke browser user
    io.Copy(w, stream)
}
```

---

## 5. Spesifikasi CLI (User Interface)

Agen harus bisa dijalankan dengan perintah tunggal:

**Contoh Perintah:**
```bash
# Untuk Web App (HTTP)
./bizeto-agent start --key BZT-12345 --port 8080 --domain my-app.com

# Untuk Printer (TCP)
./bizeto-agent start --key BZT-12345 --port 9100 --type tcp --name my-printer
```

**Flag Requirements:**
*   `--key`: Wajib, API Key dari dashboard.
*   `--port`: Wajib, port lokal aplikasi.
*   `--type`: Opsional, `http` (default) atau `tcp`.
*   `--domain`: Opsional, kustom domain jika ada.

---

## 6. Penanganan Error (Standardized)

| Error Code | HTTP Status | Deskripsi | Aksi Agent |
| :--- | :--- | :--- | :--- |
| `ERR_AUTH_FAILED` | 401 | API Key tidak valid / kadaluarsa | Stop & tampilkan pesan error |
| `ERR_DOMAIN_TAKEN` | 409 | Domain sudah digunakan user lain | Tampilkan alternatif domain |
| `ERR_RELAY_DOWN` | 503 | Server relai tidak bisa dihubungi | Reconnect (Backoff) |
| `ERR_LOCAL_OFFLINE` | 502 | Aplikasi lokal tidak merespon port | Kirim notifikasi ke Relay |

---

## 7. Rekomendasi Visualisasi
Tetap gunakan **UML (Sequence & Activity Diagram)** via Mermaid untuk teknis. **Bizagi/BPMN** hanya digunakan jika ada alur bisnis manual yang rumit (misal: Alur persetujuan pendaftaran user manual atau penagihan invoice). Untuk koding, UML jauh lebih presisi.
