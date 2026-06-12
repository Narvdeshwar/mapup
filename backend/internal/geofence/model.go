package geofence

import "time"

type CreateGeofenceRequest struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Coordinates [][]float64 `json:"coordinates"`
	Category    string      `json:"category"`
}

type Geofence struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Description string      `json:"description"`
	Coordinates [][]float64 `json:"coordinates"`
	Category    string      `json:"category"`
	CreatedAt   time.Time   `json:"created_at"`
}
