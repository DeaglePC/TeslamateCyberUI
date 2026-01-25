package handler

import (
	"net/http"
	"strconv"

	"teslamate-cyberui/internal/logger"

	"github.com/gin-gonic/gin"
)

// GetCars 获取车辆列表
func (h *Handler) GetCars(c *gin.Context) {
	cars, err := h.repo.Car.GetAll(c.Request.Context())
	if err != nil {
		logger.Errorf("Failed to get cars: %v", err)
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, "Failed to get cars"))
		return
	}

	// 转换为前端需要的格式
	var result []map[string]interface{}
	for _, car := range cars {
		item := map[string]interface{}{
			"id":         car.ID,
			"insertedAt": car.InsertedAt,
			"updatedAt":  car.UpdatedAt,
		}
		if car.Name.Valid {
			item["name"] = car.Name.String
		}
		if car.Model.Valid {
			item["model"] = car.Model.String
		}
		if car.VIN.Valid {
			item["vin"] = car.VIN.String
		}
		if car.TrimBadging.Valid {
			item["trimBadging"] = car.TrimBadging.String
		}
		if car.ExteriorColor.Valid {
			item["exteriorColor"] = car.ExteriorColor.String
		}
		if car.WheelType.Valid {
			item["wheelType"] = car.WheelType.String
		}
		if car.MarketingName.Valid {
			item["marketingName"] = car.MarketingName.String
		}
		item["displayPriority"] = car.DisplayPriority
		result = append(result, item)
	}

	c.JSON(http.StatusOK, SuccessResponse(result))
}

// GetCarStatus 获取车辆状态
func (h *Handler) GetCarStatus(c *gin.Context) {
	idStr := c.Param("id")
	carID64, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "Invalid car ID"))
		return
	}
	if carID64 < -32768 || carID64 > 32767 {
		c.JSON(http.StatusBadRequest, ErrorResponse(400, "Car ID out of valid range"))
		return
	}
	carID := int16(carID64)

	status, err := h.repo.Car.GetStatus(c.Request.Context(), carID)
	if err != nil {
		logger.Errorf("Failed to get car status: %v", err)
		c.JSON(http.StatusInternalServerError, ErrorResponse(500, "Failed to get car status"))
		return
	}

	if status == nil {
		c.JSON(http.StatusNotFound, ErrorResponse(404, "Car not found"))
		return
	}

	c.JSON(http.StatusOK, SuccessResponse(status))
}
