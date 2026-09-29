// Offline support for Proof. Registered at the end of index.html.
// - The page: network first, so every visit with internet gets the newest version; the saved copy is
//   used only when there's no connection.
// - Google Fonts and the icon: saved copy first (they rarely change), refreshed in the background.
// - Everything else (the update check's HEAD request, feedback POSTs, anything cross-site) is left alone.
// Changing CACHE throws away the old saved files on the next visit.
const CACHE = 'proof-v1';
const PAGE = './';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.add(new Request(PAGE, { cache: 'reload' }))).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('proof-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const sameSite = url.origin === self.location.origin;

  // The page itself (including ?v=… update reloads and #subject links).
  if (req.mode === 'navigate' && sameSite) {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(PAGE, copy)); }
      return res;
    }).catch(() => caches.match(PAGE).then(r => r || Response.error())));
    return;
  }

  // Fonts and the icon: use the saved copy right away, and refresh it for next time.
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  const icon = sameSite && url.pathname.endsWith('/apple-touch-icon.png');
  if (fonts || icon) {
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(saved => {
      const fresh = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => saved || Response.error());
      return saved || fresh;
    })));
  }
});
