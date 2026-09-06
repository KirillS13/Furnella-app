package services

import (
	"context"
	"myapp/internal/model"
	"myapp/internal/requests"
	"time"

	"cloud.google.com/go/firestore"
)

type OrderService struct {
	Fs *firestore.Client
	FcmClient *messaging.Client
}

func NewOrderService(db *firestore.Client, fcmClient *messaging.Client) *OrderService {
	return &OrderService{db, fcmClient}
}

func (orderService *OrderService) CreateOrder(ctx context.Context, request *requests.OrderRequest) (*model.OrderModel, error) {
	orderDocRef := orderService.Fs.Collection("Orders").NewDoc()
	userDocRef := orderService.Fs.Collection("Users").Doc(request.UserID)
	order := model.OrderModel{
		Address:     request.Address,
		Price:       request.Price,
		Dishes:      request.Dishes,
		PhoneNumber: request.PhoneNumber,
		Name:        request.Name,
		PaymentMethod: request.PaymentMethod,
		UserUid:     request.UserID,
		OrderId:     orderDocRef.ID,
		Status:      "PENDING",
		CreatedAt:   time.Now(),
	}

	err := orderService.Fs.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		userSnapshot, err := tx.Get(userDocRef)
		if err != nil {
			return err
		}

		var UserData model.UserModel
		if err = userSnapshot.DataTo(&UserData); err != nil {
			return err
		}
		UserData.PhoneNumberVerified = true
		UserData.PhoneNumber = request.PhoneNumber

		if err = tx.Set(userDocRef, &UserData); err != nil {
			return err
		}
		return tx.Create(orderDocRef, order)
	})
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (orderService *OrderService) GetMenu(ctx context.Context) ([]model.PizzaModel, error) {
	docs, err := orderService.Fs.Collection("Menus").Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	var menu []model.PizzaModel
	for _, doc := range docs {
		var pizza model.PizzaModel
		err = doc.DataTo(&pizza)
		if err != nil {
			continue
		}
		menu = append(menu, pizza)
	}
	return menu, nil
}

func (orderService *OrderService) GetOrders(ctx context.Context) (*[]model.OrderModel, error) {
	docs, err := orderService.Fs.Collection("Orders").Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	var orders []model.OrderModel
	for _, doc := range docs {
		var pizza model.OrderModel
		err = doc.DataTo(&pizza)
		if err != nil {
			continue
		}
		orders = append(orders, pizza)
	}
	return &orders, nil
}

func (orderService *OrderService) UpdateOrderStatus(ctx context.Context, orderId string, status string) (*model.OrderModel, error) {
	docRef := orderService.Fs.Collection("Orders").Doc(orderId)

	_, err := docRef.Update(ctx, []firestore.Update{
		{Path: "status", Value: status},
	})
	if err != nil {
		return nil, err
	}

	doc, err := orderService.Fs.Collection("Orders").Doc(orderId).Get(ctx)
	if err != nil {
		return nil, err
	}
	var updatedOrder model.OrderModel
	err = doc.DataTo(&updatedOrder)
	if err != nil {
		return nil, err
	}
	user, err := orderService.Fs.Collection("Users").Doc(updatedOrder.UserUid).Get(ctx)
	if err == nil {
		var userData model.UserModel
		if err = user.DataTo(&userData); err == nil && userData.FcmToken != "" {
			// Не забудь добавить в импорты:
// "firebase.google.com/go/v4/messaging"

		go func(fcmToken string, status string, orderId string) {
			// Формируем понятный текст для пользователя в зависимости от статуса
			var statusText string
			switch status {
			case "ACCEPTED":
				statusText = "Ваш заказ принят и уже готовится! 👨‍🍳"
			case "COOKING":
				statusText = "Пицца уже в печи! 🍕"
			case "ON_THE_WAY":
				statusText = "Курьер везёт ваш заказ! 🚗"
			case "DELIVERED":
				statusText = "Заказ доставлен. Приятного аппетита! 🎉"
			case "REJECTED":
				statusText = "К сожалению, ваш заказ был отклонён."
			default:
				statusText = "Статус вашего заказа изменился на: " + status
			}

			// Собираем сообщение FCM
			message := &messaging.Message{
				Token: fcmToken,
				Notification: &messaging.Notification{
					Title: "Furnella 🍕",
					Body:  statusText,
				},
				Data: map[string]string{
					"orderId": orderId,
					"status":  status,
				},
			}

			// Отправляем через FcmClient
			if orderService.FcmClient != nil {
				_, err := orderService.FcmClient.Send(context.Background(), message)
				if err != nil {
					// Логируем ошибку, если токен просрочен или невалиден
					println("Ошибка отправки Push:", err.Error())
				}
			}
		}(userData.FcmToken, updatedOrder.Status, updatedOrder.OrderId	)
		}
	}	

	return &updatedOrder, nil
}

func (orderService *OrderService) DeleteOldOrders(ctx context.Context) error {
	cutoffTime := time.Now().Add(-24 * time.Hour)

	docs, err := orderService.Fs.Collection("Orders").Where("createdAt", "<", cutoffTime).Documents(ctx).GetAll()
	if err != nil {
		return err
	}

	if len(docs) == 0 {
		return nil
	}

	batch := orderService.Fs.Batch()
	for _, doc := range docs {
		batch.Delete(doc.Ref)
	}
	_, err = batch.Commit(ctx)
	return err
}
