package controllers

import (
	"fmt"
	"oms-system/config"
	"oms-system/models"

	"github.com/gin-gonic/gin"
)

func GetLowStockProducts(c *gin.Context) {

	var products []models.Product

	config.DB.Find(&products)

	var alerts []string

	for _, p := range products {

		if p.Stock == 0 {

			alerts = append(alerts,
				"❌ "+p.Name+" is OUT OF STOCK")

		} else if p.Stock <= 5 {

			alerts = append(alerts,
				fmt.Sprintf("⚠️ %s only %d bags left",
					p.Name, p.Stock))
		}
	}

	c.JSON(200, gin.H{
		"alerts": alerts,
	})
}
func CreateProduct(c *gin.Context) {

	var product models.Product

	if err := c.ShouldBindJSON(&product); err != nil {

		c.JSON(400, gin.H{
			"error": err.Error(),
		})
		return
	}

	config.DB.Create(&product)

	c.JSON(200, gin.H{
		"message": "Product created successfully",
	})
}

func GetProducts(c *gin.Context) {

	var products []models.Product

	config.DB.Find(&products)

	c.JSON(200, products)
}

func DeleteProduct(c *gin.Context) {

	id := c.Param("id")

	config.DB.Delete(&models.Product{}, id)

	c.JSON(200, gin.H{
		"message": "Product deleted successfully",
	})
}

func UpdateProduct(c *gin.Context) {

	id := c.Param("id")

	var product models.Product

	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(400, gin.H{
			"error": err.Error(),
		})
		return
	}

	config.DB.Model(&models.Product{}).
		Where("id = ?", id).
		Updates(product)

	c.JSON(200, gin.H{
		"message": "Product updated successfully",
	})
}
