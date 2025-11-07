self.addEventListener("install", event => {
  event.waitUntil(
    caches.open("voltway-cache-v1").then(cache => {
      return cache.addAll([
        "/frontend/index.html",
        "/frontend/login/login.html",
        "/frontend/home/home.html",
        "/frontend/global/global.js",
        "/frontend/global/Layout.css"
      ]);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
