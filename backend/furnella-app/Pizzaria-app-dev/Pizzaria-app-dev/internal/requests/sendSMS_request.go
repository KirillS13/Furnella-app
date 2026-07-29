package requests

type SMSRequest struct {
	PhoneNumber string `query:"phone" validate:"required" json:"phoneNumber"`
}
