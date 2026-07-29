package model

type UserModel struct {
	ID                  string `json:"id" firestore:"userId"`
	Username            string `json:"username" firestore:"username"`
	Email               string `json:"email" firestore:"email"`
	PhoneNumber         string `json:"phoneNumber" firestore:"phoneNumber"`
	PhoneNumberVerified bool   `json:"phone_number_verified" firestore:"phone_number_verified"`
	FcmToken            string `json:"fcm_token" firestore:"fcmToken"`
}
