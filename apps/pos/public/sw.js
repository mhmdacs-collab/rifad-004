const CACHE_NAME = "rifad-pos-shell-v2";
const SHELL = [
  "/",
  "/manifest.webmanifest",
  "/brand/rifad-logo-light.png",
  "/brand/rifad-logo-dark.png",
  "/fonts/cairo/cairo-arabic-400-normal.woff2",
  "/fonts/cairo/cairo-arabic-500-normal.woff2",
  "/fonts/cairo/cairo-arabic-600-normal.woff2",
  "/fonts/cairo/cairo-arabic-700-normal.woff2",
  "/fonts/cairo/cairo-arabic-800-normal.woff2",
  "/fonts/cairo/cairo-latin-400-normal.woff2",
  "/fonts/cairo/cairo-latin-500-normal.woff2",
  "/fonts/cairo/cairo-latin-600-normal.woff2",
  "/fonts/cairo/cairo-latin-700-normal.woff2",
  "/fonts/cairo/cairo-latin-800-normal.woff2",
  "/fonts/cairo/OFL-1.1.txt",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((response) => response || caches.match("/"))),
  );
});
