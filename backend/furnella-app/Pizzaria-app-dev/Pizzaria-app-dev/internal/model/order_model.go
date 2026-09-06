package model

import "time"

type OrderModel struct {
	Address     string       `json:"address" firestore:"address"`
	Dishes      []PizzaModel `json:"dishes" firestore:"dishes"`
	Name        string       `json:"name" firestore:"name"`
	OrderId     string       `json:"order_id" firestore:"orderId"`
	PhoneNumber string       `json:"phone_number" firestore:"phoneNumber"`
	PaymentMethod string     `json:"payment_method" firestore:"paymentMethod"`
	Price       int64        `json:"price" firestore:"price"`
	Status      string       `json:"status" firestore:"status"`
	UserUid     string       `json:"user_id" firestore:"userUid"`
	CreatedAt   time.Time    `json:"createdAt" firestore:"createdAt"`
}
