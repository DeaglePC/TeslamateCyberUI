package model

type UISetting struct {
	Key   string `db:"key" json:"key"`
	Value string `db:"value" json:"value"`
}
