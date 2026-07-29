package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"myapp/common"
	"myapp/internal/model"
	"myapp/internal/requests"
	"net/http"
	"os"

	"github.com/labstack/echo/v4"
)

func (h Handler) RegisterHandler(c echo.Context) error {
	payload := new(requests.RegisterRequest)
	if err := c.Bind(payload); err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}

	validationErrors := h.ValidateBodyRequest(c, payload)
	if validationErrors != nil {
		return c.JSON(http.StatusUnprocessableEntity, validationErrors)
	}

	isEmailTaken, err := h.UserService.IsEmailTaken(c.Request().Context(), payload.Email)
	if err != nil {
		return c.JSON(http.StatusUnprocessableEntity, err.Error())
	}
	if isEmailTaken {
		return c.JSON(http.StatusBadRequest, "Email already taken")
	}
	registeredUser, err := h.UserService.RegisterUser(c.Request().Context(), payload)
	if err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}

	return c.JSON(http.StatusOK, registeredUser)
}

func (h Handler) LoginHandler(c echo.Context) error {
	payload := new(requests.LoginRequest)
	if err := c.Bind(payload); err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}

	validationErrors := h.ValidateBodyRequest(c, payload)
	if validationErrors != nil {
		return c.JSON(http.StatusUnprocessableEntity, validationErrors)
	}

	key := os.Getenv("FIREBASE_API_KEY")
	url := fmt.Sprintf("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=%s", key)

	data := map[string]interface{}{
		"email":           payload.Email,
		"password":        payload.Password,
		"returnSecureKey": true,
	}
	jsonData, err := json.Marshal(data)
	if err != nil {
		return c.JSON(http.StatusUnprocessableEntity, err.Error())
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return c.JSON(http.StatusUnprocessableEntity, err.Error())
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return c.JSON(http.StatusUnprocessableEntity, err.Error())
	}

	if resp.StatusCode != http.StatusOK {
		return c.JSON(http.StatusUnauthorized, map[string]string{
			"error": "Invalid email or password",
		})
	}

	var result model.FirebaseLoginResponse
	if err = json.Unmarshal(body, &result); err != nil {
		return err
	}

	response := common.LoginResponse{
		TokenID:      result.IDToken,
		RefreshToken: result.RefreshToken,
		LocalID:      result.LocalID,
		Email:        result.Email,
		Registered:   result.Registered,
	}
	return common.SendSuccessResponse(c, "User logged in", &response)
}
