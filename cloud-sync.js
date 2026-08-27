// ============================================================
// GitHub Gist 云备份（手动上传 / 手动恢复，支持跨设备）
//
// 职责：uploadGist() / downloadGist() / token 管理 / gist-id 管理。
// 不碰记忆算法与复习流程；备份格式与解析/合并复用 sync.js：
//   Sync.exportState / Sync.importState / Sync.mergeState
// 恢复时把下载到的文本交给 app.js 的 importBackupText(text, onSuccess)，
// 走与「导入进度」完全相同的「合并 / 覆盖」弹窗，不重复写恢复逻辑。
//
// 跨设备：gist-id 只存在本机 localStorage，新设备没有。
//   恢复时若本地无 gist-id（或 gist-id 已失效），会自动用当前 Token
//   调用 GET /gists?per_page=100 列出该账号全部 Gist，
//   按文件名 reviewer-backup.json 过滤、取 updated_at 最新的一条，
//   保存 gist-id（自动绑定）后再按 id 拉取完整内容 —— 输入同一个
//   GitHub Token 即可在任何设备找到自己的备份。
//
// 上传：有 gist-id 用 PATCH 更新同一个 Gist（不产生孤儿 Gist）；
//       第一次上传才 POST 新建。
//
// 安全：Token 不写死在代码，首次使用在自定义 modal（index.html #tokenModal）
//       中输入，只保存在本机 localStorage（键 gist-token）；
//       Token 只放请求头，绝不写入 Gist 内容；
//       只需 gist 权限，不需要 repo 权限。
// 注意：不使用 window.prompt()（iOS Safari / PWA 独立模式下不弹输入框），
//       token 输入一律走 #tokenModal。
// ============================================================

(function () {
  "use strict";

  const TOKEN_KEY = "gist-token";
  const GIST_ID_KEY = "gist-id";
  const GIST_FILENAME = "reviewer-backup.json";
  const GIST_API = "https://api.github.com/gists";

  // ---------- token 管理 ----------
  // 已有则直接用；没有则打开自定义 modal 输入并保存。
  // 返回 Promise：确认 → token 字符串；取消 → null。
  function getToken() {
    let token = null;
    try { token = localStorage.getItem(TOKEN_KEY); } catch (e) { token = null; }
    if (token && token.trim()) return Promise.resolve(token.trim());
    return requestToken();
  }

  // 打开 token 输入弹窗，等用户确认 / 取消。
  // modal 若已在输入中（重复触发），本次视为取消返回 null。
  function requestToken() {
    return new Promise(function (resolve) {
      const modal = document.getElementById("tokenModal");
      const input = document.getElementById("tokenInput");
      const confirmBtn = document.getElementById("tokenConfirmBtn");
      const cancelBtn = document.getElementById("tokenCancelBtn");
      if (!modal || !input || !confirmBtn || !cancelBtn ||
          !modal.classList.contains("hidden")) {
        resolve(null);
        return;
      }

      input.value = "";
      modal.classList.remove("hidden");
      // 聚焦输入框（移动端自动弹键盘；Safari 可能拦截，失败无碍）
      setTimeout(function () { try { input.focus(); } catch (e) { /* 忽略 */ } }, 60);

      function onConfirm() {
        const t = input.value.trim();
        if (!t) { alert("请输入 GitHub Token。"); input.focus(); return; }
        cleanup();
        try { localStorage.setItem(TOKEN_KEY, t); } catch (e) { /* 忽略 */ }
        resolve(t);
      }
      function onCancel() {
        cleanup();
        resolve(null);
      }
      // 桌面：回车 = 确认，Esc = 取消；移动端回车键同样生效
      function onKey(e) {
        if (e.key === "Enter") { e.preventDefault(); onConfirm(); }
        else if (e.key === "Escape") { onCancel(); }
      }
      function cleanup() {
        confirmBtn.removeEventListener("click", onConfirm);
        cancelBtn.removeEventListener("click", onCancel);
        document.removeEventListener("keydown", onKey);
        modal.classList.add("hidden");
      }

      confirmBtn.addEventListener("click", onConfirm);
      cancelBtn.addEventListener("click", onCancel);
      document.addEventListener("keydown", onKey);
    });
  }

  function getGistId() {
    try { return localStorage.getItem(GIST_ID_KEY); } catch (e) { return null; }
  }

  // GitHub API 错误统一提示（Bad credentials / 限流 / 404 等）
  function apiError(res) {
    return res.json().catch(function () { return {}; }).then(function (err) {
      const msg = (err && err.message) || ("HTTP " + res.status);
      alert("云端操作失败：" + msg + "\n\n请检查 Token 是否有效、是否勾选了 gist 权限。");
    });
  }

  // ---------- 上传 ----------
  // 创建私有 gist（第一次上传，无 gist-id 时）
  function createGist(token, backup) {
    const body = {
      description: "今天你记了吗 · 复习进度备份",
      public: false,
      files: {}
    };
    body.files[GIST_FILENAME] = { content: JSON.stringify(backup, null, 2) };
    return fetch(GIST_API, {
      method: "POST",
      headers: {
        "Authorization": "token " + token,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  }

  // 更新已有 gist（已有 gist-id 时，只改 reviewer-backup.json，不新建）
  function updateGist(token, gistId, backup) {
    const body = { files: {} };
    body.files[GIST_FILENAME] = { content: JSON.stringify(backup, null, 2) };
    return fetch(GIST_API + "/" + encodeURIComponent(gistId), {
      method: "PATCH",
      headers: {
        "Authorization": "token " + token,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
  }

  function uploadGist() {
    return getToken().then(function (token) {
      if (!token) { alert("已取消：没有 Token 无法上传。"); return; }

      // 1. 获取当前 localStorage 的复习状态（含诊断日志）
      const raw = localStorage.getItem("reviewer-state-v1");
      let state = {};
      try {
        state = raw ? JSON.parse(raw) : {};
      } catch (e) { state = {}; }
      const nLocal = Object.keys(state).length;
      console.log("[云端备份·诊断] reviewer-state-v1 是否存在:", raw !== null);
      console.log("[云端备份·诊断] 本地记忆对象数:", nLocal);

      // 2. 使用已有备份格式 { version, timestamp, reviewState, settings }
      const backup = Sync.exportState(state, {});
      const nUpload = Object.keys(backup.reviewState).length;
      console.log("[云端备份·诊断] 上传 JSON 中 reviewState 数量:", nUpload);

      // 空状态拦截：本机没有复习记录时不覆盖云端
      if (nUpload === 0) {
        alert("当前设备没有复习记录，无法上传云端。");
        return;
      }

      // 3. 已有 gist-id → PATCH 更新；没有 → POST 新建。
      //    PATCH 遇 404（gist 被删/失效）→ 自动改回 POST 新建，避免一直失败。
      //    两种路径统一返回 gist JSON；失败已提示时返回 null。
      const gistId = getGistId();
      let req;
      if (gistId) {
        req = updateGist(token, gistId, backup).then(function (res) {
          if (res.ok) return res.json();
          if (res.status === 404) {
            return createGist(token, backup).then(function (r2) { return r2.json(); });
          }
          return apiError(res).then(function () { return null; });
        });
      } else {
        req = createGist(token, backup).then(function (res) {
          if (!res.ok) return apiError(res).then(function () { return null; });
          return res.json();
        });
      }

      return req.then(function (gist) {
        if (!gist || !gist.id) return; // 请求失败已提示过
        // 4. 保存 gist-id，以后恢复直接用
        try { localStorage.setItem(GIST_ID_KEY, gist.id); } catch (e) { /* 忽略 */ }
        alert("云端备份成功，共保存 " + nUpload + " 项 ✅\n已保存为私有 Gist，可在其他设备点「从云端恢复」取回。");
      });
    }).catch(function (err) {
      alert("上传失败：" + (err && err.message ? err.message : "网络错误，请检查网络后重试。"));
    });
  }

  // ---------- 恢复 ----------
  // 按 gist-id 拉取 reviewer-backup.json 的完整内容。
  // 返回 Promise：{ ok:true, content } 成功；
  //   { ok:false, notFound:true } gist 不存在/文件缺失（可回退自动发现）；
  //   { ok:false, notFound:false } 请求出错（已弹提示，不要再打扰）。
  function fetchGistContent(token, gistId) {
    return fetch(GIST_API + "/" + encodeURIComponent(gistId), {
      headers: {
        "Authorization": "token " + token,
        "Accept": "application/vnd.github+json"
      }
    }).then(function (res) {
      if (!res.ok) {
        if (res.status === 404) return { ok: false, notFound: true };
        return apiError(res).then(function () { return { ok: false, notFound: false }; });
      }
      return res.json().then(function (gist) {
        const f = gist && gist.files && gist.files[GIST_FILENAME];
        if (!f || typeof f.content !== "string") return { ok: false, notFound: true };
        return { ok: true, content: f.content };
      });
    });
  }

  // 用当前 Token 列出该账号全部 Gist（per_page=100），
  // 过滤出含 reviewer-backup.json 的，取 updated_at 最新一条；
  // 找到后自动绑定 gist-id，再按 id 拉完整内容。返回值同 fetchGistContent。
  function findByToken(token) {
    return fetch(GIST_API + "?per_page=100", {
      headers: {
        "Authorization": "token " + token,
        "Accept": "application/vnd.github+json"
      }
    }).then(function (res) {
      if (!res.ok) {
        if (res.status === 404) return { ok: false, notFound: true };
        return apiError(res).then(function () { return { ok: false, notFound: false }; });
      }
      return res.json().then(function (gists) {
        if (!Array.isArray(gists)) return { ok: false, notFound: true };
        const candidates = gists.filter(function (g) {
          return g && g.id && g.files && g.files[GIST_FILENAME];
        });
        if (candidates.length === 0) return { ok: false, notFound: true };
        // 多个备份 gist 时取 updated_at 最新（ISO 字符串可直接比较）
        candidates.sort(function (a, b) {
          return String(b.updated_at || "").localeCompare(String(a.updated_at || ""));
        });
        const best = candidates[0];
        try { localStorage.setItem(GIST_ID_KEY, best.id); } catch (e) { /* 忽略 */ }
        return fetchGistContent(token, best.id);
      });
    });
  }

  // 进入原有恢复流程：先解析并打印诊断日志，再走合并/覆盖弹窗。
  // 空备份（reviewState 数量为 0）禁止恢复。
  function applyCloudRestore(content) {
    let backup;
    try {
      backup = Sync.importState(content);
    } catch (e) {
      console.log("[云端恢复·诊断] 备份解析失败:", e.message);
      alert("云端备份不是有效的备份文件。");
      return;
    }
    const n = Object.keys(backup.reviewState).length;
    console.log("[云端恢复·诊断] Gist 文件名:", GIST_FILENAME);
    console.log("[云端恢复·诊断] backup.version:", backup.version);
    console.log("[云端恢复·诊断] reviewState 数量:", n);
    if (n === 0) {
      alert("云端备份没有复习记录，已禁止恢复。");
      return;
    }
    window.importBackupText(content, function () {
      alert("云端恢复成功，共恢复 " + n + " 项 ✅");
      location.reload();
    });
  }

  function downloadGist() {
    return getToken().then(function (token) {
      if (!token) { alert("已取消：没有 Token 无法恢复。"); return; }

      // 1) 本地有 gist-id：直接按 id 拉取（快路径）；gist 失效则回退自动发现
      // 2) 本地没有 gist-id（新设备）：直接用 Token 自动发现
      const gistId = getGistId();
      const attempt = gistId
        ? fetchGistContent(token, gistId).then(function (r) {
            if (r.ok || !r.notFound) return r;
            return findByToken(token);
          })
        : findByToken(token);

      return attempt.then(function (r) {
        if (r && r.ok) { applyCloudRestore(r.content); return; }
        if (r && !r.notFound) return; // 请求出错已提示过，不再重复打扰
        alert("该账号下没有找到云备份：请先在任一设备点「上传云端」完成第一次备份。");
      });
    }).catch(function (err) {
      alert("恢复失败：" + (err && err.message ? err.message : "网络错误，请检查网络后重试。"));
    });
  }

  window.CloudSync = {
    uploadGist: uploadGist,
    downloadGist: downloadGist
  };
})();
