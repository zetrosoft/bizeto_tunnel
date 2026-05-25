# BIZETO-Tunnel - gRPC Control Plane Specification (Phase 2)

## 🛰️ Arsitektur gRPC Control Plane
Proyek ini telah bermigrasi ke arsitektur **gRPC-first** untuk komunikasi antara Agent dan Relay guna meningkatkan efisiensi dan keamanan.

### 1. Alokasi Port
*   **50051**: gRPC Control Plane (Registration & Control Stream).
*   **4321**: Data Plane (Yamux over TCP).
*   **8080**: Dashboard API (HTTP).
*   **80 / 443**: Gateway Proxy (Auto-SSL).

### 2. Workflow Pengembangan
*   **Protobuf**: Jika ada perubahan pada `api/v1/tunnel.proto`, generate ulang kode dengan:
    ```bash
    PATH=$PATH:$(go env GOPATH)/bin ./tmp/protoc_temp/bin/protoc --proto_path=api/v1 --go_out=api/v1 --go_opt=paths=source_relative --go-grpc_out=api/v1 --go-grpc_opt=paths=source_relative api/v1/tunnel.proto
    ```
*   **Build**: Gunakan perintah berikut untuk memastikan biner terbaru:
    ```bash
    go build -o bin/relay ./cmd/relay
    go build -o bin/agent ./cmd/agent
    ```

### 3. Keamanan (Tokenization)
*   Handshake tidak lagi mengirim API Key mentah ke Data Plane.
*   Handshake gRPC akan menghasilkan **Tunnel Token (JWT)** yang berlaku selama 5 menit.
*   Token ini digunakan Agent untuk mengautentikasi koneksi Yamux di port 4321.

## 📜 Log Pengerjaan (Summary Phase 2)
*   **Handshake JSON Legacy** telah diganti dengan gRPC `RegisterAgent`.
*   **JWT-based Auth** diimplementasikan untuk sesi tunneling yang lebih aman.
*   **Agent v1.1.0-grpc** mendukung parameter `--grpc` untuk menentukan alamat control plane.
*   **Hybrid Support** di Relay memungkinkan masa transisi bagi agent versi lama.

---
*Document Created: 2026-05-14*
*Version: 1.0.0 (Phase 2)*
