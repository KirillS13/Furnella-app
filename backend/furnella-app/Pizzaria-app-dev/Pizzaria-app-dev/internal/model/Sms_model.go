package model

import "time"

type SmsModel struct {
	PhoneNumber string    `firestore:"phoneNumber" json:"phoneNumber"`
	Code        string    `firestore:"code" json:"code"`
	ExpiredAt   time.Time `firestore:"expiredAt" json:"expiredAt"`
}
