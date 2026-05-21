package models

type User struct {
	Id       uint `gorm:"primaryKey"`
	Name     string
	Mobile   string
	Password string
}
