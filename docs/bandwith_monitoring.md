# Rancangan Sistem Pemantauan Bandwidth & Topup (Pay-As-You-Go)

## 🎯 Objektif
Mengimplementasikan sistem manajemen bandwidth prabayar (Pay-As-You-Go) tanpa masa aktif. Skema harga menggunakan sistem Paket Tier (Berjenjang) yang dirancang agar menguntungkan bagi *Owner*, terjangkau bagi *Customer*, dan sangat kompetitif.

## 🗄️ Pembaruan Database Schema (`internal/db/schema.sql`)
1.  **`user_bandwidth_quota`**:
    *   `user_id` (UUID, Foreign Key)
    *   `total_bytes_purchased` (BIGINT)
    *   `total_bytes_used` (BIGINT)
    *   `is_throttled` (BOOLEAN)
    *   `trial_mac_address` (VARCHAR) - Kunci keamanan utama (Hardware ID).
    *   `trial_started_at` (TIMESTAMP)

## ⚙️ Model Harga (Pricing Model)
Bizeto menggunakan model dua jalur:

### 1. Paket Gratis (Free Tier) - Device Locked
*   **Klaim Sekali Seumur Hidup:** 1x per Hardware MAC Address.
*   **Kapabilitas:** 1 Tunnel Aktif (**HTTP** & **Raw TCP**).
*   **Bandwidth:** 1 GB (Kecepatan Penuh).
*   **Lifecycle:** Setelah 30 hari, kecepatan dilimit ke **128 KB/s**.

### 2. Pay-As-You-Go (PAYG)
*   **Saldo:** Saldo Top Up tidak akan hangus (Permanen).
*   **Prioritas (QoS):** High Quality of Service (Prioritas Utama).
*   **Bonus:** Bonus 500MB khusus pelanggan baru (Hanya jika MAC perangkat belum pernah terdaftar).

---

## ⚙️ Backend (Go & gRPC)
1.  **Validasi MAC Address**: Agen mengirimkan MAC Address saat registrasi. Server menolak pemberian bonus/free tier jika MAC sudah terdaftar di user mana pun.
2.  **Mekanisme Throttling & QoS**: 
    *   Limit 128 KB/s jika kuota habis atau masa trial berakhir.
    *   Prioritas trafik (QoS Weight) diberikan kepada pengguna berbayar saat beban server tinggi.

---

## 📈 Analisis Pasar & Penetapan Harga
*   **IDR:** Rp 20.000 / GB (Sangat kompetitif untuk pasar lokal).
*   **USD:** $4.99 / GB (Margin tinggi untuk pasar global).
