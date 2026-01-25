package handler

import (
	"net/http"
	"strconv"

	"teslamate-cyberui/internal/logger"

	"github.com/gin-gonic/gin"
)

// GetCharges 获取充电记录列表
func (h *Handler) GetCharges(c *gin.Context) {
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

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("pageSize", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	result, err := h.repo.Charge.GetList(c.Request.Context(), carID, page, pageSize)
	if err != nil {
		logger.Errorf("Failed to get charges: %v", err)
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, "Failed to get charges"))
		return
	}

	c.JSON(http.StatusOK, SuccessResponse(result))
}

// GetChargeDetail 获取充电详情
func (h *Handler) GetChargeDetail(c *gin.Context) {
	chargeID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "Invalid charge ID"))
		return
	}

	detail, err := h.repo.Charge.GetDetail(c.Request.Context(), chargeID)
	if err != nil {
		logger.Errorf("Failed to get charge detail: %v", err)
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, "Failed to get charge detail"))
		return
	}

	if detail == nil {
		c.JSON(http.StatusNotFound, ErrorResponse(404, "Charge not found"))
		return
	}

	c.JSON(http.StatusOK, SuccessResponse(detail))
}

// GetChargeStats 获取充电统计数据
func (h *Handler) GetChargeStats(c *gin.Context) {
	chargeID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "Invalid charge ID"))
		return
	}

	stats, err := h.repo.Charge.GetStats(c.Request.Context(), chargeID)
	if err != nil {
		logger.Errorf("Failed to get charge stats: %v", err)
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, "Failed to get charge stats"))
		return
	}

	c.JSON(http.StatusOK, SuccessResponse(stats))
}
