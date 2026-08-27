// ============================================================
// Service Worker：PWA 主屏 / 离线外壳缓存
// 策略：全部 network-first（在线永远拿最新，包括 build/data.js，
//       知识库更新后立即生效；离线时回退缓存，复习照常可用）。
// 缓存名带版本号：内容变更时改 CACHE_VERSION 即可自动清理旧缓存。
// ============================================================

const CACHE_VERSION = "v2";
const CACHE_NAME = "reviewer-shell-" + CACHE_VERSION;
const SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./sync.js",
  "./cloud-sync.js",
  "./knowledge-studio/web/build/data.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        // 在线：拿最新并写入缓存
        const fresh = await fetch(req);
        if (fresh && fresh.ok) cache.put(req, fresh.clone());
        return fresh;
      } catch (err) {
        // 离线：回退缓存；页面导航兜底到 index.html
        const cached = await cache.match(req);
        if (cached) return cached;
        if (req.mode === "navigate") {
          const home = await cache.match("./index.html");
          if (home) return home;
        }
        throw err;
      }
    })
  );
});
