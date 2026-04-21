self.addEventListener('push', (event) => {
  console.log('Push received:', event);
  let data = {};
  try {
    data = event.data.json();
    console.log('Push data:', data);
  } catch (e) {
    console.error('Error parsing push data:', e);
    data = { title: 'Notification', body: event.data.text() };
  }
  const options = {
    body: data.body,
    icon: data.icon || '/logo.jpg',
    badge: '/logo.jpg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
