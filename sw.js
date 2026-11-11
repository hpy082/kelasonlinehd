/* Service worker Portal Belajar Spendas
   - Berkas statis: cache-first + pembaruan di latar (stale-while-revalidate) → buka instan
   - Panggilan API Apps Script, login Google, & CDN ekspor: SELALU lewat jaringan (tidak pernah di-cache)
   Naikkan VERSI setiap kali merilis perubahan frontend. */
const VERSI = 'spendas-v1.0.0';
const ASET = ['./', './index.html', './manifest.json', './css/app.css', './js/config.js', './js/icons.js', './js/core.js', './js/app.js',
  './js/v-siswa.js', './js/v-guru.js', './js/v-admin.js', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png', './icons/apple-touch-icon.png', './icons/favicon-48.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSI).then(c => c.addAll(ASET)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSI).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;                                         // POST API → jaringan langsung
  if (url.origin !== self.location.origin) return;                          // script.google.com, googleusercontent, GIS, CDN, font → jaringan
  if (url.searchParams.has('action')) return;
  e.respondWith(caches.open(VERSI).then(async cache => {
    const ada = await cache.match(req, { ignoreSearch: true });
    const segar = fetch(req).then(res => { if (res && res.ok && res.type === 'basic') cache.put(req, res.clone()); return res; }).catch(() => ada);
    return ada || segar;
  }));
});
