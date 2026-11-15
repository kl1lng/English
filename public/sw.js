/* Service worker: keeps the app shell and the recordings available offline.
   The build id comes from the registration URL (/sw.js?v=<id>), so each deploy has its own caches and
   the old ones are removed on activation. API calls and non-GET requests are never cached. */
importScripts("/sw-rules.js");

var VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
var SHELL = "shell-" + VERSION;
var MEDIA = "media-v1"; // recordings and photos are not tied to the build

self.addEventListener("install", function () {
  // The new worker waits until the page asks to take over (so a visit is never cut in half).
});

self.addEventListener("message", function (event) {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) {
              return key.indexOf("shell-") === 0 && key !== SHELL;
            })
            .map(function (key) {
              return caches.delete(key);
            }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  var rule = self.swRules.shouldCache(request.url, request.method, self.location.origin);
  if (rule === "never") return;

  if (rule === "cache-first") {
    event.respondWith(
      caches.open(MEDIA).then(function (cache) {
        return cache.match(request).then(function (hit) {
          if (hit) return hit;
          return fetch(request).then(function (response) {
            if (response.ok) cache.put(request, response.clone());
            return response;
          });
        });
      }),
    );
    return;
  }

  // network-first: fresh when online, last copy when offline
  event.respondWith(
    fetch(request)
      .then(function (response) {
        if (response.ok) {
          var copy = response.clone();
          caches.open(SHELL).then(function (cache) {
            cache.put(request, copy);
          });
        }
        return response;
      })
      .catch(function () {
        return caches.open(SHELL).then(function (cache) {
          return cache.match(request).then(function (hit) {
            return hit || (request.mode === "navigate" ? cache.match("/") : undefined) || Response.error();
          });
        });
      }),
  );
});
