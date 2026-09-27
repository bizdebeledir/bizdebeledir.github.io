"use strict";

const CACHE_NAME = "bizde-beledir-pwa-v1";

const ICON_FILES = [
  "/icon-192.png",
  "/icon-512.png"
];


/* =========================
   INSTALL
========================= */

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(ICON_FILES))
  );

  self.skipWaiting();
});


/* =========================
   ACTIVATE
========================= */

self.addEventListener("activate", event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});


/* =========================
   FETCH
========================= */

/*
  Qəsdən fetch handler yoxdur.

  Service Worker saytın:
  - HTML
  - CSS
  - JavaScript
  - JSON
  - video səhifələri

  sorğularına müdaxilə etmir.
*/
