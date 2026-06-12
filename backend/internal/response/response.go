package response

import (
	"fmt"
	"time"

	"github.com/gin-gonic/gin"
)

func JSON(c *gin.Context, status int, payload map[string]interface{}) {
	startTime, exists := c.Get("startTime")
	if exists {
		durationNs := time.Since(startTime.(time.Time)).Nanoseconds()
		payload["time_ns"] = fmt.Sprintf("%d", durationNs)
	}
	c.JSON(status, payload)
}
