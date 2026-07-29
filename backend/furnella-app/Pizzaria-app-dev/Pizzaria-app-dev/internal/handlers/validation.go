package handlers

import (
	"fmt"
	"myapp/common"
	"reflect"
	"strconv"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
)

func (h Handler) ValidateBodyRequest(c echo.Context, payload interface{}) []common.ValidationError {
	validate := validator.New(validator.WithRequiredStructEnabled())
	var errors []common.ValidationError

	err := validate.Struct(payload)
	validationErrors, ok := err.(validator.ValidationErrors)

	// --- кастомная проверка телефона, выполняется всегда ---
	reflected := reflect.ValueOf(payload)
	if reflected.Kind() == reflect.Ptr {
		reflected = reflected.Elem()
	}

	field := reflected.FieldByName("PhoneNumber")
	if field.IsValid() && field.Kind() == reflect.String {
		phone := field.String()
		start := 0
		if len(phone) != 12 || phone[0] != '+' {
			errors = append(errors, common.ValidationError{
				Error:     "Phone number is invalid",
				Key:       "phone number",
				Condition: "invalid_char",
			})
		} else {
			if len(phone) > 0 && phone[0] == '+' {
				start = 1
			}

			for i := start; i < len(phone); i++ {
				if !('0' <= phone[i] && phone[i] <= '9') {
					errors = append(errors, common.ValidationError{
						Error:     "Phone number contains invalid character",
						Key:       "phone number",
						Condition: "invalid_char",
					})
					break
				}
			}
		}

	}
	if ok {
		reflected := reflect.ValueOf(payload)
		if reflected.Kind() == reflect.Ptr {
			reflected = reflected.Elem()
		}

		for _, validationError := range validationErrors {
			field, _ := reflected.Type().FieldByName(validationError.StructField())

			key := field.Tag.Get("json")
			if key == "" {
				key = strings.ToLower(validationError.StructField())
			}

			condition := validationError.Tag()
			keyToTitleCase := strings.Replace(key, "_", " ", -1)
			param := validationError.Param()
			errMessage := keyToTitleCase + " field is " + condition

			switch condition {
			case "required":
				errMessage = keyToTitleCase + " is required"
			case "min":
				if _, err := strconv.Atoi(param); err == nil {
					errMessage = fmt.Sprintf("%s must be at least %s characters", keyToTitleCase, param)
				}
			case "email":
				errMessage = keyToTitleCase + " is invalid email address"
			case "eqfield":
				errMessage = keyToTitleCase + " must be equal to " + strings.ToLower(param)
			}

			currentValidationError := common.ValidationError{
				Error:     errMessage,
				Key:       keyToTitleCase,
				Condition: condition,
			}

			errors = append(errors, currentValidationError)
		}
	}

	return errors
}
