package models

type Settings struct {
	ID                   uint `gorm:"primaryKey"`
	LowStockThreshold    int  `json:"low_stock_threshold"`
	AutoApprove          bool `json:"auto_approve"`
	NotificationsEnabled bool `json:"notifications_enabled"`
}
