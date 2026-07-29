package model

import (
	"context"

	"firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
)

type SendMessageDto struct {
	Notification NotificationModel `json:"notification"`
	To           *string           `json:"to"`
}
type NotificationModel struct {
	Title string `json:"title"`
	Body  string `json:"body"`
}

func (dto *SendMessageDto) ToMessage() *messaging.Message {
	msg := &messaging.Message{
		Notification: &messaging.Notification{
			Title: dto.Notification.Title,
			Body:  dto.Notification.Body,
		},
	}
	if dto.To == nil {
		msg.Topic = "chat"
	} else {
		msg.Token = *dto.To
	}
	return msg
}

func Send(ctx context.Context, app *firebase.App, dto SendMessageDto) (string, error) {
	client, err := app.Messaging(ctx)
	if err != nil {
		return "", err
	}
	msg := dto.ToMessage()
	return client.Send(ctx, msg)
}
