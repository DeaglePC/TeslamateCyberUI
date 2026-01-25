package handler

import (
	"net/http"
	"strconv"

	"teslamate-cyberui/internal/logger"

	"github.com/gin-gonic/gin"
)

// GetDrives 获取驾驶记录列表
func (h *Handler) GetDrives(c *gin.Context) {
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

	result, err := h.repo.Drive.GetList(c.Request.Context(), carID, page, pageSize)
	if err != nil {
		logger.Errorf("Failed to get drives: %v", err)
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, "Failed to get drives"))
		return
	}

	c.JSON(http.StatusOK, SuccessResponse(result))
}

// GetDriveDetail 获取驾驶详情
func (h *Handler) GetDriveDetail(c *gin.Context) {
	driveID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "Invalid drive ID"))
		return
	}

	detail, err := h.repo.Drive.GetDetail(c.Request.Context(), driveID)
	if err != nil {
		logger.Errorf("Failed to get drive detail: %v", err)
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, "Failed to get drive detail"))
		return
	}

	if detail == nil {
		c.JSON(http.StatusNotFound, ErrorResponse(404, "Drive not found"))
		return
	}

	c.JSON(http.StatusOK, SuccessResponse(detail))
}

// GetDrivePositions 获取驾驶轨迹
func (h *Handler) GetDrivePositions(c *gin.Context) {
	driveID, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "Invalid drive ID"))
		return
	}

	positions, err := h.repo.Drive.GetPositions(c.Request.Context(), driveID)
	if err != nil {
		logger.Errorf("Failed to get drive positions: %v", err)
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, "Failed to get drive positions"))
		return
	}

	c.JSON(http.StatusOK, SuccessResponse(positions))
}
