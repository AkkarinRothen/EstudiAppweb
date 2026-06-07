const CACHE_NAME = 'estudiapp-v20260607072806';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './assets/css/theme.css',
    './assets/css/ui-portal.css',
    './assets/css/ui-explorer.css',
    './assets/css/ui-modal.css',
    './js/main.js',
    './js/modules/state.js',
    './js/modules/storage.js',
    './js/modules/srs.js',
    './js/modules/utils.js',
    './js/modules/fx.js',
    './js/modules/decks-page.js',
    './js/modules/ui-launchpad.js',
    './js/modules/ui-streak.js',
    './js/modules/ui-gamification.js',
    './data/packs.json',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Orbitron:wght@700;900&display=swap'
];

// Install Event: Cache core assets
self.addEventListener('install', (event) => {
    self.skipWaiting(); // Force the waiting service worker to become the active service worker
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
});

// Fetch Event: Serve from cache, then network
self.addEventListener('fetch', (event) => {
    // Skip external API calls or Supabase
    if (event.request.url.includes('supabase.co')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then((networkResponse) => {
                // Cache new assets dynamically (if they are internal)
                if (networkResponse.status === 200 && event.request.url.startsWith(self.location.origin)) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return networkResponse;
            });
        })
    );
});
