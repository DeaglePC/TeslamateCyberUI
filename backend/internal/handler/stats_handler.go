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

	if fromStr != "" && toStr != "" {
		// Try parsing as simple date first (YYYY-MM-DD)
		s, err1 := time.Parse("2006-01-02", fromStr)
		e, err2 := time.Parse("2006-01-02", toStr)
		if err1 == nil && err2 == nil {
			start = s
			end = e.Add(24*time.Hour - time.Second) // End of the day
		} else {
			// Try RFC3339
			start, _ = time.Parse(time.RFC3339, fromStr)
			end, _ = time.Parse(time.RFC3339, toStr)
		}
	}

	if start.IsZero() || end.IsZero() {
		hours, _ := strconv.Atoi(c.DefaultQuery("hours", "24"))
		if hours < 1 {
			hours = 24
		}
		end = time.Now().UTC()
		start = end.Add(-time.Duration(hours) * time.Hour)
	}

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

	if fromStr != "" && toStr != "" {
		s, err1 := time.Parse("2006-01-02", fromStr)
		e, err2 := time.Parse("2006-01-02", toStr)
		if err1 == nil && err2 == nil {
			start = s
			end = e.Add(24*time.Hour - time.Second)
		} else {
			start, _ = time.Parse(time.RFC3339, fromStr)
			end, _ = time.Parse(time.RFC3339, toStr)
		}
	}

	if start.IsZero() || end.IsZero() {
		hours, _ := strconv.Atoi(c.DefaultQuery("hours", "24"))
		if hours < 1 {
			hours = 24
		}
		end = time.Now().UTC()
		start = end.Add(-time.Duration(hours) * time.Hour)
	}

	data, err := h.repo.Stats.GetStatesTimeline(c.Request.Context(), carID, start, end)
	if err != nil {
		logger.Errorf("Failed to get states timeline: %v", err)
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, "Failed to get states timeline"))
		return
	}

	c.JSON(http.StatusOK, SuccessResponse(data))
}
