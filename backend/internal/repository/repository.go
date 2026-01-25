package repository

import (
	"github.com/jmoiron/sqlx"
)

// Repository 数据仓储接口聚合
type Repository struct {
	Car    CarRepository
	Charge ChargeRepository
	Drive  DriveRepository
	Stats  StatsRepository
}

// NewRepository 创建仓储实例
func NewRepository(db *sqlx.DB) *Repository {
	return &Repository{
		Car:    NewCarRepository(db),
		Charge: NewChargeRepository(db),
		Drive:  NewDriveRepository(db),
		Stats:  NewStatsRepository(db),
	}
}
