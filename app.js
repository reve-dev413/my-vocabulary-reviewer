// ============================================================
// 个人英语知识复习器 · 核心逻辑
// 结构：存储 / 记忆算法 / 复习调度器 / 复习流程 / 备份
// 记忆算法与调度器分离：参数集中在 PDM_CONFIG；
// 整体替换算法只改 applyReview 一个函数。
// ============================================================

"use strict";

// ---------- 0. 数据来源 ----------
// 知识库来自 knowledge-studio 母数据产物（knowledge-studio/web/build/data.js → window.KS_DATA.knowledge）。
// 旧 knowledge.js 不再被引用，文件保留不删；topic/item 结构与原库一致、id 原样保留，
// 因此 localStorage 中已有记忆状态（reviewer-state-v1，按 item.id 索引）可直接沿用。
const KNOWLEDGE = (window.KS_DATA && window.KS_DATA.knowledge) || [];

// ---------- 1. 记忆状态存储（localStorage） ----------

const STORAGE_KEY = "reviewer-state-v1";
const MS_HOUR = 3600 * 1000;
const MS_DAY = 24 * MS_HOUR;

// 最近一次成功保存的状态快照（仅用于 saveState 的骤降保护对比；不持久化）
let lastSavedState = null;

// 数据安全标记：stateBlocked = true 表示「读到的状态已损坏且未能安全恢复」，
// 此时应进入安全态（拒绝一切覆盖式写回），而非把空对象当成新用户。
// ★ 声明必须先于 `let state = loadState()`，否则 loadState 内赋值会触发 TDZ 错误。
let stateBlocked = false;
let stateLoadReport = null;   // 诊断信息（reason / raw 长度 / 备份键）

// state: { [itemId]: { difficulty, stability, lastReview, nextReview, reviews, history[] } }
let state = loadState();

function loadState() {
  // 统一走 state-safety.js 的护栏：区分「真正的新用户」与「有数据但读坏了」。
  if (!window.StateSafety || typeof window.StateSafety.safeLoadState !== "function") {
    // 安全层缺失时退化为旧行为（不应发生：state-safety.js 在 app.js 之前加载）
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }
  const r = window.StateSafety.safeLoadState(STORAGE_KEY);
  stateLoadReport = r;
  if (r.ok) {
    // 正常（新用户 empty / 已加载 loaded）
    return r.state;
  }
  // ---- 以下为异常路径：原有数据不可解析或类型错误 ----
  // 1) 保全原始数据（另存备份键，绝不改动原键）
  const backupKey = window.StateSafety.preserveCorrupt(r.raw, STORAGE_KEY);
  // 2) 进入安全态：阻止任何覆盖式写回，避免把损坏态"洗成"仅含少量新记录
  stateBlocked = true;
  stateLoadReport.backupKey = backupKey;
  // 3) 明确诊断（控制台可见；不弹窗打断，避免影响正常复习入口）
  console.error(
    "[数据安全] reviewer-state-v1 读取异常，已阻止自动覆盖。\n" +
    "  原因: " + r.reason + (r.error ? "（" + r.error + "）" : "") + "\n" +
    "  原始长度: " + (r.raw === null ? 0 : String(r.raw).length) + " 字符\n" +
    "  已保全到: " + (backupKey || "（保全失败：存储不可写）") + "\n" +
    "  本次将以空状态进入只读安全模式：不会覆盖原数据；请先备份/从云端恢复后再继续。"
  );
  return {};
}

function saveState() {
  // 安全态：绝不写回（防止把损坏状态覆盖成"少量新记录"）
  if (stateBlocked) {
    console.warn("[数据安全] 当前处于安全模式（状态读取异常），已阻止本次保存以免覆盖原数据。");
    return false;
  }
  // 骤降保护：拒绝用异常缩小的状态覆盖已有学习数据
  if (window.StateSafety && typeof window.StateSafety.guardSave === "function") {
    const prev = lastSavedState !== null ? lastSavedState : loadStateForGuard();
    const g = window.StateSafety.guardSave(prev, state);
    if (!g.allow) {
      console.error(
        "[数据安全] 已阻止覆盖：状态条目数异常骤降（" + g.before + " → " + g.after + "，原因：" + g.reason + "）。\n" +
        "  原状态保持不变；未上传云端、未覆盖备份。\n" +
        "  如确需继续，请先从云端恢复或导入备份。"
      );
      return false;
    }
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    lastSavedState = JSON.parse(JSON.stringify(state));
    return true;
  } catch (e) {
    console.error("[数据安全] 保存失败：", e);
    return false;
  }
}

// 骤降保护的基准状态：优先用内存快照；没有时读取存储中的现值。
// 注意：此函数只读，不写盘、不改全局标记。
function loadStateForGuard() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw);
    return (p && typeof p === "object" && !Array.isArray(p)) ? p : {};
  } catch (e) {
    return null; // 读不出来时返回 null → guardSave 视作 before=0（不触发保护）
  }
}

// ---------- 2. 记忆算法（PDM v1：Personal Dynamic Memory，可替换） ----------

// 所有参数集中在此，调整难度只需改这里（人为设定初始值，非墨墨参数）
const PDM_CONFIG = {
  targetRetention: 0.85,     // 目标回忆概率 p（预计 R 降到 p 时就再见）
  stabilityScale: 2,         // λ：稳定性时间尺度（λ=1 = 旧行为；2 = 受控校准值，只放大 retention 时间尺度与计划间隔）
  dInit: 0.30,               // 新对象难度初值
  dMin: 0.05, dMax: 0.95,    // 难度钳位
  sMin: 0.3, sMax: 730,      // 稳定性钳位（天，约 7 小时 ~ 2 年）
  minIntervalHours: 12,      // 全局最短复习间隔（小时）
  lapseFloorDays: 1,         // 忘记后恢复间隔下限（24h）
  lapseCapDays: 2,           // 忘记后恢复间隔上限（48h）
  firstS: { "忘记": 0.6, "困难": 1.0, "记得": 2.0, "简单": 3.5 },   // 首次复习初始稳定性（天）
  base: { "忘记": 0.25, "困难": 1.1, "记得": 1.4, "简单": 1.8 },   // S 增长基准
  creditWeight: { "忘记": 0.5, "困难": 0.3, "记得": 0.5, "简单": 0.6 }, // 压力加成权重
  damping: 0.15,             // 难度对增长率的阻尼系数
  dDelta: { "忘记": 0.08, "困难": 0.03, "记得": 0, "简单": -0.02 }, // 首次复习难度增量
  lapseDBase: 0.02,          // 后续忘记的难度基础增量
  lapseDSurprise: 0.08       // 后续忘记的"意外程度"权重（×R）
};

// 目标间隔系数 k = log2(1/p)，由 targetRetention 推导（p=0.85 → ≈0.2345），非独立参数
const K_INTERVAL = Math.log2(1 / PDM_CONFIG.targetRetention);

// 数值钳位
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// 加载时一次性迁移旧数据（只补 null/缺失字段，不覆盖数字、不删除任何字段）
migrateAllState();

// 加载时执行一次 ID 迁移（历史孤儿 item.id → 当前知识库有效 id）。
// 幂等：第二次运行不再有任何迁移动作；未确认的旧 id 原样保留，不删除、不合并。
(function runIdMigrationOnLoad() {
  if (stateBlocked) return;                                  // 安全态下不做任何改动
  if (!window.StateSafety || typeof window.StateSafety.migrateIds !== "function") return;
  const before = Object.keys(state).length;
  const report = window.StateSafety.migrateIds(state);
  const after = Object.keys(state).length;
  if (report.moved.length) {
    console.log("[ID 迁移] 已迁移 " + report.moved.length + " 条：", report.moved,
                "｜条目数 " + before + " → " + after);
    // 迁移改变了 state 内容：写回一次（saveState 含安全护栏）
    saveState();
  }
  if (report.unresolved.length) {
    console.log("[ID 迁移] 未确认归宿的历史 id（已原样保留，不删除、不合并）：" + report.unresolved.length + " 条",
                report.unresolved);
  }
  if (report.skipped.length) {
    console.warn("[ID 迁移] 已跳过的映射（目标不在当前知识库或映射无效）：", report.skipped);
  }
})();

// 记忆对象状态字段：
//   difficulty  相对难度（0.05~0.95，越高越难记）
//   stability   记忆半衰期（天）：预计回忆概率 R 降到 0.5 所需时间；新卡为 null
//   lastReview  上次复习时间戳
//   nextReview  下次复习时间戳（调度器唯一入口；0 = 立即到期）
//   reviews     复习总次数（展示用，不参与计算）
//   history     最近 50 条评价记录（调试用，不参与计算）

// ---- 旧 SM-2 遗留数据迁移（只补 null/缺失的 PDM 字段，幂等） ----
// 旧数据里 difficulty/stability/nextReview 可能是 null（旧 SM-2 版遗留）：
// 原迁移只处理 undefined，null 被跳过 → nextReview=null 被调度器当成"最早到期"永远排第一。
// 这里把 null 与缺失同等对待：
//   difficulty ← ef 换算（ef 2.5→0.05 易、1.3→0.95 难）
//   stability  ← lastIntervalDays / k（S×k ≈ 原计划间隔，平滑过渡）
//   nextReview ← 已复习过：lastReview + 一个间隔（间隔 = S×k；无间隔信息用最短 12h）
//                从未复习过：0（作为新卡立即到期，与原行为一致）
// 已是数字的字段一律不动；不删除 history / reviews / n / ef / lastIntervalDays。
function migrateLegacyState(s) {
  if (s.difficulty == null) {
    const ef = typeof s.ef === "number" ? s.ef : 2.2;
    s.difficulty = clamp((2.5 - ef) / 1.2, PDM_CONFIG.dMin, PDM_CONFIG.dMax);
  }
  if (s.stability == null) {
    const i = s.lastIntervalDays || 0;
    s.stability = i > 0 ? clamp(i / K_INTERVAL, PDM_CONFIG.sMin, PDM_CONFIG.sMax) : null;
  }
  if (s.nextReview == null) {
    if (typeof s.lastReview === "number" && s.lastReview > 0 && (s.reviews || 0) > 0) {
      const days = (typeof s.stability === "number" && s.stability > 0)
        ? Math.max(s.stability * K_INTERVAL, PDM_CONFIG.minIntervalHours / 24)
        : PDM_CONFIG.minIntervalHours / 24;
      s.nextReview = s.lastReview + days * MS_DAY;
    } else {
      s.nextReview = 0;
    }
  }
}

// 对全部记忆状态执行旧数据迁移（加载时 / 导入后调用）
function migrateAllState() {
  for (const id of Object.keys(state)) migrateLegacyState(state[id]);
}

// 惰性迁移：取某对象的记忆状态。
// 旧数据（SM-2 简化版：n / ef / lastIntervalDays）换算为 difficulty / stability，
// 不覆盖已有 lastReview / nextReview / reviews / history；旧字段残留无害，不再使用。
function ensureState(itemId) {
  let s = state[itemId];
  if (!s) {
    s = { difficulty: PDM_CONFIG.dInit, stability: null,
          lastReview: null, nextReview: 0, reviews: 0, history: [] };
    state[itemId] = s;
    return s;
  }
  if (s.lastReview === undefined) s.lastReview = null;
  if (s.reviews === undefined) s.reviews = 0;
  if (!Array.isArray(s.history)) s.history = [];
  migrateLegacyState(s);
  // 旧"忘记 → 4 小时"残留的 nextReview（未来但不足最短间隔）提升到最短间隔，避免上线即超短重复
  const now = Date.now();
  if (typeof s.nextReview === "number" && s.nextReview > now) {
    const minNext = now + PDM_CONFIG.minIntervalHours * MS_HOUR;
    if (s.nextReview < minNext) s.nextReview = minNext;
  }
  return s;
}

// 核心：用本次评价更新记忆状态，返回下次复习时间（毫秒）
// PDM v1（详见 DESIGN-MEMORY-ALGORITHM.md）：
//   ① R = 2^(-elapsed/(λ·S)) 估计当前回忆概率；credit = 1 - R（复习得越晚还能记住，credit 越大）
//   ② 首次复习：S 查表定初始稳定性；D 用固定增量
//   ③ 后续复习：S_new = S × (base + creditWeight × credit) × (1 - 0.15 × D)
//   ④ D：忘记 +0.02 + 0.08×R（R 越高 = 越出乎模型预期的遗忘 → 难度加得越多）；
//      困难 +0.03；记得 0；简单 -0.02
//   ⑤ 下次间隔：忘记 → clamp(S×λ×k, 1天, 2天)（24~48h 恢复）；其他 → max(S×λ×k, 12小时)
function applyReview(st, grade, now) {
  const cfg = PDM_CONFIG;

  let S, D;
  if (st.stability == null) {
    // 首次复习：无历史稳定性可参考，直接查表
    S = cfg.firstS[grade];
    D = clamp(st.difficulty + cfg.dDelta[grade], cfg.dMin, cfg.dMax);
  } else {
    const elapsedDays = st.lastReview ? (now - st.lastReview) / MS_DAY : 0;
    const R = Math.pow(2, -elapsedDays / (st.stability * cfg.stabilityScale));
    const credit = 1 - R;
    const mult = cfg.base[grade] + cfg.creditWeight[grade] * credit;
    S = clamp(st.stability * mult * (1 - cfg.damping * st.difficulty), cfg.sMin, cfg.sMax);
    if (grade === "忘记") {
      D = clamp(st.difficulty + cfg.lapseDBase + cfg.lapseDSurprise * R, cfg.dMin, cfg.dMax);
    } else {
      D = clamp(st.difficulty + cfg.dDelta[grade], cfg.dMin, cfg.dMax);
    }
  }

  // 下次复习间隔（天）：k = log2(1/p)，再乘 λ（stabilityScale）
  let intervalDays = S * K_INTERVAL * cfg.stabilityScale;
  if (grade === "忘记") {
    intervalDays = clamp(intervalDays, cfg.lapseFloorDays, cfg.lapseCapDays);
  } else {
    intervalDays = Math.max(intervalDays, cfg.minIntervalHours / 24);
  }

  st.difficulty = D;
  st.stability = S;
  st.lastReview = now;
  st.nextReview = now + intervalDays * MS_DAY;
  st.reviews += 1;
  st.history.push({ time: now, grade });
  if (st.history.length > 50) st.history = st.history.slice(-50);
  return st.nextReview;
}

// ---------- 3. 复习调度器 ----------
// 职责：选出"这一轮"要复习的记忆对象，并减少同一主题的短时间重复。
// 规则：到期(或新卡) → 按急迫度排序 → 两轮轮转，每个主题每轮最多 1 张
//       → 同一主题一轮最多出现 2 张，且两张之间必然隔着其他主题。

function getDueList() {
  const now = Date.now();
  const due = [];
  for (const topic of KNOWLEDGE) {
    for (const item of topic.items) {
      const st = state[item.id];
      const isNew = !st;
      const isDue = st && st.nextReview <= now;
      if (isNew || isDue) {
        due.push({ topic, item, st });
      }
    }
  }
  return due;
}

function buildReviewQueue(source) {
  const due = source || getDueList();
  if (due.length === 0) return [];

  // 急迫度排序：新卡最前，其余按到期时间（越早越急）
  due.sort((a, b) => {
    const ta = a.st ? a.st.nextReview : 0;
    const tb = b.st ? b.st.nextReview : 0;
    return ta - tb;
  });

  // 按急迫度顺序得到主题顺序，再按主题分组（组内保持急迫度顺序）
  const topicOrder = [];
  const byTopic = {};
  for (const d of due) {
    if (!(d.topic.id in byTopic)) {
      byTopic[d.topic.id] = [];
      topicOrder.push(d.topic.id);
    }
    byTopic[d.topic.id].push(d);
  }

  // 两轮轮转：每个主题每轮最多出 1 张
  const queue = [];
  for (let round = 0; round < 2; round++) {
    for (const tid of topicOrder) {
      const list = byTopic[tid];
      if (list && list.length) queue.push(list.shift());
    }
  }
  return queue;
}

// ---------- 3.5 富文本渲染（**…** 标红） ----------
// 知识库中的 **xxx** 渲染为红色；先转义 HTML 再替换标记，保证安全。
function renderRich(text) {
  if (!text) return "";
  const esc = String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc.replace(/\*\*(.+?)\*\*/g, '<span class="hl-red">$1</span>');
}

// ---------- 4. 复习流程 ----------

let queue = [];
let queueIndex = 0;
// grades：本轮四档评价计数（完成屏回顾卡用，仅内存、不持久化）；
// startTime：本轮开始时间（完成屏「本轮用时」）。
let sessionStats = { done: 0, skipped: 0, grades: { "忘记": 0, "困难": 0, "记得": 0, "简单": 0 }, startTime: 0 };

function resetSessionStats() {
  sessionStats = { done: 0, skipped: 0, grades: { "忘记": 0, "困难": 0, "记得": 0, "简单": 0 }, startTime: Date.now() };
}

// "上一题"支持：最近一次评价前的状态快照（prevState 为 null 表示评价前无状态）
let lastAction = null;
let canGoBack = false;

function updateBackBtn() {
  const btn = document.getElementById("backBtn");
  if (canGoBack) btn.classList.remove("hidden");
  else btn.classList.add("hidden");
}

// 底部操作层：细横线(recall/collapsed) ↔ 展开为四档记忆(grade) / 判断题两档(judge)
function setActionBar(mode) {
  const bar = document.getElementById("actionBar");
  if (!bar) return;
  const map = { grade: "gradeOptions", judge: "judgeOptions", ready: "readyOptions" };
  if (mode === "grade" || mode === "judge" || mode === "ready") {
    bar.classList.add("expanded");
    for (const key of Object.keys(map)) {
      const el = document.getElementById(map[key]);
      if (el) el.classList.toggle("hidden", key !== mode);
    }
  } else {
    bar.classList.remove("expanded");
    for (const key of Object.keys(map)) {
      const el = document.getElementById(map[key]);
      if (el) el.classList.add("hidden");
    }
  }
}

// 答案 → 下一张：整卡滑出再滑入（不阻塞复习流程，动画期间锁定点击）
let animating = false;
function advanceWithSlide(after) {
  if (animating) return;
  const card = document.querySelector(".card");
  if (!card) { after(); return; }
  if (typeof card.animate !== "function") { after(); return; } // 不支持动画直接切换
  animating = true;
  card.style.pointerEvents = "none";
  card.classList.add("anim-out");
  setTimeout(function () {
    after();
    card.classList.remove("anim-out");
    card.classList.add("anim-in");
    void card.offsetWidth;           // 强制回流，让滑入从右侧开始
    card.classList.remove("anim-in");
    setTimeout(function () {
      card.style.pointerEvents = "";
      animating = false;
    }, 220);
  }, 200);
}

// 应用内轻提示：替代原生 alert，避免显示来源网址/项目名标题
let noticeTimer = null;
function showNotice(text) {
  let box = document.getElementById("noticeBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "noticeBox";
    box.className = "notice-box";
    document.body.appendChild(box);
  }
  box.textContent = text;
  box.classList.add("show");
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(function () { box.classList.remove("show"); }, 2800);
}

function refreshReadyView() {
  const dueCount = getDueList().length;
  document.getElementById("dueCount").textContent = dueCount;
  document.getElementById("readyView").classList.remove("hidden");
  document.getElementById("recallView").classList.add("hidden");
  document.getElementById("gradeView").classList.add("hidden");
  document.getElementById("judgeView").classList.add("hidden");
  document.getElementById("doneView").classList.add("hidden");
  setActionBar("ready");
  document.body.classList.remove("reviewing");
  updateBackBtn();
}

function startSession() {
  queue = buildReviewQueue();
  beginSession();
}

// 再学新词：只把「从未学习过」的新词组进队列（不动 PDM 到期队列的调度逻辑）
function startNewWordsSession() {
  queue = buildReviewQueue(getDueList().filter((d) => !d.st));
  beginSession();
}

function beginSession() {
  queueIndex = 0;
  resetSessionStats();
  canGoBack = false;
  lastAction = null;
  updateBackBtn();
  if (queue.length === 0) {
    // 无待复习：完成屏平静态（取代过去的「空卡片 + toast」）
    renderDoneIdle();
    return;
  }
  document.getElementById("readyView").classList.add("hidden");
  document.getElementById("doneView").classList.add("hidden");
  document.body.classList.add("reviewing");
  showNext();
}

function showNext() {
  if (queueIndex >= queue.length) {
    finishSession();
    return;
  }
  const d = queue[queueIndex];
  const el = (id) => document.getElementById(id);
  // 判断题（judge）：显示问句 → 选答（选项随题目而定）→ 显示答案（答对=简单、答错=忘记）
  if (d.item.judge) {
    showJudge();
    return;
  }
  // 直接卡（direct）：原则直接给出，跳过"回忆→显示答案"，直接展示内容并评价
  if (d.item.direct) {
    showAnswerContent(d);
    return;
  }
  el("progressText").textContent = `第 ${queueIndex + 1} / ${queue.length} 项`;
  el("typeTag").textContent = d.item.type;
  el("topicName").innerHTML = renderRich(d.topic.name);
  el("promptText").innerHTML = renderRich(d.item.prompt);

  el("recallView").classList.remove("hidden");
  el("gradeView").classList.add("hidden");
  el("judgeView").classList.add("hidden");
  setActionBar("recall");
}

// 展示答案内容并进入评价视图
function showAnswerContent(d) {
  const el = (id) => document.getElementById(id);
  el("progressText2").textContent = `第 ${queueIndex + 1} / ${queue.length} 项`;
  el("typeTag2").textContent = d.item.type;
  el("topicName2").innerHTML = renderRich(d.topic.name);
  // 答案页顶部显示题干（灰色小字）；直接卡题干即内容本身，不重复显示
  const pia = el("promptInAnswer");
  if (d.item.prompt && d.item.answer) {
    pia.innerHTML = renderRich(d.item.prompt);
    pia.classList.remove("hidden");
  } else {
    pia.classList.add("hidden");
  }
  // 直接卡没有隐藏答案：内容即 prompt（原则）
  el("answerText").innerHTML = renderRich(d.item.answer || d.item.prompt);

  // 辅助材料
  const box = el("materialsBox");
  const list = el("materialsList");
  list.innerHTML = "";
  if (d.item.materials && d.item.materials.length) {
    for (const m of d.item.materials) {
      const p = document.createElement("p");
      p.innerHTML = renderRich(m);
      list.appendChild(p);
    }
    box.classList.remove("hidden");
  } else {
    box.classList.add("hidden");
  }

  // 相关主题提示
  const relBox = el("relatedBox");
  if (d.topic.related && d.topic.related.length) {
    relBox.textContent = "相关：" + d.topic.related.join("、");
    relBox.classList.remove("hidden");
  } else {
    relBox.classList.add("hidden");
  }

  el("recallView").classList.add("hidden");
  el("gradeView").classList.remove("hidden");
  el("judgeView").classList.add("hidden");
  setActionBar("grade");
}

function revealAnswer() {
  showAnswerContent(queue[queueIndex]);
}

// ---------- 4b. 判断题流程 ----------
// 题干保持自然疑问句；两档按钮是「对这个疑问句的直接回答」，随题目变化。
// 选项来源：item.choices（数组顺序 = 按钮顺序）+ item.correct（正确选项索引）；
// 未声明 choices 的历史卡回退为「❌ 错 / ✅ 对」两档（仍由 expected 判定）。

let pendingGrade = null;

const JUDGE_FALLBACK_CHOICES = ["❌ 错", "✅ 对"];

// 解析一道判断题的两个选项与正确项下标
function judgeOptionsFor(item) {
  const c = item ? item.choices : null;
  if (Array.isArray(c) && c.length === 2 && typeof c[0] === "string" && typeof c[1] === "string") {
    let idx = Number(item.correct);
    if (idx !== 0 && idx !== 1) idx = item.expected === false ? 1 : 0; // 容错兜底，正常数据不会走到
    return { labels: [c[0], c[1]], correctIndex: idx, legacy: false };
  }
  const expected = !item || item.expected === undefined ? true : !!item.expected;
  return { labels: JUDGE_FALLBACK_CHOICES.slice(), correctIndex: expected ? 1 : 0, legacy: true };
}

// answer 约定：「正确答案：<正确选项>。<解析>」→ 拆成正确选项与解析两句
const JUDGE_ANSWER_PREFIX = "正确答案：";
function judgeAnswerParts(answer, opt) {
  const s = String(answer || "");
  if (s.indexOf(JUDGE_ANSWER_PREFIX) === 0) {
    const end = s.indexOf("。");
    if (end > JUDGE_ANSWER_PREFIX.length) {
      return { label: s.slice(JUDGE_ANSWER_PREFIX.length, end), explanation: s.slice(end + 1).trim() };
    }
  }
  return { label: opt.labels[opt.correctIndex], explanation: s };
}

function showJudge() {
  const d = queue[queueIndex];
  const el = (id) => document.getElementById(id);
  const opt = judgeOptionsFor(d.item);
  const btns = [el("judgeLeftBtn"), el("judgeRightBtn")];
  for (let i = 0; i < btns.length; i++) {
    if (!btns[i]) continue;
    btns[i].textContent = opt.labels[i];
    // 传统对/错两档沿用红/绿配色；选项式回答用中性色（颜色不再暗示对错）
    if (opt.legacy) btns[i].setAttribute("data-judge", i === 1 ? "true" : "false");
    else btns[i].removeAttribute("data-judge");
  }
  el("judgeProgress").textContent = `第 ${queueIndex + 1} / ${queue.length} 项`;
  el("judgeType").textContent = d.item.type;
  el("judgeTopic").innerHTML = renderRich(d.topic.name);
  el("judgePrompt").innerHTML = renderRich(d.item.prompt);
  el("judgeResult").className = "";
  el("judgeAnswerBox").classList.add("hidden");
  el("judgeNextBtn").classList.add("hidden");
  el("judgeView").classList.remove("hidden");
  el("recallView").classList.add("hidden");
  el("gradeView").classList.add("hidden");
  setActionBar("judge");
}

// 选中第 index 个按钮（0=左，1=右）；评价口径不变：判断正确 → 简单、判断错误 → 忘记
function judgeChoose(index) {
  const d = queue[queueIndex];
  const el = (id) => document.getElementById(id);
  const opt = judgeOptionsFor(d.item);
  const isCorrect = index === opt.correctIndex;
  pendingGrade = isCorrect ? "简单" : "忘记";
  setActionBar("collapsed");
  const parts = judgeAnswerParts(d.item.answer, opt);
  const result = el("judgeResult");
  result.textContent = isCorrect ? "✓ 正确" : "✗ 错误";
  result.className = isCorrect ? "ok" : "wrong";
  // 答对：直接给解析；答错：先亮出正确选项，再给解析
  el("judgeAnswerText").innerHTML =
    (isCorrect ? "" : `<span class="judge-correct">正确答案：${renderRich(parts.label)}</span>\n`) +
    renderRich(parts.explanation);
  el("judgeAnswerBox").classList.remove("hidden");
  el("judgeNextBtn").classList.remove("hidden");
}

function judgeNext() {
  gradeCurrent(pendingGrade);
}

function gradeCurrent(grade) {
  const d = queue[queueIndex];
  // 保存评价前快照，供"上一题"恢复；评价后最多允许回退一步
  lastAction = {
    itemId: d.item.id,
    grade: grade,
    prevState: state[d.item.id] ? JSON.parse(JSON.stringify(state[d.item.id])) : null
  };
  canGoBack = true;
  const st = ensureState(d.item.id);
  applyReview(st, grade, Date.now());
  saveState();

  sessionStats.done += 1;
  sessionStats.grades[grade] = (sessionStats.grades[grade] || 0) + 1;
  queueIndex += 1;
  updateBackBtn();
  advanceWithSlide(showNext);
}

// 返回上一题：撤销最近一次评价（恢复该对象评价前状态），重新显示答案页供重新评价。
// 以最后一次选择为准；同一对象不会产生两次复习记录（快照恢复后 history/reviews 回到评价前）。
function goBack() {
  if (!canGoBack || !lastAction) return;
  const action = lastAction;
  canGoBack = false;
  lastAction = null;
  // 恢复评价前状态（新卡则删除该状态）
  if (action.prevState === null) {
    delete state[action.itemId];
  } else {
    state[action.itemId] = action.prevState;
  }
  saveState();
  // 回退指针并撤销计数
  sessionStats.done = Math.max(0, sessionStats.done - 1);
  if (action.grade) {
    sessionStats.grades[action.grade] = Math.max(0, (sessionStats.grades[action.grade] || 0) - 1);
  }
  queueIndex -= 1;
  updateBackBtn();
  document.getElementById("doneView").classList.add("hidden");
  // 重新显示上一题的评价界面（判断题回到判断按钮，普通卡/直接卡回到答案页）
  const d = queue[queueIndex];
  if (d.item.judge) showJudge();
  else showAnswerContent(d);
}

function finishSession() {
  renderDoneSession();
}

// ---------- 4c. 复习完成屏（v1.18.0） ----------
// 两种形态：session = 一轮复习刚结束（庆祝 + 本轮回顾卡）；
//           idle   = 当前无待复习（平静态，取代旧「空卡片 + toast」）。
// 数据全部来自本轮内存统计与现有复习状态实时计算，不新增任何存储。

function hideCardViews() {
  for (const id of ["readyView", "recallView", "gradeView", "judgeView", "doneView"]) {
    document.getElementById(id).classList.add("hidden");
  }
}

function showDoneView() {
  hideCardViews();
  document.getElementById("doneView").classList.remove("hidden");
  setActionBar("collapsed");
  document.body.classList.remove("reviewing");
  updateBackBtn();
}

// 数字滚动（完成屏轻量动效；target 为 0 或无 rAF 环境时直接落定）
function countUp(el, target, dur) {
  if (!el) return;
  if (!target || typeof requestAnimationFrame !== "function" || typeof performance === "undefined") {
    el.textContent = String(target || 0);
    return;
  }
  const t0 = performance.now();
  function step(ts) {
    const p = Math.min((ts - t0) / dur, 1);
    el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Stats 模块兜底：浏览器中 stats.js 先于 app.js 加载；
// 沙箱/测试环境缺失时降级为 null（完成屏只隐藏对应信息，不报错）。
function computeStatsSafe(now) {
  return (window.Stats && typeof window.Stats.compute === "function")
    ? window.Stats.compute(state, KNOWLEDGE, now)
    : null;
}

// 到期预告：「下一项 X 到期 · 明天待复习 N 项」（无未来到期项时返回空串）
function nextDueInfo(now) {
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const t0 = dayStart.getTime();
  let nextTs = null;
  let tomorrow = 0;
  for (const topic of KNOWLEDGE) {
    for (const item of topic.items) {
      const st = state[item.id];
      if (!st || typeof st.nextReview !== "number" || st.nextReview <= now) continue;
      if (nextTs === null || st.nextReview < nextTs) nextTs = st.nextReview;
      if (st.nextReview >= t0 + MS_DAY && st.nextReview < t0 + 2 * MS_DAY) tomorrow++;
    }
  }
  const parts = [];
  if (nextTs !== null) {
    const d = new Date(nextTs);
    const hm = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    let when;
    if (nextTs < t0 + MS_DAY) when = hm;
    else if (nextTs < t0 + 2 * MS_DAY) when = "明天 " + hm;
    else when = (d.getMonth() + 1) + "月" + d.getDate() + "日";
    parts.push("下一项 " + when + " 到期");
  }
  if (tomorrow > 0) parts.push("明天待复习 " + tomorrow + " 项");
  return parts.join(" · ");
}

// 完成屏公共部分：标题 / 连续天数副标题 / 到期预告，并切换视图
function renderDoneCommon(titleText) {
  const el = (id) => document.getElementById(id);
  el("doneTitle").textContent = titleText;
  const stats = computeStatsSafe(Date.now());
  const sub = el("doneSub");
  if (stats && stats.streak > 0) {
    sub.textContent = "连续学习 " + stats.streak + " 天";
    sub.classList.remove("hidden");
  } else {
    sub.classList.add("hidden");
  }
  const next = el("doneNext");
  const info = nextDueInfo(Date.now());
  next.textContent = info;
  next.classList.toggle("hidden", !info);
  showDoneView();
  return stats;
}

// 完成屏出口权重（v1.19.0）：主按钮 = 完成复习后的首要意图「再学 N 个新词」；
// 无新词可学时（或 idle 态）回退为「查看学习统计」；「返回首页」恒为文字钮。
function applyDoneCtaWeights() {
  const newBtn = document.getElementById("doneNewBtn");
  const statsBtn = document.getElementById("doneStatsBtn");
  if (!newBtn || !statsBtn) return;
  const hasNew = !newBtn.classList.contains("hidden");
  newBtn.classList.remove("done-cta-secondary");
  newBtn.classList.toggle("done-cta-primary", hasNew);
  statsBtn.classList.toggle("done-cta-primary", !hasNew);
  statsBtn.classList.toggle("done-cta-secondary", hasNew);
}

function renderDoneSession() {
  const el = (id) => document.getElementById(id);
  renderDoneCommon("本轮复习完成！");

  // 本轮回顾卡：项数 / 用时 / 四档分布
  el("doneRecap").classList.remove("hidden");
  countUp(el("doneItems"), sessionStats.done, 600);
  const secs = Math.max(1, Math.round((Date.now() - sessionStats.startTime) / 1000));
  if (secs < 90) {
    el("doneMinutes").textContent = String(secs);
    el("doneMinUnit").textContent = " 秒";
  } else {
    countUp(el("doneMinutes"), Math.round(secs / 60), 600);
    el("doneMinUnit").textContent = " 分";
  }
  const g = sessionStats.grades;
  renderMasteryDonut(g);

  // 轮转上限留下的到期项：说明留到下一轮（沿用旧版文案口径）
  const dueLeft = getDueList().length;
  const note = el("doneNote");
  if (dueLeft > 0) {
    note.textContent = "还有 " + dueLeft + " 项已到期，为避免同一主题短时间重复，留到下一轮再安排。";
    note.classList.remove("hidden");
  } else {
    note.classList.add("hidden");
  }

  // 再学新词：仅统计从未学习过的新词（同样受同主题一轮最多 2 张约束）
  const newQueue = buildReviewQueue(getDueList().filter((d) => !d.st));
  const newBtn = el("doneNewBtn");
  if (newQueue.length > 0) {
    newBtn.textContent = "再学 " + newQueue.length + " 个新词";
    newBtn.classList.remove("hidden");
  } else {
    newBtn.classList.add("hidden");
  }
  applyDoneCtaWeights();
}

function renderDoneIdle() {
  const el = (id) => document.getElementById(id);
  const stats = computeStatsSafe(Date.now());
  const today = stats && stats.last7 && stats.last7.find((d) => d.today);
  renderDoneCommon(today && today.reviews > 0 ? "今日复习已完成" : "今日没有待复习");
  el("doneRecap").classList.add("hidden");
  el("doneNote").classList.add("hidden");
  el("doneNewBtn").classList.add("hidden");
  applyDoneCtaWeights();
}

// ---------- 4.5 掌握度环形图（v1.20.0） ----------
// 几何全在 SVG 用户坐标系（100×100，圆心 50,50）内计算：半径 40、线宽 14（环带 33~47）。
// 无缝隙：相邻扇区共享同一端点（平头端点 + 角度首尾相接），不预留任何角度间隙；
// 单一档位占满时走「两段半圆」的整圆路径（A 命令起终点重合会退化成空路径）。
// 某档为 0 时该扇区不绘制，但容器、底轨与图例照常 → 布局恒定，不跳动、不塌陷。
const DONUT_TIERS = [
  { grade: "忘记", key: "segForget", lg: "lgForget" },
  { grade: "困难", key: "segHard", lg: "lgHard" },
  { grade: "记得", key: "segRemember", lg: "lgRemember" },
  { grade: "简单", key: "segEasy", lg: "lgEasy" },
];
const DONUT_GEO = { cx: 50, cy: 50, r: 40 };

// 角度约定：0° = 12 点方向，顺时针增大
function donutPoint(deg) {
  const rad = (deg - 90) * Math.PI / 180;
  return [DONUT_GEO.cx + DONUT_GEO.r * Math.cos(rad), DONUT_GEO.cy + DONUT_GEO.r * Math.sin(rad)];
}

function donutArc(startDeg, endDeg) {
  const s = donutPoint(startDeg);
  const f = (n) => n.toFixed(2);
  if (endDeg - startDeg >= 359.999) {
    const m = donutPoint(startDeg + 180);
    const e = donutPoint(startDeg + 360);
    return "M" + f(s[0]) + " " + f(s[1]) +
      "A" + DONUT_GEO.r + " " + DONUT_GEO.r + " 0 0 1 " + f(m[0]) + " " + f(m[1]) +
      "A" + DONUT_GEO.r + " " + DONUT_GEO.r + " 0 0 1 " + f(e[0]) + " " + f(e[1]);
  }
  const e = donutPoint(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return "M" + f(s[0]) + " " + f(s[1]) +
    "A" + DONUT_GEO.r + " " + DONUT_GEO.r + " 0 " + large + " 1 " + f(e[0]) + " " + f(e[1]);
}

function renderMasteryDonut(counts) {
  const el = (id) => document.getElementById(id);
  const vals = DONUT_TIERS.map((t) => Math.max(0, counts[t.grade] || 0));
  const total = vals.reduce((a, b) => a + b, 0);
  let cursor = 0;
  const spoken = [];
  DONUT_TIERS.forEach((t, i) => {
    const v = vals[i];
    const path = el(t.key);
    const legend = el(t.lg);
    if (legend) legend.textContent = String(v);
    if (!path) return;
    if (v <= 0 || total <= 0) {
      path.removeAttribute("d");
      path.dataset.count = "0";
      path.dataset.pct = "0";
      return;
    }
    const start = cursor;
    const end = cursor + v / total * 360;      // 直接首尾相接：无缝隙
    cursor = end;
    path.setAttribute("d", donutArc(start, end));
    path.dataset.count = String(v);
    path.dataset.pct = String(Math.round(v / total * 100));
    spoken.push(t.grade + " " + v + " 项 " + path.dataset.pct + "%");
  });
  const wrap = el("masteryDonut");
  const svg = wrap && wrap.querySelector(".md-ring");
  if (svg) svg.setAttribute("aria-label", "四档掌握度分布：" + (spoken.length ? spoken.join("，") : "本轮无评价记录"));
  masteryHighlight(null);
}

// 悬浮高亮：对应扇区加厚 + 提示槽显示「档位 · 数值 · 占比」
function masteryHighlight(grade) {
  const wrap = document.getElementById("masteryDonut");
  if (!wrap) return;
  const tip = document.getElementById("mdTip");
  if (!grade) {
    wrap.classList.remove("is-hot");
    wrap.querySelectorAll(".md-seg").forEach((p) => p.classList.remove("hot"));
    if (tip) tip.textContent = "";
    return;
  }
  wrap.classList.add("is-hot");
  wrap.querySelectorAll(".md-seg").forEach((p) => {
    const on = p.dataset.grade === grade && !!p.getAttribute("d");
    p.classList.toggle("hot", on);
    if (on && tip) tip.textContent = grade + " · " + p.dataset.count + " 项 · " + p.dataset.pct + "%";
  });
}

function bindMasteryDonutHover() {
  const wrap = document.getElementById("masteryDonut");
  if (!wrap) return;
  wrap.querySelectorAll(".md-seg").forEach((p) => {
    const hot = () => { if (p.getAttribute("d")) masteryHighlight(p.dataset.grade); };
    p.addEventListener("pointerenter", hot);
    p.addEventListener("pointerleave", () => masteryHighlight(null));
    p.addEventListener("click", hot);
  });
  document.querySelectorAll(".done-legend [data-grade]").forEach((s) => {
    const hot = () => masteryHighlight(s.dataset.grade);
    s.addEventListener("pointerenter", hot);
    s.addEventListener("pointerleave", () => masteryHighlight(null));
    s.addEventListener("click", hot);
  });
  // 触屏：点空白处取消高亮（鼠标端无副作用）
  document.addEventListener("pointerdown", (e) => {
    const t = e.target;
    const inside = t && typeof t.closest === "function" &&
      (t.closest("#masteryDonut") || t.closest(".done-legend"));
    if (!inside) masteryHighlight(null);
  }, true);
}

// ---------- 5. 备份（导出 / 导入；格式与合并逻辑见 sync.js） ----------

// 导出：生成 reviewer-backup.json（{version, timestamp, reviewState, settings}）
function exportBackup() {
  const data = Sync.exportState(state, {});
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "reviewer-backup.json";
  a.click();
  URL.revokeObjectURL(a.href);
}

// 导入：解析备份文本（自动兼容旧格式）→ 弹窗选择「合并 / 覆盖 / 取消」。
// importBackupText 供文件导入与云端恢复共用（云端恢复见 cloud-sync.js），
// 成功后可执行 onSuccess 回调（云端恢复用于提示「云端恢复成功」并刷新）。
let pendingImport = null;
let afterImport = null;

function importBackupText(text, onSuccess) {
  try {
    const backup = Sync.importState(text);
    pendingImport = backup;
    afterImport = onSuccess || null;
    document.getElementById("importCount").textContent = Sync.countLearned(backup.reviewState);
    document.getElementById("importModal").classList.remove("hidden");
  } catch (e) {
    showNotice("导入失败：不是有效的备份文件。");
  }
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = function () {
    importBackupText(reader.result);
  };
  reader.readAsText(file);
}

function applyImport(mode) {
  if (!pendingImport) return;
  const backup = pendingImport;
  pendingImport = null;
  const cb = afterImport;
  afterImport = null;
  if (mode === "merge") {
    // 合并：逐对象取 lastReview 较新者（最近复习者优先）；本机没有的补上
    state = Sync.mergeState(state, backup.reviewState);
  } else {
    // 覆盖：整体替换（二次确认）
    if (!confirm("覆盖将替换当前所有记忆状态，确定继续吗？")) {
      cancelImport();
      return;
    }
    state = backup.reviewState;
  }
  migrateAllState(); // 导入/恢复的旧数据同样迁移（旧 Gist/备份自愈）
  saveState();
  refreshReadyView();
  document.getElementById("importModal").classList.add("hidden");
  if (cb) {
    cb(); // 云端恢复：提示「云端恢复成功」并刷新页面
  } else {
    showNotice("导入成功 ✅");
  }
}

function cancelImport() {
  pendingImport = null;
  afterImport = null;
  document.getElementById("importModal").classList.add("hidden");
}

// ---------- 5.5 学习统计视图 ----------
// 只读功能：每次打开都从现有复习状态实时重算（Stats.compute，见 stats.js），
// 不新增任何存储、不写 localStorage，因此刷新/导入/覆盖/云端恢复/撤销"上一题"
// 后统计天然与复习记录一致；本页不含任何对错评价指标。

function openStats() {
  renderStats();
  document.getElementById("statsView").classList.remove("hidden");
  document.body.classList.add("stats-open"); // 锁定背景滚动，浮层内独立滚动
}

function closeStats() {
  document.getElementById("statsView").classList.add("hidden");
  document.body.classList.remove("stats-open");
}

function renderStats() {
  const s = Stats.compute(state, KNOWLEDGE, Date.now());
  const el = (id) => document.getElementById(id);
  const setText = (id, v) => { el(id).textContent = v; };

  // 空数据横幅
  el("stEmptyBanner").classList.toggle("hidden", s.hasData);

  // 总体
  setText("stLearned", s.learned);
  setText("stTotalReviews", s.totalReviews);
  setText("stLearningDays", s.learningDays + " 天");
  setText("stStreak", s.streak + " 天");
  setText("stLastStudy", s.lastStudyISO || "暂无记录");

  // 数据积累时间
  setText("stStartDate", s.firstStudyISO || "暂无记录");
  setText("stAccumulated", s.hasData ? s.accumulatedDays + " 天" : "0 天");

  // 最近 7 天
  const l7Empty = el("stLast7Empty");
  const l7List = el("stLast7List");
  l7Empty.classList.toggle("hidden", s.hasData);
  l7List.classList.toggle("hidden", !s.hasData);
  l7List.innerHTML = "";
  if (s.hasData) {
    for (const d of s.last7) {
      const row = document.createElement("div");
      row.className = "d7-row";
      row.innerHTML =
        '<div class="d7-head"><span class="d7-date"></span><span class="d7-nums"></span></div>' +
        '<div class="d7-bar"><i></i></div>';
      const dateSpan = row.querySelector(".d7-date");
      dateSpan.textContent = d.label + (d.today ? "（今天）" : "");
      if (d.today) dateSpan.classList.add("today");
      row.querySelector(".d7-nums").textContent =
        d.reviews + " 次复习 · " + d.newWords + " 个新词 · 共 " + d.total;
      row.querySelector(".d7-bar i").style.width =
        (s.maxReviews7 > 0 ? Math.round((d.total / s.maxReviews7) * 100) : 0) + "%";
      l7List.appendChild(row);
    }
  }

  // 最近 30 天柱状图
  const l30Empty = el("stLast30Empty");
  const chart = el("stLast30Chart");
  l30Empty.classList.toggle("hidden", s.hasData);
  chart.classList.toggle("hidden", !s.hasData);
  chart.innerHTML = "";
  if (s.hasData) {
    for (let i = 0; i < s.last30.length; i++) {
      const d = s.last30[i];
      const col = document.createElement("div");
      col.className = "bcol";
      const h = d.reviews > 0
        ? Math.max(4, Math.round((d.reviews / s.maxReviews30) * 100))
        : 2;
      col.innerHTML =
        '<div class="bar-wrap"><div class="bar' + (d.reviews === 0 ? " zero" : "") +
        '" style="height:' + h + '%" title="' + d.label + "：" + d.reviews + ' 次复习"></div></div>' +
        '<div class="blabel' + (i % 5 === 0 || i === 29 ? "" : " hide") + '">' + d.short + "</div>";
      chart.appendChild(col);
    }
  }
  setText("stLast30Summary", s.hasData
    ? "近 30 天共复习 " + s.totalReviews30 + " 次 · 单日最高 " + s.maxReviews30 + " 次"
    : "");

  // 复习状态
  setText("stTodayDue", s.todayDue);
  setText("stNowDue", s.nowDue);
  setText("stLearnedStatus", s.learned);
  setText("stNever", s.never);

  // PDM 数据积累
  setText("stPdmReviews", s.totalReviews);
  setText("stPdmWords", s.learned);
  setText("stPdmDays", s.hasData ? s.accumulatedDays + " 天" : "0 天");
}

// ---------- 6. 事件绑定与启动 ----------

// ===== 顶栏「更多」收纳菜单（v1.19.0） =====
// 顶栏结构在任何状态下恒定为「上一题 + 更多」两项（上一题与更多并列同级），
// 其余工具按钮收进菜单，功能与顺序不变。结构恒定 = 状态切换时顶栏尺寸不变，
// 不会出现布局跳动或按钮闪烁。
function setMoreMenu(open) {
  const btn = document.getElementById("moreBtn");
  const menu = document.getElementById("moreMenu");
  if (!btn || !menu) return;
  menu.classList.toggle("hidden", !open);
  btn.setAttribute("aria-expanded", open ? "true" : "false");
}
function isMoreMenuOpen() {
  const menu = document.getElementById("moreMenu");
  return !!menu && !menu.classList.contains("hidden");
}
document.getElementById("moreBtn").addEventListener("click", function (e) {
  e.stopPropagation();
  setMoreMenu(!isMoreMenuOpen());
});
// 菜单内点选后立即收起（按钮自身的 click 监听先于此处冒泡执行，功能不受影响）
document.getElementById("moreMenu").addEventListener("click", function (e) {
  const t = e.target;
  if (t && typeof t.closest === "function" && t.closest("button")) setMoreMenu(false);
});
// 点击页面其他位置 / Esc 关闭
document.addEventListener("click", function (e) {
  if (!isMoreMenuOpen()) return;
  const t = e.target;
  if (t && typeof t.closest === "function" &&
      (t.closest("#moreMenu") || t.closest("#moreBtn"))) return;
  setMoreMenu(false);
});
document.addEventListener("keydown", function (e) {
  if ((e.key === "Escape" || e.key === "Esc") && isMoreMenuOpen()) setMoreMenu(false);
});

document.getElementById("startBtn").addEventListener("click", startSession);
// 掌握度环形图：扇区 / 图例悬浮高亮（绑定一次即可，扇区是固定 DOM，只换 d 属性）
bindMasteryDonutHover();
document.getElementById("readyView").addEventListener("click", startSession);
document.getElementById("recallView").addEventListener("click", revealAnswer);
document.getElementById("backBtn").addEventListener("click", goBack);
// 完成屏三级出口
document.getElementById("doneStatsBtn").addEventListener("click", openStats);
document.getElementById("doneNewBtn").addEventListener("click", startNewWordsSession);
document.getElementById("doneHomeBtn").addEventListener("click", refreshReadyView);
document.getElementById("judgeLeftBtn").addEventListener("click", () => judgeChoose(0));
document.getElementById("judgeRightBtn").addEventListener("click", () => judgeChoose(1));
document.getElementById("judgeNextBtn").addEventListener("click", judgeNext);
document.getElementById("exportBtn").addEventListener("click", exportBackup);
document.getElementById("importBtn").addEventListener("click", () =>
  document.getElementById("fileInput").click()
);
document.getElementById("fileInput").addEventListener("change", (e) => {
  if (e.target.files.length) importBackup(e.target.files[0]);
  e.target.value = "";
});
document.getElementById("importMergeBtn").addEventListener("click", () => applyImport("merge"));
document.getElementById("importOverwriteBtn").addEventListener("click", () => applyImport("overwrite"));
document.getElementById("importCancelBtn").addEventListener("click", cancelImport);
// 云端备份（实现见 cloud-sync.js：CloudSync.uploadGist / downloadGist）
document.getElementById("uploadCloudBtn").addEventListener("click", () => CloudSync.uploadGist());
document.getElementById("downloadCloudBtn").addEventListener("click", () => CloudSync.downloadGist());
// 学习统计（实现见 stats.js + 上方 5.5 节）
document.getElementById("statsBtn").addEventListener("click", openStats);
document.getElementById("statsBackBtn").addEventListener("click", closeStats);
document.querySelectorAll(".option[data-grade]").forEach((btn) => {
  btn.addEventListener("click", () => gradeCurrent(btn.dataset.grade));
});

// 空格键 = 显示答案（仅在"回忆视图"下生效；阻止页面滚动与长按重复触发）
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    const recallView = document.getElementById("recallView");
    if (!recallView.classList.contains("hidden")) {
      e.preventDefault();
      if (!e.repeat) revealAnswer();
    }
  }
});

// 启动：有待复习 → 准备页；无待复习 → 完成屏平静态
if (getDueList().length === 0) {
  renderDoneIdle();
} else {
  refreshReadyView();
}
