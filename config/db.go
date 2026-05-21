package config

import (
	"fmt"
	"os"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	dsn := os.Getenv("DATABASE_URL")

	fmt.Println("DATABASE_URL:", dsn)

	// Check if DATABASE_URL is set
	if dsn == "" {
		panic("DATABASE_URL not set")
	}

	// Ensure SSL mode is present
	if !strings.Contains(dsn, "sslmode=") {
		if strings.Contains(dsn, "?") {
			dsn += "&sslmode=require"
		} else {
			dsn += "?sslmode=require"
		}
	}

	// Connect to database
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		panic("Database connection failed: " + err.Error())
	}

	DB = db
	fmt.Println("Database connected successfully!")
}
