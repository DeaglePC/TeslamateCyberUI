package handler

import (
	"net/http"
	"strconv"
	"time"

	"teslamate-cyberui/internal/logger"

	"github.com/gin-gonic/gin"
)

// GetOverviewStats 获取概览统计
func (h *Handler) GetOverviewStats(c *gin.Context) {
	idStr := c.Param("id")
	carID64, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "Invalid car ID"))
		return
	}
	if carID64 < -32768 || carID64 > 32767 {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "Car ID out of valid range"))
		return
	}
	carID := int16(carID64)

	stats, err := h.repo.Stats.GetOverview(c.Request.Context(), carID)
	if err != nil {
		logger.Errorf("Failed to get overview stats: %v", err)
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, "Failed to get overview stats"))
		return
	}

	c.JSON(http.StatusOK, SuccessResponse(stats))
}

// GetEfficiencyStats 获取能效统计
func (h *Handler) GetEfficiencyStats(c *gin.Context) {
	idStr := c.Param("id")
	carID64, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "Invalid car ID"))
		return
	}
	if carID64 < -32768 || carID64 > 32767 {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "Car ID out of valid range"))
		return
	}
	carID := int16(carID64)

	days, _ := strconv.Atoi(c.DefaultQuery("days", "30"))
	if days < 1 || days > 365 {
		days = 30
	}

	stats, err := h.repo.Stats.GetEfficiency(c.Request.Context(), carID, days)
	if err != nil {
		logger.Errorf("Failed to get efficiency stats: %v", err)
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, "Failed to get efficiency stats"))
		return
	}

	c.JSON(http.StatusOK, SuccessResponse(stats))
}

// GetBatteryStats 获取电池统计
func (h *Handler) GetBatteryStats(c *gin.Context) {
	idStr := c.Param("id")
	carID64, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "Invalid car ID"))
		return
	}
	if carID64 < -32768 || carID64 > 32767 {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "Car ID out of valid range"))
		return
	}
	carID := int16(carID64)

	stats, err := h.repo.Stats.GetBattery(c.Request.Context(), carID)
	if err != nil {
		logger.Errorf("Failed to get battery stats: %v", err)
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, "Failed to get battery stats"))
		return
	}

	c.JSON(http.StatusOK, SuccessResponse(stats))
}

// GetSocHistory 获取SOC历史数据
func (h *Handler) GetSocHistory(c *gin.Context) {
	idStr := c.Param("id")
	carID64, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "Invalid car ID"))
		return
	}
	if carID64 < -32768 || carID64 > 32767 {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "Car ID out of valid range"))
		return
	}
	carID := int16(carID64)

	var start, end time.Time
	fromStr := c.Query("from")
	toStr := c.Query("to")

	hours, _ := strconv.Atoi(c.DefaultQuery("hours", "24"))
	start, end = parseTimeRange(fromStr, toStr, hours)

	data, err := h.repo.Stats.GetSocHistory(c.Request.Context(), carID, start, end)
	if err != nil {
		logger.Errorf("Failed to get SOC history: %v", err)
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, "Failed to get SOC history"))
		return
	}

	c.JSON(http.StatusOK, SuccessResponse(data))
}

// GetStatesTimeline 获取状态时间线数据
func (h *Handler) GetStatesTimeline(c *gin.Context) {
	idStr := c.Param("id")
	carID64, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "Invalid car ID"))
		return
	}
	if carID64 < -32768 || carID64 > 32767 {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "Car ID out of valid range"))
		return
	}
	carID := int16(carID64)

	var start, end time.Time
	fromStr := c.Query("from")
	toStr := c.Query("to")

	hours, _ := strconv.Atoi(c.DefaultQuery("hours", "24"))
	start, end = parseTimeRange(fromStr, toStr, hours)

	data, err := h.repo.Stats.GetStatesTimeline(c.Request.Context(), carID, start, end)
	if err != nil {
		logger.Errorf("Failed to get states timeline: %v", err)
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, "Failed to get states timeline"))
		return
	}

	c.JSON(http.StatusOK, SuccessResponse(data))
}

// parseTimeRange parses time range from query parameters
// Supports formats: YYYY-MM-DD, YYYY-MM-DDTHH:mm:ss (local Beijing time), RFC3339
// Returns UTC time for database queries
func parseTimeRange(fromStr, toStr string, defaultHours int) (start, end time.Time) {
	if fromStr != "" && toStr != "" {
		location := beijingLocation()

		// Try parsing as simple date first (YYYY-MM-DD)
		s, err1 := time.ParseInLocation("2006-01-02", fromStr, location)
		e, err2 := time.ParseInLocation("2006-01-02", toStr, location)
		if err1 == nil && err2 == nil {
			start = s.UTC()
			end = e.Add(24*time.Hour - time.Second).UTC() // End of the day
			return
		}

		// Try RFC3339 (with timezone)
		s, err1 = time.Parse(time.RFC3339, fromStr)
		e, err2 = time.Parse(time.RFC3339, toStr)
		if err1 == nil && err2 == nil {
			start = s
			end = e
			return
		}

		// Try local datetime format (YYYY-MM-DDTHH:mm:ss) without timezone
		// Assume Beijing time, convert to UTC
		const localLayout = "2006-01-02T15:04:05"
		s, err1 = time.ParseInLocation(localLayout, fromStr, location)
		e, err2 = time.ParseInLocation(localLayout, toStr, location)
		if err1 == nil && err2 == nil {
			start = s.UTC()
			end = e.UTC()
			return
		}
	}

	// Fallback to hours-based range
	if defaultHours < 1 {
		defaultHours = 24
	}
	end = time.Now().UTC()
	start = end.Add(-time.Duration(defaultHours) * time.Hour)
	return
}
