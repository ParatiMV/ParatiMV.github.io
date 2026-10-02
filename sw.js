const V = 'regalo-v3';
const SHELL = ['./', 'index.html', 'style.css', 'script.js', 'config.js', 'manifest.json',
  'assets/icon-192.png', 'assets/icon-512.png', 'assets/apple-touch-icon.png', 'assets/artist.jpg'];
// 'reload' evita que la caché HTTP de GitHub Pages nos devuelva archivos viejos.
self.addEventListener('install', e => e.waitUntil(
  caches.open(V).then(c => Promise.allSettled(SHELL.map(u => c.add(new Request(u, { cache: 'reload' }))))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  // El vídeo/audio no pasan por el SW (Safari exige peticiones Range).
  if (r.method !== 'GET' || u.origin !== location.origin || r.headers.has('range') || /\.(mp4|webm|mp3)$/.test(u.pathname)) return;
  // Red primero (siempre la última versión); la caché solo si no hay conexión.
  e.respondWith(fetch(r.url, { cache: 'no-cache' }).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(r.url, copy)); }
    return res;
  }).catch(() => caches.match(r.url, { ignoreSearch: true }).then(h => h || caches.match('index.html'))));
});
