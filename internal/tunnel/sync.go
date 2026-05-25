package tunnel

import (
	"context"
	"log"
	"time"

	"github.com/bizeto/bizeto-tunnel/internal/db"
)

// StartBandwidthWorker memulai goroutine background untuk mensinkronisasi
// statistik bandwidth dari memory (Manager) ke PostgreSQL.
func StartBandwidthWorker(mgr *Manager, repo *db.Repository) {
	ticker := time.NewTicker(1 * time.Minute)
	go func() {
		for range ticker.C {
			// GetStats dengan reset=true akan mengambil byte sekaligus mereset counter di memori
			domains := mgr.GetActiveDomains()
			for _, domain := range domains {
				bIn, bOut := mgr.GetStats(domain, true) // reset memori ke 0
				totalBytes := bIn + bOut

				// 1. Sync ke tunnel_sessions (legacy/Analytics)
				// Karena bIn/bOut di manager sudah direset, kita tambahkan ke nilai yang ada di DB.
				// (Kita butuh function di db untuk INCR bytes_in dan bytes_out)
				err := repo.UpdateSessionStatsIncrement(context.Background(), domain, bIn, bOut)
				if err != nil {
					log.Printf("[SYNC] Failed to increment session stats for %s: %v", domain, err)
				}

				// 2. Sync ke Bandwidth Quota (Pay-As-You-Go)
				if totalBytes > 0 {
					shouldThrottle, err := repo.UpdateBandwidthUsage(context.Background(), domain, bIn, bOut)
					if err != nil {
						log.Printf("[SYNC-BW] Failed to update bandwidth usage for %s: %v", domain, err)
						continue
					}

					if shouldThrottle {
						log.Printf("[THROTTLE] Domain %s has reached its quota. Throttling to 128KB/s...", domain)
						mgr.SetThrottle(domain, true, 131072) // Limit: 128 KB/s
					} else {
						// Jika di tengah jalan tiba-tiba quota ditambah (topup)
						mgr.SetThrottle(domain, false, 0)
					}
				}
			}
		}
	}()
}
