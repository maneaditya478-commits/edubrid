// Service Worker for EduBridge PWA
const CACHE_NAME = 'edubridge-v3';
const urlsToCache = [
  './',
  './index.html',
  './home.html',
  './login.html',
  './register.html',
  './contact.html',
  './profile.html',
  './quiz.html',
  './notes.html',
  './mentor.html',
  './chat.html',
  './css/index.css',
  './css/home.css',
  './css/login.css',
  './css/register.css',
  './css/contact.css',
  './css/profile.css',
  './css/quiz.css',
  './css/notes.css',
  './css/mentor.css',
  './css/chat.css',
  './css/theme.css',
  './js/index.js',
  './js/home.js',
  './js/login.js',
  './js/register.js',
  './js/contact.js',
  './js/profile.js',
  './js/quiz.js',
  './js/notes.js',
  './js/mentor.js',
  './js/chat.js',
  './js/theme.js',
  './js/language.js',
  './translations/en.json',
  './translations/hi.json',
  './translations/mr.json',
  './manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch((error) => {
        console.error('Service Worker: Cache failed', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((response) => {
            // Don't cache non-GET requests or non-ok responses
            if (event.request.method !== 'GET' || !response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // If fetch fails and it's a navigation request, return offline page
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
  );
});

