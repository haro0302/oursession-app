const CACHE_NAME = "our-session-shell-v2";
const SHELL_URLS = ["/", "/timeline", "/mypage", "/notifications", "/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 音源ファイルはキャッシュしない（容量・著作権・鮮度の観点）
  if (url.pathname.includes("/storage/") || url.pathname.match(/\.(mp3|mp4|webm|ogg)$/)) {
    return;
  }

  // APIリクエストはキャッシュしない
  if (url.pathname.startsWith("/api/") || url.hostname.includes("supabase")) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).catch(() => {
        // オフライン時のフォールバック
        if (event.request.mode === "navigate") {
          return caches.match("/offline.html");
        }
        return new Response("offline", { status: 503 });
      });
    })
  );
});
