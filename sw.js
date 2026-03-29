// J&M Steel Service Worker
const CACHE = 'jandmsteel-v1';
const ASSETS = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;900&family=Barlow:wght@300;400;500;600&display=swap'
];

// Install — cache core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache for the app shell
// Always go network-first for Supabase API calls so data is always live
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always fetch Supabase calls live — never cache API data
  if(url.hostname.includes('supabase.co')){
    e.respondWith(fetch(e.request));
    return;
  }

  // Network first for everything else, cache as fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache a copy of successful responses
        if(res && res.status === 200 && e.request.method === 'GET'){
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
