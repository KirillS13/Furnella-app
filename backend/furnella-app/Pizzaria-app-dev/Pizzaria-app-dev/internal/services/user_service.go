package services

import (
	"context"
	"fmt"
	"myapp/internal/model"
	"myapp/internal/requests"

	"cloud.google.com/go/firestore"
	"firebase.google.com/go/v4/auth"
)

type UserService struct {
	Fs   *firestore.Client
	auth *auth.Client
}

func NewUserService(db *firestore.Client, authClient *auth.Client) *UserService {
	return &UserService{
		Fs:   db,
		auth: authClient,
	}
}

func (userService *UserService) RegisterUser(ctx context.Context, request *requests.RegisterRequest) (*model.UserModel, error) {
	params := (&auth.UserToCreate{}).Email(request.Email).Password(request.Password).DisplayName(request.Username)

	u, err := userService.auth.CreateUser(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}
	if err = userService.SaveFCMToken(ctx, u.UID, request.FcmToken); err != nil {
		userService.auth.DeleteUser(context.Background(), u.UID)
		return nil, fmt.Errorf("failed to save fcm token: %w", err)
	}
	user := &model.UserModel{
		ID:                  u.UID,
		Username:            request.Username,
		Email:               request.Email,
		PhoneNumber:         "",
		PhoneNumberVerified: false,
		FcmToken:            request.FcmToken,
	}

	_, err = userService.Fs.Collection("Users").Doc(u.UID).Set(ctx, user)
	if err != nil {
		userService.auth.DeleteUser(context.Background(), u.UID)
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}

func (userService *UserService) IsEmailTaken(ctx context.Context, email string) (bool, error) {
	query := userService.Fs.Collection("Users").Where("Email", "==", email).Limit(1)
	doc, err := query.Documents(ctx).GetAll()
	if err != nil {
		return false, fmt.Errorf("failed to query firestore: %w", err)
	}

	if len(doc) == 0 {
		return false, nil
	}

	return true, nil
}

func (userService *UserService) GetUserByID(ctx context.Context, id string) (*model.UserModel, error) {
	query, err := userService.Fs.Collection("Users").Doc(id).Get(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to query user: %w", err)
	}
	if !query.Exists() {
		return nil, fmt.Errorf("user does not exist")
	}

	var user model.UserModel
	if err = query.DataTo(&user); err != nil {
		return nil, fmt.Errorf("failed to unmarshal user: %w", err)
	}
	return &user, nil
}
