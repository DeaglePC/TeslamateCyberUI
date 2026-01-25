package config

import (
	"os"
	"strings"
)

// Config 应用配置
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Log      LogConfig
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Host        string
	Port        string
	Mode        string
	CORSOrigins []string
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// LogConfig 日志配置
type LogConfig struct {
	Level string
}

// getEnv 获取环境变量，如果为空则返回默认值
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvSlice 获取以逗号分隔的环境变量切片，如果为空则返回默认切片
func getEnvSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		if value == "*" {
			return []string{"*"}
		}
		// 按逗号分割，并去除空格
		parts := strings.Split(value, ",")
		result := make([]string, 0, len(parts))
		for _, part := range parts {
			if trimmed := strings.TrimSpace(part); trimmed != "" {
				result = append(result, trimmed)
			}
		}
		return result
	}
	return defaultValue
}

// Load 加载配置
func Load() (*Config, error) {
	cfg := &Config{
		Server: ServerConfig{
			Host:        getEnv("CYBERUI_SERVER_HOST", "0.0.0.0"),
			Port:        getEnv("CYBERUI_SERVER_PORT", "8080"),
			Mode:        getEnv("CYBERUI_SERVER_MODE", "debug"),
			CORSOrigins: getEnvSlice("CYBERUI_CORS_ORIGINS", []string{"*"}),
		},
		Database: DatabaseConfig{
			Host:     getEnv("TESLAMATE_DB_HOST", "localhost"),
			Port:     getEnv("TESLAMATE_DB_PORT", "5432"),
			User:     getEnv("TESLAMATE_DB_USER", "teslamate"),
			Password: getEnv("TESLAMATE_DB_PASSWORD", "teslamate"),
			DBName:   getEnv("TESLAMATE_DB_NAME", "teslamate"),
			SSLMode:  getEnv("TESLAMATE_DB_SSLMODE", "disable"),
		},
		Log: LogConfig{
			Level: getEnv("LOG_LEVEL", "info"),
		},
	}

	return cfg, nil
}
