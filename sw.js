/* Service worker — Région du Gbôklè
   Coquille de l'application en cache, contenu en « réseau d'abord », hors-ligne géré. */
const V = 'gbokle-v1';
const SHELL = 'shell-' + V, RUNTIME = 'runtime-' + V;
const PAGES = ['index.html', 'institution.html', 'territoire.html', 'actualites.html', 'actualite.html', 'services.html', 'investir.html', 'contact.html', 'mentions-legales.html', 'offline.html'];
const PRECACHE = ['./'].concat(PAGES, ['css/style.css', 'js/site.js', 'data/contenu.json', 'manifest.webmanifest',
  'assets/logo.png', 'assets/logo-sm.png', 'assets/favicon.png', 'assets/icon-192.png', 'assets/img/hero-1.webp']);

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== SHELL && k !== RUNTIME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });

async function trim(name, max) {
  const c = await caches.open(name), ks = await c.keys();
  if (ks.length > max) await Promise.all(ks.slice(0, ks.length - max).map(k => c.delete(k)));
}
async function networkFirst(req, cacheName, opts) {
  try {
    const res = await fetch(req);
    if (res && res.ok) { const c = await caches.open(cacheName); c.put(req, res.clone()); }
    return res;
  } catch (err) {
    const hit = await caches.match(req, opts || {});
    if (hit) return hit;
    throw err;
  }
}
async function staleWhileRevalidate(req, cacheName) {
  const c = await caches.open(cacheName), hit = await c.match(req);
  const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) { c.put(req, res.clone()); trim(cacheName, 80); } return res; }).catch(() => hit);
  return hit || net;
}
async function cacheFirst(req, cacheName) {
  const hit = await caches.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && res.ok) { const c = await caches.open(cacheName); c.put(req, res.clone()); trim(cacheName, 80); }
  return res;
}

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  // Vidéos (requêtes partielles) : toujours le réseau
  if (req.headers.has('range') || /\.mp4$/i.test(url.pathname)) return;
  // Espace admin et envoi du formulaire : jamais en cache
  if (/\/admin\/|contact\.php/.test(url.pathname)) return;

  if (url.origin !== location.origin) {
    if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(staleWhileRevalidate(req, RUNTIME));
    return;
  }
  if (req.mode === 'navigate') {
    e.respondWith(networkFirst(req, SHELL, { ignoreSearch: true }).catch(() => caches.match('offline.html')));
    return;
  }
  if (/data\/contenu\.json$/.test(url.pathname)) { e.respondWith(networkFirst(req, SHELL)); return; }
  if (/\.(css|js)$/.test(url.pathname)) { e.respondWith(staleWhileRevalidate(req, SHELL)); return; }
  if (/\.(png|jpe?g|webp|svg|ico|woff2?)$/.test(url.pathname)) { e.respondWith(cacheFirst(req, RUNTIME)); return; }
});
