# Riset Pasar: Pricing SaaS Tunneling & Analisis Teknologi

Dokumen ini berisi rangkuman riset pasar mengenai model harga (pricing) pada bisnis SaaS *Secure Tunneling* (seperti ngrok, Pinggy, zrok) serta analisis teknis mengenai cara kerja tunneling tanpa agen (agentless) menggunakan SSH.

## 1. Komparasi Rata-rata Model Harga (Pricing Tiers)

Berikut adalah perbandingan pembagian *tier* yang umum digunakan di industri SaaS *tunneling* saat ini. Harga disajikan dalam estimasi USD dan konversi kasarnya ke IDR (dengan asumsi kurs Rp 16.500 / USD). Seringkali di pasar Indonesia, harga dilokalisasi menjadi lebih murah agar sesuai dengan daya beli.

| Tingkat (Tier) | Rata-rata Harga (USD) | Rata-rata Harga (IDR) | Target Pengguna | Contoh Fitur yang Diberikan | Limitasi Umum |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free / Developer** | **$0 / bulan** | **Rp 0** | Hobbyist, Pelajar, Testing Lokal sementara | - 1 Tunnel aktif bersamaan<br>- Subdomain acak (berubah tiap restart)<br>- Protokol HTTP saja<br>- Basic Auth | - Batas waktu koneksi (misal: mati tiap 1-2 jam)<br>- Limit Bandwidth (1GB/bln - 5GB/hari)<br>- Halaman peringatan intertisial (layar peringatan sebelum masuk) |
| **Personal / Basic** | **$3 - $10 / bulan** | **± Rp 49.500 - Rp 165.000 / bln** | Freelancer, Indie Hacker, Developer Solo | - 2 hingga 3 Tunnel aktif<br>- Custom Domain (1-2 domain)<br>- Subdomain statis (permanen)<br>- Dukungan TCP (kadang tanpa UDP) | - Bandwidth dibatasi (misal 5GB/bln, kelebihan bayar per GB)<br>- Tidak ada fitur kolaborasi tim |
| **Pro / Team** | **$15 - $25 / bulan** | **± Rp 247.500 - Rp 412.500 / bln** | Startup, Agency, Tim Developer Kecil | - 5 hingga 10+ Tunnel aktif<br>- Custom Domain tanpa batas<br>- Dukungan TCP & UDP (Gaming/IoT)<br>- OAuth / SSO Login (Google/GitHub)<br>- IP Whitelisting | - Harga bertambah jika ingin menambah *seat* (anggota tim) |
| **Enterprise** | **Custom ($99+ / bulan)** | **± Rp 1.633.500+ / bln** | Perusahaan Besar, Bank, Institusi | - Tunnel tanpa batas / Ribuan Tunnel<br>- Bandwidth besar/unlimited<br>- SLA 99.99% & Priority Support<br>- Audit Logs, SAML, Zero Trust Security | - Memerlukan kontrak tahunan |

### Analisa Strategi Bisnis:
*   **Strategi ngrok:** Fokus pada enterprise. *Free tier* sangat dibatasi untuk memaksa pengguna serius *upgrade*.
*   **Strategi Pinggy:** Fokus pada *volume* dan *Developer Experience* (DX). Harga langganan murah dengan *unlimited bandwidth*, tanpa perlu instalasi.
*   **Strategi zrok:** Pendekatan *Open Source* & *Zero Trust*. Inti *software* digratiskan, tetapi versi SaaS/Hosted berbayar untuk tim yang tidak ingin mengelola infrastruktur sendiri.

Paket **Pay-As-You-Go** (misal Rp 5.000 / GB) merupakan strategi hibrida yang sangat efektif untuk menarik pengguna dengan trafik fluktuatif tanpa membebani mereka dengan langganan tetap bulanan.

---

## 2. Cara Kerja Tunneling Tanpa Agen (Agentless dengan SSH)

Beberapa kompetitor (seperti Pinggy atau Serveo) menawarkan fitur di mana pengguna **tidak perlu mengunduh agen/binary** (seperti `ngrok.exe` atau `bizeto-agent`). Mereka murni memanfaatkan **SSH**, program yang sudah tertanam di sistem operasi (Linux, macOS, Windows).

Teknologi di balik ini disebut **Reverse SSH Port Forwarding**.

### 2.1 Alur Kerja (Step-by-Step)

1.  **Eksekusi Perintah Lokal:**
    Pengguna cukup menjalankan satu baris perintah di terminal:
    ```bash
    ssh -p 443 -R 0:localhost:3000 a.pinggy.io
    ```
2.  **Koneksi Outbound:**
    Komputer lokal membuat koneksi SSH **keluar** menuju server SaaS (`a.pinggy.io`). Karena arahnya dari dalam ke luar, koneksi ini dapat dengan mudah menembus *firewall*, NAT, atau *router* rumahan.
3.  **Meminta Reverse Port (`-R`):**
    Parameter `-R 0:localhost:3000` memberikan instruksi: *"Buka sebuah port acak (0) di server remote, lalu teruskan semua trafik dari port tersebut melalui lorong SSH ini, menuju ke port 3000 di mesin lokalku."*
4.  **Routing & Proxy di Server SaaS:**
    Server SaaS menerima koneksi SSH, membuatkan subdomain dinamis (misal `app123.pinggy.io`), dan mengonfigurasi *reverse proxy* internal (seperti Nginx/Caddy) agar diarahkan ke *reverse port* yang baru saja dibuat.
5.  **Pengiriman Trafik:**
    Ketika ada pengunjung publik membuka `https://app123.pinggy.io`, *reverse proxy* akan menerima trafik tersebut dan melemparkannya masuk ke dalam lorong SSH.
6.  **Penerimaan Lokal:**
    Trafik tersebut keluar dari ujung lorong SSH di komputer lokal pengguna dan langsung menghantam aplikasi yang berjalan di port `3000`.

### 2.2 Kelebihan Agentless SSH

*   **Frictionless (Sangat Mudah):** DX (Developer Experience) maksimal. Tidak ada file yang perlu diunduh, diekstrak, atau ditambahkan ke `PATH` sistem.
*   **Aman:** Menggunakan protokol SSH yang telah teruji dan terenkripsi *end-to-end*.
*   **Bypass Firewall:** Koneksi *outbound* SSH jarang diblokir oleh jaringan standar.

### 2.3 Kekurangan Agentless SSH (Dibandingkan Agen Khusus)

*   **Performa Multiplexing:** SSH standar tidak didesain secara spesifik untuk melakukan *multiplexing* ribuan koneksi web secara efisien di bawah beban tinggi (berbeda dengan protokol modern seperti Yamux, HTTP/2, atau QUIC yang digunakan oleh agen khusus).
*   **Kurangnya Fitur Lanjutan:** Agen khusus dapat dilengkapi logika pintar di sisi klien, seperti *auto-reconnect* yang sangat agresif, pengumpulan metrik sistem, atau *health check* lokal sebelum menerima trafik. Dengan SSH standar, kontrol ini berada murni di sisi server.

---

## 3. Rekomendasi Pricing Bizeto Tunnel (Global vs Lokal)

Untuk memastikan Bizeto Tunnel kompetitif namun tetap mendapatkan profit margin yang sehat ("tidak boncos"), strategi *Pricing* harus menggunakan pendekatan **Purchasing Power Parity (PPP)**. Artinya, harga global (USD) menggunakan standar daya beli negara maju, sementara harga Indonesia (IDR) disesuaikan agar terjangkau oleh target pasar lokal tanpa mengorbankan kualitas.

### 3.1. Struktur Diskon (Upfront Commitment)

Diskon diberikan bagi pengguna yang bersedia membayar di muka (mengunci komitmen). Strategi diskon ini aman untuk arus kas perusahaan karena mendapat suntikan dana segar di awal, sekaligus menurunkan *churn rate* (pengguna berhenti langganan).

*   **1 Bulan:** Harga dasar (0% diskon). Margin tertinggi.
*   **6 Bulan:** Diskon **10%**. Menarik pengguna untuk komitmen menengah.
*   **12 Bulan (Tahunan):** Diskon **20%**. Standar industri SaaS (Beli 12 bulan, bayar setara 10 bulan). Sangat aman dan tidak akan "boncos" mengingat infrastruktur server (VPS/Bandwidth) bisa disewa tahunan dengan diskon serupa oleh perusahaan.

### 3.2. Tabel Harga Global (USD)

Target: Freelancer global, agensi internasional, perusahaan luar negeri.

| Paket | Bulanan | 6-Bulan (-10%) | 12-Bulan (-20%) | Fitur Utama |
| :--- | :--- | :--- | :--- | :--- |
| **Developer** | $0 | - | - | 1 Tunnel, Random URL, 1GB/mo |
| **Pro** | **$5.00** / bln | **$27.00** ($4.50/bln) | **$48.00** ($4.00/bln) | 10 Tunnels, Custom Domain, TCP |
| **Enterprise** | **$99.00** / bln | **$534.60** ($89.10/bln) | **$950.40** ($79.20/bln) | 100 Tunnels, Priority Support |
| **Pay-As-You-Go**| **$0.33 / GB** | - | - | Sesuai Pemakaian, No Commitment |

### 3.3. Tabel Harga Lokal Indonesia (IDR)

Target: Mahasiswa IT, Web Developer lokal, Startup UMKM Indonesia.
*Catatan: Konversi menggunakan PPP, bukan sekadar kalikan kurs Rp 16.500. Harga diturunkan ± 40%-50% dari harga global agar secara psikologis angkanya masuk akal di pasar lokal.*

| Paket | Bulanan | 6-Bulan (-10%) | 12-Bulan (-20%) | Fitur Utama |
| :--- | :--- | :--- | :--- | :--- |
| **Developer** | Rp 0 | - | - | 1 Tunnel, Random URL, 1GB/mo |
| **Pro** | **Rp 49.000** / bln | **Rp 264.600** (Rp 44.100/bln)| **Rp 470.400** (Rp 39.200/bln)| 10 Tunnels, Custom Domain, TCP |
| **Enterprise** | **Rp 990.000** / bln | **Rp 5.346.000** (Rp 891.000/bln) | **Rp 9.504.000** (Rp 792.000/bln) | 100 Tunnels, Priority Support |
| **Pay-As-You-Go**| **Rp 5.000 / GB** | - | - | Sesuai Pemakaian, No Commitment |

### Analisis Strategi Mengapa "Tidak Boncos":
1.  **Harga Pokok Penjualan (HPP) Rendah:** Biaya bandwidth server relay rata-rata (misal menggunakan DigitalOcean/Linode/AWS) sangat murah, berkisar antara $0.01 hingga $0.05 per GB. Paket Pay-As-You-Go yang dijual Rp 5.000/GB (sekitar $0.30/GB) memiliki **Margin Laba Kotor lebih dari 800%**.
2.  **Subsidi Silang Paket Pro:** Mayoritas pengguna paket Pro lokal yang membayar Rp 49.000/bulan (sekitar $3) tidak akan mengonsumsi trafik tinggi setiap hari (hanya untuk testing lokal/webhook). Sisa bandwidth dari pengguna ringan ini akan menutupi biaya server untuk sebagian kecil *power-user* yang rakus bandwidth.
3.  **Keamanan Arus Kas dari Diskon:** Diskon tahunan (20%) secara matematis berarti pelanggan membayar untuk 10 bulan di muka. Mendapatkan Rp 470.400 di hari pertama dari satu pengguna jauh lebih berharga dan aman sebagai modal operasional *(Cash Flow)* daripada mencicil Rp 49.000 setiap bulan yang rentan putus di tengah jalan (*Churn Rate* tinggi).

---

### 3.4. Memahami Pendekatan Purchasing Power Parity (PPP)

**Purchasing Power Parity (PPP)** atau **Paritas Daya Beli** adalah metode untuk menyelaraskan harga produk agar "rasa murahnya" di negara maju sama dengan "rasa murahnya" di negara berkembang (seperti Indonesia).

**Mengapa Konversi Kurs Biasa Sering Gagal?**
Misalkan harga paket Pro Bizeto Tunnel di pasar global adalah **$5.00**. Jika dikonversi langsung ($1 = Rp 16.500), harganya menjadi **Rp 82.500**.
Bagi *developer* di AS (gaji rata-rata $5.000/bulan), harga $5.00 setara uang receh (0,1% dari gaji). Namun, bagi mahasiswa IT atau *developer* pemula di Indonesia (gaji/uang saku Rp 4.000.000/bulan), mengeluarkan Rp 82.500 setiap bulan bisa terasa memberatkan.

**Solusi PPP (Diskon Lokal):**
Dengan menurunkan harganya menjadi **Rp 49.000**, produk ini secara psikologis berubah dari "pembelian yang harus dipikirkan matang-matang" menjadi "pembelian impulsif/iseng" bagi developer lokal. 

**Keuntungan PPP untuk Bizeto Tunnel (SaaS):**
1.  **Meningkatkan Volume Penjualan Skala Besar:** Lebih baik mendapatkan 1.000 pelanggan lokal yang rutin membayar Rp 49.000/bulan daripada hanya 100 pelanggan yang membayar Rp 82.500/bulan.
2.  **Menurunkan Pembajakan/Akun Sharing:** Harga yang disesuaikan dengan kantong lokal menurunkan motivasi pengguna untuk membagikan satu akun secara beramai-ramai.
3.  **HPP Produk Digital Tetap (Zero Marginal Cost):** Menjual langganan digital tambahan ke satu pengguna lokal nyaris tidak menambah biaya produksi (kecuali sedikit biaya server *bandwidth*). Oleh karena itu, menjual dengan harga lebih murah secara lokal tetap mendatangkan **margin keuntungan murni** yang tinggi dibandingkan tidak menjualnya sama sekali.

Strategi PPP ini memastikan Bizeto Tunnel tetap **eksklusif dan standar global di pasar internasional**, namun menjadi **produk merakyat yang mendominasi volume pasar di Indonesia**.

---

## 4. Peta Jalan Pengembangan (Development Roadmap): Niche Market Protokol Non-HTTP

Meskipun HTTP/HTTPS adalah standar pengembangan web, pasar *secure tunneling* memiliki ceruk (*niche*) B2B dan *Hobbyist* bernilai tinggi pada protokol **Non-HTTP (Raw TCP dan UDP)**. Fitur ini sangat dihindari oleh penyedia *tunnel* gratis karena rawan disalahgunakan dan sulit dikelola, sehingga menjadikannya fitur premium (berbayar) yang sangat laku.

Berikut adalah daftar protokol, port, dan target pasar yang harus didukung oleh Bizeto Tunnel sebagai poin keunggulan kompetitif (Unique Selling Proposition):

### 4.1. Niche Gaming & Komunikasi Real-Time (Protokol UDP)
UDP krusial untuk aplikasi yang membutuhkan latensi instan tanpa toleransi *delay*.
*   **Multiplayer Game Servers (Bervariasi):** Mengekspos server lokal *Minecraft* (UDP 25565), *Palworld*, atau CS:GO agar bisa dimainkan publik tanpa konfigurasi *port-forwarding* router.
*   **VoIP & WebRTC (Bervariasi):** Menguji server komunikasi suara/video lokal (Jitsi, Asterisk).
*   **IoT & Telemetry (UDP 5683 CoAP):** Protokol ringan khusus untuk mikrokontroler (ESP32/Arduino) bertenaga baterai yang mengirim data sensor secara masif.

### 4.2. Niche Administrasi Sistem & Homelab (Protokol Raw TCP)
TCP mentah memastikan integritas data (tidak ada paket hilang).
*   **Akses Database Remote (TCP 3306 MySQL, 5432 PostgreSQL):** Mengekspos database lokal agar bisa di-*query* langsung oleh tim jarak jauh menggunakan DBeaver/DataGrip.
*   **Remote Desktop & CLI (TCP 3389 RDP, 22 SSH, 5900 VNC):** Akses jarak jauh ke server atau PC kantor (on-premise) yang terblokir firewall *strict*.
*   **File Transfer (TCP 21 FTP, 22 SFTP):** Membuka akses server NAS lokal (Synology/QNAP) agar klien/pekerja lepas bisa menarik file video 50GB langsung dari mesin lokal tanpa *upload* ke Google Drive.

### 4.3. Niche Media Streaming & Broadcasting (Protokol TCP/UDP)
Sangat laku di kalangan *Production House* atau *Streamer*.
*   **RTMP (TCP 1935):** Standar industri *streaming* (OBS/Vmix). Kameramen di lapangan (liputan *live*) dapat mengirim video mentah via internet masuk ke *tunnel*, untuk diproses server OBS lokal di kantor.
*   **RTSP/RTP (TCP/UDP dinamis):** Mengakses *feed* kamera CCTV atau *IP Camera* lokal pabrik dari luar jaringan.

### 4.4. Niche Enterprise & Infrastruktur
*   **Identity Services (TCP/UDP 389 LDAP, 1812 RADIUS):** Mengekspos server otentikasi kantor pusat agar cabang bisa *login* (SSO).
*   **Private DNS (TCP/UDP 53):** Memungkinkan pengguna menjalankan Pi-hole/AdGuard (pemblokir iklan) di rumah, lalu diakses dari HP mereka saat bepergian (bebas iklan di jaringan 4G/5G).

### 4.5. Fitur UX Inovatif: "Preset Tunnels" (Untuk CLI Agent)
Sebagai poin pengembangan DX (Developer Experience), Bizeto CLI dapat merangkum kerumitan konfigurasi port di atas dengan membuat alias *preset* bawaan.
Alih-alih pengguna mengingat nomor port:
```bash
# Sulit diingat (Pendekatan tradisional)
bizeto tcp --port 5432 
bizeto udp --port 25565
```

Bizeto akan menyediakan *semantic commands*:
```bash
# Mudah diingat (Pendekatan Bizeto UX)
bizeto expose postgres   # Otomatis buka TCP 5432
bizeto expose minecraft  # Otomatis buka UDP 25565
bizeto expose rdp        # Otomatis buka TCP 3389
bizeto expose rtmp       # Otomatis buka TCP 1935
```
Fitur *Preset* ini akan menurunkan penghalang teknis (*barrier to entry*) secara drastis bagi pengguna awam dan memperluas adopsi Bizeto di luar demografi *web developer*.

---

## 5. Strategi Pertumbuhan (Product-Led Growth & Lokalisasi)

Untuk bersaing dengan "Goliath" seperti ngrok dan Cloudflare, Bizeto Tunnel (sebagai "David") harus menang telak dalam hal **kemudahan penggunaan (UX), harga lokal, dan pendekatan komunitas**.

### 5.1. Inovasi Produk sebagai Marketing (Product-Led Growth)
*   **"Semantic CLI" (Frictionless UX):** CLI yang cerdas dan berorientasi pada niat (*Intent-based*). Selain fitur preset port di atas, CLI dapat merespons secara manusiawi. Contoh: Ketika mendeteksi React di port 3000, CLI menyarankan *"React terdeteksi. Ingin mengekspos port 3000?"*.
*   **"Zero-Latency" Local PoP:** Menggunakan infrastruktur *Point of Presence* (PoP) lokal di Jakarta (contoh: IDCloudHost, Biznet, AWS CGK). Klaim "Satu-satunya Tunnel dengan server di Indonesia, ping di bawah 10ms" adalah daya tarik utama bagi developer lokal, khususnya pengembang game.

### 5.2. Edukasi & Komunitas (Grassroots Marketing)
Jangan menjual layanan *tunnel*, melainkan juallah **"solusi dari masalah spesifik"**.
*   **Pain-Point SEO:** Targetkan kata kunci yang secara spesifik menyelesaikan masalah developer lokal. Contoh artikel/tutorial: *"Cara Test Webhook Midtrans/Xendit di Localhost tanpa Deploy"*, atau *"Cara Main Minecraft Multiplayer Beda WiFi tanpa Port Forwarding Indihome"*.
*   **Program "Kampus Bizeto":** Tawarkan paket Pro gratis selama 6 bulan untuk pendaftar menggunakan email kampus (`.ac.id`). Ini membangun kebiasaan sejak di bangku kuliah, sehingga saat mereka lulus dan masuk ke dunia kerja (startup/korporat), *tool* pertama yang mereka usulkan ke tim adalah Bizeto.
*   **Video Marketing (TikTok/Reels):** Gunakan pendekatan *storytelling*. Tunjukkan *pain point* (menunggu *deploy* lama hanya untuk menunjukkan revisi ke klien) dan tunjukkan Bizeto sebagai jalan pintas instan (`bizeto up` langsung dapat URL).

---

## 6. Model Pembayaran: Analisis Deposit vs Wallet

Dalam penerapan model *Pay-As-You-Go* (PAYG) dengan harga kompetitif (contoh: Rp 5.000 / GB), diperlukan mekanisme untuk mencegah pengguna nakal yang menghabiskan ratusan GB lalu tidak membayar (*Hit & Run*).

### 6.1. Mengapa "Returnable Deposit" Tidak Disarankan
Sistem meminta deposit yang bisa ditarik kembali (contoh: wajib deposit Rp 50.000 di awal) **tidak sepadan (Not Worth It)**, karena:
1.  **Friction yang Tinggi:** Menghancurkan faktor "Impulse Buy". Pengguna merasa sedang membeli paket Rp 50.000, bukan membayar sesuai pemakaian.
2.  **Isu Kepercayaan:** Pengguna sering curiga terhadap janji "uang kembali" karena takut proses penarikan yang lambat atau dipersulit oleh prosedur admin/CS.
3.  **Beban Operasional:** Mengurus pengembalian dana (*refund*) memunculkan biaya transfer *payment gateway* tambahan yang akan memakan margin keuntungan. Uang titipan juga mempersulit pencatatan akuntansi (*Deferred Revenue*).

### 6.2. Solusi Industri: Prepaid Top-Up / Wallet (Sangat Disarankan)
Sebagai gantinya, gunakan model **Prepaid Top-Up (Bizeto Wallet)**.
*   **Cara Kerja:** Pengguna mengisi saldo (Top-Up) mulai dari Rp 10.000, Rp 20.000, dst. Saldo ini bersifat *non-refundable* (tidak bisa diuangkan kembali) tetapi tidak memiliki masa kedaluwarsa. Saldo akan terpotong secara otomatis per GB pemakaian.
*   **Keunggulan Utama:**
    *   Sangat akrab dengan kebiasaan orang Indonesia (seperti beli pulsa atau token listrik).
    *   Uang top-up langsung menjadi kas perusahaan (*cash flow* positif).
    *   Jika pengguna meninggalkan layanan dan masih ada sisa saldo kecil, sisa saldo tersebut menjadi margin keuntungan murni bagi perusahaan (*Breakage Profit*).
*   **User Experience (UX):** Tampilkan notifikasi yang jelas di dasbor: *"Saldo Anda: Rp 10.000. Cukup untuk ± 2 GB bandwidth."* Jika saldo menipis, peringatan segera muncul. Jika habis, koneksi terputus dengan aman. Tersedianya dukungan metode pembayaran lokal seperti **QRIS** atau **GoPay** akan mempercepat konversi di pasar Indonesia.
