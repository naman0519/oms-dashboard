package main

import (
	"fmt"
	"oms-system/config"
	"oms-system/models"
	"oms-system/routes"
	"os"

	"github.com/gin-contrib/sessions"
	"github.com/gin-contrib/sessions/cookie"

	"github.com/gin-gonic/gin"
)

func main() {

	fmt.Println("OMS SERVER STARTED")

	// DB connect
	config.Connect()

	// Migrate
	config.DB.AutoMigrate(
		&models.Order{},
		&models.Product{},
		&models.Settings{},
		&models.Admin{},
	)

	// gin
	r := gin.Default()

	store := cookie.NewStore([]byte("secret"))

	r.Use(sessions.Sessions("mysession", store))

	r.Static("/static", "./static")

	r.LoadHTMLGlob("templates/*")

	// routes
	routes.SetupRoutes(r)

	// run
	port := os.Getenv("PORT")

	if port == "" {
		port = "8081"
	}

	r.Run(":" + port)
}
