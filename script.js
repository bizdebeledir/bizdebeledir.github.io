"use strict";

const CACHE_NAME = "bizde-beledir-static-v2";

const STATIC_FILES = [
  "/style.css",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.webmanifest"
];


/* =========================
   INSTALL
========================= */

self.addEventListener("install", event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_FILES))
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
  );

  self.clients.claim();
});


/* =========================
   FETCH
========================= */

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  const isStaticFile =
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".webmanifest");

  if (!isStaticFile) {
    return;
  }

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then(response => {
        if (
          !response ||
          response.status !== 200
        ) {
          return response;
        }

        const copy = response.clone();

        caches
          .open(CACHE_NAME)
          .then(cache => {
            cache.put(request, copy);
          });

        return response;
      });
    })
  );
});w
