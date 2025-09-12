// Service Worker for PWA
const CACHE_NAME = 'expense-guide-v1';
const urlsToCache = [
  '/web_ui/',
  '/web_ui/registration_step1.html',
  '/web_ui/registration_step2.html',
  '/web_ui/registration_step3.html',
  '/web_ui/style.css',
  '/web_ui/script.js',
  '/web_ui/manifest.json'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
