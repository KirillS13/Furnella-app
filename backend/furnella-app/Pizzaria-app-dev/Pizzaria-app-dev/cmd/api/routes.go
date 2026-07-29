package main

import (
	"myapp/internal/handlers"
)

func (app Application) routes(handler handlers.Handler) {
	auth := app.server.Group("/auth")
	{
		auth.POST("/registration", handler.RegisterHandler)
		auth.POST("/login", handler.LoginHandler)
	}
	orders := app.server.Group("/orders")
	{
		orders.POST("", handler.OrderHandler)
		orders.GET("/menu", handler.GetAllPizzas)
		orders.GET("/all", handler.GetAllOrders)
		orders.PATCH("/:id/status", handler.ChangeOrderStatus)
	}
	notifications := app.server.Group("/notifications")
	{
		notifications.POST("", handler.SendHandler)
		notifications.POST("/broadcast", handler.BroadCast)
		notifications.POST("/sms/send", handler.SendSMS)
		notifications.POST("/sms/verify", handler.VerifyCode)
	}

}
