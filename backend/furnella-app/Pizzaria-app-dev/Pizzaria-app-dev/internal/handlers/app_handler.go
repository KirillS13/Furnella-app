package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

type Health struct {
	Status string `json:"status"`
}

func (h Handler) ServeHTTP(c echo.Context) error {
	status := Health{Status: "done"}
	return c.JSON(http.StatusOK, status)
}
