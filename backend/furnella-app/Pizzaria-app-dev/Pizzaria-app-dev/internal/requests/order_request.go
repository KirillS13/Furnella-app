package requests

import (
	"myapp/internal/model"
)

type OrderRequest struct {
	Address     string             `json:"address" validate:"required"`
	Dishes      []model.PizzaModel `json:"dishes" validate:"required,dive"`
	Name        string             `json:"name" validate:"required"`
	PhoneNumber string             `json:"phoneNumber" validate:"required"`
	Price       int64              `json:"price" validate:"required"`
	UserID      string             `json:"user_id" validate:"required"`
}
