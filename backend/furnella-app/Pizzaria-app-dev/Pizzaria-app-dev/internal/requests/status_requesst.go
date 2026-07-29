package requests

type ChangeStatusReq struct {
	Status string `json:"status" validate:"required"`
}
