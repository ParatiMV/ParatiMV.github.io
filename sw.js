const V = 'regalo-v2';
const SHELL = ['./', 'index.html', 'style.css', 'script.js', 'config.js', 'manifest.json',
  'assets/icon-192.png', 'assets/icon-512.png', 'assets/apple-touch-icon.png', 'assets/artist.jpg'];
self.addEventListener('install', e => e.waitUntil(
  caches.open(V).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  // El vídeo/audio no pasan por el SW (Safari exige peticiones Range).
  if (r.method !== 'GET' || u.origin !== location.origin || r.headers.has('range') || /\.(mp4|webm|mp3)$/.test(u.pathname)) return;
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(res => { if (res.ok) caches.open(V).then(c => c.put(r, res.clone())); return res; })
      .catch(() => hit || caches.match('index.html'));
    return hit || net;
  }));
});
