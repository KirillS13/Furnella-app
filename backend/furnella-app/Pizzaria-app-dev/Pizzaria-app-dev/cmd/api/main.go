package main

import (
	"context"
	"fmt"
	"myapp/common"
	"myapp/internal/handlers"
	services2 "myapp/internal/services"
	"os"

	"github.com/infobip-community/infobip-api-go-sdk/v3/pkg/infobip"
	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

type Application struct {
	handler handlers.Handler
	logger  echo.Logger
	server  *echo.Echo
}

func main() {
	e := echo.New()
	
	// Мягкая загрузка .env (для локалки). На Render файл отсутствует — и это нормально!
	_ = godotenv.Load()

	db := common.GetFirestore()

	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{
			"http://localhost:3000",
			"http://localhost:5173",
			"https://furnella-app.vercel.app", // <- Вот правильный URL вашего фронтенда
		},
		AllowMethods: []string{
			echo.GET, echo.POST, echo.PATCH, echo.PUT, echo.DELETE, echo.OPTIONS,
		},
		AllowHeaders: []string{
			echo.HeaderOrigin,
			echo.HeaderContentType,
			echo.HeaderAccept,
			echo.HeaderAuthorization,
		},
		AllowCredentials: true,
	}))

	url := "https://38xjxn.api.infobip.com"
	apikey := os.Getenv("API_KEY")

	firebaseApp := common.GetApp()
	authClient, err := firebaseApp.Auth(context.Background())
	if err != nil {
		e.Logger.Fatal(err)
	}
	messagingClient, err := firebaseApp.Messaging(context.Background())
	if err != nil {
		e.Logger.Fatal(err)
	}
	infobipClient, err := infobip.NewClient(url, apikey)
	if err != nil {
		e.Logger.Fatal(err)
	}

	userService := services2.NewUserService(db, authClient)
	orderService := services2.NewOrderService(db)

	h := handlers.Handler{
		Logger:        e.Logger,
		UserService:   userService,
		OrderService:  orderService,
		FCMClient:     messagingClient,
		InfobipClient: infobipClient,
	}
	app := Application{
		handler: h,
		logger:  e.Logger,
		server:  e,
	}

	app.routes(h)
	fmt.Println(app)

	// Читаем PORT (стандарт Render), либо APP_PORT, либо 8080 по умолчанию
	port := os.Getenv("PORT")
	if port == "" {
		port = os.Getenv("APP_PORT")
	}
	if port == "" {
		port = "8080"
	}

	// Обязательно 0.0.0.0 для работы внутри облака
	appAddress := fmt.Sprintf("0.0.0.0:%s", port)
	e.Logger.Fatal(e.Start(appAddress))
}