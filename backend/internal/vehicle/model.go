package vehicle

import "time"

type CreateVehicleRequest struct {
	VehicleNumber string `json:"vehicle_number"`
	DriverName    string `json:"driver_name"`
	VehicleType   string `json:"vehicle_type"`
	Phone         string `json:"phone"`
}

type Vehicle struct {
	ID            string    `json:"id"`
	VehicleNumber string    `json:"vehicle_number"`
	DriverName    string    `json:"driver_name"`
	VehicleType   string    `json:"vehicle_type"`
	Phone         string    `json:"phone"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
}

type LocationUpdateRequest struct {
	VehicleID string    `json:"vehicle_id"`
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Timestamp time.Time `json:"timestamp"`
}

type CurrentGeofence struct {
	GeofenceID   string `json:"geofence_id"`
	GeofenceName string `json:"geofence_name"`
	Category     string `json:"category,omitempty"`
	Status       string `json:"status,omitempty"`
}

type LocationUpdateResponse struct {
	VehicleID        string            `json:"vehicle_id"`
	LocationUpdated  bool              `json:"location_updated"`
	CurrentGeofences []CurrentGeofence `json:"current_geofences"`
}

type WebSocketMessage struct {
	EventID   string    `json:"event_id"`
	EventType string    `json:"event_type"`
	Timestamp time.Time `json:"timestamp"`
	Vehicle   struct {
		VehicleID     string `json:"vehicle_id"`
		VehicleNumber string `json:"vehicle_number"`
		DriverName    string `json:"driver_name"`
	} `json:"vehicle"`
	Geofence struct {
		GeofenceID   string `json:"geofence_id"`
		GeofenceName string `json:"geofence_name"`
		Category     string `json:"category"`
	} `json:"geofence"`
	Location struct {
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
	} `json:"location"`
}

