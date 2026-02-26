package handler

import (
	"encoding/base64"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// 背景图片存储的 key
const backgroundImageKey = "backgroundImage"
const backgroundOriginalImageKey = "backgroundOriginalImage"

// 最大图片大小 30MB（Base64 编码后约为 40MB）
const maxImageSize = 30 * 1024 * 1024

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

// UploadBackgroundImageRequest 上传背景图片请求
type UploadBackgroundImageRequest struct {
	// Image Base64 编码的图片数据，格式为 data:image/xxx;base64,xxxx
	Image string `json:"image" binding:"required"`
	// OriginalImage 原始图片（用于重新裁剪）
	OriginalImage string `json:"originalImage,omitempty"`
}

// UploadBackgroundImage 上传背景图片
func (h *Handler) UploadBackgroundImage(c *gin.Context) {
	var req UploadBackgroundImageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, err.Error()))
		return
	}

	// 验证图片格式
	if !strings.HasPrefix(req.Image, "data:image/") {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "invalid image format, must be data:image/xxx;base64,xxx"))
		return
	}

	// 提取 Base64 部分验证大小
	parts := strings.Split(req.Image, ",")
	if len(parts) != 2 {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "invalid image format"))
		return
	}

	// 解码验证
	imageData, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "invalid base64 encoding"))
		return
	}

	// 检查图片大小
	if len(imageData) > maxImageSize {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, fmt.Sprintf("image size exceeds limit (%dMB)", maxImageSize/1024/1024)))
		return
	}

	// 保存到数据库
	if err := h.repo.UISetting.Set(backgroundImageKey, req.Image); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, err.Error()))
		return
	}

	// 保存原始图片（如果有）
	if req.OriginalImage != "" {
		if err := h.repo.UISetting.Set(backgroundOriginalImageKey, req.OriginalImage); err != nil {
			c.JSON(http.StatusInternalServerError, ErrorResponse(500, err.Error()))
			return
		}
	}

	c.JSON(http.StatusOK, SuccessResponse(map[string]any{
		"message": "background image uploaded successfully",
		"size":    len(imageData),
	}))
}

// GetBackgroundImage 获取背景图片
func (h *Handler) GetBackgroundImage(c *gin.Context) {
	setting, err := h.repo.UISetting.Get(backgroundImageKey)
	if err != nil {
		// 没有设置背景图片，返回空
		c.JSON(http.StatusOK, SuccessResponse(map[string]string{
			"image":         "",
			"originalImage": "",
		}))
		return
	}

	// 获取原始图片
	originalSetting, _ := h.repo.UISetting.Get(backgroundOriginalImageKey)
	originalImage := ""
	if originalSetting != nil {
		originalImage = originalSetting.Value
	}

	c.JSON(http.StatusOK, SuccessResponse(map[string]string{
		"image":         setting.Value,
		"originalImage": originalImage,
	}))
}

// DeleteBackgroundImage 删除背景图片
func (h *Handler) DeleteBackgroundImage(c *gin.Context) {
	// 设置为空字符串即删除
	if err := h.repo.UISetting.Set(backgroundImageKey, ""); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, err.Error()))
		return
	}

	// 同时删除原始图片
	h.repo.UISetting.Set(backgroundOriginalImageKey, "")

	c.JSON(http.StatusOK, SuccessResponse(map[string]string{
		"message": "background image deleted",
	}))
}
