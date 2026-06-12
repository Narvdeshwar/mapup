package alert

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	"mapup-backend/internal/response"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) ConfigureAlert(c *gin.Context) {
	var req ConfigureAlertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, gin.H{"error": "invalid request format"})
		return
	}

	config := &AlertConfig{
		ID:         uuid.New().String(),
		GeofenceID: req.GeofenceID,
		VehicleID:  req.VehicleID,
		EventType:  req.EventType,
		Status:     "active",
	}

	if err := h.repo.ConfigureAlert(c.Request.Context(), config); err != nil {
		response.JSON(c, http.StatusInternalServerError, gin.H{"error": "failed to configure alert"})
		return
	}

	response.JSON(c, http.StatusCreated, gin.H{
		"alert_id":    config.ID,
		"geofence_id": config.GeofenceID,
		"vehicle_id":  config.VehicleID,
		"event_type":  config.EventType,
		"status":      config.Status,
	})
}

func (h *Handler) ListAlerts(c *gin.Context) {
	alerts, err := h.repo.ListAlerts(c.Request.Context())
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, gin.H{"error": "failed to fetch alerts"})
		return
	}

	if alerts == nil {
		alerts = []AlertConfig{}
	}

	response.JSON(c, http.StatusOK, gin.H{
		"alerts": alerts,
	})
}

func (h *Handler) ListViolations(c *gin.Context) {
	violations, err := h.repo.ListViolations(c.Request.Context())
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, gin.H{"error": "failed to fetch violations"})
		return
	}

	if violations == nil {
		violations = []Violation{}
	}

	response.JSON(c, http.StatusOK, gin.H{
		"violations": violations,
		"total_count": len(violations),
	})
}
