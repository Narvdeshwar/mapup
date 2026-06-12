package vehicle

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Create(ctx context.Context, v *Vehicle) error {
	query := `
		INSERT INTO vehicles (id, vehicle_number, driver_name, vehicle_type, phone, status)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING created_at
	`
	err := r.pool.QueryRow(ctx, query, v.ID, v.VehicleNumber, v.DriverName, v.VehicleType, v.Phone, v.Status).Scan(&v.CreatedAt)
	return err
}

func (r *Repository) List(ctx context.Context) ([]Vehicle, error) {
	query := `
		SELECT id, vehicle_number, driver_name, vehicle_type, phone, status, created_at
		FROM vehicles
	`
	rows, err := r.pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []Vehicle
	for rows.Next() {
		var v Vehicle
		if err := rows.Scan(&v.ID, &v.VehicleNumber, &v.DriverName, &v.VehicleType, &v.Phone, &v.Status, &v.CreatedAt); err != nil {
			return nil, err
		}
		results = append(results, v)
	}
	return results, nil
}

func (r *Repository) UpdateLocation(ctx context.Context, req *LocationUpdateRequest) ([]CurrentGeofence, error) {
	// 1. Insert into vehicle_locations
	id := uuid.New().String()
	insertQuery := `
		INSERT INTO vehicle_locations (id, vehicle_id, location, timestamp)
		VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5)
	`
	// PostGIS uses ST_MakePoint(longitude, latitude)
	_, err := r.pool.Exec(ctx, insertQuery, id, req.VehicleID, req.Longitude, req.Latitude, req.Timestamp)
	if err != nil {
		return nil, err
	}

	// 2. Find intersecting geofences
	geoQuery := `
		SELECT id, name, category
		FROM geofences
		WHERE ST_Contains(polygon, ST_SetSRID(ST_MakePoint($1, $2), 4326))
	`
	rows, err := r.pool.Query(ctx, geoQuery, req.Longitude, req.Latitude)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var geofences []CurrentGeofence
	for rows.Next() {
		var g CurrentGeofence
		if err := rows.Scan(&g.GeofenceID, &g.GeofenceName, &g.Category); err != nil {
			return nil, err
		}
		g.Status = "inside"
		geofences = append(geofences, g)
	}

	return geofences, nil
}

func (r *Repository) GetLocation(ctx context.Context, vehicleID string) (*LocationUpdateResponse, error) {
	// Get latest location
	locQuery := `
		SELECT ST_X(location), ST_Y(location), timestamp
		FROM vehicle_locations
		WHERE vehicle_id = $1
		ORDER BY timestamp DESC
		LIMIT 1
	`
	var lon, lat float64
	var timestamp time.Time
	err := r.pool.QueryRow(ctx, locQuery, vehicleID).Scan(&lon, &lat, &timestamp)
	if err != nil {
		return nil, err
	}

	// Get intersecting geofences
	geoQuery := `
		SELECT id, name, category
		FROM geofences
		WHERE ST_Contains(polygon, ST_SetSRID(ST_MakePoint($1, $2), 4326))
	`
	rows, err := r.pool.Query(ctx, geoQuery, lon, lat)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var geofences []CurrentGeofence
	for rows.Next() {
		var g CurrentGeofence
		if err := rows.Scan(&g.GeofenceID, &g.GeofenceName, &g.Category); err != nil {
			return nil, err
		}
		geofences = append(geofences, g)
	}

	if geofences == nil {
		geofences = []CurrentGeofence{}
	}

	return &LocationUpdateResponse{
		VehicleID:        vehicleID,
		LocationUpdated:  true,
		CurrentGeofences: geofences,
	}, nil
}

func (r *Repository) ProcessGeofenceEvent(ctx context.Context, req LocationUpdateRequest, g CurrentGeofence, eventType string) (*WebSocketMessage, error) {
	// Check if alert configured
	alertQuery := `
		SELECT id FROM alerts
		WHERE geofence_id = $1 AND (vehicle_id = $2 OR vehicle_id IS NULL) AND (event_type = $3 OR event_type = 'both') AND status = 'active'
		LIMIT 1
	`
	var alertID string
	err := r.pool.QueryRow(ctx, alertQuery, g.GeofenceID, req.VehicleID, eventType).Scan(&alertID)
	if err != nil {
		// No alert configured or error
		return nil, nil
	}

	// Insert violation
	violationID := uuid.New().String()
	insertQuery := `
		INSERT INTO violations (id, vehicle_id, geofence_id, event_type, latitude, longitude, timestamp)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err = r.pool.Exec(ctx, insertQuery, violationID, req.VehicleID, g.GeofenceID, eventType, req.Latitude, req.Longitude, req.Timestamp)
	if err != nil {
		return nil, err
	}

	// Get vehicle details
	vehQuery := `SELECT vehicle_number, driver_name FROM vehicles WHERE id = $1`
	var vNum, dName string
	_ = r.pool.QueryRow(ctx, vehQuery, req.VehicleID).Scan(&vNum, &dName)

	msg := &WebSocketMessage{
		EventID:   violationID,
		EventType: eventType,
		Timestamp: req.Timestamp,
	}
	msg.Vehicle.VehicleID = req.VehicleID
	msg.Vehicle.VehicleNumber = vNum
	msg.Vehicle.DriverName = dName
	msg.Geofence.GeofenceID = g.GeofenceID
	msg.Geofence.GeofenceName = g.GeofenceName
	msg.Geofence.Category = g.Category
	msg.Location.Latitude = req.Latitude
	msg.Location.Longitude = req.Longitude

	return msg, nil
}

