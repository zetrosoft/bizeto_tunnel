package tunnel

import (
	"context"
	"fmt"
	"log"
	"sync"

	pb "github.com/bizeto/bizeto-tunnel/api/v1"
	"github.com/bizeto/bizeto-tunnel/internal/auth"
	"github.com/bizeto/bizeto-tunnel/internal/db"
	"google.golang.org/grpc/peer"
	"golang.org/x/time/rate"
)

// GRPCHandler mengimplementasikan TunnelService gRPC.
type GRPCHandler struct {
	pb.UnimplementedTunnelServiceServer
	authSvc *auth.Service
	repo    *db.Repository
	manager *Manager

	// Fase 1: gRPC Rate Limiting (Infrastruktur DoS)
	limiters   map[string]*rate.Limiter
	limiterMu  sync.Mutex
}

func NewGRPCHandler(authSvc *auth.Service, repo *db.Repository, manager *Manager) *GRPCHandler {
	return &GRPCHandler{
		authSvc:  authSvc,
		repo:     repo,
		manager:  manager,
		limiters: make(map[string]*rate.Limiter),
	}
}

func (h *GRPCHandler) getLimiter(ip string) *rate.Limiter {
	h.limiterMu.Lock()
	defer h.limiterMu.Unlock()

	limiter, ok := h.limiters[ip]
	if !ok {
		// Limit 5 request per detik, burst 10
		limiter = rate.NewLimiter(5, 10)
		h.limiters[ip] = limiter
	}
	return limiter
}

// RegisterAgent menangani handshake awal dari agen.
func (h *GRPCHandler) RegisterAgent(ctx context.Context, req *pb.RegisterRequest) (*pb.RegisterResponse, error) {
	// 0. gRPC Rate Limiting
	ip := "0.0.0.0"
	if p, ok := peer.FromContext(ctx); ok {
		ip = p.Addr.String()
	}
	
	limiter := h.getLimiter(ip)
	if !limiter.Allow() {
		return &pb.RegisterResponse{
			Success:      false,
			ErrorMessage: "Too many registration requests. Please wait.",
		}, nil
	}

	log.Printf("[gRPC] Registration request from hostname: %s (MAC: %s)", req.Hostname, req.MacAddress)

	// 1. Validasi API Key
	apiKeyID, userID, domain, err := h.authSvc.ValidateKey(ctx, req.ApiKey, req.Hostname)
	if err != nil {
		return &pb.RegisterResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Authentication failed: %v", err),
		}, nil
	}

	// 2. Log Session ke DB (Simpan metadata)
	_, err = h.repo.LogSession(ctx, domain, apiKeyID, ip, req.Version, req.Hostname, "Unknown OS", req.MacAddress)
	if err != nil {
		log.Printf("[gRPC] Failed to log session to DB: %v", err)
	}

	// 3. Cek & Inisialisasi Trial Gratis (jika belum pernah topup)
	bwStatus, err := h.repo.GetBandwidthStatus(ctx, userID)
	if err == nil {
		// Jika ini adalah user baru (bonus 500MB diinisialisasi), cek MAC Address
		if bwStatus.ExpiresAt != nil && bwStatus.Purchased == 524288000 && bwStatus.Used == 0 {
			// Coba daftarkan trial untuk perangkat ini
			err = h.repo.InitializeTrial(ctx, userID, req.MacAddress)
			if err != nil {
				// Jika error berarti MAC sudah terdaftar di user lain
				return &pb.RegisterResponse{
					Success:      false,
					ErrorMessage: "Trial and efficiency period already claimed for this device hardware ID.",
				}, nil
			}
		}
	}

	// 4. Batasan Protokol (Trial hanya HTTP)
	if bwStatus.ExpiresAt != nil {
		log.Printf("[TRIAL] User %s is in trial mode.", userID)
	}

	// 5. Buat Tunnel Token (JWT pendek berdurasi 1 menit)
	tunnelToken, err := h.authSvc.GenerateTunnelToken(apiKeyID, domain)
	if err != nil {
		return &pb.RegisterResponse{
			Success:      false,
			ErrorMessage: fmt.Sprintf("Failed to generate token: %v", err),
		}, nil
	}

	log.Printf("[gRPC] Agent authorized: %s -> %s", req.Hostname, domain)

	return &pb.RegisterResponse{
		Success:        true,
		AssignedDomain: domain,
		TunnelToken:    tunnelToken,
	}, nil
}

// ControlStream menangani aliran kontrol dua arah antara Agent dan Relay.
func (h *GRPCHandler) ControlStream(stream pb.TunnelService_ControlStreamServer) error {
	// 1. Terima pesan pertama untuk identifikasi dan validasi
	firstMsg, err := stream.Recv()
	if err != nil {
		return err
	}

	// Validasi TunnelToken (JWT) yang dikirim di Payload pesan pertama
	apiKeyID, domain, err := h.authSvc.ValidateTunnelToken(firstMsg.Payload)
	if err != nil {
		log.Printf("[gRPC] Control stream validation failed: %v", err)
		return fmt.Errorf("unauthorized control stream")
	}

	log.Printf("[gRPC] Control stream established for %s (Key: %s)", domain, apiKeyID)

	// 2. Loop untuk menangani pesan kontrol
	for {
		msg, err := stream.Recv()
		if err != nil {
			log.Printf("[gRPC] Control stream closed: %v", err)
			return err
		}

		switch msg.Type {
		case pb.ControlMessage_PING:
			err = stream.Send(&pb.ControlMessage{
				Type: pb.ControlMessage_PONG,
			})
			if err != nil {
				return err
			}
		case pb.ControlMessage_NOTIFY_LOCAL_OFFLINE:
			log.Printf("[gRPC] Agent notified local app is offline")
		default:
			log.Printf("[gRPC] Received unknown message type: %v", msg.Type)
		}
	}
}
