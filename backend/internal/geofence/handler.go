package geofence

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

func (h *Handler) CreateGeofence(c *gin.Context) {
	var req CreateGeofenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, gin.H{"error": "invalid request format"})
		return
	}

	// Basic validation
	if len(req.Coordinates) < 4 {
		response.JSON(c, http.StatusBadRequest, gin.H{"error": "coordinates must have at least 4 points forming a closed polygon"})
		return
	}

	g := &Geofence{
		ID:          uuid.New().String(),
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		Coordinates: req.Coordinates,
	}

	if err := h.repo.Create(c.Request.Context(), g); err != nil {
		response.JSON(c, http.StatusInternalServerError, gin.H{"error": "failed to create geofence"})
		return
	}

	response.JSON(c, http.StatusCreated, gin.H{
		"id":     g.ID,
		"name":   g.Name,
		"status": "active",
	})
}

func (h *Handler) ListGeofences(c *gin.Context) {
	category := c.Query("category")
	
	geofences, err := h.repo.List(c.Request.Context(), category)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, gin.H{"error": "failed to fetch geofences"})
		return
	}

	// The repository returns geofences with proper coordinates or string representation.
	// WKT parsing could be added here if needed, but for now we skip parsing 
	// because repo layer is handling it or returning simplified coordinates.

	if geofences == nil {
		geofences = []Geofence{}
	}

	response.JSON(c, http.StatusOK, gin.H{
		"geofences": geofences,
	})
}

func (h *Handler) DeleteGeofence(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.JSON(c, http.StatusBadRequest, gin.H{"error": "geofence id is required"})
		return
	}

	if err := h.repo.Delete(c.Request.Context(), id); err != nil {
		response.JSON(c, http.StatusInternalServerError, gin.H{"error": "failed to delete geofence"})
		return
	}

	response.JSON(c, http.StatusOK, gin.H{"message": "geofence deleted successfully"})
}

func (h *Handler) UpdateGeofence(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		response.JSON(c, http.StatusBadRequest, gin.H{"error": "geofence id is required"})
		return
	}

	var req CreateGeofenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, gin.H{"error": "invalid request format"})
		return
	}

	if len(req.Coordinates) < 4 {
		response.JSON(c, http.StatusBadRequest, gin.H{"error": "coordinates must have at least 4 points forming a closed polygon"})
		return
	}

	g := &Geofence{
		Name:        req.Name,
		Description: req.Description,
		Category:    req.Category,
		Coordinates: req.Coordinates,
	}

	if err := h.repo.Update(c.Request.Context(), id, g); err != nil {
		response.JSON(c, http.StatusInternalServerError, gin.H{"error": "failed to update geofence"})
		return
	}

	response.JSON(c, http.StatusOK, gin.H{"message": "geofence updated successfully"})
}
