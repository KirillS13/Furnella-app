import { initializeApp } from 'firebase/app'
import { getMessaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "AIzaSyDGC1Np-3KhD2rt6QwQhHaiD0E47RxYxQ0",
  authDomain: "furnella-46cj2b.firebaseapp.com",
  databaseURL: "https://furnella-46cj2b-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "furnella-46cj2b",
  storageBucket: "furnella-46cj2b.firebasestorage.app",
  messagingSenderId: "16169752417",
  appId: "1:16169752417:web:e3b36064cb4077cae45720"
};

export const firebaseApp = initializeApp(firebaseConfig)
export const messaging = typeof window !== 'undefined' ? getMessaging(firebaseApp) : null