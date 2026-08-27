// ============================================================
// GitHub Gist 云备份（手动上传 / 手动恢复）
//
// 职责：uploadGist() / downloadGist() / token 管理 / gist-id 管理。
// 不碰记忆算法与复习流程；备份格式与解析/合并复用 sync.js：
//   Sync.exportState / Sync.importState / Sync.mergeState
// 恢复时把下载到的文本交给 app.js 的 importBackupText(text, onSuccess)，
// 走与「导入进度」完全相同的「合并 / 覆盖」弹窗，不重复写恢复逻辑。
//
// 安全：Token 不写死在代码，首次使用弹窗输入，只保存在本机
//       localStorage（键 gist-token）；只需 gist 权限，不需要 repo 权限。
// ============================================================

(function () {
  "use strict";

  const TOKEN_KEY = "gist-token";
  const GIST_ID_KEY = "gist-id";
  const GIST_FILENAME = "reviewer-backup.json";
  const GIST_API = "https://api.github.com/gists";

  // ---------- token 管理 ----------
  // 已有则直接用；没有则弹窗要求输入，保存到 localStorage 后返回。
  // 用户取消（prompt 返回 null）返回 null。
  function getToken() {
    let token = null;
    try { token = localStorage.getItem(TOKEN_KEY); } catch (e) { token = null; }
    if (token && token.trim()) return token.trim();
    const input = prompt(
      "首次使用 GitHub 云备份，请输入你的 GitHub Token。\n\n" +
      "获取：GitHub → Settings → Developer settings → Personal access tokens → 新建，\n" +
      "权限只需勾选 gist（不需要 repo 权限）。\n\n" +
      "Token 只保存在本机浏览器 localStorage（键 gist-token），不会写入代码。"
    );
    if (input === null) return null; // 用户取消
    const t = input.trim();
    if (!t) return null;
    try { localStorage.setItem(TOKEN_KEY, t); } catch (e) { /* 忽略 */ }
    return t;
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
  function uploadGist() {
    const token = getToken();
    if (!token) { alert("已取消：没有 Token 无法上传。"); return Promise.resolve(); }

    // 1. 获取当前 localStorage 的复习状态
    let state = {};
    try {
      const raw = localStorage.getItem("reviewer-state-v1");
      state = raw ? JSON.parse(raw) : {};
    } catch (e) { state = {}; }

    // 2. 使用已有备份格式 { version, timestamp, reviewState, settings }
    const backup = Sync.exportState(state, {});

    // 3. 创建私有 gist，文件名 reviewer-backup.json，内容为格式化 JSON
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
    }).then(function (res) {
      if (!res.ok) return apiError(res);
      return res.json().then(function (gist) {
        if (!gist || !gist.id) throw new Error("GitHub 响应缺少 gist id");
        // 5. 保存 gist-id，以后恢复直接用
        try { localStorage.setItem(GIST_ID_KEY, gist.id); } catch (e) { /* 忽略 */ }
        alert("云端备份成功 ✅\n已保存为私有 Gist，可在其他设备点「从云端恢复」取回。");
      });
    }).catch(function (err) {
      alert("上传失败：" + (err && err.message ? err.message : "网络错误，请检查网络后重试。"));
    });
  }

  // ---------- 恢复 ----------
  function downloadGist() {
    const token = getToken();
    if (!token) { alert("已取消：没有 Token 无法恢复。"); return Promise.resolve(); }
    const gistId = getGistId();
    if (!gistId) {
      alert("还没有云端备份：请先点「上传云端」完成第一次备份。");
      return Promise.resolve();
    }

    return fetch(GIST_API + "/" + encodeURIComponent(gistId), {
      headers: {
        "Authorization": "token " + token,
        "Accept": "application/vnd.github+json"
      }
    }).then(function (res) {
      if (!res.ok) return apiError(res);
      return res.json().then(function (gist) {
        const files = (gist && gist.files) || {};
        const f = files[GIST_FILENAME];
        if (!f || typeof f.content !== "string") {
          alert("云端备份里没有找到 " + GIST_FILENAME + "，可能被误删，请重新上传。");
          return;
        }
        // 4. 调用已有导入逻辑：解析 + 合并/覆盖弹窗，成功后再提示并刷新页面
        window.importBackupText(f.content, function () {
          alert("云端恢复成功 ✅");
          location.reload();
        });
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
