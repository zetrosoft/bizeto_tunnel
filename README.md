# BIZETO-Tunnel: Enterprise-Grade Reverse Proxy

BIZETO-Tunnel adalah solusi tunneling berperforma tinggi yang memungkinkan Anda mengekspos layanan lokal ke internet publik dengan aman, fokus pada branding kustom, dan latensi rendah.

## 🚀 Quick Start untuk Pengembang

### 1. Prasyarat
*   **Go** versi 1.21 atau lebih baru.
*   **Docker & Docker Compose** (untuk menjalankan Redis & PostgreSQL).
*   **Protobuf Compiler** (`protoc`) & gRPC plugins.

### 2. Setup Lingkungan Pengembangan
Kloning repositori dan jalankan infrastruktur pendukung:

```bash
# Clone repository (ganti dengan URL asli nantinya)
git clone https://github.com/bizeto/bizeto-tunnel.git
cd bizeto-tunnel

# Jalankan Redis & Database via Docker
docker-compose up -d
```

### 3. Instalasi Dependensi
```bash
go mod tidy
```

### 4. Build Aplikasi
Gunakan perintah berikut untuk mengompilasi biner Relay dan Agent:

```bash
# Build Relay (Server)
go build -o bin/bizeto-relay ./cmd/relay

# Build Agent (Client)
go build -o bin/bizeto-agent ./cmd/agent
```

---

## 🚀 Fitur Full Version
*   **Database Persistensi:** Menggunakan PostgreSQL untuk menyimpan kredensial dan domain.
*   **Auto-SSL (ACME):** Integrasi Let's Encrypt untuk sertifikat SSL otomatis pada domain kustom.
*   **High-Performance Proxy:** Menggunakan `httputil.ReverseProxy` dengan dialer Yamux kustom.

## 🛠 Cara Menjalankan

### 1. Jalankan Infrastruktur
```bash
docker-compose up -d
```

### 2. Setup Host Lokal (Untuk Pengujian)
Agar domain contoh `dev.samkarsa.com` bekerja di mesin lokal, tambahkan baris berikut ke `/etc/hosts` Anda:
```text
127.0.0.1 dev.samkarsa.com
```

### 3. Jalankan Relay Server
```bash
export DB_HOST=localhost
go run cmd/relay/main.go
```

### 4. Jalankan Agent Lokal
```bash
go run cmd/agent/main.go --key DEV-KEY-123 --port 8080
```

---

## 📂 Struktur Repositori
*   `/api`: Definisi gRPC (.proto).
*   `/cmd`: Titik masuk aplikasi (Relay & Agent).
*   `/internal`: Logika bisnis inti (Auth, Tunnel, Cert).
*   `/pkg`: Utilitas publik.
*   `/docs`: Dokumentasi teknis mendalam (HLD & LLD).

---

## 📜 Dokumentasi Terkait
Sebelum mulai menulis kode, pengembang **WAJIB** membaca dokumen berikut di folder `/docs`:
1.  [Technical Architecture (HLD)](docs/Technical_Full_Document.md) - Memahami gambaran besar sistem.
2.  [Implementation Spec (LLD)](docs/Implementation_LLD.md) - Detail teknis, Protobuf, dan Skema Database.
3.  [Infrastruktur Spec](docs/Infrastruktur_Spec.md) - Kebutuhan server dan skalabilitas.
4.  [User Manual Agent](docs/User_Manual_Agent.md) - Panduan cara pakai bagi pengguna akhir.

---

## 🤝 Kontribusi
1.  Buat branch baru dari `develop`.
2.  Pastikan kode mengikuti standar `go fmt`.
3.  Tambahkan unit test untuk setiap fitur baru di folder `internal/`.
4.  Kirim Pull Request untuk di-review oleh Lead Architect.

---

## 📧 Kontak & Dukungan
Jika ada pertanyaan teknis, hubungi Lead Software Architect atau kirim isu melalui sistem manajemen proyek.
