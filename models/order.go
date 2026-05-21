package models

import "gorm.io/gorm"

type Order struct {
	gorm.Model
	UserName    string
	Product     string
	PhoneNumber string
	Quantity    int
	Status      string
}
