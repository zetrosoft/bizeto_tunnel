package cert

import (
	"context"
	"crypto/tls"
	"fmt"
	"golang.org/x/crypto/acme/autocert"
	"net/http"
	"path/filepath"
)

// DomainValidator adalah fungsi untuk memvalidasi domain secara eksternal (misal: via DB).
type DomainValidator func(ctx context.Context, domain string) (bool, error)

// Manager mengelola sertifikat SSL otomatis menggunakan ACME atau sertifikat manual.
type Manager struct {
	autocertManager *autocert.Manager
	manualCert      *tls.Certificate
}

// NewManager membuat instans baru dari SSL Manager dengan HostPolicy dinamis.
func NewManager(cacheDir string, email string, validator DomainValidator, allowedDomains ...string) *Manager {
	m := &autocert.Manager{
		Prompt:     autocert.AcceptTOS,
		Cache:      autocert.DirCache(filepath.Join(cacheDir, "certs")),
		Email:      email,
	}

	// HostPolicy dinamis: Izinkan domain di allowlist atau yang divalidasi oleh validator
	m.HostPolicy = func(ctx context.Context, host string) error {
		// 1. Cek allowlist statis (misal: domain utama)
		for _, d := range allowedDomains {
			if host == d {
				return nil
			}
		}

		// 2. Cek via validator (database)
		ok, err := validator(ctx, host)
		if err != nil {
			return fmt.Errorf("failed to validate domain %s: %w", host, err)
		}
		if !ok {
			return fmt.Errorf("domain %s is not registered", host)
		}
		return nil
	}

	return &Manager{
		autocertManager: m,
	}
}

// LoadCertificate memuat sertifikat dari file manual.
func (m *Manager) LoadCertificate(certFile, keyFile string) error {
	cert, err := tls.LoadX509KeyPair(certFile, keyFile)
	if err != nil {
		return err
	}
	m.manualCert = &cert
	return nil
}

// TLSConfig mengembalikan konfigurasi TLS yang mendukung SNI dan ACME/Manual.
func (m *Manager) TLSConfig() *tls.Config {
	config := m.autocertManager.TLSConfig()
	if m.manualCert != nil {
		// Jika ada sertifikat manual, kita gunakan GetCertificate untuk memilih secara dinamis
		originalGetCert := config.GetCertificate
		config.GetCertificate = func(hello *tls.ClientHelloInfo) (*tls.Certificate, error) {
			// Coba autocert dulu
			if originalGetCert != nil {
				if cert, err := originalGetCert(hello); err == nil && cert != nil {
					return cert, nil
				}
			}
			// Jika autocert gagal atau domain tidak di-manage ACME, gunakan manualCert sebagai default/fallback
			return m.manualCert, nil
		}
	}
	return config
}

// HTTPHandler membungkus handler yang ada untuk menangani tantangan ACME pada port 80.
func (m *Manager) HTTPHandler(fallback http.Handler) http.Handler {
	return m.autocertManager.HTTPHandler(fallback)
}

// GetCertificate adalah helper untuk mendapatkan sertifikat secara dinamis.
func (m *Manager) GetCertificate(hello *tls.ClientHelloInfo) (*tls.Certificate, error) {
	if m.manualCert != nil {
		// Jika ada sertifikat manual, cek apakah host-nya cocok (opsional, untuk sekarang langsung return manual)
		// Dalam skenario multi-domain, autocert lebih disarankan.
	}
	return m.autocertManager.GetCertificate(hello)
}

// AddDomain menambahkan domain baru ke daftar putih (whitelist) untuk SSL.
// Dalam produksi, HostPolicy harus divalidasi terhadap database domains.
func (m *Manager) AddDomain(domain string) {
	// Implementasi dinamis HostPolicy jika diperlukan
}
