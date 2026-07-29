package handlers

import (
	"context"
	"errors"
	"fmt"
	"myapp/internal/model"
	requests2 "myapp/internal/requests"
	"net/http"
	"time"

	"myapp/common"

	"github.com/infobip-community/infobip-api-go-sdk/v3/pkg/infobip/models"
	"github.com/labstack/echo/v4"
	"github.com/labstack/gommon/random"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var allCodes = map[string]string{}

func (h Handler) SendSMS(c echo.Context) error {
	ctx := c.Request().Context()

	request := new(requests2.SMSRequest)
	if err := c.Bind(request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	validationErrors := h.ValidateBodyRequest(c, request)
	if validationErrors != nil {
		return c.JSON(http.StatusBadRequest, validationErrors)
	}
	docRef := h.UserService.Fs.Collection("SmsCodes").Doc(request.PhoneNumber)
	doc, err := docRef.Get(ctx)
	if err == nil && doc.Exists() {
		return c.JSON(http.StatusAlreadyReported, "Sms has already been sent")
	}

	code := random.String(5, random.Numeric)

	msg := models.SMSMsg{
		Destinations: []models.SMSDestination{
			{To: request.PhoneNumber},
		},
		From: "447491163443",
		Text: fmt.Sprintf("Code: %s", code),
	}
	req := models.SendSMSRequest{
		Messages: []models.SMSMsg{msg},
	}

	resp, _, err := h.InfobipClient.SMS.Send(ctx, req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, err.Error())
	}

	SmsData := model.SmsModel{
		PhoneNumber: request.PhoneNumber,
		Code:        code,
		ExpiredAt:   time.Now().Add(time.Minute * 20),
	}
	_, err = docRef.Set(ctx, SmsData)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, "failed to save sms data")
	}

	return common.SendSuccessResponse(c, "Message sent successfully", resp)
}

var ErrSmsAlreadySent = errors.New("sms already sent")

func (h Handler) SendMessage(ctx context.Context, phoneNumber string) error {

	docRef := h.UserService.Fs.Collection("SmsCodes").Doc(phoneNumber)
	doc, err := docRef.Get(ctx)
	if err == nil && doc.Exists() {
		return ErrSmsAlreadySent
	}
	code := random.String(5, random.Numeric)

	msg := models.SMSMsg{
		Destinations: []models.SMSDestination{
			{To: phoneNumber},
		},
		From: "447491163443",
		Text: fmt.Sprintf("Code: %s", code),
	}

	req := models.SendSMSRequest{
		Messages: []models.SMSMsg{msg},
	}

	_, _, err = h.InfobipClient.SMS.Send(ctx, req)
	if err != nil {
		return err
	}

	SmsData := model.SmsModel{
		PhoneNumber: phoneNumber,
		Code:        code,
		ExpiredAt:   time.Now().Add(time.Minute * 20),
	}
	_, err = docRef.Set(ctx, SmsData)
	fmt.Println(code)

	return nil
}

func (h Handler) VerifyCode(c echo.Context) error {
	ctx := c.Request().Context()
	request := new(requests2.VerifyCodeRequest)
	if err := c.Bind(request); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	phone := request.PhoneNumber
	if phone != "" && phone[0] != '+' {
		phone = "+" + phone
	}

	docRef := h.UserService.Fs.Collection("SmsCodes").Doc(phone)
	doc, err := docRef.Get(ctx)
	if err != nil {
		if status.Code(err) == codes.NotFound {
			return c.JSON(http.StatusNotFound, "SMS code not found or expired")
		}
		return c.JSON(http.StatusInternalServerError, err.Error())
	}

	var storedCode model.SmsModel
	err = doc.DataTo(&storedCode)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, fmt.Sprintf("DataTo error: %v", err))
	}

	fmt.Printf("REQUEST phone='%s' code='%s'\n", request.PhoneNumber, request.Code)
	fmt.Printf("STORED code='%s'\n", storedCode.Code)

	// Проверка срока действия кода напрямую (БЕЗ time.Parse)
	if time.Now().After(storedCode.ExpiredAt) {
		_, _ = docRef.Delete(ctx)
		return c.JSON(http.StatusBadRequest, "Code has expired")
	}

	if storedCode.Code == request.Code {
		_, err = h.OrderService.CreateOrder(ctx, &request.Order)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": err.Error(),
			})
		}

		// После успешного создания заказа удаляем использованный СМС-код из базы
		_, _ = docRef.Delete(ctx)

		responseUser := map[string]interface{}{
			"id":                  request.Order.UserID, // или реальный ID из сессии/базы
			"name":                request.Order.Name,
			"phoneNumber":         phone,
			"phoneNumberVerified": true,
			"role":                "user",
		}

		return c.JSON(http.StatusOK, responseUser)
	}

	return c.JSON(http.StatusBadRequest, "Code is not correct")
}
