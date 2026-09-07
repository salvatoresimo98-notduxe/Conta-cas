/* Conta Cassa — service worker
   IMPORTANTE: incrementa VERSION a ogni modifica dell'app,
   altrimenti il tablet continuerà a mostrare la versione vecchia. */
const VERSION = 'v9';
const CACHE = 'conta-cassa-' + VERSION;

const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png'
];

/* Installazione: mette in cache i file dell'app */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .catch(() => {})   // se un file manca, l'installazione non fallisce
  );
});

/* Attivazione: elimina le cache delle versioni precedenti */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k.startsWith('conta-cassa-') && k !== CACHE)
            .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* Messaggio dalla pagina: applica subito l'aggiornamento */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

/* Strategia: network-first con fallback su cache.
   Se c'è rete usa la versione aggiornata; se non c'è, apre comunque
   l'app dalla cache. Le richieste non-GET e quelle esterne passano dirette. */
self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then(hit =>
          hit || caches.match('index.html')
        )
      )
  );
});
