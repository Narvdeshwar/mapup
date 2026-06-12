package alert

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) ConfigureAlert(ctx context.Context, config *AlertConfig) error {
	query := `
		INSERT INTO alerts (id, geofence_id, vehicle_id, event_type, status)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING created_at
	`
	var vid *string
	if config.VehicleID != "" {
		vid = &config.VehicleID
	}
	err := r.pool.QueryRow(ctx, query, config.ID, config.GeofenceID, vid, config.EventType, config.Status).Scan(&config.CreatedAt)
	return err
}

func (r *Repository) ListAlerts(ctx context.Context) ([]AlertConfig, error) {
	query := `SELECT id, geofence_id, vehicle_id, event_type, status, created_at FROM alerts`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var alerts []AlertConfig
	for rows.Next() {
		var a AlertConfig
		var vid *string
		if err := rows.Scan(&a.ID, &a.GeofenceID, &vid, &a.EventType, &a.Status, &a.CreatedAt); err != nil {
			return nil, err
		}
		if vid != nil {
			a.VehicleID = *vid
		}
		alerts = append(alerts, a)
	}
	return alerts, nil
}

func (r *Repository) ListViolations(ctx context.Context) ([]Violation, error) {
	query := `
		SELECT v.id, v.vehicle_id, veh.vehicle_number, v.geofence_id, g.name, v.event_type, v.latitude, v.longitude, v.timestamp
		FROM violations v
		JOIN vehicles veh ON v.vehicle_id = veh.id
		JOIN geofences g ON v.geofence_id = g.id
		ORDER BY v.timestamp DESC
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var violations []Violation
	for rows.Next() {
		var v Violation
		if err := rows.Scan(&v.ID, &v.VehicleID, &v.VehicleNumber, &v.GeofenceID, &v.GeofenceName, &v.EventType, &v.Latitude, &v.Longitude, &v.Timestamp); err != nil {
			return nil, err
		}
		violations = append(violations, v)
	}
	return violations, nil
}
