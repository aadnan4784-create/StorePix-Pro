const VER = 'multishop-v4.2';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];
const MAX_CACHE_ENTRIES = 200;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VER).then(c =>
      Promise.all(SHELL.map(u => c.add(u).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks =>
      Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  if (url.origin === location.origin) {
    const net = fetch(req).then(res => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(VER).then(c => c.put(req, copy));
      }
      return res;
    });

    const cached = () =>
      caches.match(req, { ignoreSearch: true })
        .then(r => r || caches.match('./index.html', { ignoreSearch: true }));

    e.respondWith(
      Promise.race([
        net.catch(() => null),
        new Promise(r => setTimeout(() => r(null), 2500))
      ]).then(r => r || cached().then(c => c || net))
        .catch(() => cached())
    );
  } else if (
    url.hostname === 'www.gstatic.com' &&
    url.pathname.startsWith('/firebasejs/')
  ) {
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then(r =>
        r || fetch(req).then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(VER).then(c => c.put(req, copy));
          }
          return res;
        })
      )
    );
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(l => {
      for (const c of l) {
        if ('focus' in c) return c.focus();
      }
      return self.clients.openWindow('./');
    })
  );
});

self.addEventListener('error', e => {
  console.error('SW error:', e);
});

self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
