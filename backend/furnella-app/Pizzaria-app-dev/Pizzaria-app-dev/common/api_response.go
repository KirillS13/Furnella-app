package common

import (
	"myapp/internal/requests"
	"net/http"

	"github.com/labstack/echo/v4"
)

type ValidationError struct {
	Error     string `json:"error"`
	Key       string `json:"key"`
	Condition string `json:"condition"`
}

type JSONSuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data"`
}

func SendSuccessResponse(c echo.Context, message string, data interface{}) error {
	return c.JSON(http.StatusOK, JSONSuccessResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

type LoginResponse struct {
	TokenID      string `json:"token_id"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	LocalID      string `json:"local_id"`
	Email        string `json:"email"`
	Registered   bool   `json:"registered"`
}

type OrderResponse struct {
	OrderID    string                  `json:"order_id"`
	Order      []requests.OrderRequest `json:"order"`
	TotalPrice int64                   `json:"total_price"`
}
