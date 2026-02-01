package repository

import (
	"teslamate-cyberui/internal/logger"

	"github.com/jmoiron/sqlx"
)

// Repository 数据仓储接口聚合
type Repository struct {
	Car       CarRepository
	Charge    ChargeRepository
	Drive     DriveRepository
	Stats     StatsRepository
	UISetting UISettingRepository
}

// NewRepository 创建仓储实例
func NewRepository(db *sqlx.DB) *Repository {
	uiSettingRepo := NewUISettingRepository(db)
	if err := uiSettingRepo.InitTable(); err != nil {
		logger.Errorf("Failed to initialize ui_settings table: %v", err)
	}

	return &Repository{
		Car:       NewCarRepository(db),
		Charge:    NewChargeRepository(db),
		Drive:     NewDriveRepository(db),
		Stats:     NewStatsRepository(db),
		UISetting: uiSettingRepo,
	}
}
