    // sw.js - Service Worker voor VoiceSum PWA

const CACHE_NAME = 'voicesum-cache-v1';

// Bestanden om te cachen voor offline gebruik
const FILES_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

// Service Worker installeren
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  // Cache vooraf vullen met essentiële bestanden
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Pre-caching app shell');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        // Force activation zonder te wachten op vernieuwen van browser
        return self.skipWaiting();
      })
  );
});

// Service Worker activeren en oude caches opruimen
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  // Oude caches verwijderen
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
    .then(() => {
      // Zorg ervoor dat de Service Worker direct controle neemt over alle clients
      return self.clients.claim();
    })
  );
});

// Netwerkverzoeken afhandelen met cache-first strategie
self.addEventListener('fetch', (event) => {
  // Alleen GET-verzoeken cachen
  if (event.request.method !== 'GET') return;
  
  // API-verzoeken en audio-uploads niet cachen
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('/process-audio')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone het verzoek, want het kan maar één keer worden gebruikt
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then((response) => {
          // Controleer of we een geldige response hebben
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone de response want het kan maar één keer worden gebruikt
          const responseToCache = response.clone();
          
          // Open cache en sla response op
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        })
        .catch(() => {
          // Als het netwerk faalt en we een pagina niet kunnen laden,
          // toon dan een offline-pagina voor navigatieverzoeken
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          
          // Voor afbeeldingen, toon een offline placeholder
          if (event.request.destination === 'image') {
            return new Response('Image not available offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          }
        });
      })
  );
});