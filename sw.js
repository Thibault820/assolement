// Permet d'ouvrir l'appli sans réseau (les données viennent ensuite de Firebase ou du téléphone).
var CACHE = 'assolement-v1';
var APP = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(APP); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // La page : on prend la dernière version en ligne, sinon celle gardée sur le téléphone
  if (e.request.mode === 'navigate' || (u.origin === location.origin && /\.(html|webmanifest|png)$|\/$/.test(u.pathname))) {
    e.respondWith(fetch(e.request).then(function (r) {
      var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); return r;
    }).catch(function () { return caches.match(e.request).then(function (r) { return r || caches.match('./index.html'); }); }));
    return;
  }
  // Scripts Firebase et polices : gardés sur le téléphone
  if (u.hostname === 'www.gstatic.com' || u.hostname === 'fonts.googleapis.com' || u.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.match(e.request).then(function (r) {
      return r || fetch(e.request).then(function (rr) { var copy = rr.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); return rr; });
    }));
  }
});
