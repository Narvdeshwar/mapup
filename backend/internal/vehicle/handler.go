package vehicle

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"mapup-backend/internal/response"
	"mapup-backend/internal/websocket"
)

type Handler struct {
	repo *Repository
	hub  *websocket.Hub
}

func NewHandler(repo *Repository, hub *websocket.Hub) *Handler {
	return &Handler{repo: repo, hub: hub}
}

func (h *Handler) CreateVehicle(c *gin.Context) {
	var req CreateVehicleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, gin.H{"error": "invalid request format"})
		return
	}

	v := &Vehicle{
		ID:            uuid.New().String(),
		VehicleNumber: req.VehicleNumber,
		DriverName:    req.DriverName,
		VehicleType:   req.VehicleType,
		Phone:         req.Phone,
		Status:        "active",
	}

	if err := h.repo.Create(c.Request.Context(), v); err != nil {
		response.JSON(c, http.StatusInternalServerError, gin.H{"error": "failed to create vehicle"})
		return
	}

	response.JSON(c, http.StatusCreated, gin.H{
		"id":             v.ID,
		"vehicle_number": v.VehicleNumber,
		"status":         v.Status,
	})
}

func (h *Handler) ListVehicles(c *gin.Context) {
	vehicles, err := h.repo.List(c.Request.Context())
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, gin.H{"error": "failed to fetch vehicles"})
		return
	}

	if vehicles == nil {
		vehicles = []Vehicle{}
	}

	response.JSON(c, http.StatusOK, gin.H{
		"vehicles": vehicles,
	})
}

func (h *Handler) UpdateLocation(c *gin.Context) {
	var req LocationUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, gin.H{"error": "invalid request format"})
		return
	}

	// 1. Get previous geofences
	prevLoc, _ := h.repo.GetLocation(c.Request.Context(), req.VehicleID)
	prevGeofences := map[string]bool{}
	if prevLoc != nil {
		for _, g := range prevLoc.CurrentGeofences {
			prevGeofences[g.GeofenceID] = true
		}
	}

	// 2. Update location and get current geofences
	currGeofencesList, err := h.repo.UpdateLocation(c.Request.Context(), &req)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, gin.H{"error": "failed to update location"})
		return
	}

	currGeofences := map[string]CurrentGeofence{}
	for _, g := range currGeofencesList {
		currGeofences[g.GeofenceID] = g
	}

	// 3. Detect Entry/Exit Events
	// Note: In a real app we'd fetch actual AlertConfigs from DB. 
	// For this assessment, we'll run a quick DB query inside repo to log violations and broadcast.
	for _, g := range currGeofencesList {
		if !prevGeofences[g.GeofenceID] {
			// Entry event
			h.handleGeofenceEvent(c.Request.Context(), req, g, "entry")
		}
	}

	if prevLoc != nil {
		for _, g := range prevLoc.CurrentGeofences {
			if _, exists := currGeofences[g.GeofenceID]; !exists {
				// Exit event
				h.handleGeofenceEvent(c.Request.Context(), req, g, "exit")
			}
		}
	}

	if currGeofencesList == nil {
		currGeofencesList = []CurrentGeofence{}
	}

	response.JSON(c, http.StatusOK, gin.H{
		"vehicle_id":        req.VehicleID,
		"location_updated":  true,
		"current_geofences": currGeofencesList,
	})
}

func (h *Handler) handleGeofenceEvent(ctx context.Context, req LocationUpdateRequest, g CurrentGeofence, eventType string) {
	// Let repo handle checking alert config, inserting violation, and returning it if triggered
	violation, err := h.repo.ProcessGeofenceEvent(ctx, req, g, eventType)
	if err == nil && violation != nil {
		// Broadcast to websocket
		h.hub.Broadcast(violation)
	}
}

func (h *Handler) GetLocation(c *gin.Context) {
	vehicleID := c.Param("id")
	if vehicleID == "" {
		response.JSON(c, http.StatusBadRequest, gin.H{"error": "vehicle_id is required"})
		return
	}

	loc, err := h.repo.GetLocation(c.Request.Context(), vehicleID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, gin.H{"error": "failed to get location"})
		return
	}

	response.JSON(c, http.StatusOK, gin.H{
		"vehicle_id":        loc.VehicleID,
		"current_geofences": loc.CurrentGeofences,
	})
}
