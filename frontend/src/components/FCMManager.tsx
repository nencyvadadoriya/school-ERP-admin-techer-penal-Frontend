import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationAPI } from '../services/api';
import { requestForToken, onMessageListener } from '../firebase';
import { toast } from 'react-toastify';

const FCMManager: React.FC = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      handleToken();
    }
  }, [user]);

  useEffect(() => {
    const unsubscribe = onMessageListener().then((payload: any) => {
      console.log('Received foreground message:', payload);
      toast.info(
        <div>
          <strong>{payload.notification?.title}</strong>
          <div>{payload.notification?.body}</div>
        </div>
      );
    }).catch(err => console.log('failed: ', err));

    // For background messages, the service worker handles it.
  }, []);

  const handleToken = async () => {
    try {
      const token = await requestForToken();
      if (token && user) {
        // Map roles to API endpoints
        let rolePath = user.role;
        if (rolePath === 'sub_admin') rolePath = 'admin';
        
        await notificationAPI.updateFCMToken(token, rolePath);
        console.log('FCM token updated on backend');
      }
    } catch (error) {
      console.error('Error handling FCM token:', error);
    }
  };

  return null;
};

export default FCMManager;
