# Arsitektur Port & Jaringan BIZETO-Relay

Dokumen ini menjelaskan pembagian port pada server Relay Bizeto dan fungsinya masing-masing dalam mendukung ekosistem *tunneling*.

## Daftar Port dan Peranannya

Berikut adalah tabel pemetaan port yang diekspos oleh kontainer `bijexa-relay`:

| Port Host | Port Kontainer | Nama Layanan | Protokol | Fungsi Utama |
| :--- | :--- | :--- | :--- | :--- |
| **8081** | 80 | HTTP Redirector | TCP (HTTP) | Pengalihan paksa dari `http://` ke `https://`. |
| **4443** | 443 | HTTPS Gateway | TCP (HTTPS) | Jalur masuk trafik publik ke tunnel dengan Auto-SSL (ACME). |
| **4321** | 4321 | Data Plane | TCP (Yamux) | Jalur pengiriman data mentah antara Relay dan Agen. |
| **8082** | 8080 | Dashboard API | TCP (REST) | Jalur komunikasi antara Dashboard Web dan Backend. |
| **50051** | 50051 | Control Plane | TCP (gRPC) | Jalur registrasi, autentikasi, dan kontrol Agen. |

---

## Penjelasan Detil

### 1. HTTP Redirector (8081 → 80)
Berfungsi sebagai pintu keamanan awal. Setiap permintaan yang masuk menggunakan protokol tidak terenkripsi akan segera diarahkan ke jalur aman (HTTPS). Ini menjamin bahwa data yang melewati tunnel selalu dalam keadaan terenkripsi.

### 2. HTTPS Gateway (4443 → 443)
Ini adalah jantung dari server Relay yang menangani **SSL Termination**. Bizeto menggunakan integrasi ACME (Let's Encrypt) untuk secara otomatis menerbitkan sertifikat SSL bagi setiap subdomain user. 
*   **Keuntungan**: Pengguna tidak perlu mengurus SSL di server lokal mereka sendiri.
*   **Isolasi**: Menggunakan port 4443 di tingkat host mencegah konflik jika VPS sudah menjalankan web server lain di port 443.

### 3. Data Plane / Yamux (4321)
Port ini khusus digunakan untuk protokol **Yamux (Yet another Multiplexer)**. Yamux memungkinkan banyak koneksi virtual berjalan di atas satu koneksi TCP fisik tunggal antara Agen dan Relay.
*   Port ini memikul beban trafik aplikasi (misal: trafik website atau API yang sedang di-tunnel).

### 4. Dashboard API (8082 → 8080)
Memisahkan trafik manajemen dari trafik tunnel. Jalur ini digunakan oleh dashboard untuk:
*   Mengambil statistik penggunaan bandwidth.
*   Mengelola daftar API Key.
*   Melakukan konfigurasi profil dan paket langganan.

### 5. Control Plane / gRPC (50051)
Menggunakan standar industri **gRPC over HTTP/2**. Ini adalah jalur komunikasi berkecepatan tinggi dan hemat bandwidth untuk:
*   **Registrasi Agen**: Validasi API Key dan identitas perangkat.
*   **Handshake**: Pertukaran token sesi sekali pakai.
*   **Monitoring**: Mengirimkan sinyal detak jantung (*heartbeat*) untuk memastikan Agen tetap online.

---

## Ringkasan Manfaat
*   **Keamanan Berlapis**: Pemisahan Control Plane (50051) dan Data Plane (4321) memastikan bahwa meskipun satu jalur terganggu, manajemen sistem tetap dapat diakses.
*   **Isolasi Protokol**: Mengurangi kemungkinan konflik data dan mempermudah debugging jika terjadi masalah pada salah satu layanan.
*   **Skalabilitas**: Arsitektur ini memungkinkan kita untuk mengoptimalkan sumber daya server berdasarkan jenis beban trafik (misal: menambah bandwidth pada port 443 tanpa membebani port API).
