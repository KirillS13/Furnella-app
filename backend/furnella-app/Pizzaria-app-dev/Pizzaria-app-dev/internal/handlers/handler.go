package handlers

import (
	services2 "myapp/internal/services"

	"firebase.google.com/go/v4/messaging"
	"github.com/infobip-community/infobip-api-go-sdk/v3/pkg/infobip"
	"github.com/labstack/echo/v4"
)

type Handler struct {
	Logger        echo.Logger
	UserService   *services2.UserService
	OrderService  *services2.OrderService
	FCMClient     *messaging.Client
	InfobipClient infobip.Client
}
