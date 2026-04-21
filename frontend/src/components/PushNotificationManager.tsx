import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';

const PushNotificationManager: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user && (user.role === 'teacher' || user.role === 'student')) {
      registerPush();
    }
  }, [user]);

  const registerPush = async () => {
    try {
      if (!('serviceWorker' in navigator)) return;

      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration.scope);

      // Check notification permission
      if (Notification.permission === 'denied') {
        console.warn('Notification permission denied by user');
        return;
      }

      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.warn('Notification permission not granted:', permission);
          return;
        }
      }

      let subscription = await registration.pushManager.getSubscription();
      console.log('Existing subscription:', subscription);

      if (!subscription) {
        const publicVapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        console.log('Using VAPID Key:', publicVapidKey);
        if (!publicVapidKey) {
          console.warn('VAPID public key not found');
          return;
        }

        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
          });
          console.log('New subscription created:', subscription);
        } catch (subError) {
          console.error('Failed to subscribe to push:', subError);
          return;
        }
      }

      await notificationAPI.subscribePush(subscription);
      console.log('Push subscription saved to backend');
    } catch (error) {
      console.error('Error registering push:', error);
    }
  };

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  return null;
};

export default PushNotificationManager;
