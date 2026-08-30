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

// state: { [itemId]: { difficulty, stability, lastReview, nextReview, reviews, history[] } }
let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ---------- 2. 记忆算法（PDM v1：Personal Dynamic Memory，可替换） ----------

// 所有参数集中在此，调整难度只需改这里（人为设定初始值，非墨墨参数）
const PDM_CONFIG = {
  targetRetention: 0.85,     // 目标回忆概率 p（预计 R 降到 p 时就再见）
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
//   ① R = 2^(-elapsed/S) 估计当前回忆概率；credit = 1 - R（复习得越晚还能记住，credit 越大）
//   ② 首次复习：S 查表定初始稳定性；D 用固定增量
//   ③ 后续复习：S_new = S × (base + creditWeight × credit) × (1 - 0.15 × D)
//   ④ D：忘记 +0.02 + 0.08×R（R 越高 = 越出乎模型预期的遗忘 → 难度加得越多）；
//      困难 +0.03；记得 0；简单 -0.02
//   ⑤ 下次间隔：忘记 → clamp(S×k, 1天, 2天)（24~48h 恢复）；其他 → max(S×k, 12小时)
function applyReview(st, grade, now) {
  const cfg = PDM_CONFIG;

  let S, D;
  if (st.stability == null) {
    // 首次复习：无历史稳定性可参考，直接查表
    S = cfg.firstS[grade];
    D = clamp(st.difficulty + cfg.dDelta[grade], cfg.dMin, cfg.dMax);
  } else {
    const elapsedDays = st.lastReview ? (now - st.lastReview) / MS_DAY : 0;
    const R = Math.pow(2, -elapsedDays / st.stability);
    const credit = 1 - R;
    const mult = cfg.base[grade] + cfg.creditWeight[grade] * credit;
    S = clamp(st.stability * mult * (1 - cfg.damping * st.difficulty), cfg.sMin, cfg.sMax);
    if (grade === "忘记") {
      D = clamp(st.difficulty + cfg.lapseDBase + cfg.lapseDSurprise * R, cfg.dMin, cfg.dMax);
    } else {
      D = clamp(st.difficulty + cfg.dDelta[grade], cfg.dMin, cfg.dMax);
    }
  }

  // 下次复习间隔（天）：k = log2(1/p)
  let intervalDays = S * K_INTERVAL;
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

function buildReviewQueue() {
  const due = getDueList();
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
let sessionStats = { done: 0, skipped: 0 };

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
  const map = { grade: "gradeOptions", judge: "judgeOptions", ready: "readyOptions", done: "doneOptions" };
  if (mode === "grade" || mode === "judge" || mode === "ready" || mode === "done") {
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
  queueIndex = 0;
  sessionStats = { done: 0, skipped: 0 };
  canGoBack = false;
  lastAction = null;
  updateBackBtn();
  if (queue.length === 0) {
    alert("今天没有需要复习的内容，休息一下吧 🎉");
    refreshReadyView();
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
  // 判断题（judge）：显示命题 → 判断对/错 → 显示答案（对=简单、错=忘记）
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

let pendingGrade = null;

function showJudge() {
  const d = queue[queueIndex];
  const el = (id) => document.getElementById(id);
  el("judgeProgress").textContent = `第 ${queueIndex + 1} / ${queue.length} 项`;
  el("judgeType").textContent = d.item.type;
  el("judgeTopic").innerHTML = renderRich(d.topic.name);
  el("judgePrompt").innerHTML = renderRich(d.item.prompt);
  el("judgeAnswerBox").classList.add("hidden");
  el("judgeNextBtn").classList.add("hidden");
  el("judgeView").classList.remove("hidden");
  el("recallView").classList.add("hidden");
  el("gradeView").classList.add("hidden");
  setActionBar("judge");
}

function judgeChoose(userSaysCorrect) {
  const d = queue[queueIndex];
  const el = (id) => document.getElementById(id);
  const expected = d.item.expected === undefined ? true : !!d.item.expected;
  const isCorrect = userSaysCorrect === expected;
  // 判断正确 → 简单；判断错误 → 忘记
  pendingGrade = isCorrect ? "简单" : "忘记";
  setActionBar("collapsed");
  el("judgeResult").textContent = isCorrect ? "✅ 判断正确" : "❌ 判断错误";
  el("judgeAnswerText").innerHTML = renderRich(d.item.answer);
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
    prevState: state[d.item.id] ? JSON.parse(JSON.stringify(state[d.item.id])) : null
  };
  canGoBack = true;
  const st = ensureState(d.item.id);
  applyReview(st, grade, Date.now());
  saveState();

  sessionStats.done += 1;
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
  queueIndex -= 1;
  updateBackBtn();
  document.getElementById("doneView").classList.add("hidden");
  // 重新显示上一题的评价界面（判断题回到判断按钮，普通卡/直接卡回到答案页）
  const d = queue[queueIndex];
  if (d.item.judge) showJudge();
  else showAnswerContent(d);
}

function finishSession() {
  const dueLeft = getDueList().length;
  const summary = document.getElementById("doneSummary");
  let msg = `本轮完成 ${sessionStats.done} 项。`;
  if (dueLeft > 0) {
    msg += `\n还有 ${dueLeft} 项已到期，为避免同一主题短时间重复，留到下一轮再安排。`;
  }
  summary.textContent = msg;
  document.getElementById("doneView").classList.remove("hidden");
  document.getElementById("recallView").classList.add("hidden");
  document.getElementById("gradeView").classList.add("hidden");
  document.getElementById("judgeView").classList.add("hidden");
  setActionBar("done");
  document.body.classList.remove("reviewing");
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
    alert("导入失败：不是有效的备份文件。");
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
    alert("导入成功 ✅");
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

document.getElementById("startBtn").addEventListener("click", startSession);
document.getElementById("readyView").addEventListener("click", startSession);
document.getElementById("recallView").addEventListener("click", revealAnswer);
document.getElementById("againBtn").addEventListener("click", startSession);
document.getElementById("backBtn").addEventListener("click", goBack);
document.getElementById("judgeTrueBtn").addEventListener("click", () => judgeChoose(true));
document.getElementById("judgeFalseBtn").addEventListener("click", () => judgeChoose(false));
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

refreshReadyView();
