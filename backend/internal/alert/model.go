package alert

import "time"

type ConfigureAlertRequest struct {
	GeofenceID string `json:"geofence_id"`
	VehicleID  string `json:"vehicle_id"`
	EventType  string `json:"event_type"`
}

type AlertConfig struct {
	ID         string    `json:"id"`
	GeofenceID string    `json:"geofence_id"`
	VehicleID  string    `json:"vehicle_id,omitempty"`
	EventType  string    `json:"event_type"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
}

type Violation struct {
	ID            string    `json:"id"`
	VehicleID     string    `json:"vehicle_id"`
	VehicleNumber string    `json:"vehicle_number"`
	GeofenceID    string    `json:"geofence_id"`
	GeofenceName  string    `json:"geofence_name"`
	EventType     string    `json:"event_type"`
	Latitude      float64   `json:"latitude"`
	Longitude     float64   `json:"longitude"`
	Timestamp     time.Time `json:"timestamp"`
}
