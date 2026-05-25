package tunnel

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"net"
	"net/http"
	"net/http/httputil"
	"strings"
	"time"

	"github.com/bizeto/bizeto-tunnel/internal/db"
)

// Gateway menangani permintaan HTTP publik dan meneruskannya ke tunnel yang sesuai.
type Gateway struct {
	manager *Manager
	repo    *db.Repository
	proxy   *httputil.ReverseProxy
	logChan chan TrafficLog // Buffer untuk logging asinkron ke DB
}

// NewGateway membuat instans baru dari HTTPS Gateway.
func NewGateway(m *Manager, repo *db.Repository) *Gateway {
	g := &Gateway{
		manager: m,
		repo:    repo,
		logChan: make(chan TrafficLog, 1000),
	}

	// Inisialisasi Reverse Proxy dengan Dialer kustom
	g.proxy = &httputil.ReverseProxy{
		Director: func(req *http.Request) {
			req.URL.Scheme = "http" // Target agen selalu dianggap HTTP (internal tunnel)
			req.URL.Host = req.Host
		},
		Transport: &http.Transport{
			DialContext: g.dialContext,
			// Optimasi untuk tunneling
			MaxIdleConns:          100,
			IdleConnTimeout:       90 * time.Second,
			TLSHandshakeTimeout:   10 * time.Second,
			ExpectContinueTimeout: 1 * time.Second,
		},
		ErrorHandler: func(w http.ResponseWriter, r *http.Request, err error) {
			http.Error(w, "Tunnel Bridge Error: "+err.Error(), http.StatusBadGateway)
		},
	}

	// Start Async DB Logger
	go g.logWorker()

	return g
}

func (g *Gateway) logWorker() {
	for logEntry := range g.logChan {
		// Simpan ke DB secara permanen menggunakan anonymous struct yang cocok dengan Repository.InsertTrafficLog
		err := g.repo.InsertTrafficLog(context.Background(), struct {
			Domain        string
			Method        string
			Path          string
			RemoteIP      string
			RemotePort    int
			Status        int
			UserAgent     string
			Referer       string
			Protocol      string
			TLSVersion    string
			LatencyMS     int
			BytesSent     int64
			BytesReceived int64
			AgentHostname string
			AgentMAC      string
		}{
			Domain:        logEntry.Domain,
			Method:        logEntry.Method,
			Path:          logEntry.Path,
			RemoteIP:      logEntry.RemoteIP,
			RemotePort:    logEntry.RemotePort,
			Status:        logEntry.Status,
			UserAgent:     logEntry.UserAgent,
			Referer:       logEntry.Referer,
			Protocol:      logEntry.Protocol,
			TLSVersion:    logEntry.TLSVersion,
			LatencyMS:     logEntry.LatencyMS,
			BytesSent:     logEntry.BytesSent,
			BytesReceived: logEntry.BytesReceived,
			AgentHostname: logEntry.AgentHostname,
			AgentMAC:      logEntry.AgentMAC,
		})
		if err != nil {
			log.Printf("[AUDIT-DB] Failed to save traffic log: %v", err)
		}
	}
}

// dialContext mengarahkan koneksi HTTP keluar ke dalam stream Yamux.
func (g *Gateway) dialContext(ctx context.Context, network, addr string) (net.Conn, error) {
	// Ambil domain dari alamat (misal: "my-app.bizeto.io:80" -> "my-app.bizeto.io")
	host, _, err := net.SplitHostPort(addr)
	if err != nil {
		host = addr
	}

	// Minta stream baru dari Manager berdasarkan domain
	return g.manager.GetStream(host)
}

// statusWriter membungkus http.ResponseWriter untuk mencatat status code & bandwidth.
type statusWriter struct {
	http.ResponseWriter
	status int
	bytes  int64
}

func (w *statusWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *statusWriter) Write(b []byte) (int, error) {
	n, err := w.ResponseWriter.Write(b)
	w.bytes += int64(n)
	return n, err
}

// ServeHTTP meneruskan permintaan ke ReverseProxy dan mencatat log audit lengkap.
func (g *Gateway) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	start := time.Now()
	
	// Normalisasi Host
	host := r.Host
	if strings.Contains(host, ":") {
		h, _, err := net.SplitHostPort(host)
		if err == nil {
			host = h
		}
	}

	// Cek apakah tunnel tersedia sebelum meneruskan ke proxy
	if _, err := g.manager.GetStream(host); err != nil {
		http.Error(w, "Tunnel Offline: "+host, http.StatusNotFound)
		return
	}

	// Ekstrak Metadata Client
	remoteIP, remotePortStr, _ := net.SplitHostPort(r.RemoteAddr)
	var remotePort int
	fmt.Sscanf(remotePortStr, "%d", &remotePort)

	tlsVer := "None"
	if r.TLS != nil {
		switch r.TLS.Version {
		case tls.VersionTLS13:
			tlsVer = "TLS 1.3"
		case tls.VersionTLS12:
			tlsVer = "TLS 1.2"
		}
	}

	// Ambil metadata agent dari manager
	agentMeta, _ := g.manager.GetMeta(host)

	// Bungkus writer untuk menangkap status & bandwidth
	sw := &statusWriter{ResponseWriter: w, status: http.StatusOK}

	// Jalankan Proxy
	g.proxy.ServeHTTP(sw, r)

	duration := time.Since(start)

	logEntry := TrafficLog{
		Timestamp:     time.Now(),
		Method:        r.Method,
		Path:          r.URL.Path,
		Domain:        host,
		Status:        sw.status,
		RemoteIP:      remoteIP,
		RemotePort:    remotePort,
		UserAgent:     r.UserAgent(),
		Referer:       r.Referer(),
		Protocol:      r.Proto,
		TLSVersion:    tlsVer,
		LatencyMS:     int(duration.Milliseconds()),
		BytesSent:     sw.bytes,
		BytesReceived: r.ContentLength,
		AgentHostname: agentMeta.Hostname,
		AgentMAC:      agentMeta.MacAddress,
	}

	// 1. Catat Log ke Manager (Memory - untuk Live Dashboard)
	g.manager.AddLog(host, logEntry)

	// 2. Kirim ke worker untuk simpan ke DB (Asinkron)
	select {
	case g.logChan <- logEntry:
	default:
		log.Printf("[AUDIT] Log channel full, dropping log for %s", host)
	}
}
