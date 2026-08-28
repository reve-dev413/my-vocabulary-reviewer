// ============================================================
// Service Worker：PWA 主屏 / 离线外壳缓存
//
// 策略：真 network-first —— 在线时永远从服务器拿最新文件：
//   fetch 使用 { cache: "reload" } 绕过浏览器 HTTP 缓存，
//   避免旧 app.js / sync.js / cloud-sync.js / data.js 被缓存；
//   只有网络失败（离线）时才回退 Cache Storage。
//
// 缓存名取自 version.json 的版本号：版本变化 → 新缓存名 →
//   activate 自动删除旧缓存，无需手改本文件常量。
// ============================================================

const DEFAULT_CACHE_NAME = "reviewer-shell-default";
let CACHE_NAME = DEFAULT_CACHE_NAME;

const SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./sync.js",
  "./cloud-sync.js",
  "./update.js",
  "./knowledge-studio/web/build/data.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      // 从 version.json 取版本号拼缓存名（拿不到则退回默认名，不影响安装）
      try {
        const res = await fetch("version.json", { cache: "reload" });
        if (res.ok) {
          const data = await res.json();
          if (data && data.version) {
            CACHE_NAME = "reviewer-shell-" + data.version;
          }
        }
      } catch (e) { /* 离线安装：使用默认缓存名 */ }
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(SHELL);
      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const stale = keys.filter((k) => k !== CACHE_NAME);
      await Promise.all(stale.map((k) => caches.delete(k)));
      await self.clients.claim();
      // 冷启动破局：若存在旧缓存（说明是"更新"而非首次安装），
      // 说明可能有一个旧的 cache-first SW 仍控制着页面、把旧外壳发给了用户。
      // 这里强制让所有受控窗口客户端重新导航一次，立刻拿到最新外壳，
      // 不需要用户手动注销旧 SW 或 F5。首次安装（无旧缓存）不受影响。
      if (stale.length > 0) {
        const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        await Promise.all(
          wins.map((w) => w.navigate(w.url).catch(() => {}))
        );
      }
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        // 真 network-first：绕过 HTTP 缓存，强制走网络拿最新
        const fresh = await fetch(req, { cache: "reload" });
        if (fresh && fresh.ok && !url.search) {
          // 只缓存无查询参数的稳定资源，
          // 避免 version.json?t=… 之类的临时 URL 污染缓存
          cache.put(req, fresh.clone()).catch(() => {});
        }
        return fresh;
      } catch (err) {
        // 离线：回退缓存；导航请求兜底到 index.html
        const cached = await cache.match(req);
        if (cached) return cached;
        if (req.mode === "navigate") {
          const home = await cache.match("./index.html");
          if (home) return home;
        }
        throw err;
      }
    })()
  );
});
