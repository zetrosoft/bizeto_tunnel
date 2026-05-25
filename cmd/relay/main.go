package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/bizeto/bizeto-tunnel/internal/auth"
	"github.com/bizeto/bizeto-tunnel/internal/billing"
	"github.com/bizeto/bizeto-tunnel/internal/db"
	"github.com/bizeto/bizeto-tunnel/internal/tunnel"
	"github.com/joho/godotenv"
	"google.golang.org/grpc"
	pb "github.com/bizeto/bizeto-tunnel/api/v1"
)

type HandshakeRequest struct {
	APIKey    string `json:"api_key"`
	Version   string `json:"version"`
	Hostname  string `json:"hostname"`
	OS        string `json:"os"`
	MachineID string `json:"machine_id"`
}

func main() {
	// Build ID unik untuk verifikasi deployment
	fmt.Println("[BOOT] BIZETO-Relay Enterprise - Build ID: 20260521-v5")
	
	// Load environment variables from .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("[INFO] No .env file found, using system environment variables")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is not set!")
	}
	auth.SetJWTKey(jwtSecret)

	fmt.Println("Starting BIZETO-Relay Full Version...")

	// 1. Inisialisasi Database
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5433")
	dbUser := getEnv("DB_USER", "bizeto_user")
	dbPass := getEnv("DB_PASS", "bizeto_password")
	dbName := getEnv("DB_NAME", "bizeto_db")
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", 
		dbHost, dbPort, dbUser, dbPass, dbName)
	fmt.Printf("[DEBUG] Connecting to DB with user: %s, host: %s\n", dbUser, dbHost)

	repo, err := db.NewRepository(dsn)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer repo.Close()

	// 2. Inisialisasi Layanan
	authSvc := auth.NewService(repo)
	billingSvc := billing.NewService(repo)
	tunnelMgr := tunnel.NewManager()
	tunnelMgr.StartScavenger(5 * time.Minute)

	gateway := tunnel.NewGateway(tunnelMgr, repo)
	api := tunnel.NewAPI(tunnelMgr, repo, billingSvc, authSvc)

	// Konfigurasi Metadata Relay dari Env
	api.Region = getEnv("RELAY_REGION", "Singapore (SIN)")
	api.NodeID = getEnv("RELAY_NODE_ID", "RELAY-SIN-01")
	api.IsSecure = true // Always true because SSL is terminated by Traefik at the edge

	// 2. Register API Endpoints for Dashboard (Port 8080)
	mux := http.NewServeMux()

	// Public Endpoints
	mux.HandleFunc("/api/auth/google/login", authSvc.HandleGoogleLogin)
	mux.HandleFunc("/api/auth/google/callback", authSvc.HandleGoogleCallback)
	mux.HandleFunc("/api/pricing-plans", api.GetPublicPricingPlans) // New public endpoint
	mux.HandleFunc("/api/exchange-rate", api.GetExchangeRate) // Dynamic exchange rate endpoint

	// Protected User Endpoints
	mux.HandleFunc("/api/stats", auth.JWTMiddleware(api.GetStats))
	mux.HandleFunc("/api/tunnels", auth.JWTMiddleware(api.GetTunnels))
	mux.HandleFunc("/api/tunnels/traffic", auth.JWTMiddleware(api.GetTrafficLogs))
	mux.HandleFunc("/api/tunnels/check-status", auth.JWTMiddleware(api.CheckTunnelStatus))
	mux.HandleFunc("/api/tunnels/delete", auth.JWTMiddleware(api.DeleteDomain))
	mux.HandleFunc("/api/tunnels/custom/add", auth.JWTMiddleware(api.AddCustomDomain))
	mux.HandleFunc("/api/tunnels/custom/verify", auth.JWTMiddleware(api.VerifyDNS))
	mux.HandleFunc("/api/wizard/save", auth.JWTMiddleware(api.SaveWizardData))
	mux.HandleFunc("/api/keys", auth.JWTMiddleware(api.GetAPIKeys))
	mux.HandleFunc("/api/keys/create", auth.JWTMiddleware(api.CreateAPIKey))
	mux.HandleFunc("/api/keys/delete", auth.JWTMiddleware(api.DeleteAPIKey))
	mux.HandleFunc("/api/keys/download-config", auth.JWTMiddleware(api.DownloadAgentConfig))
	mux.HandleFunc("/api/user/features", auth.JWTMiddleware(api.GetUserFeatures))
	mux.HandleFunc("/api/user/profile", auth.JWTMiddleware(api.GetUserProfile))
	mux.HandleFunc("/api/user/profile/update", auth.JWTMiddleware(api.UpdateUserProfile))
	mux.HandleFunc("/api/billing/checkout", auth.JWTMiddleware(api.HandleCheckout))
	mux.HandleFunc("/api/billing/topup", auth.JWTMiddleware(api.HandleTopupCheckout))
	mux.HandleFunc("/api/bandwidth/status", auth.JWTMiddleware(api.GetBandwidthStatus))
	mux.HandleFunc("/api/billing/webhook", api.HandleWebhook)
	mux.HandleFunc("/api/billing/simulate-webhook", auth.JWTMiddleware(api.SimulateWebhook))

	// Protected Owner Endpoints
	mux.HandleFunc("/api/owner/stats", auth.JWTMiddleware(auth.OwnerOnly(api.GetOwnerStats)))
	mux.HandleFunc("/api/owner/tenants", auth.JWTMiddleware(auth.OwnerOnly(api.GetOwnerTenants)))
	mux.HandleFunc("/api/owner/sessions", auth.JWTMiddleware(auth.OwnerOnly(api.GetOwnerSessions)))
	mux.HandleFunc("/api/owner/tenants/toggle", auth.JWTMiddleware(auth.OwnerOnly(api.ToggleUser)))
	mux.HandleFunc("/api/owner/tenants/role", auth.JWTMiddleware(auth.OwnerOnly(api.UpdateUserRole)))
	mux.HandleFunc("/api/owner/pricing-plans", auth.JWTMiddleware(auth.OwnerOnly(api.GetOwnerPricingPlans)))
	mux.HandleFunc("/api/owner/pricing-plans/upsert", auth.JWTMiddleware(auth.OwnerOnly(api.UpsertPlan)))

	// Jalankan API Server di background dengan Global CORS Middleware
	// Di Docker Dev: Host 8082 dipetakan ke Container 8080
	apiPort := getEnv("INTERNAL_API_PORT", "8080") 

	go func() {
		fmt.Printf("[API] Server starting on port :%s (Internal)\n", apiPort)
		fmt.Printf("[API] If running via Docker, Host Port is likely 8082\n")
		if err := http.ListenAndServe(":"+apiPort, auth.CORSMiddleware(mux)); err != nil {
			log.Fatalf("API Server failed: %v", err)
		}
	}()

	// 2.3 Background Worker: Fetch Exchange Rate (Setiap Jam 5 Pagi WIB)
	go api.StartExchangeRateWorker()

	// 2.5 Background Worker: Sync Stats to DB (Setiap 1 Menit) dan Throttling
	tunnel.StartBandwidthWorker(tunnelMgr, repo)

	// 4. Jalankan Tunnel Gateway (Port 8081 - Plain HTTP)
	// Traefik akan menangani SSL (Termination) dan meneruskan trafik ke sini.
	go func() {
		fmt.Println("[GATEWAY] Listening on :8081 (Tunnel Entrypoint)")
		if err := http.ListenAndServe(":8081", gateway); err != nil {
			log.Fatalf("Tunnel Gateway failed: %v", err)
		}
	}()

	// 5. Jalankan Control Plane gRPC (Port 50051) - Plain Mode (Internal)
	// Traefik menangani SSL di gerbang luar.
	go func() {
		lis, err := net.Listen("tcp", ":50051")
		if err != nil {
			log.Fatalf("failed to listen for gRPC: %v", err)
		}

		// Plain gRPC Server (No TLS here)
		s := grpc.NewServer()

		pb.RegisterTunnelServiceServer(s, tunnel.NewGRPCHandler(authSvc, repo, tunnelMgr))
		fmt.Println("[gRPC] Control Plane listening on :50051 (Internal Plain)")
		if err := s.Serve(lis); err != nil {
			log.Fatalf("failed to serve gRPC: %v", err)
		}
	}()

	// 6. Jalankan Control Plane Legacy (Port 4321) untuk Agent (Yamux) - Plain Mode (Internal)
	// Traefik menangani SSL di gerbang luar.
	lis, err := net.Listen("tcp", ":4321")
	if err != nil {
		log.Fatalf("Control Plane failed: %v", err)
	}
	fmt.Println("[CONTROL] Listening for agents on :4321 (Internal Plain)")

	for {
		conn, err := lis.Accept()
		if err != nil {
			log.Printf("Accept error: %v", err)
			continue
		}
		go handleAgentConnection(conn, authSvc, tunnelMgr, repo)
	}
}

func handleAgentConnection(conn net.Conn, authSvc *auth.Service, mgr *tunnel.Manager, repo *db.Repository) {
	// 1. Handshake JSON
	var req HandshakeRequest
	if err := json.NewDecoder(conn).Decode(&req); err != nil {
		conn.Close()
		return
	}

	var apiKeyID, domain string
	var err error

	// 2. Validasi: Coba sebagai Tunnel Token (JWT) dulu, lalu API Key (Legacy)
	if len(req.APIKey) > 40 { // Asumsi JWT lebih panjang dari API Key standar
		apiKeyID, domain, err = authSvc.ValidateTunnelToken(req.APIKey)
	}

	if err != nil || apiKeyID == "" {
		// Fallback ke API Key konvensional
		apiKeyID, _, domain, err = authSvc.ValidateKey(context.Background(), req.APIKey, req.Hostname)
	}

	if err != nil {
		json.NewEncoder(conn).Encode(map[string]string{"error": "Unauthorized: " + err.Error()})
		conn.Close()
		return
	}

	// 3. Catat Sesi ke DB
	ip := conn.RemoteAddr().String()
	_, err = authSvc.LogSession(context.Background(), domain, apiKeyID, ip, req.Version, req.Hostname, req.OS, req.MachineID)
	if err != nil {
		log.Printf("Failed to log session: %v", err)
	}

	// 4. Kirim Konfirmasi
	json.NewEncoder(conn).Encode(map[string]string{"status": "ok", "domain": domain})

	// 5. Upgrade ke Yamux Server dengan Metadata Audit
	fmt.Printf("[CONTROL] Agent connected: %s\n", domain)
	mgr.AddSession(domain, conn, tunnel.SessionMeta{
		Hostname:   req.Hostname,
		MacAddress: req.MachineID, // Legacy uses machine_id as MAC identifier
		IP:         ip,
		Version:    req.Version,
	})

	// 6. Cek Bandwidth Quota (Throttling) & QoS
	bwStatus, bwErr := repo.GetBandwidthStatusByDomain(context.Background(), domain)
	if bwErr == nil {
		// Set status pembayaran untuk Quality of Service (QoS)
		isPaid := bwStatus.ExpiresAt == nil
		mgr.SetPaidStatus(domain, isPaid)

		if bwStatus.IsThrottled {
			log.Printf("[THROTTLE] Domain %s is throttled on connection.", domain)
			mgr.SetThrottle(domain, true, 131072) // Limit 128 KB/s
		}
	}

	// Wait until session is closed
	// Yamux session will handle cleanup inside Manager
	// We just need to remove it from DB when disconnected
	// (Note: In production, use a heartbeat or Yamux exit signal)
	// For simplicity, we assume disconnect when AddSession returns or is removed
}

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}
