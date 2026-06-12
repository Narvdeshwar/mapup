package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"mapup-backend/internal/alert"
	"mapup-backend/internal/config"
	"mapup-backend/internal/database"
	"mapup-backend/internal/geofence"
	"mapup-backend/internal/middleware"
	"mapup-backend/internal/vehicle"
	"mapup-backend/internal/websocket"
)

func main() {
	cfg := config.Load()

	pool, err := database.NewPostgresPool(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer pool.Close()

	geoRepo := geofence.NewRepository(pool)
	geoHandler := geofence.NewHandler(geoRepo)

	vehRepo := vehicle.NewRepository(pool)
	
	alertRepo := alert.NewRepository(pool)
	alertHandler := alert.NewHandler(alertRepo)

	hub := websocket.NewHub()
	go func() {
		// normally we might run hub.Run() here if it had one
	}()

	vehHandler := vehicle.NewHandler(vehRepo, hub)

	r := gin.Default()
	r.Use(middleware.CORS())
	r.Use(middleware.Timer())

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	r.POST("/geofences", geoHandler.CreateGeofence)
	r.GET("/geofences", geoHandler.ListGeofences)
	r.PUT("/geofences/:id", geoHandler.UpdateGeofence)
	r.DELETE("/geofences/:id", geoHandler.DeleteGeofence)

	r.POST("/vehicles", vehHandler.CreateVehicle)
	r.GET("/vehicles", vehHandler.ListVehicles)
	r.POST("/vehicles/location", vehHandler.UpdateLocation)
	r.GET("/vehicles/location/:id", vehHandler.GetLocation)

	r.POST("/alerts/configure", alertHandler.ConfigureAlert)
	r.GET("/alerts", alertHandler.ListAlerts)
	r.GET("/violations/history", alertHandler.ListViolations)

	r.GET("/ws/alerts", hub.HandleConnections)

	log.Printf("Server starting on port %s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("Server failed to run: %v", err)
	}
}
