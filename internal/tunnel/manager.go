package tunnel

import (
	"context"
	"fmt"
	"net"
	"sync"
	"sync/atomic"
	"time"

	"github.com/hashicorp/yamux"
	"golang.org/x/time/rate"
)

// CountingConn membungkus net.Conn untuk menghitung byte yang ditransfer dan mendukung throttling.
type CountingConn struct {
	net.Conn
	BytesIn  *int64
	BytesOut *int64
	Limiter  *rate.Limiter // Limiter untuk throttling (jika nil, berarti unthrottled)
}

func (c *CountingConn) Read(b []byte) (n int, err error) {
	// Fase 2: Memory-Safe Throttling (Pre-read Logic)
	// Jika ada limiter, batasi pembacaan agar tidak melebihi kapasitas burst limiter
	if c.Limiter != nil {
		burst := c.Limiter.Burst()
		if len(b) > burst {
			b = b[:burst]
		}
	}

	n, err = c.Conn.Read(b)
	if n > 0 {
		if c.Limiter != nil {
			// Tunggu sampai token tersedia untuk jumlah byte yang dibaca
			_ = c.Limiter.WaitN(context.Background(), n)
		}
		if c.BytesIn != nil {
			// Fase 1: Integritas Data Bandwidth (Atomic Operations)
			atomic.AddInt64(c.BytesIn, int64(n))
		}
	}
	return
}

func (c *CountingConn) Write(b []byte) (n int, err error) {
	if len(b) > 0 {
		if c.Limiter != nil {
			// Tunggu sampai token tersedia sebelum menulis
			_ = c.Limiter.WaitN(context.Background(), len(b))
		}
		
		n, err = c.Conn.Write(b)
		if c.BytesOut != nil {
			// Fase 1: Integritas Data Bandwidth (Atomic Operations)
			atomic.AddInt64(c.BytesOut, int64(n))
		}
	}
	return
}

// TrafficLog menyimpan metadata permintaan HTTP yang melewati tunnel (Enterprise Audit).
type TrafficLog struct {
	ID            string    `json:"id"`
	Timestamp     time.Time `json:"timestamp"`
	Method        string    `json:"method"`
	Path          string    `json:"path"`
	Domain        string    `json:"domain"`
	Status        int       `json:"status"`
	RemoteIP      string    `json:"remote_ip"`
	RemotePort    int       `json:"remote_port"`
	UserAgent     string    `json:"user_agent"`
	Referer       string    `json:"referer"`
	Protocol      string    `json:"protocol"`
	TLSVersion    string    `json:"tls_version"`
	LatencyMS     int       `json:"latency_ms"`
	BytesSent     int64     `json:"bytes_sent"`
	BytesReceived int64     `json:"bytes_received"`
	AgentHostname string    `json:"agent_hostname"`
	AgentMAC      string    `json:"agent_mac"`
}

// SessionMeta menyimpan metadata tentang agen yang terhubung.
type SessionMeta struct {
	Hostname   string
	MacAddress string
	IP         string
	Version    string
}

// Manager mengelola semua sesi tunnel yang aktif di Relay Server.
type Manager struct {
	mu        sync.RWMutex
	sessions  map[string]*yamux.Session // Map dari Assigned Domain ke Sesi Yamux
	bytesIn   map[string]*int64
	bytesOut  map[string]*int64
	throttles map[string]*rate.Limiter // Map untuk menyimpan rate limiter tiap domain
	isPaid    map[string]bool          // Menandai apakah domain milik user yang sudah topup (QoS)
	meta      map[string]SessionMeta   // Metadata sesi per domain

	logs   map[string][]TrafficLog // Domain -> Daftar log terakhir
	logMu  sync.RWMutex
}

// NewManager membuat instans baru dari Tunnel Manager.
func NewManager() *Manager {
	return &Manager{
		sessions:  make(map[string]*yamux.Session),
		bytesIn:   make(map[string]*int64),
		bytesOut:  make(map[string]*int64),
		throttles: make(map[string]*rate.Limiter),
		isPaid:    make(map[string]bool),
		meta:      make(map[string]SessionMeta),
		logs:      make(map[string][]TrafficLog),
	}
}

// StartScavenger memulai worker latar belakang untuk membersihkan sesi yang sudah tertutup (Ghost Sessions).
func (m *Manager) StartScavenger(interval time.Duration) {
	ticker := time.NewTicker(interval)
	go func() {
		for range ticker.C {
			m.scavenge()
		}
	}()
}

func (m *Manager) scavenge() {
	m.mu.Lock()
	defer m.mu.Unlock()

	for domain, session := range m.sessions {
		if session.IsClosed() {
			delete(m.sessions, domain)
			delete(m.bytesIn, domain)
			delete(m.bytesOut, domain)
			delete(m.throttles, domain)
			delete(m.meta, domain)
			fmt.Printf("[SCAVENGER] Removed ghost session for domain: %s\n", domain)
		}
	}
}

// AddLog menambahkan log trafik baru untuk domain tertentu (Circular buffer 50 logs).
func (m *Manager) AddLog(domain string, log TrafficLog) {
	m.logMu.Lock()
	defer m.logMu.Unlock()

	l := m.logs[domain]
	if len(l) >= 50 {
		l = l[1:] // Hapus yang terlama
	}
	m.logs[domain] = append(l, log)
}

// GetLogs mengambil daftar log trafik terbaru untuk domain tertentu.
func (m *Manager) GetLogs(domain string) []TrafficLog {
	m.logMu.RLock()
	defer m.logMu.RUnlock()

	if l, ok := m.logs[domain]; ok {
		// Return copy
		res := make([]TrafficLog, len(l))
		copy(res, l)
		return res
	}
	return []TrafficLog{}
}

// AddSession mendaftarkan sesi Yamux baru untuk domain tertentu dengan metadata.
func (m *Manager) AddSession(domain string, conn net.Conn, meta SessionMeta) (*yamux.Session, error) {
	// Konfigurasi Yamux (Server side) - Dioptimalkan untuk stabilitas
	config := yamux.DefaultConfig()
	config.KeepAliveInterval = 10 * time.Second
	config.ConnectionWriteTimeout = 10 * time.Second

	session, err := yamux.Server(conn, config)
	if err != nil {
		return nil, fmt.Errorf("failed to create yamux server: %w", err)
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	// Jika ada sesi lama, tutup dulu (cleanup)
	if old, ok := m.sessions[domain]; ok {
		old.Close()
	}

	m.sessions[domain] = session
	m.meta[domain] = meta
	m.bytesIn[domain] = new(int64)
	m.bytesOut[domain] = new(int64)
	return session, nil
}

// GetMeta mengembalikan metadata sesi untuk domain tertentu.
func (m *Manager) GetMeta(domain string) (SessionMeta, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	meta, ok := m.meta[domain]
	return meta, ok
}

// SetPaidStatus memperbarui status pembayaran untuk domain (untuk QoS).
func (m *Manager) SetPaidStatus(domain string, paid bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.isPaid[domain] = paid
}

// GetQoSWeight mengembalikan bobot prioritas berdasarkan status akun.
func (m *Manager) GetQoSWeight(domain string) int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	if paid, ok := m.isPaid[domain]; ok && paid {
		return 10 // Prioritas tinggi (Topup User)
	}
	return 1 // Prioritas rendah (Free)
}

// SetThrottle mengaktifkan atau menonaktifkan throttle untuk domain tertentu.
// limitBytesPerSec adalah kecepatan maksimal (contoh: 128 KB/s = 131072).
func (m *Manager) SetThrottle(domain string, isThrottled bool, limitBytesPerSec int) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if isThrottled {
		// Buat limiter dengan kecepatan tertentu (burst size sama dengan limit 1 detik)
		m.throttles[domain] = rate.NewLimiter(rate.Limit(limitBytesPerSec), limitBytesPerSec)
	} else {
		// Hapus limiter
		delete(m.throttles, domain)
	}
}

// RemoveSession menghapus sesi tunnel saat koneksi terputus.
func (m *Manager) RemoveSession(domain string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.sessions, domain)
	delete(m.bytesIn, domain)
	delete(m.bytesOut, domain)
	delete(m.throttles, domain)
	delete(m.meta, domain)
}

// GetStream membuka stream baru ke agen berdasarkan domain tujuan.
func (m *Manager) GetStream(domain string) (net.Conn, error) {
	m.mu.RLock()
	session, ok := m.sessions[domain]
	bIn := m.bytesIn[domain]
	bOut := m.bytesOut[domain]
	limiter := m.throttles[domain]
	m.mu.RUnlock()

	if !ok || session.IsClosed() {
		return nil, fmt.Errorf("no active tunnel for domain: %s", domain)
	}

	// Membuka stream baru melalui koneksi TCP yang sudah ada
	stream, err := session.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open yamux stream: %w", err)
	}

	// Bungkus stream dengan CountingConn
	return &CountingConn{
		Conn:     stream,
		BytesIn:  bIn,
		BytesOut: bOut,
		Limiter:  limiter,
	}, nil
}

// GetActiveDomains mengembalikan daftar semua domain yang sedang online.
func (m *Manager) GetActiveDomains() []string {
	m.mu.RLock()
	defer m.mu.RUnlock()

	domains := make([]string, 0, len(m.sessions))
	for d := range m.sessions {
		domains = append(domains, d)
	}
	return domains
}

// GetStats mengembalikan statistik penggunaan data untuk domain tertentu.
// Fungsi ini juga mereset counter (bytes_in, bytes_out) menjadi 0 jika reset == true.
// Ini berguna untuk worker yang memindahkan angka pemakaian ke database.
func (m *Manager) GetStats(domain string, reset bool) (int64, int64) {
	m.mu.Lock() // Menggunakan Lock karena kita mungkin mengubah nilainya
	defer m.mu.Unlock()

	if bIn, ok := m.bytesIn[domain]; ok {
		in := atomic.LoadInt64(bIn)
		out := atomic.LoadInt64(m.bytesOut[domain])

		if reset {
			atomic.StoreInt64(bIn, 0)
			atomic.StoreInt64(m.bytesOut[domain], 0)
		}

		return in, out
	}
	return 0, 0
}

// StatsSnapshot menyimpan data snapshot bandwidth.
type StatsSnapshot struct {
	Domain   string
	BytesIn  int64
	BytesOut int64
}

// GetSnapshot mengambil semua statistik domain yang sedang aktif tanpa meresetnya.
func (m *Manager) GetSnapshot() []StatsSnapshot {
	m.mu.RLock()
	defer m.mu.RUnlock()

	snapshot := make([]StatsSnapshot, 0, len(m.sessions))
	for domain := range m.sessions {
		snapshot = append(snapshot, StatsSnapshot{
			Domain:   domain,
			BytesIn:  atomic.LoadInt64(m.bytesIn[domain]),
			BytesOut: atomic.LoadInt64(m.bytesOut[domain]),
		})
	}
	return snapshot
}

// GetGlobalStats mengembalikan total byte masuk dan keluar dari semua sesi.
func (m *Manager) GetGlobalStats() (int64, int64) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	var totalIn, totalOut int64
	for _, val := range m.bytesIn {
		if val != nil {
			totalIn += atomic.LoadInt64(val)
		}
	}
	for _, val := range m.bytesOut {
		if val != nil {
			totalOut += atomic.LoadInt64(val)
		}
	}
	return totalIn, totalOut
}
