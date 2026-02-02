package handler

import (
	"time"

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

// parseDateTime 解析日期时间字符串，支持多种格式
// 数据库使用 timestamp without time zone，存储的是北京时间
func parseDateTime(dateStr string, isEndDate bool) *time.Time {
	if dateStr == "" {
		return nil
	}

	location := beijingLocation()

	// 纯日期格式 YYYY-MM-DD（主要格式）
	if t, err := time.ParseInLocation("2006-01-02", dateStr, location); err == nil {
		if isEndDate {
			// 结束日期设置为当天结束时间 23:59:59
			endOfDay := t.Add(24*time.Hour - time.Second)
			return &endOfDay
		}
		return &t
	}

	// 本地时间格式（不带时区后缀）2006-01-02T15:04:05
	if t, err := time.ParseInLocation("2006-01-02T15:04:05", dateStr, location); err == nil {
		return &t
	}

	// 兼容 UTC 格式，转换为北京时间
	if t, err := time.Parse(time.RFC3339, dateStr); err == nil {
		beijingTime := t.In(location)
		return &beijingTime
	}
	if t, err := time.Parse("2006-01-02T15:04:05.000Z", dateStr); err == nil {
		beijingTime := t.In(location)
		return &beijingTime
	}

	return nil
}

// beijingLocation 返回北京时间时区
func beijingLocation() *time.Location {
	location, err := time.LoadLocation("Asia/Shanghai")
	if err != nil {
		return time.FixedZone("CST", 8*3600)
	}
	return location
}
