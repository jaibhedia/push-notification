// Service Worker for handling push notifications

// Firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Initialize Firebase (you'll need to replace with your config)
firebase.initializeApp({
     apiKey: "AIzaSyDPw68m3iVnPSub7K-hlcIX3kUyyzo4ya0",
  authDomain: "notification-a480a.firebaseapp.com",
  projectId: "notification-a480a",
  storageBucket: "notification-a480a.firebasestorage.app",
  messagingSenderId: "425827070698",
  appId: "1:425827070698:web:d77d77854ab2e5ae051d93"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('Received background message: ', payload);

    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon || '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: 'push-notification',
        requireInteraction: true,
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/action-view.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/action-dismiss.png'
            }
        ],
        data: payload.data
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Notification click received:', event);

    event.notification.close();

    if (event.action === 'view') {
        // Handle view action
        const clickAction = event.notification.data?.click_action || '/';
        event.waitUntil(
            clients.openWindow(clickAction)
        );
    } else if (event.action === 'dismiss') {
        // Handle dismiss action
        console.log('Notification dismissed by user');
    } else {
        // Handle default click
        const clickAction = event.notification.data?.click_action || '/';
        event.waitUntil(
            clients.matchAll({ type: 'window' }).then((clientList) => {
                for (const client of clientList) {
                    if (client.url === clickAction && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(clickAction);
                }
            })
        );
    }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
    console.log('Notification closed:', event);
});

// Cache management for offline functionality
const CACHE_NAME = 'push-notification-mvp-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/app.js',
    '/config.js',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});
