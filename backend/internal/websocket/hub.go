package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for the assessment
	},
}

type Hub struct {
	clients map[*websocket.Conn]bool
	mu      sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[*websocket.Conn]bool),
	}
}

func (h *Hub) HandleConnections(c *gin.Context) {
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to set websocket upgrade: %+v\n", err)
		return
	}
	defer ws.Close()

	h.mu.Lock()
	h.clients[ws] = true
	h.mu.Unlock()

	for {
		_, _, err := ws.ReadMessage()
		if err != nil {
			h.mu.Lock()
			delete(h.clients, ws)
			h.mu.Unlock()
			break
		}
	}
}

func (h *Hub) Broadcast(message interface{}) {
	h.mu.Lock()
	defer h.mu.Unlock()

	msgBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshalling broadcast message: %v", err)
		return
	}

	for client := range h.clients {
		err := client.WriteMessage(websocket.TextMessage, msgBytes)
		if err != nil {
			log.Printf("Error writing to client: %v", err)
			client.Close()
			delete(h.clients, client)
		}
	}
}
