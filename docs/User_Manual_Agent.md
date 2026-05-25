# Panduan Pengguna: BIZETO Agent CLI

Dokumen ini menjelaskan cara menginstal dan menggunakan Agen BIZETO untuk mengekspos layanan lokal Anda ke internet.

## 1. Instalasi

### Windows
1. Unduh biner `bizeto-agent.exe` dari halaman [Releases](https://github.com/bizeto/bizeto-tunnel/releases).
2. Pindahkan ke folder yang terdaftar di PATH Anda (misal: `C:\Windows\system32`) atau jalankan langsung dari folder unduhan.

### macOS / Linux (One-Line Script)
Jalankan perintah berikut di terminal Anda:
```bash
curl -sL https://get.bizeto.io | bash
```

## 2. Autentikasi
Sebelum menjalankan tunnel, Anda memerlukan **API Key**.
1. Login ke [BIZETO Dashboard](http://localhost:6500).
2. Pergi ke menu **API Keys**.
3. Klik **Generate New Key** dan salin kuncinya.

## 3. Penggunaan Dasar

### Mengekspos Web App (HTTP)
Jika aplikasi Anda berjalan di port 8080:
```bash
bizeto-agent start --key BZT-XXXX-XXXX --port 8080
```
Setelah berhasil, Anda akan mendapatkan URL publik seperti `https://random-name.bizeto.io`.

### Mengekspos Printer (TCP)
Untuk printer thermal atau layanan TCP lainnya:
```bash
bizeto-agent start --key BZT-XXXX-XXXX --port 9100 --type tcp
```

## 4. Opsi Lanjutan

| Flag | Deskripsi | Contoh |
| :--- | :--- | :--- |
| `--key` | API Key Anda (Wajib) | `--key BZT-123` |
| `--port` | Port lokal target (Wajib) | `--port 3000` |
| `--domain` | Gunakan kustom domain Anda | `--domain app.saya.com` |
| `--relay` | Alamat server relai kustom | `--relay relay.perusahaan.com:4321` |
| `--name` | Nama tunnel untuk identifikasi | `--name "Server-Gudang"` |

## 5. Troubleshooting

*   **Error: Connection Refused:** Pastikan aplikasi lokal Anda sudah menyala di port yang ditentukan.
*   **Error: Invalid API Key:** Periksa kembali kunci Anda di dashboard.
*   **Latensi Tinggi:** Pastikan Anda terhubung ke server relai terdekat (default otomatis memilih yang terbaik).
