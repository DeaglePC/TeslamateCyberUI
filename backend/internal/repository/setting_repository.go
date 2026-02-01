package repository

import (
	"fmt"
	"teslamate-cyberui/internal/model"

	"github.com/jmoiron/sqlx"
)

type UISettingRepository interface {
	InitTable() error
	Get(key string) (*model.UISetting, error)
	GetAll() ([]model.UISetting, error)
	Set(key string, value string) error
}

type uiSettingRepository struct {
	db *sqlx.DB
}

func NewUISettingRepository(db *sqlx.DB) UISettingRepository {
	return &uiSettingRepository{db: db}
}

func (r *uiSettingRepository) InitTable() error {
	schema := `
	CREATE TABLE IF NOT EXISTS ui_settings (
		key TEXT PRIMARY KEY,
		value TEXT NOT NULL
	);
	`
	_, err := r.db.Exec(schema)
	if err != nil {
		return fmt.Errorf("failed to create ui_settings table: %w", err)
	}
	return nil
}

func (r *uiSettingRepository) Get(key string) (*model.UISetting, error) {
	var setting model.UISetting
	err := r.db.Get(&setting, "SELECT key, value FROM ui_settings WHERE key = $1", key)
	if err != nil {
		return nil, err
	}
	return &setting, nil
}

func (r *uiSettingRepository) GetAll() ([]model.UISetting, error) {
	var settings []model.UISetting
	err := r.db.Select(&settings, "SELECT key, value FROM ui_settings")
	if err != nil {
		return nil, err
	}
	return settings, nil
}

func (r *uiSettingRepository) Set(key string, value string) error {
	_, err := r.db.Exec(`
		INSERT INTO ui_settings (key, value)
		VALUES ($1, $2)
		ON CONFLICT (key) DO UPDATE SET value = $2
	`, key, value)
	return err
}
