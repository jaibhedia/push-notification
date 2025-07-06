// Firebase configuration
// Replace these values with your Firebase project configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDPw68m3iVnPSub7K-hlcIX3kUyyzo4ya0",
  authDomain: "notification-a480a.firebaseapp.com",
  projectId: "notification-a480a",
  storageBucket: "notification-a480a.firebasestorage.app",
  messagingSenderId: "425827070698",
  appId: "1:425827070698:web:d77d77854ab2e5ae051d93",
};

// Backend API configuration
const API_BASE_URL = 'http://localhost:3000/api';

// VAPID key for web push (get this from Firebase Console)
const VAPID_KEY = "BAPw_g8Kowc4lgjVhViqi6U2yCVIdre1iWTe3JqLmT8c9wzmZ-XcxcCuGtLy4nYEPvBOrEZKN_MqWHl8iHZ_gjA";

// Export configuration
window.CONFIG = {
    firebaseConfig,
    API_BASE_URL,
    VAPID_KEY
};
