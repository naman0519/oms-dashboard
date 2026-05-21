package controllers

import (
	"fmt"
	"net/http"
	"time"

	"oms-system/config"
	"oms-system/models"

	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
)

func ExportOrdersToExcel(c *gin.Context) {
	var orders []models.Order

	// Load all orders
	config.DB.Order("id desc").Find(&orders)

	// Create new Excel file
	f := excelize.NewFile()
	sheetName := "Orders"
	f.SetSheetName("Sheet1", sheetName)

	// Headers
	headers := []string{
		"ID",
		"Customer Name",
		"Product",
		"Phone Number",
		"Quantity",
		"Status",
		"Created At",
	}

	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue(sheetName, cell, header)
	}

	// Data rows
	for i, order := range orders {
		row := i + 2

		f.SetCellValue(sheetName, fmt.Sprintf("A%d", row), order.ID)
		f.SetCellValue(sheetName, fmt.Sprintf("B%d", row), order.UserName)
		f.SetCellValue(sheetName, fmt.Sprintf("C%d", row), order.Product)
		f.SetCellValue(sheetName, fmt.Sprintf("D%d", row), order.PhoneNumber)
		f.SetCellValue(sheetName, fmt.Sprintf("E%d", row), order.Quantity)
		f.SetCellValue(sheetName, fmt.Sprintf("F%d", row), order.Status)
		f.SetCellValue(
			sheetName,
			fmt.Sprintf("G%d", row),
			order.CreatedAt.Format("02-01-2006 15:04"),
		)
	}

	// Auto column widths
	f.SetColWidth(sheetName, "A", "A", 10)
	f.SetColWidth(sheetName, "B", "B", 20)
	f.SetColWidth(sheetName, "C", "C", 20)
	f.SetColWidth(sheetName, "D", "D", 20)
	f.SetColWidth(sheetName, "E", "E", 10)
	f.SetColWidth(sheetName, "F", "F", 15)
	f.SetColWidth(sheetName, "G", "G", 25)

	// File name with current date
	filename := fmt.Sprintf(
		"orders_report_%s.xlsx",
		time.Now().Format("2006-01-02"),
	)

	// Download headers
	c.Header(
		"Content-Type",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	)
	c.Header(
		"Content-Disposition",
		fmt.Sprintf("attachment; filename=%s", filename),
	)

	// Write file to response
	if err := f.Write(c.Writer); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate Excel file",
		})
	}
}
