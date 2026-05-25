package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/tls"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"flag"
	"fmt"
	"net"
	"os"
	"runtime"
	"time"

	pb "github.com/bizeto/bizeto-tunnel/api/v1"
	"github.com/bizeto/bizeto-tunnel/internal/tunnel"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

// SecKey must match RELAY'S ConfigIntegrityKey
const SecKey = "bizeto-default-dev-integrity-key-3344"


func verifyConfig(rawPayload []byte, signature string) bool {
	if signature == "" { return false }
	h := hmac.New(sha256.New, []byte(SecKey))
	h.Write(rawPayload)
	expected := hex.EncodeToString(h.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

type SecureConfig struct {
	Payload   string `json:"payload"`
	Signature string `json:"signature"`
}

type HandshakeRequest struct {
	APIKey    string `json:"api_key"`
	Version   string `json:"version"`
	Hostname  string `json:"hostname"`
	OS        string `json:"os"`
	MachineID string `json:"machine_id"`
}

type HandshakeResponse struct {
	Status string `json:"status"`
	Domain string `json:"domain"`
	Error  string `json:"error,omitempty"`
}

// ANSI Colors
const (
	ColorReset  = "\033[0m"
	ColorGreen  = "\033[32m"
	ColorBlue   = "\033[34m"
	ColorCyan   = "\033[36m"
	ColorYellow = "\033[33m"
	ColorRed    = "\033[31m"
	ColorBold   = "\033[1m"
)

func printBanner() {
	bannerPart1 := `
  ____  _          _        `
	bannerPart2 := `_______                     _ 
 |  _ \(_)        | |      `
	bannerPart3 := `|__   __|                   | |
 | |_) |_ _______ | |_ ___    | | _   _ _ __  _ __   __| |
 |  _ <| |_  / _ \| __/ _ \   | || | | | '_ \| '_ \ / _' |
 | |_) | |/ /  __/| || (_) |  | || |_| | | | | | | | (_| |
 |____/|_/___\___| \__\___/   |_| \__,_|_| |_|_| |_|\__,_|
`
	fmt.Print(ColorCyan + bannerPart1 + ColorBlue + bannerPart2 + ColorCyan + bannerPart3 + ColorReset)
	fmt.Printf("  %s%sReverse Proxy & Secure Tunneling Agent%s\n", ColorBold, ColorBlue, ColorReset)
	fmt.Printf("  %sVersion: 1.0.1%s\n", ColorGreen, ColorReset)
	fmt.Println("------------------------------------------------------")
}

func getHardwareFingerprint() (string, string, string, string) {
	hostname, _ := os.Hostname()
	goos := runtime.GOOS + "/" + runtime.GOARCH
	mac := getPrimaryMacAddress()
	cpuCount := runtime.NumCPU()
	
	// Create a more unique MachineID using SHA-256 (Multi-Factor)
	h := sha256.New()
	h.Write([]byte(hostname + mac + runtime.GOOS + runtime.GOARCH + fmt.Sprintf("%d", cpuCount)))
	machineID := hex.EncodeToString(h.Sum(nil))[:16]
	
	return hostname, goos, machineID, mac
}

func getPrimaryMacAddress() string {
	interfaces, err := net.Interfaces()
	if err != nil {
		return "00:00:00:00:00:00"
	}
	for _, i := range interfaces {
		if i.Flags&net.FlagLoopback == 0 && i.HardwareAddr != nil {
			return i.HardwareAddr.String()
		}
	}
	return "00:00:00:00:00:00"
}

func main() {
	// 1. Parsing Argumen CLI
	apiKey := flag.String("key", "", "API Key dari dashboard BIZETO")
	localPort := flag.Int("port", 0, "Port aplikasi lokal yang ingin di-tunnel")
	relayAddr := flag.String("relay", "", "Alamat Relay Server (Data Plane)")
	grpcAddr := flag.String("grpc", "", "Alamat gRPC Control Plane")
	configPath := flag.String("config", "bizeto.json", "Path ke file konfigurasi")
	insecure := flag.Bool("insecure", false, "Lewati verifikasi sertifikat SSL (Hanya untuk pengujian)")
	flag.Parse()

	// 2. Load Secured Config (Priority with Auto-Discovery)
	configLoaded := false
	targetConfig := *configPath

	// Auto-discovery logic if default bizeto.json is missing
	if _, err := os.Stat(targetConfig); os.IsNotExist(err) && targetConfig == "bizeto.json" {
		files, _ := os.ReadDir(".")
		for _, f := range files {
			if !f.IsDir() && (len(f.Name()) > 7 && f.Name()[:6] == "bizeto" && f.Name()[len(f.Name())-5:] == ".json") {
				targetConfig = f.Name()
				break
			}
		}
	}

	if file, err := os.Open(targetConfig); err == nil {
		var secCfg SecureConfig
		if err := json.NewDecoder(file).Decode(&secCfg); err == nil {
			rawPayload, err := base64.StdEncoding.DecodeString(secCfg.Payload)
			if err != nil {
				fmt.Printf("%s[SECURITY ERROR]%s Configuration payload in %s is corrupted.\n", ColorRed, ColorReset, targetConfig)
				os.Exit(1)
			}

			if !verifyConfig(rawPayload, secCfg.Signature) {
				fmt.Printf("%s[SECURITY ERROR]%s %s has been tampered with or is invalid!\n", ColorRed, ColorReset, targetConfig)
				fmt.Println("Please download a fresh config file from your Bizeto Dashboard.")
				os.Exit(1)
			}

			var cfg Config
			if err := json.Unmarshal(rawPayload, &cfg); err == nil {
				*apiKey = cfg.APIKey
				// Only override if not provided via CLI
				if *localPort == 0 { *localPort = cfg.LocalPort }
				if *relayAddr == "" { *relayAddr = cfg.RelayAddr }
				if *grpcAddr == "" { *grpcAddr = cfg.GRPCAddr }
				configLoaded = true
				fmt.Printf("%s[INFO]%s Loaded configuration from %s\n", ColorBlue, ColorReset, targetConfig)
			}
		}
		file.Close()
	}

	printBanner()

	// 3. Fallback/Validation logic
	if !configLoaded {
		if *apiKey == "" {
			fmt.Printf("%s[ERROR]%s API Key wajib diisi (via bizeto.json atau flag --key)\n", ColorRed, ColorReset)
			os.Exit(1)
		}
		// Default fallbacks if not using config file
		if *localPort == 0 { *localPort = 80 }
		if *relayAddr == "" { *relayAddr = "localhost:4321" }
		if *grpcAddr == "" { *grpcAddr = "localhost:50051" }
	}

	retryDelay := 1 * time.Second
	maxRetryDelay := 30 * time.Second

	for {
		err := runAgent(*apiKey, *localPort, *relayAddr, *grpcAddr, *insecure)
		if err != nil {
			fmt.Printf("\n%s[DISCONNECTED]%s %v\n", ColorRed, ColorReset, err)
			fmt.Printf("%s[RETRY]%s Reconnecting in %v...\n", ColorYellow, ColorReset, retryDelay)
			time.Sleep(retryDelay)
			
			retryDelay *= 2
			if retryDelay > maxRetryDelay {
				retryDelay = maxRetryDelay
			}
			continue
		}
		retryDelay = 1 * time.Second
	}
}

func runAgent(apiKey string, localPort int, relayAddr string, grpcAddr string, insecure bool) error {
	fmt.Printf("%s[INFO]%s Connecting to Control Plane: %s%s%s (TLS)...\n", ColorBlue, ColorReset, ColorBold, grpcAddr, ColorReset)

	// 1. Koneksi ke gRPC Control Plane (Secured with TLS)
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// TLS Config dengan opsi InsecureSkipVerify
	creds := credentials.NewTLS(&tls.Config{
		MinVersion:         tls.VersionTLS13,
		InsecureSkipVerify: insecure,
	})

	gConn, err := grpc.DialContext(ctx, grpcAddr, grpc.WithTransportCredentials(creds))
	if err != nil {
		return fmt.Errorf("failed to connect to gRPC: %w", err)
	}
	defer gConn.Close()

	client := pb.NewTunnelServiceClient(gConn)

	// 2. Handshake gRPC
	hName, _, _, macAddr := getHardwareFingerprint()
	regResp, err := client.RegisterAgent(ctx, &pb.RegisterRequest{
		ApiKey:     apiKey,
		Version:    "1.2.0",
		Hostname:   hName,
		MacAddress: macAddr,
	})
	if err != nil {
		return fmt.Errorf("gRPC registration failed: %w", err)
	}

	if !regResp.Success {
		return fmt.Errorf("authentication failed: %s", regResp.ErrorMessage)
	}

	fmt.Printf("%s[INFO]%s Authorized as %s. Connecting to Data Plane (TLS)...\n", ColorBlue, ColorReset, regResp.AssignedDomain)

	// 2.5 Start Persistent Control Stream for Heartbeat & Validation
	go func() {
		stream, err := client.ControlStream(context.Background())
		if err != nil {
			return
		}
		
		// Send first message with TunnelToken for authorization
		stream.Send(&pb.ControlMessage{
			Type:    pb.ControlMessage_PING,
			Payload: regResp.TunnelToken,
		})

		// Heartbeat loop
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			if err := stream.Send(&pb.ControlMessage{Type: pb.ControlMessage_PING}); err != nil {
				return
			}
			// Wait for PONG
			_, _ = stream.Recv()
		}
	}()

	// 3. Koneksi ke Data Plane (Secured with TLS)
	dialer := &net.Dialer{Timeout: 10 * time.Second}
	dataConn, err := tls.DialWithDialer(dialer, "tcp", relayAddr, &tls.Config{
		MinVersion:         tls.VersionTLS13,
		InsecureSkipVerify: insecure,
	})
	if err != nil {
		return fmt.Errorf("failed to connect to Data Plane: %w", err)
	}
	defer dataConn.Close()

	// Kirim Handshake minimal (hanya token)
	hRequest := HandshakeRequest{
		APIKey:   regResp.TunnelToken,
		Version:  "1.2.0-tls",
		Hostname: hName,
	}
	if err := json.NewEncoder(dataConn).Encode(hRequest); err != nil {
		return fmt.Errorf("failed to send data plane handshake: %w", err)
	}

	// Baca respon
	var hResp HandshakeResponse
	if err := json.NewDecoder(dataConn).Decode(&hResp); err != nil {
		return fmt.Errorf("data plane handshake failed: %w", err)
	}

	fmt.Printf("%s[SUCCESS]%s Secure tunnel established!\n", ColorGreen, ColorReset)
	fmt.Println("------------------------------------------------------")
	fmt.Printf(" %sForwarding:%s  https://%s %s->%s localhost:%d\n", ColorBold, ColorReset, hResp.Domain, ColorCyan, ColorReset, localPort)
	fmt.Printf(" %sProtocol:%s    Yamux over gRPC-Controlled Stream\n", ColorBold, ColorReset)
	fmt.Println("------------------------------------------------------")
	fmt.Printf("%s[INFO]%s Waiting for incoming requests...\n", ColorBlue, ColorReset)

	// 4. Inisialisasi Agent Logic
	localAddr := fmt.Sprintf("localhost:%d", localPort)
	bizetoAgent := tunnel.NewAgent(localAddr)

	return bizetoAgent.StartSession(dataConn)
}
