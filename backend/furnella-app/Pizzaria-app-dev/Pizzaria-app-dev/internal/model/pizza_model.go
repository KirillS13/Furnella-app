package model

type PizzaModel struct {
	Description string `json:"description" firestore:"description"`
	Title       string `json:"title" firestore:"title"`
	Painter     string `json:"image" firestore:"painter"`
	Price       int64  `json:"price" firestore:"price"`
	Quantity    int64  `json:"quantity" firestore:"quantity"`
	Id          int64  `json:"id" firestore:"id"`
}
