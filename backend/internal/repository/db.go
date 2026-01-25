package repository

import (
	"fmt"

	"teslamate-cyberui/internal/config"
	"teslamate-cyberui/internal/logger"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

// NewPostgresDB 创建PostgreSQL数据库连接
func NewPostgresDB(cfg config.DatabaseConfig) (*sqlx.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode,
	)

	db, err := sqlx.Connect("postgres", dsn)
	if err != nil {
		logger.Errorf("Failed to connect to database: %v", err)
		return nil, err
	}

	// 设置连接池参数
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	// 验证连接
	if err := db.Ping(); err != nil {
		logger.Errorf("Failed to ping database: %v", err)
		return nil, err
	}

	return db, nil
}
