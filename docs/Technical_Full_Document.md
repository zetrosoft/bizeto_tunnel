# Dokumentasi Teknis Komprehensif: BIZETO-Tunnel

**Versi:** 1.2.0  
**Status:** Dokumen Teknis Final  
**Teknologi Utama:** Go, Yamux, gRPC, Redis, PostgreSQL

---

## 1. Arsitektur Global (Sistem Terdistribusi)

BIZETO-Tunnel terdiri dari dua komponen utama: **BIZETO-Relay** (di Cloud) dan **BIZETO-Agent** (di Jaringan Privat). Keduanya berkomunikasi melalui koneksi TCP tunggal yang di-multiplexing.

### 1.1 Diagram Komponen (UML Component Diagram)

```mermaid
flowchart TD
    subgraph PI ["Public Internet"]
        UB["User Browser"]
        DNS["Custom Domain DNS"]
    end

    subgraph BR ["BIZETO-Relay (Cloud)"]
        GW["HTTPS Gateway"]
        TM["Tunnel Manager"]
        AS["Auth Service"]
        SW["ACME/SSL Worker"]
        RS[("Redis (State)")]
        DB[("PostgreSQL (Config)")]
    end

    subgraph PN ["Private Network"]
        BA["BIZETO-Agent"]
        LWA["Local Web App"]
        LPS["Local Printer Server"]
    end

    UB -->|HTTPS Request| GW
    GW -.->|Lookup| RS
    TM <==>|Multiplexed Tunnel| BA
    BA -->|Proxy Pass| LWA
    BA -->|Raw TCP| LPS
    TM <-->|Validate| AS
    AS -->|Query| DB
    SW -->|ACME Challenge| DNS
```

---

## 2. Alur Pembentukan Tunnel (Control Plane)

Control Plane bertanggung jawab atas autentikasi dan negosiasi parameter tunnel sebelum data dialirkan.

### 2.1 Diagram Sekuensial: Autentikasi & Handshake

```mermaid
sequenceDiagram
    participant BA as BIZETO-Agent
    participant TM as Tunnel Manager
    participant AS as Auth Service
    participant RS as Redis Store

    BA->>TM: Connect (TLS Handshake)
    BA->>TM: gRPC: Authenticate(API_KEY)
    TM->>AS: VerifyCredentials(key)
    AS-->>TM: Success (UserID, Plan, Assigned_Domain)
    TM->>BA: Auth OK + Domain Configuration
    BA->>TM: Initiate Yamux Session
    TM->>RS: Set(Domain -> ConnectionID)
    Note over BA, TM: Tunnel Persisten Aktif
```

---

## 3. Multiplexing Data (Data Plane)

BIZETO menggunakan protokol **Yamux** untuk memungkinkan ratusan permintaan HTTP/TCP berjalan secara paralel di atas satu koneksi fisik yang sama.

### 3.1 Diagram Alir Data: Request Handling

```mermaid
sequenceDiagram
    participant U as User
    participant GW as Gateway
    participant RS as Redis
    participant TM as Tunnel Manager
    participant BA as BIZETO-Agent
    participant App as Local App

    U->>GW: HTTP Request (host: brand.com)
    GW->>RS: Get ConnectionID for "brand.com"
    RS-->>GW: ConnectionID: #XYZ
    GW->>TM: Forward Payload to Stream #XYZ
    TM->>BA: [Yamux Frame] Open Stream + Data
    BA->>App: Forward to localhost:8080
    App-->>BA: HTTP Response
    BA-->>TM: [Yamux Frame] Response Data
    TM-->>GW: Unwrapped Payload
    GW-->>U: 200 OK (Data)
```

---

## 4. Lifecycle Manajemen SSL (ACME)

Untuk setiap domain kustom, BIZETO secara otomatis mengelola siklus hidup sertifikat SSL.

### 4.1 State Diagram: Sertifikat SSL

```mermaid
stateDiagram-v2
    [*] --> Unconfigured
    Unconfigured --> ChallengePending : User Adds Domain
    ChallengePending --> Validating : DNS/HTTP Challenge Start
    Validating --> Issued : Challenge Success
    Validating --> Failed : Invalid DNS/Timeout
    Issued --> Active : Certificate Loaded in Memory
    Active --> Expiring : Days Left < 30
    Expiring --> Validating : Auto-Renewal Start
    Failed --> ChallengePending : Retry Logic
```

---

## 5. Studi Kasus Teknis: Remote Printing

Dalam kasus printer, BIZETO-Tunnel tidak melakukan interpretasi protokol (Layer 7), melainkan hanya meneruskan aliran byte mentah (Layer 4).

### 5.1 Alur UML: Cloud-to-Printer

```mermaid
sequenceDiagram
    participant CloudApp as Web App (Cloud)
    participant Relay as BIZETO-Relay
    participant Agent as BIZETO-Agent
    participant Printer as Thermal Printer

    CloudApp->>Relay: POST /print (Binary Payload: ESC/POS)
    Relay->>Relay: Identifikasi Tunnel ID
    Relay->>Agent: Stream Data (Yamux)
    Agent->>Printer: TCP Write (Port 9100)
    Printer->>Printer: Cetak Fisik
    Agent-->>Relay: ACK (Data Sent)
    Relay-->>CloudApp: 200 OK (Printed)
```

---

## 6. Spesifikasi Teknis Komponen

### 6.1 BIZETO-Relay (Go)
*   **Networking:** `net.Listen`, `crypto/tls` (TLS 1.3).
*   **Multiplexing:** `hashicorp/yamux`.
*   **Caching:** `go-redis`.
*   **Service Mesh:** gRPC untuk komunikasi internal.

### 6.2 BIZETO-Agent (Go)
*   **Binary Size:** ~15MB (Statis, tanpa dependensi eksternal).
*   **Platform:** Mendukung `GOOS=linux, windows, darwin` dan `GOARCH=amd64, arm64, arm`.
*   **Reverse Proxy:** Menggunakan `httputil.ReverseProxy` untuk HTTP dan `io.Copy` untuk Raw TCP.

---

## 7. Ketahanan (Fault Tolerance)

1.  **Exponential Backoff:** Jika koneksi ke Relay terputus, Agent akan mencoba menyambung kembali dengan jeda waktu yang meningkat (1s, 2s, 4s, ..., max 30s).
2.  **Heartbeat/Keep-Alive:** Ping setiap 30 detik untuk memastikan koneksi TCP tidak diputus oleh firewall perantara atau beban penyeimbang (Load Balancer).
3.  **Graceful Shutdown:** Menutup semua aliran aktif sebelum biner dihentikan.
