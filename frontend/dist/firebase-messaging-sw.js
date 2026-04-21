importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Get your Firebase config from the Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyBA43Q__esgbfUdZzan4B_641QoOfQSEmE",
  authDomain: "school-erp-70d71.firebaseapp.com",
  projectId: "school-erp-70d71",
  storageBucket: "school-erp-70d71.firebasestorage.app",
  messagingSenderId: "615546692815",
  appId: "1:615546692815:web:5be6e3ac5b6b85d1f943ba",
  measurementId: "G-TE20144QET"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.jpg'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
