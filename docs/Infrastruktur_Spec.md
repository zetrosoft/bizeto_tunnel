# Spesifikasi Infrastruktur: BIZETO-Tunnel

Dokumen ini merinci kebutuhan perangkat keras dan perangkat lunak untuk menjalankan komponen BIZETO-Tunnel, baik untuk skenario *Self-Hosted* maupun *Managed*.

---

## 1. Server Relai (BIZETO-Relay)
Server ini berfungsi sebagai titik pusat yang menerima lalu lintas dari internet publik dan meneruskannya ke agen lokal.

### A. Spesifikasi Minimum (Hingga 50 Tunnel Aktif)
Cocok untuk penggunaan pribadi, tim kecil, atau server *self-hosted* di VPS murah.
*   **CPU:** 1 vCPU (Shared)
*   **RAM:** 512 MB - 1 GB
*   **Storage:** 10 GB (SSD lebih disukai)
*   **Network:** 100 Mbps Bandwidth, 500 GB - 1 TB Egress/Bulan.
*   **OS:** Linux (Ubuntu 22.04 LTS, Debian 11+, atau Alpine Linux untuk Docker).

### B. Spesifikasi Rekomendasi (Skala Enterprise / 500+ Tunnel)
Cocok untuk penyedia layanan atau infrastruktur internal perusahaan besar.
*   **CPU:** 2-4 vCPU (Dedicated) - Go sangat efisien dalam memanfaatkan *multi-threading*.
*   **RAM:** 2 GB - 4 GB (Utamanya untuk caching rute di Redis dan buffer TLS).
*   **Storage:** 20 GB+ NVMe.
*   **Network:** 1 Gbps+ Bandwidth dengan latensi rendah.
*   **Additional:** Static Public IP (Wajib), Wildcard DNS support.

---

## 2. Sisi Klien / Agen (BIZETO-Agent)
Perangkat yang menjalankan aplikasi lokal dan terhubung ke Server Relai.

### A. Spesifikasi Minimum
BIZETO-Agent dirancang sangat ringan agar bisa berjalan di perangkat IoT.
*   **Hardware:** Raspberry Pi Zero, Router OpenWrt (dengan storage cukup), atau PC Tua.
*   **CPU:** Arsitektur ARM, x86, atau x64.
*   **RAM:** 64 MB - 128 MB (Hanya memakan sedikit memori untuk proses tunneling).
*   **OS:** Windows, macOS, Linux, atau FreeBSD.

---

## 3. Komponen Pendukung (Software Stack)
Jika Anda melakukan *Self-Hosted* penuh, berikut adalah dependensi yang dibutuhkan:

| Komponen | Versi Rekomendasi | Peran |
| :--- | :--- | :--- |
| **HAProxy** | 2.8+ | Gateway utama (TCP Shield) & Proteksi DDoS. |
| **Traefik** | 2.10+ | Manajemen SSL otomatis (ACME) & HTTP Routing. |
| **Go Runtime** | 1.21+ | Untuk kompilasi/menjalankan biner Relay Core. |
| **Redis** | 6.2+ | Menyimpan status sesi tunnel secara *real-time*. |
| **PostgreSQL** | 14+ | Manajemen user, API Key, dan log audit. |
| **Docker** | 24.0+ | (Wajib) Mengelola orkestrasi kontainer Perisai Ganda. |

---

## 4. Estimasi Biaya (Visi Murah/Donasi)
Berdasarkan visi untuk memberikan layanan murah, berikut estimasi biaya VPS untuk *Self-Hosting*:

*   **Penyedia Murah (Hetzner/DigitalOcean/Vultr):** ~$4 - $6 / bulan.
*   **Oracle Cloud (Free Tier):** **Rp 0 (Gratis Selamanya)** - Sangat direkomendasikan karena memberikan spek ARM yang tinggi (4 vCPU / 24 GB RAM) secara gratis.
*   **Google Cloud / AWS (Free Tier):** Bisa digunakan untuk skala kecil (micro instance).

## 5. Tabel Perbandingan Spesifikasi Berdasarkan Jumlah Koneksi

Berikut adalah estimasi kebutuhan server relai berdasarkan beban koneksi *concurrent* (aktif bersamaan).

| Kapasitas (Koneksi Aktif) | Tipe Profil | CPU | RAM | Bandwidth | Rekomendasi Penggunaan |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1 - 100** | **Entry / Dev** | 1 vCPU (Shared) | 1 GB | 100 Mbps | Pengembang & UMKM Kecil |
| **100 - 500** | **Professional** | 2 vCPU (Dedicated) | 2 GB - 4 GB | 500 Mbps | Agensi & Start-up |
| **500 - 2.000+** | **Enterprise** | 4 - 8 vCPU (High Priority) | 8 GB - 16 GB | 1 Gbps+ | Layanan SaaS & Perusahaan Besar |

### Analisis untuk 500+ Koneksi (Skala Enterprise)
Untuk menangani lebih dari 500 koneksi aktif secara stabil, fokus bergeser dari sekadar RAM ke **I/O Jaringan** dan **Manajemen Thread CPU**:

1.  **CPU (Multi-Core):** Pada skala ini, Go runtime akan sangat sibuk melakukan enkripsi/dekripsi TLS. CPU dengan jumlah *core* lebih banyak (4-8 core) sangat krusial untuk menangani *goroutines* secara paralel tanpa latensi.
2.  **RAM (Buffer & Caching):** Setiap koneksi Yamux memiliki buffer internal. Dengan ribuan koneksi, penggunaan RAM akan meningkat secara linear untuk menjaga *throughput* data tetap tinggi. 8GB - 16GB adalah angka aman untuk mencegah *Out of Memory* (OOM).
3.  **Network Bandwidth:** 500 koneksi aktif yang melakukan transfer data berat dapat dengan mudah menghabiskan pipa 100-500 Mbps. Server Enterprise wajib memiliki kartu jaringan 1 Gbps atau lebih.
4.  **Optimasi OS (Ulimit):** Pada skala 500+, pengaturan standar Linux untuk *Open Files* (ulimit) harus ditingkatkan (misal ke 65535) agar sistem dapat membuka banyak *socket* sekaligus.

## 6. Pertimbangan Khusus (Bandwidth & Latensi)
1.  **Bandwidth:** Konsumsi bandwidth di Server Relai adalah 2x lipat (Traffic In dari User + Traffic Out ke Agent). Pastikan kuota bulanan VPS mencukupi.
2.  **Lokasi Server:** Pilih lokasi VPS yang paling dekat dengan lokasi fisik Agen Lokal untuk meminimalkan *ping* (latensi). Contoh: Jika Agen di Indonesia, gunakan VPS di Singapura atau Jakarta.
