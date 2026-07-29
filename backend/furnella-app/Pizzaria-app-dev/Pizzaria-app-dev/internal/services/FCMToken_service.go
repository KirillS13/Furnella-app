package services

import (
	"context"
	"fmt"

	"cloud.google.com/go/firestore"
)

func (userService *UserService) SaveFCMToken(ctx context.Context, userID, fcmToken string) error {

	_, err := userService.Fs.Collection("Users").Doc(userID).Set(ctx, map[string]interface{}{
		"fcmToken": fcmToken,
	}, firestore.MergeAll)
	if err != nil {
		return fmt.Errorf("failed to save fcm token: %w", err)
	}

	return err
}

func (userService *UserService) GetAllFCMTokens(ctx context.Context, limit int, lastDoc *firestore.DocumentSnapshot) ([]string, *firestore.DocumentSnapshot, int, error) {
	query := userService.Fs.Collection("Users").Select("fcmToken").Limit(limit)

	if lastDoc != nil {
		query = query.StartAfter(lastDoc)
	}

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		return nil, nil, 0, err
	}
	docsCount := len(docs)

	if len(docs) == 0 {
		return nil, nil, 0, nil
	}
	var fcmTokens []string

	for _, doc := range docs {
		if token, err := doc.DataAt("fcmToken"); err == nil {
			if str, ok := token.(string); ok && str != "" {
				fcmTokens = append(fcmTokens, str)
			}
		}
	}

	lastDoc = docs[len(docs)-1]

	return fcmTokens, lastDoc, docsCount, nil
}
