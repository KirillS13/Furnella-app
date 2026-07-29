package common

import (
"context"
"log"
"os"
"path/filepath"
"sync"

"cloud.google.com/go/firestore"
firebase "firebase.google.com/go/v4"
"google.golang.org/api/option"
)

var (
app      *firebase.App
fsClient *firestore.Client
appOnce  sync.Once
)

func initFirebase() {
var opt option.ClientOption

// 1. Если содержимый JSON передан прямо в переменную окружения FIREBASE_KEY_JSON
if keyData := os.Getenv("FIREBASE_KEY_JSON"); keyData != "" {
opt = option.WithCredentialsJSON([]byte(keyData))
} else {
// 2. Ищем секретный файл в возможных местах
serviceAccountPath := os.Getenv("FIREBASE_KEY_PATH")

if serviceAccountPath == "" {
// Перебираем стандартные пути для Render и локальной разработки
possiblePaths := []string{
"/etc/secrets/firebase-key.json",
"/etc/secrets/firebase-key",
}

// Ищем любой .json файл в папке /etc/secrets/ на Render
if files, err := filepath.Glob("/etc/secrets/*.json"); err == nil && len(files) > 0 {
possiblePaths = append([]string{files[0]}, possiblePaths...)
}

for _, p := range possiblePaths {
if _, err := os.Stat(p); err == nil {
serviceAccountPath = p
break
}
}
}

// Fallback для локальной разработки
if serviceAccountPath == "" {
serviceAccountPath = "Credentials/furnella-46cj2b-firebase-adminsdk-fbsvc-4f27d73e98.json"
}

opt = option.WithCredentialsFile(serviceAccountPath)
}

var err error
config := &firebase.Config{
ProjectID: "furnella-46cj2b",
}
app, err = firebase.NewApp(context.Background(), config, opt)
if err != nil {
log.Fatalf("error initializing app: %v", err)
}

fsClient, err = app.Firestore(context.Background())
if err != nil {
log.Fatalf("error initializing Firestore client: %v", err)
}
}

func GetFirestore() *firestore.Client {
appOnce.Do(initFirebase)
return fsClient
}

func GetApp() *firebase.App {
appOnce.Do(initFirebase)
return app
}
