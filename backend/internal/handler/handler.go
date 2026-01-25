package handler

import (
	"teslamate-cyberui/internal/repository"
)

// Handler 处理器集合
type Handler struct {
	repo *repository.Repository
}

// NewHandler 创建处理器
func NewHandler(repo *repository.Repository) *Handler {
	return &Handler{repo: repo}
}

// Response 通用响应
type Response struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// SuccessResponse 成功响应
func SuccessResponse(data interface{}) Response {
	return Response{
		Code:    0,
		Message: "success",
		Data:    data,
	}
}

// ErrorResponse 错误响应
func ErrorResponse(code int, message string) Response {
	return Response{
		Code:    code,
		Message: message,
	}
}
