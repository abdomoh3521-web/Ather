const CACHE_NAME = 'athar-v1';
const urlsToCache = [
  './index.html',
  './manifest.json',
  // يمكنك إضافة مسارات الصور والأيقونات هنا
];

// تثبيت الـ Service Worker وتخزين الملفات
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// جلب الملفات من التخزين المؤقت عند غياب الإنترنت
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});