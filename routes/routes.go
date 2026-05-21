package routes

import (
	"oms-system/controllers"

	"github.com/gin-contrib/sessions"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {

	// Home page
	r.GET("/", func(c *gin.Context) {
		c.HTML(200, "index.html", nil)
	})

	r.GET("/login", func(c *gin.Context) {
		c.HTML(200, "login.html", nil)
	})

	// Dashboard
	r.GET("/dashboard", func(c *gin.Context) {

		session := sessions.Default(c)

		admin := session.Get("admin")

		if admin == nil {

			c.Redirect(302, "/login")

			return

		}
		c.HTML(200, "dashboard.html", nil)
	})

	r.GET("/products", func(c *gin.Context) {
		c.HTML(200, "products.html", nil)
	})

	r.GET("/analytics", func(c *gin.Context) {
		c.HTML(200, "analytics.html", nil)
	})

	r.GET("/settings", func(c *gin.Context) {
		c.HTML(200, "settings.html", nil)
	})

	// APIs

	r.POST("/login", controllers.AdminLogin)
	r.POST("/order", controllers.CreateOrder)
	r.POST("/products", controllers.CreateProduct)
	r.POST("/api/change-password", controllers.ChangePassword)

	r.GET("/orders", controllers.GetOrders)
	r.GET("/logout", controllers.Logout)
	r.GET("/low-stock-products", controllers.GetLowStockProducts)
	r.GET("/api/products", controllers.GetProducts)
	r.GET("/api/settings", controllers.GetSettings)
	r.GET("/export/orders", controllers.ExportOrdersToExcel)

	r.PUT("/order/:id/approve", controllers.ApproveOrder)
	r.PUT("/order/:id/reject", controllers.RejectOrder)

	r.DELETE("/order/:id", controllers.DeleteOrder)
	r.DELETE("/api/products/:id", controllers.DeleteProduct)
	r.PUT("/api/products/:id", controllers.UpdateProduct)
	r.POST("/api/settings", controllers.SaveSettings)
}
