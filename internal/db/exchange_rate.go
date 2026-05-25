package db

import (
	"context"
	"time"
)

func (r *Repository) SaveExchangeRate(ctx context.Context, date time.Time, rate float64) error {
	query := `
		INSERT INTO exchange_rates (date, rate_idr)
		VALUES ($1, $2)
		ON CONFLICT (date) DO UPDATE
		SET rate_idr = EXCLUDED.rate_idr
	`
	_, err := r.db.ExecContext(ctx, query, date.Format("2006-01-02"), rate)
	return err
}

func (r *Repository) GetExchangeRate(ctx context.Context, date time.Time) (float64, error) {
	query := `
		SELECT rate_idr
		FROM exchange_rates
		WHERE date = $1
	`
	var rate float64
	err := r.db.QueryRowContext(ctx, query, date.Format("2006-01-02")).Scan(&rate)
	return rate, err
}
