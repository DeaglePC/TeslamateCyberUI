package middleware

import (
	"embed"
	"net/http"
	"path/filepath"
	"strings"

	"teslamate-cyberui/internal/logger"

	"github.com/gin-gonic/gin"
)

//go:embed mock_data/*.json
var mockDataFS embed.FS

// MockData 是一个用于返回假数据的Gin中间件
func MockData(enableMock bool) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 如果未开启Mock，或者不是API请求，直接放行
		if !enableMock || !strings.HasPrefix(c.Request.URL.Path, "/api/") {
			c.Next()
			return
		}

		// 拦截所有非 GET 请求，在 Mock 模式下直接返回成功，不进行任何实际的修改或保存操作
		if c.Request.Method != http.MethodGet {
			logger.Infof("Mock enabled, intercepting %s request to %s, returning success", c.Request.Method, c.Request.URL.Path)
			c.JSON(http.StatusOK, gin.H{
				"code":    0,
				"message": "success (mock mode)",
				"data":    nil,
			})
			c.Abort()
			return
		}

		// 根据请求路径构建Mock文件路径
		// 例如：/api/v1/cars -> mock_data/api_v1_cars.json
		// /api/v1/cars/123/status -> mock_data/api_v1_cars_id_status.json

		path := strings.TrimPrefix(c.Request.URL.Path, "/")

		// 简单的路由参数模式替换，将数字ID替换为"id"以匹配通用mock文件
		// 这里可能需要根据实际路由设计进行调整
		parts := strings.Split(path, "/")
		for i, part := range parts {
			// 假设纯数字的是ID
			if isNumeric(part) {
				parts[i] = "id"
			}
		}

		fileName := strings.Join(parts, "_") + ".json"
		mockFilePath := filepath.Join("mock_data", fileName)

		logger.Debugf("Mock enabled, looking for mock data file: %s", mockFilePath)

		// 尝试从嵌入的文件系统中读取Mock数据
		data, err := mockDataFS.ReadFile(mockFilePath)
		if err != nil {
			// 如果开启了Mock但是找不到对应的Mock文件，直接返回一个错误提示，而不是继续往下执行
			// 因为在Mock模式下，真实数据库连接可能没有初始化，往下执行会导致空指针异常（Panic）
			logger.Warnf("Mock file not found: %s, returning empty data", mockFilePath)
			c.JSON(http.StatusNotFound, gin.H{
				"code":    404,
				"message": "Mock data file not found: " + mockFilePath,
				"data":    nil,
			})
			c.Abort()
			return
		}

		logger.Infof("Serving mock data for %s from %s", c.Request.URL.Path, mockFilePath)

		// 返回Mock JSON数据
		c.Data(http.StatusOK, "application/json; charset=utf-8", data)
		// 终止后续的处理函数
		c.Abort()
	}
}

func isNumeric(s string) bool {
	for _, c := range s {
		if c < '0' || c > '9' {
			return false
		}
	}
	// 空字符串不算数字
	return len(s) > 0
}
