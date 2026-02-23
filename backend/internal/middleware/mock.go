package middleware

import (
	"embed"
	"net/http"
	"path/filepath"
	"strings"
	"time"

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

		// 动态生成 states-timeline 的数据
		if fileName == "api_v1_cars_id_stats_states-timeline.json" {
			c.JSON(http.StatusOK, gin.H{
				"code":    0,
				"message": "success",
				"data":    generateMockStatesTimeline(),
			})
			c.Abort()
			return
		}

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

// generateMockStatesTimeline 动态生成过去 24 小时内的车辆状态时间线
func generateMockStatesTimeline() []map[string]interface{} {
	now := time.Now().UTC()
	timeline := make([]map[string]interface{}, 0)

	// 从 24 小时前开始
	startTime := now.Add(-24 * time.Hour)

	// 定义状态枚举 (根据 frontend/src/types/index.ts 的 StateTimelineItem.state: 0: parked, 1: driving, 2: charging, 3: asleep, 4: offline, 5: suspended, 6: updating)
	states := []int{4, 3, 0, 1, 0, 4, 0, 1, 0, 2, 0, 6, 0, 3, 4}

	// 平均分配 24 小时给上边的 15 个状态 (约 1.6 小时一个状态)
	durationPerState := (24 * time.Hour) / time.Duration(len(states))

	for i, state := range states {
		timeline = append(timeline, map[string]interface{}{
			"time":  startTime.Add(time.Duration(i) * durationPerState).Format(time.RFC3339),
			"state": state,
		})
	}

	return timeline
}
