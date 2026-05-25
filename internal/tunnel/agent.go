package tunnel

import (
	"fmt"
	"io"
	"net"
	"time"

	"github.com/hashicorp/yamux"
)

// Agent mengelola koneksi tunnel dari sisi klien (lokal).
type Agent struct {
	LocalAddr string // Alamat aplikasi lokal, misal "localhost:8080"
}

// NewAgent membuat instans baru dari BIZETO Agent.
func NewAgent(localAddr string) *Agent {
	return &Agent{
		LocalAddr: localAddr,
	}
}

// StartSession mulai menerima stream dari Relay melalui sesi Yamux yang sudah ada.
func (a *Agent) StartSession(conn net.Conn) error {
	// Konfigurasi Yamux (Client side) - Dioptimalkan untuk stabilitas
	config := yamux.DefaultConfig()
	config.KeepAliveInterval = 10 * time.Second
	config.ConnectionWriteTimeout = 10 * time.Second
	
	session, err := yamux.Client(conn, config)
	if err != nil {
		return fmt.Errorf("failed to create yamux client: %w", err)
	}
	defer session.Close()

	for {
		// Menunggu stream baru dibuka oleh Relay
		stream, err := session.Accept()
		if err != nil {
			if err == io.EOF || err.Error() == "session closed" {
				return nil // Sesi ditutup secara normal
			}
			return fmt.Errorf("failed to accept yamux stream: %w", err)
		}

		// Tangani setiap stream dalam goroutine terpisah
		go a.handleStream(stream)
	}
}

func (a *Agent) handleStream(stream net.Conn) {
	defer stream.Close()

	start := time.Now()

	// 1. Buka koneksi ke aplikasi lokal (Gunakan 127.0.0.1 agar lebih stabil)
	addr := a.LocalAddr
	if addr == "localhost" || addr == "localhost:80" || addr == ":80" {
		addr = "127.0.0.1:80"
	}
	
	localConn, err := net.DialTimeout("tcp", addr, 5*time.Second)
	if err != nil {
		fmt.Printf("\033[31m[ERROR]\033[0m Failed to route to local app %s: %v\n", addr, err)
		return
	}
	defer localConn.Close()

	// 2. Lakukan 'Piping' dua arah (Full Duplex)
	errChan := make(chan error, 2)
	var bytesIn, bytesOut int64

	go func() {
		n, err := io.Copy(localConn, stream)
		bytesIn = n
		errChan <- err
	}()
	go func() {
		n, err := io.Copy(stream, localConn)
		bytesOut = n
		errChan <- err
	}()

	<-errChan
	duration := time.Since(start)
	
	// Cetak log sukses
	fmt.Printf("\033[32m[REQ]\033[0m Handled connection in %v | ↑ %d B | ↓ %d B\n", duration, bytesOut, bytesIn)
}
