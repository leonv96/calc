const cacheName = 'vat-q-v6';
const assets = ['./', './index.html'];

// Install and save assets into the cache
self.addEventListener('install', e => {
    e.waitUntil(
        caches.open(cacheName).then(cache => {
            return cache.addAll(assets);
        }).then(() => self.skipWaiting()) // Force the new version to take over instantly
    );
});

// Activate and clear out old cached versions automatically
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== cacheName) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Network-first strategy: Try the live internet first, fallback to cache if offline
self.addEventListener('fetch', e => {
    e.respondWith(
        fetch(e.request)
            .then(networkResponse => {
                // If we get a valid live response, clone it into the cache for next time we are offline
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(cacheName).then(cache => {
                        cache.put(e.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                // If the network fails (offline), load from phone memory immediately
                return caches.match(e.request);
            })
    );
});
