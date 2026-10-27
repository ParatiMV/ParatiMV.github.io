const V = 'regalo-v24';
const PREFIX = 'regalo-';
const SHELL = ['./', 'index.html', 'style.css?v=24', 'script.js?v=24',
  'config.js?v=24', 'manifest.json'];
const OPTIONAL = ['assets/icon-192.png', 'assets/icon-512.png', 'assets/apple-touch-icon.png'];
self.addEventListener('install', e => e.waitUntil((async () => {
  const c = await caches.open(V);
  await c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })));
  await Promise.allSettled(OPTIONAL.map(u => c.add(u)));
  // Activate naturally after old clients close, avoiding mixed app versions.
})()));
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const key of await caches.keys()) {
    if (key.startsWith(PREFIX) && key !== V) await caches.delete(key);
  }
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin ||
      r.headers.has('range') || /\.(mp4|webm|mp3|jpg|jpeg)$/i.test(u.pathname)) return;
  const allowed = new Set([...SHELL, ...OPTIONAL].map(p => new URL(p, self.registration.scope).pathname));
  if (r.mode !== 'navigate' && !allowed.has(u.pathname)) return;
  e.respondWith((async () => {
    const c = await caches.open(V);
    try {
      const response = await fetch(r);
      if (response.ok) {
        const copy = response.clone();
        e.waitUntil(c.put(r, copy));
      }
      return response;
    } catch (_) {
      const cached = await c.match(r);
      if (cached) return cached;
      if (r.mode === 'navigate') return (await c.match(new URL('index.html', self.registration.scope))) || Response.error();
      return Response.error();
    }
  })());
});

