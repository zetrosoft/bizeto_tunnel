# BIZETO-Tunnel: Project Memory

## [2026-05-14] PHASE 2: gRPC CONTROL PLANE IMPLEMENTATION
- **Achievement:** Migrasi dari handshake JSON (Legacy) ke gRPC Bidirectional Control Plane.
- **Technical Changes:**
  - Generate Go code dari `api/v1/tunnel.proto`.
  - Implementasi `GRPCHandler` di Relay Server.
  - Implementasi JWT-based `TunnelToken` untuk otorisasi Data Plane.
  - Upgrade Agent untuk registrasi via gRPC.

## [2026-05-16] PHASE 3: PAY-AS-YOU-GO BANDWIDTH & TOPUP SYSTEM
- **Achievement:** Migrasi sistem langganan (subscription) bulanan menjadi model *Pay-As-You-Go* (berbasis volume kuota) dengan dukungan Topup instan via Xendit.
- **Backend & Database Changes:**
  - Penambahan tabel `user_bandwidth_quota` (dengan field `expires_at` untuk bonus) dan `topup_transactions`.
  - Implementasi *Background Sync Worker* (`internal/tunnel/sync.go`) untuk menjumlahkan metrik I/O secara *real-time* ke database (siklus 1 menit).
  - Mekanisme **Throttling Otomatis**: Kecepatan koneksi TCP Yamux akan dilimit hingga 128KB/s jika pemakaian melebihi kuota yang dibeli atau jika masa bonus kedaluwarsa.
  - Endpoint topup otomatis Xendit (`CreateTopupCheckout`) di-bundle dengan Paket Tier (Starter, Popular, Value, Best Deal).
  - Skema Bonus: Setiap user baru yang belum pernah topup akan mendapat bonus inisialisasi **500MB (berlaku 30 Hari)**.
- **Frontend Changes:**
  - Mengubah antarmuka "Billing" di `UserDashboard.tsx` menjadi manajer "Sisa Kuota" visual (ProgressBar), beserta opsi nominal topup.
  - Memperbarui tabel "Tenants & Users" di `OwnerDashboard.tsx` agar menyajikan informasi kuota sisa, total pemakaian, indikator Throttle, dan akumulasi nilai deposit.
  - **Penyederhanaan UI Publik:** Memperbarui `LandingPage.tsx` dan `PricingPage.tsx` agar menyembunyikan tabel perbandingan paket langganan klasik (bulanan) dan hanya menampilkan paket Pay-As-You-Go sebagai fokus utama, lengkap dengan info bonus awal 500MB.
- **Global Pricing (PPP):**
  - Mengimplementasikan *Purchasing Power Parity (PPP)* untuk mata uang USD. Pengguna internasional ($ USD) akan menerima harga PPP ($4.99/GB) sementara pengguna IDR menerima harga lokalisasi (Rp 20.000/GB).
  - API Topup dan webhook di-refactor untuk mendukung pemisahan kalkulasi harga USD dan konversinya ke Invoice IDR Xendit secara *on-the-fly*.

## [2026-05-17] SHADCN INTEGRATION & UX IMPROVEMENT
- **Achievement:** Migrasi penuh dari dialog kustom ke official Shadcn/UI AlertDialog (Radix UI).
- **Technical Changes:**
  - Mengintegrasikan `dashboard/src/components/ui/alert-dialog.tsx` ke dalam `Shared.tsx`.
  - Refactoring `AlertDialog` dan `ConfirmDialog` di `Shared.tsx` agar menggunakan komponen berbasis Radix UI namun tetap mempertahankan API prop-based yang kompatibel dengan call-site yang sudah ada.
  - Memastikan konsistensi tampilan (Dark/Light mode) dan animasi transisi pada dialog di seluruh dashboard.
  - Verifikasi penghapusan total pemanggilan `alert()` native di seluruh codebase frontend.
- **Docker & Build Infrastructure:**
  - Update `dashboard/Dockerfile.dev` dengan `ENV CI=true` dan flag `--no-frozen-lockfile` untuk mengatasi error TTY dan sinkronisasi lockfile otomatis di dalam container.
  - Memastikan dependensi runtime Shadcn (`@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`) berada di `dependencies` utama agar terinstal dengan benar di lingkungan produksi/container.

