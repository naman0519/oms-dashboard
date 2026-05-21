package controllers

import (
	"fmt"
	"net/http"
	"strings"

	"oms-system/config"
	"oms-system/models"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// GET /api/settings
func GetSettings(c *gin.Context) {
	var settings models.Settings

	err := config.DB.
		Raw(`SELECT id,
		            low_stock_threshold,
		            auto_approve,
		            notifications_enabled
		     FROM settings
		     WHERE id = 1`).
		Scan(&settings).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Unable to load settings",
		})
		return
	}

	c.JSON(http.StatusOK, settings)
}

// POST /api/settings
func SaveSettings(c *gin.Context) {
	var settings models.Settings

	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request data",
		})
		return
	}

	err := config.DB.Exec(`
		UPDATE settings
		SET low_stock_threshold = ?,
		    auto_approve = ?,
		    notifications_enabled = ?
		WHERE id = 1
	`,
		settings.LowStockThreshold,
		settings.AutoApprove,
		settings.NotificationsEnabled,
	).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Unable to save settings",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Settings saved successfully",
	})
}

// POST /api/settings/change-password

func ChangePassword(c *gin.Context) {
	var req struct {
		CurrentPassword string `json:"current_password"`
		NewPassword     string `json:"new_password"`
		ConfirmPassword string `json:"confirm_password"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": "Invalid request"})
		return
	}

	// Confirm password check
	if req.NewPassword != req.ConfirmPassword {
		c.JSON(400, gin.H{"error": "New passwords do not match"})
		return
	}

	// Fetch admin
	var admin models.Admin
	if err := config.DB.First(&admin, 1).Error; err != nil {
		c.JSON(404, gin.H{"error": "Admin not found"})
		return
	}

	// DEBUG: terminal me dekhne ke liye
	fmt.Println("DB Password:", admin.Password)
	fmt.Println("Entered Password:", req.CurrentPassword)

	// Compare current password
	if err := bcrypt.CompareHashAndPassword(
		[]byte(strings.TrimSpace(admin.Password)),
		[]byte(strings.TrimSpace(req.CurrentPassword)),
	); err != nil {
		c.JSON(400, gin.H{
			"error": "Current password is incorrect",
		})
		return
	}
	// Update password
	hashedPassword, err := bcrypt.GenerateFromPassword(
		[]byte(req.NewPassword),
		bcrypt.DefaultCost,
	)
	if err != nil {
		c.JSON(500, gin.H{
			"error": "Failed to hash password",
		})
		return
	}
	admin.Password = string(hashedPassword)
	config.DB.Save(&admin)

	c.JSON(200, gin.H{"message": "Password changed successfully"})
}
