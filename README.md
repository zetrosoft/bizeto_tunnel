# BIZETO-Tunnel: Enterprise-Grade Reverse Proxy

BIZETO-Tunnel is a high-performance tunneling solution that allows you to securely expose local services to the public internet, focusing on custom branding, security hardening, and low latency.

## 🚀 Quick Start for Developers

### 1. Prerequisites
*   **Go** version 1.21 or later.
*   **Docker & Docker Compose** (for running Redis & PostgreSQL).
*   **Protobuf Compiler** (`protoc`) & gRPC plugins.

### 2. Development Environment Setup
Clone the repository and launch the supporting infrastructure:

```bash
# Clone repository
git clone https://github.com/zetrosoft/bizeto_tunnel.git
cd bizeto_tunnel

# Start Redis & Database via Docker
docker-compose up -d
```

### 3. Dependency Installation
```bash
go mod tidy
```

### 4. Build Application
Use the following commands to compile the Relay and Agent binaries:

```bash
# Build Relay (Server)
go build -o bin/bizeto-relay ./cmd/relay

# Build Agent (Client)
go build -o bin/bizeto-agent ./cmd/agent
```

---

## 🚀 Full Version Features
*   **Persistence Database:** Uses PostgreSQL for storing credentials and domain mappings.
*   **Auto-SSL (ACME):** Built-in Let's Encrypt integration for automatic SSL certificate management on custom domains.
*   **High-Performance Proxy:** Leverages `httputil.ReverseProxy` with a custom Yamux-based dialer for robust multiplexing.

## 🛠 Usage Instructions

### 1. Start Infrastructure
```bash
docker-compose up -d
```

### 2. Configure Local Hosts (For Testing)
To enable the example domain `dev.samkarsa.com` on your local machine, add this entry to your `/etc/hosts`:
```text
127.0.0.1 dev.samkarsa.com
```

### 3. Start Relay Server
```bash
export DB_HOST=localhost
go run cmd/relay/main.go
```

### 4. Start Local Agent
```bash
go run cmd/agent/main.go --key DEV-KEY-123 --port 8080
```

---

## 📂 Repository Structure
*   `/api`: gRPC definitions and generated code.
*   `/cmd`: Entry points for the Relay (server) and Agent (client).
*   `/internal`: Core business logic (Authentication, Tunnel Management, Certificate handling).
*   `/pkg`: General utility packages.
*   `/docs`: Comprehensive technical documentation.

---

## 📜 Documentation
Developers are **REQUIRED** to review these documents before contributing:
1.  [Technical Architecture (HLD)](docs/Technical_Full_Document.md) - System overview.
2.  [Implementation Spec (LLD)](docs/Implementation_LLD.md) - Protobuf specs and DB schema.
3.  [Infrastructure Spec](docs/Infrastruktur_Spec.md) - Server and scalability requirements.
4.  [User Manual Agent](docs/User_Manual_Agent.md) - End-user operational guide.

---

## 🤝 Contribution
1.  Branch out from `develop`.
2.  Adhere to `go fmt` standards.
3.  Include unit tests for all new features in the `internal/` directory.
4.  Submit a Pull Request for review by the Lead Architect.

---

## 💰 Support & Donations
If you find this project valuable for your infrastructure or security investigations, please consider supporting the developer:
*   **PayPal:** [iswanputera](https://www.paypal.com/paypalme/iswanputera)

---

## 🔍 Featured Forensic Case Study
This tool has been utilized in high-stakes forensic investigations. Below is a summary of a recent report:

**Case: Forensic Investigation - mahkota188gaming@gmail.com**
*   **Timestamp:** 2026-05-18
*   **Infrastructure Recon:** Mapped Google Workspace mail servers and DNS records.
*   **OSINT Footprinting:** Identified linked profiles and recovery leads (Phone ending in ..74).
*   **Action Plan:** Secured account with hardware keys and revoked malicious OAuth tokens.
*   *Full details available in security logs.*

---

## 📧 Contact & Support
For technical inquiries, contact the Lead Software Architect or open an issue in the project tracker.
