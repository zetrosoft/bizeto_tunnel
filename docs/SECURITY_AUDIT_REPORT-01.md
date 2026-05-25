# 🛡️ Laporan Audit Keamanan: Bizeto Tunnel (Infrastructure & Code)
**Status:** KRITIS | **Objek:** Relay Server, Agent, & Dashboard Architecture
**Tanggal Laporan:** 18 Mei 2026

## 1. Kerentanan Kode Sumber (Source Code Vulnerabilities)

### A. Hardcoded Secrets (Kunci Rahasia Tersemat)
*   **File:** `internal/auth/middleware.go`
*   **Temuan:** Variabel `jwtKey` berisi nilai default: `"default-bizeto-secret-key-123"`.
*   **Risiko:** Penyerang dapat membuat token JWT palsu dengan peran `OWNER`. Hal ini memungkinkan siapapun menguasai seluruh jaringan tunnel dan melihat trafik user lain tanpa otorisasi.
*   **Rekomendasi:** Cabut nilai hardcoded. Wajibkan sistem mengambil `JWT_SECRET` dari *Environment Variable* saat runtime.

### B. Insecure OAuth Implementation
*   **File:** `internal/auth/service.go`
*   **Temuan:** Konstanta `oauthStateString` bersifat statis (`"random_state_string"`).
*   **Risiko:** Rentan terhadap serangan **OAuth CSRF**. Penyerang dapat memanipulasi proses login Google untuk menghubungkan identitas mereka ke akun Bizeto Tunnel milik orang lain.
*   **Rekomendasi:** Implementasikan *Dynamic State* yang di-generate per sesi dan divalidasi saat callback.

### C. Kurangnya Integritas Konfigurasi
*   **File:** `internal/auth/service.go`
*   **Temuan:** `ConfigIntegrityKey` bocor di dalam kode.
*   **Risiko:** Penyerang dapat memodifikasi file konfigurasi agen (`bizeto.json`) dan memberikan tanda tangan digital (*signature*) palsu agar seolah-olah valid dari sistem.

---

## 2. Jaringan & Komunikasi (Networking)

### A. Data Plane Unencrypted (Non-TLS)
*   **Lokasi:** `cmd/relay/main.go` (Port 4321 dan 50051)
*   **Temuan:** Komunikasi antara Agent dan Relay menggunakan gRPC dan Yamux di atas protokol TCP biasa tanpa lapisan enkripsi (No TLS).
*   **Risiko:** **Sniffing & Interception.** Seluruh data yang dilewatkan melalui tunnel dapat dibaca oleh pihak ketiga di jalur jaringan yang sama (misalnya ISP atau penyedia cloud).
*   **Rekomendasi:** Implementasikan mTLS (*Mutual TLS*) antara Agent dan Relay untuk menjamin privasi dan integritas data.

### B. Whitelisting Tunnel Gateway
*   **Temuan:** Gateway tunnel (`bijexa.samkarsa.com`) menerima koneksi dari IP manapun tanpa pembatasan di level infrastruktur.
*   **Risiko:** Jika API Key bocor, penyerang dapat menghubungkan agen mereka sendiri ke relay Anda dengan sangat mudah.
*   **Rekomendasi:** Implementasikan pembatasan jumlah koneksi per IP dan deteksi perilaku anomali pada port kontrol (4321).

---

## 3. Manajemen Kredensial & Lingkungan

### A. Eksposur File Konfigurasi
*   **Temuan:** File `.env` dan `bizeto-wizard-key.json` ditemukan berada dalam folder yang memiliki risiko terpapar ke luar.
*   **Risiko:** Kebocoran `XENDIT_SECRET_KEY` dan `GOOGLE_CLIENT_SECRET`.
*   **Rekomendasi:** Ubah izin akses file (*File Permission*) menjadi `600` (hanya pemilik yang bisa baca) dan pastikan folder `dist/` tidak memuat rahasia mentah.

---

## 4. Checklist Perbaikan untuk Tim Pengembang

1.  [ ] **Patch `internal/auth`:** Pastikan semua secret menggunakan `os.Getenv`.
2.  [ ] **Update `cmd/relay`:** Tambahkan dukungan sertifikat SSL untuk gRPC (`grpc.WithTransportCredentials`).
3.  [ ] **Rotasi JWT:** Segera ganti `JWT_SECRET` di semua lingkungan produksi.
4.  [ ] **Audit Logging:** Tambahkan log IP asli pada setiap percobaan *handshake* yang gagal di Relay.

---
*Laporan ini disusun secara otomatis oleh Asisten AI Keamanan berdasarkan audit codebase.*
