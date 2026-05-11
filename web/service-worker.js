// 簡易 Service Worker：static assets 採 cache-first，
// 讓 App 加到主畫面後可離線啟動。Tesseract.js 模型由 Tesseract 自行管理。

const CACHE = 'stimlig-v2';
const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'css/styles.css',
  'js/app.js',
  'js/categories.js',
  'js/parser.js',
  'js/classifier.js',
  'js/ocr.js',
  'js/storage.js',
  'js/format.js',
  'js/chart.js',
  'js/export.js',
  'icons/icon-192.svg',
  'icons/icon-512.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all(ASSETS.map((url) =>
        cache.add(url).catch((err) => console.warn('cache miss', url, err))
      ))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // 跨域資源（Tesseract CDN）走網路；同源資源走 cache-first。
  if (url.origin !== self.location.origin) return;

  // 只快取 GET。
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        // 跑時把新資源也丟進 cache。
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return res;
      });
    })
  );
});
