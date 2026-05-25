# 🛡️ Rekomendasi Keamanan (Hardening) - BiZETO Tunnel

Dokumen ini berisi hasil audit keamanan dan langkah-langkah perbaikan (patching) yang diperlukan untuk memperkuat infrastruktur dan logika aplikasi BiZETO Tunnel sebelum dilakukan deployment ke server produksi.

---

## 1. Perbaikan Logging IP Agen (Audit Trail)
**Temuan:** 
File `internal/tunnel/grpc_handler.go` menggunakan *hardcoded* IP `0.0.0.0` pada saat mencatat sesi ke database (`LogSession`). Hal ini membuat penelusuran (audit trail) menjadi mustahil jika terjadi serangan atau aktivitas mencurigakan dari IP tertentu.

**Rekomendasi:** 
Gunakan package `google.golang.org/grpc/peer` untuk mengekstrak alamat IP asli dari context gRPC.

**Contoh Implementasi:**
```go
import "google.golang.org/grpc/peer"

// ... di dalam fungsi RegisterAgent
p, ok := peer.FromContext(ctx)
ip := "unknown"
if ok {
    ip = p.Addr.String()
}
// Gunakan variabel ip ini untuk h.repo.LogSession
```

---

## 2. Proteksi `ControlStream` (Authentication Bypass)
**Temuan:** 
Fungsi `ControlStream` saat ini menerima koneksi dua arah tanpa memvalidasi `TunnelToken` yang dihasilkan pada tahap registrasi. Penyerang yang mengetahui ID agen dapat mencoba membuka stream kontrol tanpa otentikasi yang valid.

**Rekomendasi:** 
Agen harus mengirimkan `TunnelToken` pada pesan pertama di `ControlStream` atau menyertakannya dalam metadata gRPC (headers). Server harus memvalidasi token tersebut sebelum memproses instruksi kontrol apa pun.

---

## 3. Penguatan Identitas Perangkat (Anti-Spoofing)
**Temuan:** 
Sistem inisialisasi *Free Trial* hanya mengandalkan `MAC Address` yang dikirim oleh klien. MAC Address sangat mudah dipalsukan (*spoofing*) melalui perangkat lunak, yang memungkinkan user mendapatkan trial berkali-kali pada satu mesin.

**Rekomendasi:** 
Gunakan **Hardware Fingerprinting** yang lebih unik (seperti kombinasi CPU ID, Disk Serial, dan BIOS UUID) yang kemudian di-*hash* menjadi satu `MachineID`. Jangan pernah mempercayai identitas yang mudah dimanipulasi oleh client-side script.

---

## 4. Isolasi Port Administratif (Network Hardening)
**Temuan:** 
Konfigurasi `docker-compose.yml` mengekspos Dashboard (port 6500) dan API (port 8082) ke interface publik (`0.0.0.0`). Ini membuka peluang bagi pihak luar untuk melakukan brute-force atau eksploitasi langsung pada aplikasi manajemen.

**Rekomendasi:** 
Gunakan **Loopback Binding** agar port-port administratif hanya mendengarkan pada `localhost` (127.0.0.1). Akses eksternal harus melalui Nginx Reverse Proxy yang sudah dikonfigurasi dengan SSL dan kebijakan keamanan tambahan.

**Ubah di `docker-compose.yml`:**
```yaml
# Dashboard
ports:
  - "127.0.0.1:6500:80"
# API
ports:
  - "127.0.0.1:8082:8080"
```

---

## 5. Manajemen Secrets & Kredensial
**Temuan:** 
Kredensial sensitif (`JWT_SECRET`, `XENDIT_SECRET_KEY`, database password) tersimpan dalam teks biasa di file `.env`.

**Rekomendasi:** 
1. Pastikan file `.env` dan `.env.dev` telah ditambahkan ke `.gitignore`.
2. Di lingkungan produksi (VPS), pertimbangkan untuk menggunakan mekanisme manajemen rahasia yang lebih aman seperti **Docker Secrets** atau **Environment Variable Injection** langsung dari sistem CI/CD yang terenkripsi.

---

> **Status Audit:** `PENDING FIXES`  
> **Diperiksa Oleh:** Senior Security Architect (Gemini CLI)  
> **Tanggal:** 18 Mei 2026
