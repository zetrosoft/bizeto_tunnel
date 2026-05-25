package auth

import (
	"context"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/bizeto/bizeto-tunnel/internal/db"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

func getGoogleOauthConfig() *oauth2.Config {
	return &oauth2.Config{
		RedirectURL:  getEnv("GOOGLE_REDIRECT_URL", "http://localhost:8080/api/auth/google/callback"),
		ClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		ClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
		Endpoint:     google.Endpoint,
	}
}

func generateRandomState(n int) string {
	b := make([]byte, n)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func (s *Service) GenerateToken(userID, role string) (string, error) {
	expirationTime := time.Now().Add(72 * time.Hour)
	claims := &Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

// GenerateTunnelToken menghasilkan token sekali pakai untuk data plane.
func (s *Service) GenerateTunnelToken(apiKeyID, domain string) (string, error) {
	expirationTime := time.Now().Add(5 * time.Minute)
	claims := jwt.MapClaims{
		"api_key_id": apiKeyID,
		"domain":     domain,
		"exp":        jwt.NewNumericDate(expirationTime).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtKey)
}

// ValidateTunnelToken memverifikasi token dari data plane.
func (s *Service) ValidateTunnelToken(tokenString string) (apiKeyID string, domain string, err error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validasi algoritma
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return jwtKey, nil
	})

	if err != nil || !token.Valid {
		return "", "", fmt.Errorf("invalid or expired tunnel token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", "", fmt.Errorf("invalid claims")
	}

	apiKeyID = claims["api_key_id"].(string)
	domain = claims["domain"].(string)
	return apiKeyID, domain, nil
}

// SignConfig menandai data konfigurasi dengan HMAC-SHA256.
func (s *Service) SignConfig(data []byte) string {
	// Fase 3: Cabut kunci statis dari kode
	key := getEnv("CONFIG_INTEGRITY_KEY", "bizeto-default-dev-integrity-key-3344")
	h := hmac.New(sha256.New, []byte(key))
	h.Write(data)
	return hex.EncodeToString(h.Sum(nil))
}

// VerifyConfig memverifikasi integritas konfigurasi.
func (s *Service) VerifyConfig(data []byte, signature string) bool {
	expected := s.SignConfig(data)
	return hmac.Equal([]byte(expected), []byte(signature))
}

type Service struct {
	repo *db.Repository
}

func NewService(repo *db.Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) ValidateKey(ctx context.Context, apiKey, hostname string) (apiKeyID string, userID string, domain string, err error) {
	return s.repo.ValidateKey(ctx, apiKey, hostname)
}

func (s *Service) LogSession(ctx context.Context, domainName string, apiKeyID string, ip, version, hostname, osInfo, machineID string) (string, error) {
	return s.repo.LogSession(ctx, domainName, apiKeyID, ip, version, hostname, osInfo, machineID)
}

func (s *Service) CloseSession(ctx context.Context, sessionID string) error {
	return s.repo.CloseSession(ctx, sessionID)
}

func (s *Service) HandleGoogleLogin(w http.ResponseWriter, r *http.Request) {
	config := getGoogleOauthConfig()
	state := generateRandomState(16)
	
	// Di produksi, kita selalu menggunakan HTTPS lewat Proxy
	isSecure := true 
	
	// Paksa domain cookie ke root domain agar bisa diakses antar subdomain
	cookieDomain := ".samkarsa.com"
	if strings.Contains(r.Host, "localhost") || strings.Contains(r.Host, "127.0.0.1") {
		cookieDomain = ""
		isSecure = false
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    state,
		Path:     "/",
		Domain:   cookieDomain,
		Expires:  time.Now().Add(10 * time.Minute),
		HttpOnly: true,
		Secure:   isSecure, 
		SameSite: http.SameSiteNoneMode, // Wajib None untuk cross-site callback ke HTTPS
	})

	url := config.AuthCodeURL(state)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (s *Service) HandleGoogleCallback(w http.ResponseWriter, r *http.Request) {
	frontendURL := getEnv("FRONTEND_URL", "https://bijexa.samkarsa.com")
	config := getGoogleOauthConfig()

	cookie, err := r.Cookie("oauth_state")
	if err != nil {
		fmt.Printf("[OAUTH ERROR] oauth_state cookie not found. All Cookies: %v\n", r.Cookies())
		http.Redirect(w, r, frontendURL+"/login?error=missing_state", http.StatusTemporaryRedirect)
		return
	}

	state := r.FormValue("state")
	if state != cookie.Value {
		fmt.Printf("[OAUTH ERROR] state mismatch: expected %s, got %s\n", cookie.Value, state)
		http.Redirect(w, r, frontendURL+"/login?error=invalid_state", http.StatusTemporaryRedirect)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "oauth_state",
		Value:    "",
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
	})

	code := r.FormValue("code")
	token, err := config.Exchange(context.Background(), code)
	if err != nil {
		http.Redirect(w, r, frontendURL+"/login?error=exchange_failed", http.StatusTemporaryRedirect)
		return
	}

	req, _ := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	req.Header.Set("Authorization", "Bearer "+token.AccessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		http.Redirect(w, r, frontendURL+"/login?error=userinfo_failed", http.StatusTemporaryRedirect)
		return
	}
	defer resp.Body.Close()

	var googleUser struct {
		ID      string `json:"id"`
		Email   string `json:"email"`
		Name    string `json:"name"`
		Picture string `json:"picture"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&googleUser); err != nil {
		http.Redirect(w, r, frontendURL+"/login?error=decode_failed", http.StatusTemporaryRedirect)
		return
	}

	user, err := s.repo.UpsertGoogleUser(context.Background(), googleUser.Email, googleUser.Name, googleUser.ID, googleUser.Picture)
	if err != nil {
		http.Redirect(w, r, frontendURL+"/login?error=db_failed", http.StatusTemporaryRedirect)
		return
	}

	jwtToken, err := s.GenerateToken(user.ID, user.Role)
	if err != nil {
		http.Redirect(w, r, frontendURL+"/login?error=token_failed", http.StatusTemporaryRedirect)
		return
	}

	// Fase 3: Pengamanan Aliran Token OAuth (Shared Cookie)
	// Kita tetap set cookie dengan domain yang benar sebagai backup
	cookieDomain := ".samkarsa.com"
	isSecure := true
	if strings.Contains(r.Host, "localhost") || strings.Contains(r.Host, "127.0.0.1") {
		cookieDomain = ""
		isSecure = false
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "bzt_auth_token",
		Value:    jwtToken,
		Path:     "/",
		Domain:   cookieDomain,
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: false, 
		Secure:   isSecure,
		SameSite: http.SameSiteNoneMode, // Wajib None untuk cross-subdomain HTTPS
	})

	// Kirim data lengkap ke frontend via query param agar langsung diproses oleh LoginPage.tsx
	authData := map[string]interface{}{
		"user":  user,
		"token": jwtToken,
	}
	authDataJSON, _ := json.Marshal(authData)
	
	targetURL := fmt.Sprintf("%s/login?auth_data=%s", frontendURL, url.QueryEscape(string(authDataJSON)))
	http.Redirect(w, r, targetURL, http.StatusTemporaryRedirect)
}
