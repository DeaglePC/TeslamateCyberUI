package handler

import (
	"net/http"
	"strconv"

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

	hours, _ := strconv.Atoi(c.DefaultQuery("hours", "24"))
	if hours < 1 || hours > 168 {
		hours = 24
	}

	data, err := h.repo.Stats.GetSocHistory(c.Request.Context(), carID, hours)
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

	hours, _ := strconv.Atoi(c.DefaultQuery("hours", "24"))
	if hours < 1 || hours > 168 {
		hours = 24
	}

	data, err := h.repo.Stats.GetStatesTimeline(c.Request.Context(), carID, hours)
	if err != nil {
		logger.Errorf("Failed to get states timeline: %v", err)
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, "Failed to get states timeline"))
		return
	}

	c.JSON(http.StatusOK, SuccessResponse(data))
}
