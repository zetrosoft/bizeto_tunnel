# Laporan Audit Keamanan (Security Assessment Report) - BiZETO Tunnel
**Target:** bijexa.samkarsa.com
**Status:** FINAL
**Tanggal:** 19 Mei 2026

---

### 1. Ringkasan Temuan (Executive Summary)

Sistem BiZETO memiliki arsitektur yang cukup matang dengan implementasi **gRPC**, **Yamux Multiplexing**, dan **Auto-SSL (ACME)**. Namun, ditemukan celah **IDOR (Insecure Direct Object Reference)** yang kritis pada beberapa API endpoint dan potensi kelemahan pada mekanisme **Hardware Fingerprinting**.

| Kategori | Status Risiko | Temuan Utama |
| :--- | :--- | :--- |
| **Otentikasi** | 🟡 Medium | Penggunaan *State* statis (sudah di-patch) & dependensi pada MAC Address. |
| **Otorisasi** | 🔴 Critical | **IDOR** pada fungsi penghapusan resource (API Keys/Domains). |
| **Data Plane** | 🟡 Medium | Potensi *Traffic Sniffing* pada Relay jika user menggunakan HTTP lokal. |
| **Infrastruktur** | 🟢 Low | Sudah menggunakan TLS 1.3 dan mTLS pada Control Plane. |

---

### 2. Analisis Keamanan Kodebase (White-Box Review)

#### A. Kerentanan IDOR (Insecure Direct Object Reference)
Pada file `internal/tunnel/api.go`, handler `DeleteAPIKey` dan `DeleteDomain` hanya menerima parameter `id` dari query URL tanpa memverifikasi apakah `id` tersebut benar milik `user_id` yang sedang login (dari JWT Context).
*   **Dampak:** Penyerang yang terautentikasi dapat menghapus domain atau API Key milik pengguna lain hanya dengan melakukan *enumeration* pada ID.
*   **Lokasi:** `API.DeleteAPIKey`, `API.DeleteDomain`.

#### B. Kelemahan "Trial Claim" (Hardware Spoofing)
Sistem menggunakan `MacAddress` sebagai basis verifikasi *Free Trial*. 
*   **Kelemahan:** MAC Address dikirim oleh client (Agent) dan sangat mudah dipalsukan (*spoofing*). Seorang pengguna teknis dapat membuat script untuk mengganti-ganti MAC Address dan mendapatkan kuota trial tak terbatas.
*   **Risiko:** Kerugian finansial (pencurian sumber daya bandwidth).

#### C. Mekanisme Fallback Autentikasi Agent
Pada `cmd/relay/main.go` fungsi `handleAgentConnection`, sistem mencoba memvalidasi `TunnelToken` (JWT), namun jika gagal, ia melakukan *fallback* ke API Key konvensional. 
*   **Analisis:** Jika algoritma hashing API Key di database tidak kuat atau terjadi kebocoran API Key, penyerang dapat langsung melakukan koneksi tanpa melalui proses handshake gRPC yang lebih ketat.

#### D. Validasi JWT & HMAC
Kode sudah mengimplementasikan pemeriksaan `SigningMethodHMAC` pada middleware, yang merupakan langkah tepat untuk mencegah serangan **JWT Algorithm Confusion** (perubahan dari RS256 ke HS256).

---

### 3. Analisis Infrastruktur (bijexa.samkarsa.com)

1.  **Control Plane (Port 50051 & 4321):**
    *   Penggunaan port non-standar untuk Control Plane bagus untuk mengurangi *automated bot scanning*.
    *   Wajib memastikan port 4321 (Yamux) selalu dibungkus TLS (sudah terdeteksi di kode).
2.  **Exposed Ports:**
    *   Berdasarkan `docker-compose.yml`, ada potensi eksposur port internal (8080/8082) ke publik jika tidak dibatasi oleh Firewall/Security Group VPS.
3.  **Data Privacy (Relay Server):**
    *   Sebagai *Man-in-the-Middle* yang sah, Relay memiliki akses ke trafik mentah jika user tidak menggunakan HTTPS di server lokal mereka. Ini adalah risiko privasi bawaan pada layanan tunneling.

---

### 4. Rekomendasi Strategis (Hardening)

#### 🛠️ Prioritas 1: Perbaikan Otorisasi (Immediate)
*   **Validasi Kepemilikan:** Pastikan setiap fungsi `DELETE`, `UPDATE`, atau `GET` (detail) pada API selalu menyertakan `WHERE id = $1 AND user_id = $2` dalam query database-nya. Jangan pernah mempercayai ID dari client tanpa verifikasi context user.

#### 🛡️ Prioritas 2: Penguatan Fingerprinting (Anti-Fraud)
*   **Multi-Factor Fingerprint:** Jangan hanya mengandalkan MAC Address. Gabungkan dengan **CPU ID**, **Motherboard Serial**, dan **Disk UUID**. 
*   **Server-Side Check:** Simpan hash dari kombinasi identitas tersebut di database untuk membatasi klaim trial per perangkat unik secara lebih akurat.

#### 🔐 Prioritas 3: Pengamanan Data Plane
*   **End-to-End Encryption (E2EE):** Edukasi pengguna untuk selalu menggunakan HTTPS pada aplikasi lokal mereka. 
*   **Zero-Logging Policy:** Pastikan log trafik (`traffic_logs`) tidak menyimpan isi *payload* (body) request/response, melainkan hanya metadata (header/path) untuk keperluan audit.

#### 🚀 Prioritas 4: Network Hardening
*   **Bind to Localhost:** Ubah konfigurasi Docker agar port API dan Dashboard hanya mendengarkan pada `127.0.0.1` dan diakses publik hanya melalui Reverse Proxy (Nginx/Caddy).
*   **Rate Limiting:** Terapkan pembatasan frekuensi request pada level IP di Nginx untuk mencegah brute-force pada endpoint Google Callback atau API Key.

#### 🔐 Prioritas 5: SSL Integrity & Cookie Policy (OAuth Fix)
*   **Fix SSL Mismatch:** Masalah `missing_state` pada OAuth sering disebabkan oleh ketidaksesuaian sertifikat SSL (Hostname Mismatch). Browser modern akan memblokir cookie dengan atribut `Secure` jika sertifikat tidak valid/cocok.
    *   **Solusi:** Gunakan **SAN (Subject Alternative Name)** agar satu sertifikat mencakup semua domain yang digunakan (`bc.samkarsa.com` dan `bijexa.samkarsa.com`).
    *   **Bypass Rate-Limit:** Jika Let's Encrypt terkena *rate-limit*, segera beralih ke provider alternatif seperti **ZeroSSL** atau **Google Trust Services** melalui protokol ACME. Jangan menyarankan penggunaan browser "toleran" kepada pengguna.
*   **Cookie Security:** Pastikan atribut cookie `oauth_state` diatur ke `SameSite=Lax` (atau `None` jika lintas domain dengan HTTPS) untuk menjamin token state terkirim kembali setelah redirect dari Google.
