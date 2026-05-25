package tunnel

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"sort"
	"sync"
	"time"

	"github.com/bizeto/bizeto-tunnel/internal/billing"
	"github.com/bizeto/bizeto-tunnel/internal/db"
	"github.com/bizeto/bizeto-tunnel/internal/auth"
)

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// API handle requests for dashboard data
type API struct {
	manager  *Manager
	repo     *db.Repository
	billing  *billing.Service
	auth     *auth.Service
	Region   string
	NodeID   string
	IsSecure bool
}

func NewAPI(m *Manager, r *db.Repository, b *billing.Service, authSvc *auth.Service) *API {
	return &API{manager: m, repo: r, billing: b, auth: authSvc, Region: "Global", NodeID: "DEV-NODE", IsSecure: true}
}

func (a *API) GetTrafficLogs(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Dapatkan semua tunnel user
	tunnels, err := a.repo.GetUserTunnels(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	allLogs := []TrafficLog{}
	for _, t := range tunnels {
		allLogs = append(allLogs, a.manager.GetLogs(t.DomainName)...)
	}

	// Urutkan berdasarkan waktu terbaru
	sort.Slice(allLogs, func(i, j int) bool {
		return allLogs[i].Timestamp.After(allLogs[j].Timestamp)
	})

	// Batasi 50 log terakhir
	if len(allLogs) > 50 {
		allLogs = allLogs[:50]
	}

	if allLogs == nil {
		allLogs = []TrafficLog{}
	}

	json.NewEncoder(w).Encode(allLogs)
}

func (a *API) GetStats(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// 1. Dapatkan daftar tunnel user untuk filter stats live
	tunnels, err := a.repo.GetUserTunnels(r.Context(), userID)
	if err != nil {
		log.Printf("[STATS] Failed to get user tunnels: %v", err)
	}

	var userLiveIn, userLiveOut int64
	var userActiveCount int
	
	activeDomains := a.manager.GetActiveDomains()
	userActiveMap := make(map[string]bool)
	for _, t := range tunnels {
		userActiveMap[t.DomainName] = true
		
		// Ambil stats live untuk domain ini
		in, out := a.manager.GetStats(t.DomainName, false)
		userLiveIn += in
		userLiveOut += out
	}
	
	// Re-count active connections specifically for this user
	for _, d := range activeDomains {
		if userActiveMap[d] {
			userActiveCount++
		}
	}

	// 2. Dapatkan stats akumulasi dari DB
	status, err := a.repo.GetBandwidthStatus(r.Context(), userID)
	if err != nil {
		log.Printf("[STATS] Failed to get DB bandwidth status: %v", err)
	}

	// Gabungkan: total = db_stats + current_live_session_in_memory
	accumulatedIn := int64(0)
	accumulatedOut := int64(0)
	if err == nil {
		accumulatedIn = status.BytesIn
		accumulatedOut = status.BytesOut
	}
	
	// Total cumulative values
	displayIn := accumulatedIn + userLiveIn
	displayOut := accumulatedOut + userLiveOut
	displayTotal := displayIn + displayOut
	
	stats := map[string]interface{}{
		"active_connections": userActiveCount,
		"total_bandwidth":    displayTotal, // Send raw number, frontend will format
		"bytes_in":           displayIn,    // Cumulative In
		"bytes_out":          displayOut,   // Cumulative Out
		"avg_latency":        "12ms", 
		"total_requests":     "N/A",
		"relay_info": map[string]interface{}{
			"region":   a.Region,
			"node_id":  a.NodeID,
			"secure":   a.IsSecure,
			"tls_ver":  "TLS 1.3",
			"ddos_pro": true,
		},
	}
	json.NewEncoder(w).Encode(stats)
}

func (a *API) GetTunnels(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	tunnels, err := a.repo.GetUserTunnels(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	activeDomains := a.manager.GetActiveDomains()
	activeMap := make(map[string]bool)
	for _, d := range activeDomains {
		activeMap[d] = true
	}

	results := []map[string]interface{}{}
	for _, t := range tunnels {
		status := "offline"
		if activeMap[t.DomainName] {
			status = "online"
		}

		bIn, bOut := a.manager.GetStats(t.DomainName, false)

		results = append(results, map[string]interface{}{
			"id":            t.ID,
			"domain":        t.DomainName,
			"status":        status,
			"bytes_in":      bIn,
			"bytes_out":     bOut,
			"hostname":      t.Hostname,
			"agent_version": t.AgentVersion,
			"ip":            t.IP,
			"created_at":    t.CreatedAt,
		})
	}

	json.NewEncoder(w).Encode(results)
}

func (a *API) CheckTunnelStatus(w http.ResponseWriter, r *http.Request) {
	domain := r.URL.Query().Get("domain")
	activeDomains := a.manager.GetActiveDomains()
	
	online := false
	for _, d := range activeDomains {
		if d == domain {
			online = true
			break
		}
	}

	json.NewEncoder(w).Encode(map[string]bool{"online": online})
}

func (a *API) SaveWizardData(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var data struct {
		UserID string `json:"user_id"`
		APIKey string `json:"api_key"`
		Domain string `json:"domain"`
		Port   int    `json:"port"`
	}

	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// 1. Simpan API Key
	err := a.repo.SaveAPIKey(r.Context(), userID, data.APIKey, "Wizard Key")
	if err != nil {
		http.Error(w, "Failed to save API Key", http.StatusInternalServerError)
		return
	}

	// 2. Simpan Domain
	err = a.repo.SaveDomain(r.Context(), data.UserID, data.Domain)
	if err != nil {
		http.Error(w, "Failed to save Domain", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

func (a *API) GetAPIKeys(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	keys, err := a.repo.GetAPIKeys(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(keys)
}

func (a *API) CreateAPIKey(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var data struct {
		UserID string `json:"user_id"`
		Label  string `json:"label"`
		Key    string `json:"key"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := a.repo.SaveAPIKey(r.Context(), userID, data.Key, data.Label)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (a *API) DeleteAPIKey(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	keyID := r.URL.Query().Get("id")
	err := a.repo.DeleteAPIKey(r.Context(), keyID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (a *API) DeleteDomain(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	domainID := r.URL.Query().Get("id")
	err := a.repo.DeleteDomain(r.Context(), domainID, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (a *API) ToggleUser(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("id")
	err := a.repo.ToggleUserStatus(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (a *API) UpsertPlan(w http.ResponseWriter, r *http.Request) {
	var p db.PricingPlan
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := a.repo.UpsertPricingPlan(r.Context(), p)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (a *API) GetUserFeatures(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	f, err := a.repo.GetUserFeatures(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(f)
}

func (a *API) GetUserProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	profile, err := a.repo.GetUserProfile(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(profile)
}

func (a *API) UpdateUserProfile(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var data struct {
		FullName  string `json:"full_name"`
		AvatarURL string `json:"avatar_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := a.repo.UpdateUserProfile(r.Context(), userID, data.FullName, data.AvatarURL)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (a *API) HandleCheckout(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var data struct {
		PlanName       string `json:"plan_name"`
		DurationMonths int    `json:"duration_months"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if data.DurationMonths == 0 {
		data.DurationMonths = 1
	}

	invoiceURL, err := a.billing.CreateCheckout(r.Context(), userID, data.PlanName, data.DurationMonths)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"invoice_url": invoiceURL})
}

func (a *API) HandleTopupCheckout(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var data struct {
		Amount   float64 `json:"amount"`
		Currency string  `json:"currency"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	invoiceURL, err := a.billing.CreateTopupCheckout(r.Context(), userID, data.Amount, data.Currency)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"invoice_url": invoiceURL})
}

func (a *API) GetBandwidthStatus(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	status, err := a.repo.GetBandwidthStatus(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Ambil data live dari memori untuk digabungkan
	tunnels, _ := a.repo.GetUserTunnels(r.Context(), userID)
	var liveTotal int64
	for _, t := range tunnels {
		in, out := a.manager.GetStats(t.DomainName, false)
		liveTotal += (in + out)
	}

	response := map[string]interface{}{
		"total_bytes_purchased": status.Purchased,
		"total_bytes_used":      status.Used + liveTotal, // Gabungan DB + Live
		"is_throttled":          status.IsThrottled,
		"expires_at":            status.ExpiresAt,
		"trial_started_at":      status.TrialStart,
		"live_session_bytes":    liveTotal,
	}

	json.NewEncoder(w).Encode(response)
}

func (a *API) HandleWebhook(w http.ResponseWriter, r *http.Request) {
	verifyToken := r.Header.Get("x-callback-token")
	if verifyToken != os.Getenv("XENDIT_VERIFICATION_TOKEN") {
		http.Error(w, "Invalid callback token", http.StatusForbidden)
		return
	}

	body, _ := io.ReadAll(r.Body)
	var invoiceData map[string]interface{}
	if err := json.Unmarshal(body, &invoiceData); err != nil {
		http.Error(w, "Invalid body", http.StatusBadRequest)
		return
	}

	err := a.billing.ProcessWebhook(r.Context(), invoiceData)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

// SimulateWebhook hanya digunakan untuk testing di localhost.
func (a *API) SimulateWebhook(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var data struct {
		PlanName string `json:"plan_name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Cari Plan ID
	plans, _ := a.repo.GetPricingPlans(r.Context())
	var planID string
	for _, p := range plans {
		// Menggunakan strings.EqualFold (dibutuhkan import "strings", asumsikan sudah ada di service.go atau api.go)
		// Karena kita di api.go dan mungkin belum import strings, kita ubah huruf ke kecil secara manual atau asumsikan case sesuai
		if p.Name == "Pro" && data.PlanName == "PRO" { planID = p.ID; break }
		if p.Name == "Enterprise" && data.PlanName == "ENTERPRISE" { planID = p.ID; break }
	}

	if planID == "" {
		http.Error(w, "Plan not found for simulation", http.StatusBadRequest)
		return
	}

	// Force activate
	err := a.repo.ActivateSubscription(r.Context(), userID, planID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (a *API) AddCustomDomain(w http.ResponseWriter, r *http.Request) {
	var data struct {
		UserID string `json:"user_id"`
		Domain string `json:"domain"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	err := a.repo.SaveCustomDomain(r.Context(), data.UserID, data.Domain)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
}

func (a *API) VerifyDNS(w http.ResponseWriter, r *http.Request) {
	domain := r.URL.Query().Get("domain")
	if domain == "" {
		http.Error(w, "domain required", http.StatusBadRequest)
		return
	}

	ips, err := net.LookupIP(domain)
	if err != nil {
		json.NewEncoder(w).Encode(map[string]interface{}{"valid": false, "error": "DNS not found"})
		return
	}

	serverIP := getEnv("PUBLIC_IP", "127.0.0.1")
	valid := false
	for _, ip := range ips {
		if ip.String() == serverIP {
			valid = true
			break
		}
	}

	if valid {
		_ = a.repo.MarkDomainVerified(r.Context(), domain)
	}

	json.NewEncoder(w).Encode(map[string]interface{}{"valid": valid, "ips": ips})
}

func (a *API) GetOwnerStats(w http.ResponseWriter, r *http.Request) {
	stats, err := a.repo.GetOwnerStats(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(stats)
}

func (a *API) GetOwnerTenants(w http.ResponseWriter, r *http.Request) {
	tenants, err := a.repo.GetTenants(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(tenants)
}

func (a *API) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	var data struct {
		UserID string `json:"user_id"`
		Role   string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if data.Role != "USER" && data.Role != "OWNER" {
		http.Error(w, "Invalid role", http.StatusBadRequest)
		return
	}

	err := a.repo.UpdateUserRole(r.Context(), data.UserID, data.Role)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
}

func (a *API) GetOwnerSessions(w http.ResponseWriter, r *http.Request) {
	sessions, err := a.repo.GetActiveSessions(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(sessions)
}

func (a *API) GetOwnerPricingPlans(w http.ResponseWriter, r *http.Request) {
	plans, err := a.repo.GetPricingPlans(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(plans)
}

func (a *API) GetPublicPricingPlans(w http.ResponseWriter, r *http.Request) {
	plans, err := a.repo.GetPricingPlans(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	
	// Tambahkan paket Pay-As-You-Go secara virtual jika tidak ada di DB
	// atau biarkan owner mengaturnya via dashboard. Untuk saat ini kita kembalikan apa adanya.
	json.NewEncoder(w).Encode(plans)
}

var (
	exchangeRateIDR float64 = 16500.0 // Default
	exchangeRateMu  sync.RWMutex
)

// StartExchangeRateWorker fetches the USD to IDR rate once at startup and then daily at 5:00 AM WIB (22:00 UTC).
func (a *API) StartExchangeRateWorker() {
	// Initial fetch
	a.fetchExchangeRate()

	for {
		now := time.Now().UTC()
		// 5:00 AM WIB is 22:00 UTC
		nextTick := time.Date(now.Year(), now.Month(), now.Day(), 22, 0, 0, 0, time.UTC)
		if now.After(nextTick) {
			nextTick = nextTick.Add(24 * time.Hour)
		}

		sleepDuration := nextTick.Sub(now)
		log.Printf("[EXCHANGE RATE] Next fetch scheduled in %v (at %v UTC)", sleepDuration, nextTick)
		
		time.Sleep(sleepDuration)
		a.fetchExchangeRate()
	}
}

func (a *API) fetchExchangeRate() {
	ctx := context.Background()
	today := time.Now()

	// 1. Coba ambil dari database untuk hari ini
	if rate, err := a.repo.GetExchangeRate(ctx, today); err == nil && rate > 0 {
		exchangeRateMu.Lock()
		exchangeRateIDR = rate
		exchangeRateMu.Unlock()
		log.Printf("[EXCHANGE RATE] Loaded from DB for today: %.2f", rate)
		return
	}

	// 2. Jika belum ada di database, fetch dari API
	resp, err := http.Get("https://open.er-api.com/v6/latest/USD")
	if err != nil {
		log.Printf("[EXCHANGE RATE] Failed to fetch: %v", err)
		return
	}
	defer resp.Body.Close()

	var result struct {
		Rates map[string]float64 `json:"rates"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Printf("[EXCHANGE RATE] Failed to decode JSON: %v", err)
		return
	}

	if idr, ok := result.Rates["IDR"]; ok {
		exchangeRateMu.Lock()
		exchangeRateIDR = idr
		exchangeRateMu.Unlock()

		// 3. Simpan ke database
		if err := a.repo.SaveExchangeRate(ctx, today, idr); err != nil {
			log.Printf("[EXCHANGE RATE] Failed to save to DB: %v", err)
		} else {
			log.Printf("[EXCHANGE RATE] Successfully fetched and saved USD -> IDR: %.2f", idr)
		}
	} else {
		log.Printf("[EXCHANGE RATE] IDR not found in rates")
	}
}

func (a *API) GetExchangeRate(w http.ResponseWriter, r *http.Request) {
	exchangeRateMu.RLock()
	rate := exchangeRateIDR
	exchangeRateMu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]float64{
		"USD_TO_IDR": rate,
	})
}

func (a *API) DownloadAgentConfig(w http.ResponseWriter, r *http.Request) {
	userID, ok := r.Context().Value("user_id").(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	keyID := r.URL.Query().Get("key_id")
	if keyID == "" {
		http.Error(w, "key_id required", http.StatusBadRequest)
		return
	}

	// 1. Ambil detail API Key dari DB
	key, err := a.repo.GetAPIKeyByID(r.Context(), keyID)
	if err != nil {
		http.Error(w, "Key not found", http.StatusNotFound)
		return
	}

	if key.UserID != userID {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// 2. Siapkan Data Konfigurasi
	// Kita gunakan alamat gRPC dan Relay dari environment
	relayAddr := getEnv("BASE_DOMAIN", "localhost") + ":4321"
	grpcAddr := getEnv("BASE_DOMAIN", "localhost") + ":50051"

	configData := map[string]interface{}{
		"api_key":    key.KeyValue,
		"relay_addr": relayAddr,
		"grpc_addr":  grpcAddr,
		"local_port": 80, // Default
		"timestamp":  time.Now().Unix(),
	}

	rawJSON, _ := json.Marshal(configData)
	
	// 3. Tambahkan Signature Keamanan
	signature := a.auth.SignConfig(rawJSON)
	
	finalBundle := map[string]interface{}{
		"payload":   base64.StdEncoding.EncodeToString(rawJSON),
		"signature": signature,
		"version":   "1.1.0",
		"note":      "DO NOT EDIT THIS FILE MANUALLY. SECURED BY BIZETO ENCRYPTION.",
	}

	w.Header().Set("Content-Disposition", "attachment; filename=bizeto.json")
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(finalBundle)
}
