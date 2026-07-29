package requests

type VerifyCodeRequest struct {
	PhoneNumber string       `json:"phoneNumber"`
	Code        string       `json:"code"`
	Order       OrderRequest `json:"order"`
}
