# BIZETO-Tunnel Security Audit & Remediation Roadmap
**Author:** System Security Expert
**Target:** Development Team
**Status:** HIGH PRIORITY - Confidential

## 1. Executive Summary
Audit keamanan pada codebase BIZETO-Tunnel menunjukkan sistem memiliki fungsionalitas yang baik namun memiliki beberapa celah kritis yang dapat dieksploitasi untuk mencuri data pengguna, memanipulasi tunnel, atau melakukan serangan Man-in-the-Middle (MitM). Dokumen ini berfungsi sebagai panduan eksekusi untuk tim developer.

---

## 2. Temuan Kritis & Panduan Perbaikan

### A. Vulnerability: Insecure Direct Object Reference (IDOR)
*   **Lokasi:** `internal/tunnel/api.go` -> `GetAPIKeys`, `CreateAPIKey`, `DeleteAPIKey`.
*   **Masalah:** Saat ini kode mengambil `user_id` dari query parameter URL. Pengguna 'A' bisa menghapus atau melihat kunci milik Pengguna 'B' hanya dengan mengganti ID di URL.
*   **Saran Eksekusi Detail:**
    1.  Hapus baris `userID := r.URL.Query().Get("user_id")`.
    2.  Ambil ID dari context: `userID, _ := r.Context().Value("user_id").(string)`.
    3.  Lakukan hal yang sama untuk semua handler yang memerlukan identitas user.

### B. Vulnerability: Unencrypted Control & Data Plane (MitM)
*   **Lokasi:** `cmd/agent/main.go` & `cmd/relay/main.go`.
*   **Masalah:** Komunikasi via port `50051` (gRPC) dan `4321` (Yamux) berjalan di atas TCP murni tanpa enkripsi. Data sensitif dari aplikasi lokal dikirim secara terbuka.
*   **Saran Eksekusi Detail:**
    1.  Implementasikan **Internal TLS**. Gunakan paket `crypto/tls` untuk membungkus listener di Relay.
    2.  Di sisi Agen, ganti `insecure.NewCredentials()` dengan `credentials.NewClientTLSFromCert(nil, "")` (atau sertifikat CA internal).
    3.  Gunakan `tls.Config{MinVersion: tls.VersionTLS13}`.

### C. Vulnerability: Static OAuth State (CSRF)
*   **Lokasi:** `internal/auth/service.go` -> `const oauthStateString = "random_state_string"`.
*   **Masalah:** Parameter `state` yang statis memungkinkan penyerang melakukan serangan Login CSRF.
*   **Saran Eksekusi Detail:**
    1.  Buat fungsi generator string acak (32 karakter).
    2.  Di `HandleGoogleLogin`, generate string baru, simpan di **Secure Cookie** (HttpOnly) milik browser user.
    3.  Di `HandleGoogleCallback`, bandingkan string dari Google dengan string di Cookie. Jika beda, tolak login.

---

## 3. Temuan Risiko Tinggi

### A. Weak Secret Management
*   **Masalah:** `JWT_SECRET` memiliki nilai default yang tertanam di kode.
*   **Saran Eksekusi Detail:**
    1.  Di `internal/auth/middleware.go`, hapus string default.
    2.  Jika `JWT_SECRET` kosong saat startup, buat aplikasi berhenti dengan error (`log.Fatal`). Jangan biarkan sistem berjalan dengan kunci yang diketahui publik.

### B. Plaintext API Keys in Database
*   **Masalah:** Tabel `api_keys` menyimpan kunci dalam bentuk teks asli.
*   **Saran Eksekusi Detail:**
    1.  Ubah alur pembuatan kunci: Saat user membuat kunci, tunjukkan kunci asli **hanya satu kali**.
    2.  Simpan hasil hash kunci (misal: `SHA-256`) ke database.
    3.  Saat agen konek, hash input dari agen dan bandingkan dengan hash di database.

---

## 4. Checklist Keamanan Tambahan

- [ ] **Rate Limiting:** Tambahkan middleware untuk membatasi permintaan ke `/api/auth/*` dan `/api/keys/create` (Maks 5 per menit).
- [ ] **Docker Security:** Pastikan kontainer database (`postgres`) tidak mengekspos port ke publik (hanya internal network Docker).
- [ ] **Input Validation:** Gunakan sanitasi pada input `label` kunci API dan `domain_name` untuk mencegah SQL Injection atau XSS di dashboard.

---

## 5. Timeline Perbaikan yang Disarankan
- **Fase 1 (Segera):** Fix IDOR dan OAuth State (Mencegah pencurian akun).
- **Fase 2 (Minggu ini):** Implementasi mTLS/TLS 1.3 pada Data Plane.
- **Fase 3 (Bulan ini):** Implementasi Key Hashing dan Rate Limiting.

**Note:** Segera hubungi Security Officer setelah Fase 1 selesai untuk re-audit.
