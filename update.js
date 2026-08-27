// ============================================================
// update.js：版本检测与"发现新版本"提示（PWA 自动更新体验）
//
// 职责：
//   1. 页面启动后后台读取服务器 version.json（带时间戳，绕过缓存）
//   2. 与本地 localStorage["app-version"] 比较
//   3. 首次打开：静默记录版本，不提示
//   4. 发现新版本：显示「发现新版本 vX」+ [立即更新] / [稍后]
//   5. [立即更新]：registration.update() → 新 SW 接管 → reload 页面
//
// 安全边界：只读写独立的 "app-version" 键，
//   绝不触碰 reviewer-state-v1（复习进度）/ gist-token / gist-id（云同步）。
// 离线或失败：静默跳过，不影响复习。
// ============================================================
(function (global) {
  "use strict";

  var VERSION_KEY = "app-version";

  function readLocal() {
    try { return global.localStorage.getItem(VERSION_KEY) || ""; } catch (e) { return ""; }
  }
  function writeLocal(v) {
    try { global.localStorage.setItem(VERSION_KEY, String(v)); } catch (e) {}
  }

  // 判定逻辑（纯函数，便于测试）：
  //   local 为空      → "first"  （首次安装：只记录，不提示）
  //   local != server → "update"（发现新版本）
  //   否则            → "none"
  function decide(local, server) {
    if (!server) return "none";
    if (!local) return "first";
    return server === local ? "none" : "update";
  }

  function fetchVersion() {
    // 时间戳 + no-store：确保拿到服务器最新版本号，不被 HTTP/SW 缓存糊住
    return global.fetch("version.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("http " + res.status);
        return res.json();
      })
      .then(function (data) {
        return data && typeof data.version === "string" ? data.version.trim() : "";
      });
  }

  function doUpdate(serverVersion) {
    // 先记录新版本，reload 后不再重复提示
    writeLocal(serverVersion);
    var btn = document.getElementById("updateNowBtn");
    if (btn) { btn.disabled = true; btn.textContent = "正在更新…"; }

    var reloaded = false;
    function reloadNow() {
      if (reloaded) return;
      reloaded = true;
      try { global.sessionStorage.setItem("app-just-updated", "1"); } catch (e) {}
      global.location.reload();
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then(function (reg) {
        if (!reg) { reloadNow(); return; }
        // 新 SW 接管（controllerchange）→ 立即刷新；否则 5 秒兜底刷新
        var timer = setTimeout(reloadNow, 5000);
        navigator.serviceWorker.addEventListener("controllerchange", function () {
          clearTimeout(timer);
          reloadNow();
        });
        reg.update().catch(function () { reloadNow(); });
      }).catch(function () { reloadNow(); });
    } else {
      reloadNow();
    }
  }

  function showBanner(serverVersion) {
    if (document.getElementById("appUpdateBox")) return;
    var box = document.createElement("div");
    box.id = "appUpdateBox";
    box.className = "update-box";
    var title = document.createElement("div");
    title.className = "update-title";
    title.textContent = "发现新版本 v" + serverVersion;
    var actions = document.createElement("div");
    actions.className = "update-actions";
    var now = document.createElement("button");
    now.id = "updateNowBtn";
    now.className = "update-btn update-btn-primary";
    now.textContent = "立即更新";
    var later = document.createElement("button");
    later.className = "update-btn";
    later.textContent = "稍后";
    actions.appendChild(now);
    actions.appendChild(later);
    box.appendChild(title);
    box.appendChild(actions);
    document.body.appendChild(box);
    now.addEventListener("click", function () { doUpdate(serverVersion); });
    later.addEventListener("click", function () { box.parentNode.removeChild(box); });
  }

  function showUpdatedToast() {
    var toast = document.createElement("div");
    toast.className = "update-box";
    toast.textContent = "更新完成 ✅";
    document.body.appendChild(toast);
    setTimeout(function () {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
  }

  function check() {
    fetchVersion().then(function (serverVersion) {
      if (!serverVersion) return;
      var result = decide(readLocal(), serverVersion);
      if (result === "first") { writeLocal(serverVersion); return; }
      if (result === "update") showBanner(serverVersion);
    }).catch(function () { /* 离线或读取失败：静默，不打扰复习 */ });
  }

  function start() {
    function run() {
      setTimeout(check, 1000); // 后台延迟检查，不阻塞首屏
    }
    if (global.document) {
      if (global.document.readyState === "loading") {
        global.document.addEventListener("DOMContentLoaded", run);
      } else {
        run();
      }
      // reload 后一次性「更新完成 ✅」提示
      try {
        if (global.sessionStorage && global.sessionStorage.getItem("app-just-updated") === "1") {
          global.sessionStorage.removeItem("app-just-updated");
          showUpdatedToast();
        }
      } catch (e) {}
    }
  }

  // 暴露纯逻辑（供 node 测试），浏览器环境才启动检测
  global.AppUpdate = { decide: decide };
  if (global.document && global.navigator && global.location) {
    start();
  }
})(typeof window !== "undefined" ? window : this);
