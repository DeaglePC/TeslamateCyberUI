package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// APIKeyAuth creates a middleware that validates the X-API-Key header
// If apiKey is empty, authentication is disabled (pass-through)
func APIKeyAuth(apiKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// If no API key is configured, disable authentication
		if apiKey == "" {
			c.Next()
			return
		}

		// Get the API key from header
		providedKey := c.GetHeader("X-API-Key")

		// Check if the key matches
		if providedKey == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "API key is required",
			})
			return
		}

		if providedKey != apiKey {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"code":    401,
				"message": "Invalid API key",
			})
			return
		}

		c.Next()
	}
}
