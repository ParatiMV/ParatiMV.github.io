const V = 'regalo-v8';
const SHELL = ['./', 'index.html', 'style.css', 'script.js', 'config.js', 'manifest.json',
  'assets/icon-192.png', 'assets/icon-512.png', 'assets/apple-touch-icon.png', 'assets/artist.jpg'];
self.addEventListener('install', e => e.waitUntil(
  caches.open(V).then(c => Promise.allSettled(SHELL.map(u => c.add(new Request(u, { cache: 'reload' }))))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || r.headers.has('range') || /\.(mp4|webm|mp3)$/.test(u.pathname)) return;
  e.respondWith(fetch(r.url, { cache: 'no-cache' }).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(r.url, copy)); }
    return res;
  }).catch(() => caches.match(r.url, { ignoreSearch: true }).then(h => h || caches.match('index.html'))));
});
