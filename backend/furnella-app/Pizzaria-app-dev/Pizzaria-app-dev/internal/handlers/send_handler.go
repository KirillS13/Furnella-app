package handlers

import (
	"myapp/common"
	"myapp/internal/model"
	"net/http"

	"cloud.google.com/go/firestore"
	"firebase.google.com/go/v4/messaging"
	"github.com/labstack/echo/v4"
)

func (h Handler) SendHandler(c echo.Context) error {
	payload := new(model.SendMessageDto)

	if err := c.Bind(payload); err != nil {
		return c.JSON(http.StatusBadRequest, err.Error())
	}
	validationErrors := h.ValidateBodyRequest(c, payload)
	if validationErrors != nil {
		return c.JSON(http.StatusBadRequest, validationErrors)
	}

	_, err := h.FCMClient.Send(c.Request().Context(), payload.ToMessage())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, "OK")
}

func (h Handler) BroadCast(c echo.Context) error {
	ctx := c.Request().Context()
	payload := new(model.SendMessageDto)

	if err := c.Bind(payload); err != nil {
		return err
	}
	validationErrors := h.ValidateBodyRequest(c, payload)
	if validationErrors != nil {
		return c.JSON(http.StatusBadRequest, validationErrors)
	}

	const batchSize = 500

	var (
		lastDoc        *firestore.DocumentSnapshot
		totalRecieved  int
		totalSuccessed int
		totalFailed    int
	)

	for {
		tokens, nextCursor, docsCount, err := h.UserService.GetAllFCMTokens(ctx, batchSize, lastDoc)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, err.Error())
		}

		if docsCount == 0 {
			break
		}
		if len(tokens) > 0 {
			multiMsg := &messaging.MulticastMessage{
				Tokens: tokens,
				Notification: &messaging.Notification{
					Title: payload.Notification.Title,
					Body:  payload.Notification.Body,
				},
			}
			br, err := h.FCMClient.SendMulticast(ctx, multiMsg)
			if err != nil {
				c.Logger().Errorf("Error sending multicast message: %v", err)
				totalFailed += len(tokens)
			} else {
				totalSuccessed += br.SuccessCount
				totalFailed += br.FailureCount
			}
			totalRecieved += len(tokens)
		}
		lastDoc = nextCursor
		if docsCount < batchSize {
			break
		}

	}
	if totalRecieved == 0 {
		return common.SendSuccessResponse(c, "No active fcmtokens found for broadcast", nil)
	}
	report := map[string]interface{}{
		"total_recieved_tokens":  totalRecieved,
		"total_failed_tokens":    totalFailed,
		"total_successed_tokens": totalSuccessed,
	}

	return common.SendSuccessResponse(c, "OK", report)
}
