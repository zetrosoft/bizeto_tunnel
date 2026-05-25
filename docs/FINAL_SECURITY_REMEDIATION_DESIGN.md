# FINAL SECURITY REMEDIATION & ARCHITECTURE DESIGN
**Project:** Bizeto Tunnel v1.2.0
**Status:** REQUIRED BEFORE PRODUCTION DEPLOYMENT

Dokumen ini merupakan ringkasan eksekutif dan panduan teknis final yang menggabungkan temuan audit keamanan. Tim pengembang diinstruksikan untuk mengimplementasikan perubahan berikut sesuai dengan prioritas yang ditetapkan.

---

## FASE 1: PERBAIKAN KRITIS (BLOCKER)
*Perbaikan ini wajib diselesaikan sebelum server relay dibuka untuk akses publik.*

### 1. Integritas Data Bandwidth (Atomic Operations)
- **Lokasi:** internal/tunnel/manager.go
- **Masalah:** Penambahan counter BytesIn dan BytesOut tidak aman secara konkuren (Data Race).
- **Solusi:** Gunakan package sync/atomic.
- **Implementasi:**
  Gunakan atomic.AddInt64(c.BytesIn, int64(n)) alih-alih penambahan langsung.

### 2. Pencegahan Serangan "Re-Hashing Lockout"
- **Lokasi:** internal/db/repository.go -> ValidateKey
- **Masalah:** Logika migrasi otomatis men-hash API Key yang sudah di-hash.
- **Solusi:** Hapus total logika fallback migrasi otomatis. Pindahkan migrasi API Key ke skrip migrasi database (SQL) satu kali.

### 3. gRPC Rate Limiting (Infrastruktur DoS)
- **Lokasi:** cmd/relay/main.go & internal/tunnel/grpc_handler.go
- **Masalah:** Endpoint registrasi agen tidak memiliki batasan frekuensi.
- **Solusi:** Tambahkan gRPC Unary Interceptor menggunakan golang.org/x/time/rate.
- **Target:** Limit 5 request/second per IP untuk registrasi.

---

## FASE 2: RESILIENSI & MANAJEMEN RESOURCE
*Meningkatkan ketahanan server terhadap serangan eksploitasi resource.*

### 4. Memory-Safe Throttling (Pre-read Logic)
- **Lokasi:** internal/tunnel/manager.go -> CountingConn
- **Masalah:** Throttling terjadi setelah pembacaan data (Post-read).
- **Solusi:** Implementasikan pembacaan berukuran kecil (chunked) dan panggil Limiter.WaitN SEBELUM membaca chunk berikutnya.

### 5. Pembersihan Sesi "Hantu" (Cleanup Worker)
- **Lokasi:** internal/tunnel/manager.go
- **Masalah:** Sesi yang tidak tertutup secara normal tetap menggantung di memori.
- **Solusi:** Tambahkan Background Scavenger Worker yang memeriksa session.IsClosed() setiap 5 menit.

---

## FASE 3: PENGUATAN AUTENTIKASI & PRIVASI

### 6. Pengamanan Aliran Token OAuth
- **Masalah:** JWT terpapar di URL query parameter saat redirect.
- **Solusi:** 
  1. Backend menyimpan JWT sementara di Secure; HttpOnly cookie.
  2. Frontend mengambil JWT dari cookie atau melalui endpoint /api/auth/me.

### 7. Manajemen Rahasia (Secret Management)
- **Solusi:** Cabut semua kunci statis (ConfigIntegrityKey, SecKey) dari kode. Pindahkan ke .env dan akses melalui os.Getenv().

---

## FASE 4: KEAMANAN KONTAINER & JARINGAN

### 8. Docker Non-Root User
- **Instruksi:** Perbarui Dockerfile.relay untuk membuat user non-privilege.
  Contoh: RUN adduser -D -u 1000 bizeto && USER bizeto

### 9. SSRF Prevention (Agent Whitelisting)
- **Masalah:** Agent bisa dipaksa melakukan proxy ke jaringan internal Relay.
- **Solusi:** Tambahkan validasi pada Relay untuk hanya mengizinkan forwarding ke port-port standar.

---

## CHECKLIST UNTUK TIM DEV
- [ ] Ganti semua counter bandwidth ke sync/atomic.
- [ ] Hapus logika migrasi API Key otomatis di repository.go.
- [ ] Tambahkan rate limiter pada gRPC RegisterAgent.
- [ ] Refactor CountingConn agar lebih hemat memori.
- [ ] Implementasi scavenger worker untuk sesi Yamux.
- [ ] Pindahkan semua kunci integritas ke environment variables.
- [ ] Update Dockerfile ke mode Non-Root.

**Dibuat Oleh:** Software Architect & Security Analyst (Gemini CLI)
**Tanggal:** 19 Mei 2026
