/* ===========================================================================
   Entdeckerfisch – Service Worker (sw.js)
   ---------------------------------------------------------------------------
   Macht das Spiel offline-fähig (PWA): alle Dateien werden beim Installieren
   in den Cache gelegt und danach cache-first ausgeliefert – genau wie beim
   Uhrzeit-Uhu, unserem anderen JONFIE-STUDIOS-Spiel.

   WICHTIG: Bei jeder Änderung an den Spieldateien die VERSION hochzählen
   (gleich mit der ?v=NUMMER in index.html) – sonst liefert der Cache alt aus.
   ===========================================================================*/

var VERSION = "v2";
var CACHE_NAME = "entdeckerfisch-" + VERSION;

var DATEIEN = [
  "./",
  "index.html",
  "style.css?v=2",
  "config.js?v=2",
  "welten.js?v=2",
  "spiel.js?v=2",
  "manifest.webmanifest",
  "icon.svg"
];

self.addEventListener("install", function (ereignis) {
  ereignis.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(DATEIEN); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (ereignis) {
  ereignis.waitUntil(
    caches.keys().then(function (namen) {
      return Promise.all(namen.map(function (name) {
        if (name !== CACHE_NAME) { return caches.delete(name); }
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (ereignis) {
  if (ereignis.request.method !== "GET") { return; }
  ereignis.respondWith(
    caches.match(ereignis.request, { ignoreSearch: false }).then(function (treffer) {
      if (treffer) { return treffer; }
      return fetch(ereignis.request).catch(function () {
        // Offline-Fallback für Seitenaufrufe: die Startseite.
        if (ereignis.request.mode === "navigate") { return caches.match("index.html"); }
      });
    })
  );
});
