package billing

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/bizeto/bizeto-tunnel/internal/db"
	"github.com/xendit/xendit-go/v6"
	"github.com/xendit/xendit-go/v6/invoice"
)

type Service struct {
	repo         *db.Repository
	xenditClient *xendit.APIClient
}

func NewService(repo *db.Repository) *Service {
	apiKey := os.Getenv("XENDIT_SECRET_KEY")
	client := xendit.NewClient(apiKey)
	return &Service{
		repo:         repo,
		xenditClient: client,
	}
}

// CreateCheckout membuat invoice Xendit dan mengembalikan URL pembayaran.
func (s *Service) CreateCheckout(ctx context.Context, userID, planName string, durationMonths int) (string, error) {
	// 1. Ambil detail plan dari DB
	plans, err := s.repo.GetPricingPlans(ctx)
	if err != nil {
		return "", err
	}

	var selectedPlan *db.PricingPlan
	for _, p := range plans {
		if strings.EqualFold(p.Name, planName) {
			selectedPlan = &p
			break
		}
	}

	if selectedPlan == nil {
		return "", fmt.Errorf("plan %s not found", planName)
	}

	// 2. Buat request invoice ke Xendit
	customerName := "Bizeto User"
	userProfile, _ := s.repo.GetUserProfile(ctx, userID)
	if userProfile.FullName != "" {
		customerName = userProfile.FullName
	}

	// Hitung harga total berdasarkan durasi
	var baseMonthlyPrice float64
	planLower := strings.ToLower(selectedPlan.Name)
	
	// 1. Tentukan harga dasar bulanan
	// Jika PriceMonthly di DB > 1000, asumsikan itu adalah nilai IDR langsung
	if selectedPlan.PriceMonthly > 1000 {
		baseMonthlyPrice = selectedPlan.PriceMonthly
	} else if selectedPlan.PriceMonthly > 0 {
		// Jika PriceMonthly adalah nilai kecil (misal 5.0), asumsikan USD dan konversi ke IDR
		rate, _ := s.repo.GetExchangeRate(ctx, time.Now())
		if rate == 0 {
			rate = 16500 // Fallback aman
		}
		baseMonthlyPrice = selectedPlan.PriceMonthly * rate
	} else {
		// Fallback ke harga statis hanya jika DB nol (Backward compatibility)
		if strings.Contains(planLower, "pro") {
			baseMonthlyPrice = 49000
		} else if strings.Contains(planLower, "enterprise") {
			baseMonthlyPrice = 990000
		} else if strings.Contains(planLower, "pay") {
			baseMonthlyPrice = 5000
		} else {
			baseMonthlyPrice = 0 // Free plan
		}
	}

	// 2. Hitung total sebelum diskon
	price := baseMonthlyPrice * float64(durationMonths)
	
	// 3. Terapkan diskon berdasarkan durasi
	var discount float64
	if durationMonths >= 24 {
		discount = selectedPlan.Discount24Months
		if discount == 0 { discount = 35 }
	} else if durationMonths >= 12 {
		discount = selectedPlan.Discount12Months
		if discount == 0 { discount = 20 }
	} else if durationMonths >= 6 {
		discount = selectedPlan.Discount6Months
		if discount == 0 { discount = 10 }
	}
	
	if discount > 0 {
		price = price * (1 - discount/100)
	}

	// Pastikan harga adalah pembulatan (Xendit IDR tidak mendukung desimal)
	price = float64(int64(price))

	createInvoiceRequest := *invoice.NewCreateInvoiceRequest(
		fmt.Sprintf("BZT-INV-%s-%d-%d", userID[:8], selectedPlan.MaxTunnels, time.Now().Unix()),
		price,
	)
	createInvoiceRequest.SetCustomer(invoice.CustomerObject{
		GivenNames: *invoice.NewNullableString(&customerName),
		Email:      *invoice.NewNullableString(&userProfile.Email),
	})
	createInvoiceRequest.SetDescription(fmt.Sprintf("BIZETO-Tunnel %s Plan Subscription (%d Months)", planName, durationMonths))
	createInvoiceRequest.SetCurrency("IDR")
	createInvoiceRequest.SetReminderTime(1)
	
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:6500"
	}
	createInvoiceRequest.SetSuccessRedirectUrl(frontendURL + "/dashboard?payment=success")
	createInvoiceRequest.SetFailureRedirectUrl(frontendURL + "/dashboard?payment=failed")

	// Tambahkan metadata untuk identifikasi saat webhook
	createInvoiceRequest.SetMetadata(map[string]interface{}{
		"user_id":   userID,
		"plan_id":   selectedPlan.ID,
		"plan_name": planName,
		"duration":  durationMonths,
	})

	resp, _, err := s.xenditClient.InvoiceApi.CreateInvoice(ctx).
		CreateInvoiceRequest(createInvoiceRequest).
		Execute()

	if err != nil {
		if fmt.Sprintf("%v", err) != "<nil>" {
			return "", fmt.Errorf("xendit error: %T - %v", err, err)
		}
	}

	if resp == nil || resp.InvoiceUrl == "" {
		return "", fmt.Errorf("invoice response is empty")
	}

	return resp.InvoiceUrl, nil
}

// CreateTopupCheckout membuat invoice Xendit untuk pembelian kuota (Pay-As-You-Go).
func (s *Service) CreateTopupCheckout(ctx context.Context, userID string, amount float64, currency string) (string, error) {
	var amountIDR float64
	if currency == "USD" {
		rate, _ := s.repo.GetExchangeRate(ctx, time.Now())
		if rate == 0 {
			rate = 16500 // Fallback
		}
		amountIDR = amount * rate
	} else {
		amountIDR = amount
		currency = "IDR"
	}

	if amountIDR < 15000 {
		return "", fmt.Errorf("minimum topup amount is Rp 15.000 or $1")
	}

	userProfile, _ := s.repo.GetUserProfile(ctx, userID)
	customerName := "Bizeto User"
	if userProfile.FullName != "" {
		customerName = userProfile.FullName
	}

	// Tentukan Paket Tier dan Kuota yang Didapat berdasarkan PPP
	var bytesAdded int64
	var discount float64 = 0
	
	if currency == "USD" {
		if amount >= 9.99 {
			bytesAdded = 5 * 1024 * 1024 * 1024 // 5 GB
		} else if amount >= 8.99 {
			bytesAdded = 3 * 1024 * 1024 * 1024 // 3 GB
		} else if amount >= 6.99 {
			bytesAdded = int64(1.5 * 1024 * 1024 * 1024) // 1.5 GB
		} else {
			bytesAdded = 1 * 1024 * 1024 * 1024 // 1 GB
		}
	} else {
		if amountIDR >= 50000 {
			bytesAdded = 5 * 1024 * 1024 * 1024 // 5 GB
		} else if amountIDR >= 40000 {
			bytesAdded = 3 * 1024 * 1024 * 1024 // 3 GB
		} else if amountIDR >= 30000 {
			bytesAdded = int64(1.5 * 1024 * 1024 * 1024) // 1.5 GB
		} else {
			bytesAdded = 1 * 1024 * 1024 * 1024 // 1 GB
		}
	}

	createInvoiceRequest := *invoice.NewCreateInvoiceRequest(
		fmt.Sprintf("BZT-TOPUP-%s-%d", userID[:8], time.Now().Unix()),
		amount,
	)
	createInvoiceRequest.SetCustomer(invoice.CustomerObject{
		GivenNames: *invoice.NewNullableString(&customerName),
		Email:      *invoice.NewNullableString(&userProfile.Email),
	})
	
	gbStr := fmt.Sprintf("%.1f GB", float64(bytesAdded)/(1024*1024*1024))
	createInvoiceRequest.SetDescription(fmt.Sprintf("BIZETO-Tunnel Bandwidth Topup (%s)", gbStr))
	createInvoiceRequest.SetCurrency(currency)
	createInvoiceRequest.SetReminderTime(1)
	
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:6500"
	}
	createInvoiceRequest.SetSuccessRedirectUrl(frontendURL + "/dashboard?payment=success")
	createInvoiceRequest.SetFailureRedirectUrl(frontendURL + "/dashboard?payment=failed")

	// Tambahkan metadata untuk identifikasi saat webhook
	createInvoiceRequest.SetMetadata(map[string]interface{}{
		"type":             "TOPUP",
		"user_id":          userID,
		"amount_idr":       amountIDR, // Selalu dicatat dalam IDR di database
		"discount_percent": discount,
		"bytes_added":      bytesAdded,
	})

	resp, _, err := s.xenditClient.InvoiceApi.CreateInvoice(ctx).
		CreateInvoiceRequest(createInvoiceRequest).
		Execute()

	if err != nil {
		if fmt.Sprintf("%v", err) != "<nil>" {
			return "", fmt.Errorf("xendit error: %T - %v", err, err)
		}
	}

	if resp == nil || resp.InvoiceUrl == "" {
		return "", fmt.Errorf("invoice response is empty")
	}

	return resp.InvoiceUrl, nil
}

// ProcessWebhook memproses notifikasi pembayaran dari Xendit.
func (s *Service) ProcessWebhook(ctx context.Context, invoiceData map[string]interface{}) error {
	status, ok := invoiceData["status"].(string)
	if !ok || status != "PAID" {
		return nil // Abaikan jika belum dibayar
	}

	metadata, ok := invoiceData["metadata"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("no metadata found in webhook")
	}

	txType, _ := metadata["type"].(string)
	userID, _ := metadata["user_id"].(string)

	if userID == "" {
		return fmt.Errorf("invalid metadata: user_id is missing")
	}

	if txType == "TOPUP" {
		// Proses transaksi topup bandwidth
		amountIDR, _ := metadata["amount_idr"].(float64)
		discountPercent, _ := metadata["discount_percent"].(float64)
		bytesAddedFloat, _ := metadata["bytes_added"].(float64)
		bytesAdded := int64(bytesAddedFloat)
		invoiceID, _ := invoiceData["id"].(string)

		return s.repo.AddBandwidthQuota(ctx, userID, amountIDR, discountPercent, bytesAdded, invoiceID)
	}

	// Default ke proses subscription lama
	planID, _ := metadata["plan_id"].(string)
	if planID == "" {
		return fmt.Errorf("invalid metadata: plan_id is missing for subscription")
	}

	// Update subscription di DB
	return s.repo.ActivateSubscription(ctx, userID, planID)
}
