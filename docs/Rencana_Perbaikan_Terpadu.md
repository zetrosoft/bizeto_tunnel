# Rencana Perbaikan Terpadu - Bizeto Tunnel

## 1. Perbaikan Bandwidth & Kuota (Sesuai `bandwith_monitoring.md`)
* **Masalah:** Data bandwidth selalu reset ke 0 setelah beberapa detik.
* **Sinkronisasi Dokumentasi:** Terdapat 2 paket utama: **Free** (Trial 1GB/30 hari) dan **Pay-As-You-Go** (Permanen & Prioritas). Jika kuota habis atau trial berakhir, berlaku limit 128 KB/s (Throttled).
* **Solusi:** 
    * Menggabungkan data akumulasi database (`total_bytes_used`) dengan data live memori.
    * Dashboard menampilkan nama paket yang dimiliki user saat ini (Free/Pay-As-You-Go).
    * Jika user masih menggunakan paket "Free", tampilkan tombol "Upgrade" yang mencolok ke "Pay-As-You-Go".
    * Menampilkan indikator "Throttled" yang jelas jika limit tercapai.


## 2. Fitur Multi-Bahasa (UX Improvement)
* **Masalah:** Belum ada kontrol manual untuk ganti bahasa.
* **Solusi:** Menambahkan Language Switcher di sidebar dashboard dan memastikan preferensi tersimpan di localStorage agar konsisten di seluruh halaman (Landing, Pricing, Dashboard).

## 3. Monitoring Detail Agent (Sesuai `tunnel.proto` & `Implementation_LLD.md`)
* **Masalah:** Metadata seperti MAC Address dan Hostname sudah ada di protokol gRPC tapi belum disimpan ke database.
* **Sinkronisasi Dokumentasi:** MAC Address adalah "Primary Security Key" untuk mencegah penyalahgunaan trial.
* **Solusi:** 
    * **Backend:** Update gRPC RegisterAgent untuk mencatat MAC, Hostname, dan Versi ke tabel `tunnel_sessions`.
    * **Frontend:** Menampilkan metadata perangkat ini di list tunnel.
    * **Fitur Baru:** Menambahkan panel "Live Traffic Logs" (Console-like) di dashboard untuk memantau aktivitas trafik secara real-time.

## 4. Peningkatan Menu API Key (Sesuai `V1.0.0_PRODUCTION_PLAN.md`)
* **Masalah:** Kurang informasi identitas perangkat.
* **Solusi:** Mencatat `last_used_at` dan hostname terakhir pada setiap API Key. Di UI, user akan melihat perangkat mana yang terakhir kali menggunakan key tersebut, memberikan keamanan ekstra (audit trail).
