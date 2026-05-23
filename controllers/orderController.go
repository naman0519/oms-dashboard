package controllers

import (
	"fmt"
	"oms-system/config"
	"oms-system/models"
	"strings"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
)

// ========================================
// CREATE ORDER
// ========================================
func CreateOrder(c *gin.Context) {

	var data map[string]interface{}

	// JSON read
	if err := c.ShouldBindJSON(&data); err != nil {
		c.JSON(400, gin.H{
			"error": err.Error(),
		})
		return
	}

	// Quantity convert
	qty := 0
	if q, ok := data["quantity"].(float64); ok {
		qty = int(q)
	}

	// Create order
	order := models.Order{
		UserName:    fmt.Sprintf("%v", data["name"]),
		Product:     fmt.Sprintf("%v", data["product"]),
		PhoneNumber: fmt.Sprintf("%v", data["phone"]),
		Quantity:    qty,
		Status:      "Pending",
	}

	// Save in DB
	if err := config.DB.Create(&order).Error; err != nil {
		c.JSON(500, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(200, gin.H{
		"message": "Order created successfully",
		"order":   order,
	})
}

// ========================================
// GET ALL ORDERS
// ========================================
func GetOrders(c *gin.Context) {
	var orders []models.Order

	config.DB.Order("created_at desc").Find(&orders)

	c.JSON(200, orders)
}

// ========================================
// APPROVE ORDER + AUTO STOCK DEDUCTION
// ========================================
func ApproveOrder(c *gin.Context) {
	id := c.Param("id")

	var order models.Order

	// Find order
	if err := config.DB.First(&order, id).Error; err != nil {
		c.JSON(404, gin.H{
			"error": "Order not found",
		})
		return
	}

	// If already approved, don't deduct stock again
	if order.Status == "Approved" {
		c.JSON(200, gin.H{
			"message": "Order already approved",
			"order":   order,
		})
		return
	}

	// Find matching product by name (case-insensitive + trim spaces)
	var product models.Product
	productName := strings.TrimSpace(order.Product)

	if err := config.DB.
		Where("LOWER(TRIM(name)) = LOWER(TRIM(?))", productName).
		First(&product).Error; err != nil {
		c.JSON(404, gin.H{
			"error": "Product not found",
		})
		return
	}

	// Convert values safely
	orderQty := int(order.Quantity)
	currentStock := int(product.Stock)

	// Debug logs
	fmt.Println("Product:", product.Name)
	fmt.Println("Current Stock:", currentStock)
	fmt.Println("Order Quantity:", orderQty)

	// Stock validation
	if currentStock <= 0 {
		c.JSON(400, gin.H{
			"error": "Product is out of stock",
		})
		return
	}

	if currentStock < orderQty {
		c.JSON(400, gin.H{
			"error": "Insufficient stock",
		})
		return
	}

	// Deduct stock
	product.Stock = currentStock - orderQty
	config.DB.Save(&product)

	// Update order status
	order.Status = "Approved"
	config.DB.Save(&order)

	c.JSON(200, gin.H{
		"message": "Order approved and stock updated successfully",
		"order":   order,
		"product": product,
	})
}

// ========================================
// REJECT ORDER
// ========================================
func RejectOrder(c *gin.Context) {
	id := c.Param("id")

	var order models.Order

	// Find order
	if err := config.DB.First(&order, id).Error; err != nil {
		c.JSON(404, gin.H{
			"error": "Order not found",
		})
		return
	}

	// If already rejected, do nothing
	if order.Status == "Rejected" {
		c.JSON(200, gin.H{
			"message": "Order already rejected",
			"order":   order,
		})
		return
	}

	// If already approved, do not allow reject
	if order.Status == "Approved" {
		c.JSON(400, gin.H{
			"error": "Approved order cannot be rejected",
		})
		return
	}

	// Update status
	order.Status = "Rejected"
	config.DB.Save(&order)

	c.JSON(200, gin.H{
		"message": "Order rejected",
		"order":   order,
	})
}

// ========================================
// DELETE ORDER
// ========================================
func DeleteOrder(c *gin.Context) {
	id := c.Param("id")

	config.DB.Delete(&models.Order{}, id)

	c.JSON(200, gin.H{
		"message": "Order deleted successfully",
	})
}

// ========================================
// ADMIN LOGIN
// ========================================
// func AdminLogin(c *gin.Context) {
// 	email := strings.TrimSpace(c.PostForm("email"))
// 	password := strings.TrimSpace(c.PostForm("password"))

// 	//Admin record database se fetch karo
// 	var admin models.Admin
// 	if err := config.DB.Where("username = ?", "admin").First(&admin).Error; err != nil {
// 		c.HTML(401, "login.html", gin.H{
// 			"error": "Admin account not found",
// 		})
// 		return
// 	}

// 	// Email verify (login page par admin@gmail.com use kar rahe ho)
// 	if email != "admin@gmail.com" {
// 		c.HTML(401, "login.html", gin.H{
// 			"error": "Invalid email or password",
// 		})
// 		return
// 	}

// 	// Password verify using bcrypt hash stored in database
// 	if password != "123456" {
// 		c.HTML(401, "login.html", gin.H{
// 			"error": "Invalid password",
// 		})
// 		return
// 	}

func AdminLogin(c *gin.Context) {

	email := strings.TrimSpace(c.PostForm("email"))
	password := strings.TrimSpace(c.PostForm("password"))

	// Simple fixed login
	if email != "admin@gmail.com" || password != "123456" {

		c.HTML(401, "login.html", gin.H{
			"error": "Invalid email or password",
		})

		return
	}

	// Session create
	session := sessions.Default(c)
	session.Set("admin", email)
	session.Save()

	// Dashboard redirect
	c.Redirect(302, "/dashboard")
}

// 	// Session create
// 	session := sessions.Default(c)
// 	session.Set("admin", true)
// 	session.Save()

// 	// Redirect to dashboard
// 	c.Redirect(302, "/dashboard")
// }

// ========================================
// LOGOUT
// ========================================
func Logout(c *gin.Context) {
	session := sessions.Default(c)

	session.Clear()
	session.Save()

	c.Redirect(302, "/login")
}
