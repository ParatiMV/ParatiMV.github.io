const V = 'regalo-v27';
const PREFIX = 'regalo-';
const SHELL = ['./', 'index.html', 'manifest.json'];
self.addEventListener('install', e => e.waitUntil((async () => {
  const c = await caches.open(V);
  await c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })));
  await self.skipWaiting();
})()));
self.addEventListener('activate', e => e.waitUntil((async () => {
  for (const key of await caches.keys()) {
    if (key.startsWith(PREFIX) && key !== V) await caches.delete(key);
  }
  await self.clients.claim();
})()));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== self.location.origin || r.headers.has('range')) return;
  const allowed = new Set([...SHELL].map(p => new URL(p, self.registration.scope).pathname));
  if (r.mode !== 'navigate' && !allowed.has(u.pathname)) return;
  e.respondWith((async () => {
    const c = await caches.open(V);
    try {
      const response = await fetch(r);
      if (response.ok) e.waitUntil(c.put(r, response.clone()));
      return response;
    } catch (_) {
      const cached = await c.match(r) || await c.match(new URL('index.html', self.registration.scope));
      return cached || Response.error();
    }
  })());
});
