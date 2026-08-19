const CACHE = 'alameer-brand-v6';
const RUNTIME_CACHE = 'alameer-runtime-v1';

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './config.js',
  './manifest.webmanifest',
  './assets/logo.png',
  './assets/placeholder.svg',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE && key !== RUNTIME_CACHE)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isSheetRequest(url){
  return url.hostname.includes('docs.google.com') ||
         url.hostname.includes('googleusercontent.com');
}

function sheetCacheKey(request){
  const url = new URL(request.url);
  url.searchParams.delete('_');
  return new Request(url.toString(), {
    method: 'GET',
    headers: request.headers,
    mode: request.mode,
    credentials: request.credentials,
    redirect: request.redirect
  });
}

async function staleWhileRevalidate(request, cacheKey = request){
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(cacheKey);

  const networkPromise = fetch(request)
    .then(response => {
      if(response && (response.ok || response.type === 'opaque')){
        cache.put(cacheKey, response.clone()).catch(() => {});
      }
      return response;
    });

  if(cached){
    networkPromise.catch(() => {});
    return cached;
  }

  return networkPromise;
}

self.addEventListener('fetch', event => {
  const request = event.request;

  if(request.method !== 'GET') return;

  const url = new URL(request.url);

  // بيانات Google Sheets: تجاهل معامل كسر الكاش (_=timestamp)
  // واعرض آخر نسخة فوراً، ثم حدّثها في الخلفية.
  if(isSheetRequest(url)){
    event.respondWith(
      staleWhileRevalidate(request, sheetCacheKey(request))
        .catch(() => caches.match(sheetCacheKey(request)))
    );
    return;
  }

  // صور المنتجات الخارجية: اعرض الصورة المحفوظة فوراً إن وجدت.
  if(request.destination === 'image'){
    event.respondWith(
      staleWhileRevalidate(request)
        .catch(() => caches.match('./assets/logo.png'))
    );
    return;
  }

  // ملفات المتجر الأساسية: Cache First لتسريع فتح التطبيق.
  if(url.origin === self.location.origin){
    event.respondWith(
      caches.match(request)
        .then(cached => cached || fetch(request).then(response => {
          if(response && response.ok){
            const copy = response.clone();
            caches.open(CACHE).then(cache => cache.put(request, copy));
          }
          return response;
        }))
        .catch(() => caches.match('./index.html'))
    );
  }
});
