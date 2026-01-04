
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  // Pass-through for online-only app
  event.respondWith(fetch(event.request));
});
