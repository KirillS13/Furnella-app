// 1. Подгружаем фоновые скрипты самого Firebase
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// 2. Вставь сюда данные своего приложения из консоли Firebase (как в firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyDGC1Np-3KhD2rt6QwQhHaiD0E47RxYxQ0",
  authDomain: "furnella-46cj2b.firebaseapp.com",
  databaseURL: "https://furnella-46cj2b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "furnella-46cj2b",
  storageBucket: "furnella-46cj2b.firebasestorage.app",
  messagingSenderId: "16169752417",
  appId: "1:16169752417:web:e3b36064cb4077cae45720"
};

// 3. Инициализируем фоновое приложение
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// 4. Этот обработчик будет срабатывать, когда прилетит пуш при закрытой вкладке
messaging.onBackgroundMessage((payload) => {
  console.log('Получено фоновое уведомление: ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // иконка сайта
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});