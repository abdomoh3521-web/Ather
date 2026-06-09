const CACHE_NAME = 'athar-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192x192.png',
  './background.mp4',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@400;500;700;800&display=swap'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) return caches.delete(cache);
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // تخطي الطلبات الخاصة بالصوتيات لأنها كبيرة جداً
  if (event.request.url.includes('.mp3')) return;

  // استراتيجية (Network First) لطلبات الـ API (القرآن والمواقيت)
  if (event.request.url.includes('api.alquran.cloud') || event.request.url.includes('api.aladhan.com') || event.request.url.includes('mp3quran.net/api')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, resClone));
          return response;
        })
        .catch(() => caches.match(event.request)) // في حالة انقطاع النت، يجلب من الكاش
    );
    return;
  }

  // الاستراتيجية العادية لباقي الملفات (Cache First)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        return networkResponse;
      });
    })
  );
});

// --- الأكواد الجديدة الخاصة بالإشعارات في الخلفية ---

// 1. استلام الإشعار (Push Event)
self.addEventListener('push', event => {
  let data = { title: 'منصة أَثَر', body: 'حان وقت وردك!', url: '/' };

  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body,
    icon: './icon-192x192.png',
    badge: './icon-192x192.png',
    vibrate: [200, 100, 200], // اهتزاز الهاتف
    data: { url: data.url }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// 2. التفاعل عند الضغط على الإشعار (Notification Click)
self.addEventListener('notificationclick', event => {
  event.notification.close(); // إغلاق الإشعار بعد الضغط عليه
  
  const targetUrl = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // التحقق مما إذا كان التطبيق مفتوحاً بالفعل للتركيز عليه
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // إذا كان التطبيق مغلقاً تماماً، قم بفتحه
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});