// ============================================================
// 同步接口：手动文件同步（当前唯一方式）+ 未来云同步预留
//
// 备份文件 reviewer-backup.json 格式：
//   { version, timestamp, reviewState, settings }
//   兼容旧格式：{ app, version, exportedAt, state }
//
// 本文件只放纯函数，不碰 localStorage / DOM。
// 未来接 iCloud Drive / GitHub private repo / WebDAV / 云数据库时，
// 只需通过 registerAdapter 注册一个实现 export()/import() 的适配器，
// 上传/下载后的合并一律复用 mergeState，本文件与 app.js 无需改动。
// ============================================================

(function () {
  "use strict";

  const BACKUP_VERSION = 1;

  // 导出：state（reviewer-state-v1 原样）+ settings → 备份对象
  function exportState(state, settings) {
    return {
      version: BACKUP_VERSION,
      timestamp: new Date().toISOString(),
      reviewState: state,
      settings: settings || {}
    };
  }

  // 解析导入内容：自动识别新格式（reviewState）与旧格式（state）。
  // 非法内容抛错。
  function importState(text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("不是有效的 JSON");
    }
    if (!data || typeof data !== "object") throw new Error("格式不对");
    const reviewState = data.reviewState || data.state;
    if (!reviewState || typeof reviewState !== "object" || Array.isArray(reviewState)) {
      throw new Error("缺少记忆状态");
    }
    return {
      version: data.version,
      timestamp: data.timestamp,
      reviewState: reviewState,
      settings: data.settings && typeof data.settings === "object" ? data.settings : {}
    };
  }

  // 合并：localState 与 remoteState 逐对象合并，不修改入参。
  // 同一对象两边都有 → 取 lastReview 较新者（最近复习者胜出）；
  // 一边没有 → 取有的一边；两边都无 lastReview → 保留本机。
  function mergeState(localState, remoteState) {
    const merged = {};
    const ids = new Set([
      ...Object.keys(localState),
      ...Object.keys(remoteState)
    ]);
    for (const id of ids) {
      const l = localState[id];
      const r = remoteState[id];
      if (l === undefined) { merged[id] = r; continue; }
      if (r === undefined) { merged[id] = l; continue; }
      merged[id] = pickNewer(l, r);
    }
    return merged;
  }

  function pickNewer(a, b) {
    const ta = typeof a.lastReview === "number" ? a.lastReview : -Infinity;
    const tb = typeof b.lastReview === "number" ? b.lastReview : -Infinity;
    // 严格更晚才换；相等或都无 lastReview 时保留 a（本机）
    return tb > ta ? b : a;
  }

  // ---- 云同步适配器预留（当前不实现任何适配器） ----
  const adapters = {};

  window.Sync = {
    exportState: exportState,
    importState: importState,
    mergeState: mergeState,
    registerAdapter: function (name, impl) {
      if (name && impl && typeof impl.export === "function" && typeof impl.import === "function") {
        adapters[name] = impl;
      }
    }
  };
})();
