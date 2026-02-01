package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// GetUISettings 获取所有UI设置
func (h *Handler) GetUISettings(c *gin.Context) {
	settings, err := h.repo.UISetting.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, err.Error()))
		return
	}

	// Convert slice to map for easier frontend consumption
	settingsMap := make(map[string]string)
	for _, s := range settings {
		settingsMap[s.Key] = s.Value
	}

	c.JSON(http.StatusOK, SuccessResponse(settingsMap))
}

// UpdateUISettingRequest 更新设置请求
type UpdateUISettingRequest struct {
	Key   string `json:"key" binding:"required"`
	Value string `json:"value" binding:"required"`
}

// UpdateUISetting 更新单个UI设置
func (h *Handler) UpdateUISetting(c *gin.Context) {
	var req UpdateUISettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, err.Error()))
		return
	}

	if err := h.repo.UISetting.Set(req.Key, req.Value); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, err.Error()))
		return
	}

	c.JSON(http.StatusOK, SuccessResponse(nil))
}

// BatchUpdateUISettings 批量更新UI设置
func (h *Handler) BatchUpdateUISettings(c *gin.Context) {
	var req map[string]string
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, err.Error()))
		return
	}

	for k, v := range req {
		if err := h.repo.UISetting.Set(k, v); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse(500, err.Error()))
			return
		}
	}

	c.JSON(http.StatusOK, SuccessResponse(nil))
}
