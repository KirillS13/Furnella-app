package handlers

import (
	"errors"
	"fmt"
	"myapp/common"
	"myapp/internal/requests"
	"net/http"

	"github.com/labstack/echo/v4"
)

func (h Handler) OrderHandler(c echo.Context) error {
	ctx := c.Request().Context()
	payload := new(requests.OrderRequest)
	if err := c.Bind(payload); err != nil {
		return c.JSON(http.StatusBadRequest, "Failed to bind payload")
	}

	validationErrors := h.ValidateBodyRequest(c, payload)
	if len(validationErrors) > 0 {
		return c.JSON(http.StatusBadRequest, validationErrors)
	}
	user, err := h.UserService.GetUserByID(ctx, payload.UserID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]string{
			"error": fmt.Sprintf("Not found %s", payload.UserID),
		})

	}
	isNotVerified := !user.PhoneNumberVerified
	phoneChanged := user.PhoneNumberVerified == true && user.PhoneNumber != payload.PhoneNumber
	if isNotVerified || phoneChanged {
		err = h.SendMessage(ctx, payload.PhoneNumber)
		if err != nil {
			if errors.Is(err, ErrSmsAlreadySent) {
				return c.JSON(http.StatusAlreadyReported, map[string]string{
					"message": "Sms has already been sent",
				})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": err.Error(),
			})
		}

		return c.JSON(http.StatusCreated, map[string]string{
			"message": "Verified message was sent",
		})

	}
	builtOrder, err := h.OrderService.CreateOrder(ctx, payload)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": err.Error(),
		})
	}

	return common.SendSuccessResponse(c, "Order created successfully", builtOrder)
}

func (h Handler) GetAllPizzas(c echo.Context) error {
	ctx := c.Request().Context()

	menu, err := h.OrderService.GetMenu(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "failed to get menu" + err.Error(),
		})
	}
	return common.SendSuccessResponse(c, "МЕНЮ FURNELLA", menu)
}

func (h Handler) GetAllOrders(c echo.Context) error {
	ctx := c.Request().Context()

	err := h.OrderService.DeleteOldOrders(ctx)
	if err != nil {
		c.Logger().Error(err)
	}

	orders, err := h.OrderService.GetOrders(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{})
	}

	return common.SendSuccessResponse(c, "ЗАКАЗЫ FURNELLA", orders)
}

func (h Handler) ChangeOrderStatus(c echo.Context) error {
	ctx := c.Request().Context()

	orderID := c.Param("id")
	if orderID == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Order ID is required",
		})
	}

	payload := new(requests.ChangeStatusReq)
	if err := c.Bind(payload); err != nil {
		return c.JSON(http.StatusBadRequest, "failed to bind payload")
	}
	validationErrors := h.ValidateBodyRequest(c, payload)
	if len(validationErrors) > 0 {
		return c.JSON(http.StatusBadRequest, validationErrors)
	}

	updatedOrder, err := h.OrderService.UpdateOrderStatus(ctx, orderID, payload.Status, &h.InfobipClient)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err)
	}

	return common.SendSuccessResponse(c, "Order status updated successfully", updatedOrder)
}
