# 🛠️ DEVELOPER SECURITY HARDENING GUIDE
**Target:** Bizeto Tunnel v1.2.0

Rekomendasi teknis ini ditujukan untuk tim Developer guna menutup celah keamanan yang ditemukan pada audit terakhir.

---

## 1. CORS Hardening (Prio: HIGH)
**Masalah:** Penggunaan wildcard '*' pada origin.
**Perbaikan (Sudah Diterapkan):** 
- Middleware sekarang mengecek header 'Origin' terhadap 'FRONTEND_URL'.
- Selalu gunakan domain spesifik di produksi.

## 2. JWT Integrity (Prio: HIGH)
**Masalah:** Algoritma penandatanganan tidak divalidasi.
**Perbaikan (Sudah Diterapkan):**
- Menambahkan pengecekan 'token.Method.(*jwt.SigningMethodHMAC)' di middleware.
- Mencegah serangan 'None Algorithm'.

## 3. Secret Management (Prio: HIGH)
**Masalah:** Kunci integritas konfigurasi ('ConfigIntegrityKey') bersifat statis.
**Rekomendasi Developer:**
- Pindahkan kunci ini ke '.env'.
- Gunakan 'os.Getenv("CONFIG_INTEGRITY_KEY")' di 'internal/auth/service.go'.
- Jangan pernah melakukan hardcode kunci kriptografi di dalam kode.

## 4. OAuth Data Security (Prio: MEDIUM)
**Masalah:** Mengirim JWT melalui URL Fragment/Query.
**Rekomendasi Developer:**
- Ubah aliran login: Gunakan 'HttpOnly Cookie' untuk menyimpan JWT sementara, atau gunakan endpoint '/api/auth/session' untuk mengambil data setelah redirect selesai.
- Hindari membawa informasi sensitif di URL karena akan tercatat di log server.

## 5. Docker Non-Root (Prio: LOW)
**Masalah:** Kontainer berjalan sebagai root.
**Rekomendasi Developer:**
- Tambahkan baris berikut di 'Dockerfile.relay':
  RUN adduser -D -u 1000 bizeto
  USER bizeto

---
**Catatan:** Keamanan bukan sebuah fitur, melainkan proses berkelanjutan. Lakukan audit berkala setiap kali ada perubahan pada logika autentikasi.
