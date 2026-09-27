// ============================================================
// reviewState 数据安全层（state-safety.js）
//
// 职责（只做这三件事，不碰 PDM、不碰统计口径、不碰 UI）：
//   1. ID 迁移：把历史孤儿 item.id 的记忆状态迁移到当前知识库的有效 id。
//   2. loadState 护栏：区分「真正的新用户」与「有数据但读坏了」。
//   3. saveState 骤降保护：拒绝用异常缩小的状态覆盖已有学习数据。
//
// 依赖：window.KS_DATA.knowledge（知识库）、localStorage。
// 不依赖 app.js / stats.js / sync.js / cloud-sync.js，可独立测试。
//
// 设计原则：
//   · 迁移映射表必须「显式、可审计」，绝不根据相似度自动猜测。
//   · 未确认的旧 id 一律保留原样，仅登记为 unresolved，不删除、不合并。
//   · 所有迁移操作幂等：运行 N 次结果完全相同。
//   · loadState 失败时不返回空对象，而是返回带标记的安全态并保留原始数据。
// ============================================================

(function () {
  "use strict";

  // ============================================================
  // 一、ID 迁移映射表
  // ============================================================
  //
  // 结构：{ "<旧 id>": "<新 id>" }
  //
  // ★★ 重要：本表必须只包含「已确认属于同一知识项」的映射。
  //    确认标准（三者必须同时满足）：
  //      (a) 旧 id 确实曾在本项目的某版知识库中作为 topic.id 或 item.id 存在；
  //      (b) 新 id 在当前知识库中作为 item.id 存在；
  //      (c) 两者承载的知识内容经人工核对为同一项（而非语义相近）。
  //
  // ★★ 当前状态：经全库核查（当前 data.js / 13 份 archive / knowledge.js /
  //    299-434 基线），第 4 轮诊断列出的 13 个孤儿 id **在任何一版知识库中都不存在**，
  //    其来源世代已被完全抹除，因此**无法满足确认标准 (a)**。
  //    → 本表**故意保持为空**，13 个旧 id 全部进入 UNRESOLVED_LEGACY_IDS。
  //    → 待用户提供原始映射依据后，再逐条填入并补测。
  //
  // 填入示例（仅示意格式，请勿直接启用）：
  //   "old-topic-id": "new-item-id",
  //
  let ID_MIGRATION_MAP = {
  };

  // 已确认「在当前知识库中确实没有归宿」的历史 id。
  // 这些 key 会被：保留原样、不删除、不合并，并在诊断中报告。
  const UNRESOLVED_LEGACY_IDS = [
    "manage-meaning",
    "access-verb-usage",
    "access-noun",
    "competence-vs-competency",
    "accord-collocations",
    "personality-trait-1",
    "sentence-beyond-horizon-1",
    "advocate-1",
    "resist-give-in-to-peer-pressure-1",
    "principle-insist-warning",
    "capability",
    "competitiveness",
    "manage-time"
  ];

  // 迁移映射的可替换入口（供测试或日后扩展注入；正式运行不调用）
  function setMigrationMap(map) {
    if (map && typeof map === "object" && !Array.isArray(map)) {
      ID_MIGRATION_MAP = map;
    }
  }
  function getMigrationMap() {
    return ID_MIGRATION_MAP;
  }

  // ============================================================
  // 二、知识库索引
  // ============================================================

  function currentKnowledgeIds() {
    const kb = (window.KS_DATA && window.KS_DATA.knowledge) || [];
    const set = new Set();
    for (const topic of kb) {
      if (!topic || !Array.isArray(topic.items)) continue;
      for (const item of topic.items) {
        if (item && item.id) set.add(item.id);
      }
    }
    return set;
  }

  // ============================================================
  // 三、迁移与安全合并
  // ============================================================

  const HISTORY_LIMIT = 50; // 与 app.js applyReview 的 history 上限保持一致

  // 规范化单条 history：{ time:number>0, grade:string }；非法条目丢弃。
  function normalizeHistoryEntry(h) {
    if (!h || typeof h !== "object") return null;
    const t = h.time;
    if (typeof t !== "number" || !isFinite(t) || t <= 0) return null;
    return { time: t, grade: typeof h.grade === "string" ? h.grade : "" };
  }

  // history 去重 + 按时间升序。去重键 = time（同一时刻视为同一次复习）。
  // 同一 time 出现多条时保留第一条（时间戳唯一性由 applyReview 保证）。
  function dedupeSortHistory(hist) {
    const arr = [];
    const seen = new Set();
    if (Array.isArray(hist)) {
      for (const raw of hist) {
        const h = normalizeHistoryEntry(raw);
        if (!h) continue;
        if (seen.has(h.time)) continue;
        seen.add(h.time);
        arr.push(h);
      }
    }
    arr.sort(function (a, b) { return a.time - b.time; });
    return arr;
  }

  // 取单条 state 中可用的「时间锚」（用于挑选较新者）。
  function anchorTime(st) {
    if (!st || typeof st !== "object") return -Infinity;
    if (typeof st.lastReview === "number" && st.lastReview > 0) return st.lastReview;
    const h = Array.isArray(st.history) ? st.history : [];
    let mx = -Infinity;
    for (const e of h) {
      const n = normalizeHistoryEntry(e);
      if (n && n.time > mx) mx = n.time;
    }
    return mx;
  }

  // 安全合并两个 state 条目（oldSt 从旧 id 来，newSt 是目标 id 已有）。
  //
  // 规则（严格遵循任务要求）：
  //   · history 取并集、去重、按时间排序 —— 两边所有复习记录都保留；
  //   · grade 原样保留（不做任何推断/补齐）；
  //   · reviews 取两边较大值（不虚增；因为 history 已合并，实际条数可能少于 reviews
  //     属正常截断情形，与 app.js 的 50 条上限语义一致）；
  //   · lastReview 取两边较晚者（不得倒退）；
  //   · nextReview 取「对应用户更该复习」= 取两边中与较晚 lastReview 同源者的值；
  //     若两边 lastReview 相同，取较早的 nextReview（不会延后复习机会）；
  //   · difficulty / stability 取「由较新 lastReview 所属条目」的值；
  //     另一边独有的字段在缺失时补入，不互相覆盖已有数值。
  //   · 不新增任何 history 条目、不改任何 time、不制造新复习。
  function mergeStateEntry(oldSt, newSt) {
    if (!oldSt) return newSt;
    if (!newSt) return oldSt;

    const tOld = anchorTime(oldSt);
    const tNew = anchorTime(newSt);
    const primary = tOld > tNew ? oldSt : newSt;   // 较新者为字段主源
    const secondary = tOld > tNew ? newSt : oldSt; // 较旧者为补充源

    const merged = {};

    // 字段主源优先；缺失（undefined/null）才用补充源
    function takeNum(key) {
      const p = primary[key];
      if (typeof p === "number" && isFinite(p)) return p;
      const s = secondary[key];
      if (typeof s === "number" && isFinite(s)) return s;
      return p === undefined ? (s === undefined ? undefined : s) : p;
    }

    // difficulty / stability：较新者的值优先；为 null 时用补充源
    let difficulty = primary.difficulty;
    if (difficulty == null) difficulty = secondary.difficulty;
    let stability = primary.stability;
    if (stability == null) stability = secondary.stability;

    const hist = dedupeSortHistory(
      (Array.isArray(oldSt.history) ? oldSt.history : []).concat(
        Array.isArray(newSt.history) ? newSt.history : []
      )
    );

    const reviews = Math.max(
      typeof oldSt.reviews === "number" ? oldSt.reviews : 0,
      typeof newSt.reviews === "number" ? newSt.reviews : 0
    );

    const lastReview = Math.max(
      typeof oldSt.lastReview === "number" && oldSt.lastReview > 0 ? oldSt.lastReview : -Infinity,
      typeof newSt.lastReview === "number" && newSt.lastReview > 0 ? newSt.lastReview : -Infinity
    );

    // nextReview：取「不延后复习机会」者 —— 有效值中较小者
    const nr = [];
    if (typeof oldSt.nextReview === "number" && isFinite(oldSt.nextReview)) nr.push(oldSt.nextReview);
    if (typeof newSt.nextReview === "number" && isFinite(newSt.nextReview)) nr.push(newSt.nextReview);
    const nextReview = nr.length ? Math.min.apply(null, nr) : 0;

    merged.difficulty = difficulty === undefined ? null : difficulty;
    merged.stability = stability === undefined ? null : stability;
    merged.lastReview = lastReview === -Infinity ? null : lastReview;
    merged.nextReview = nextReview;
    merged.reviews = reviews;
    merged.history = hist;

    // 保留任何其它非核心字段（如旧 SM-2 的 n / ef / lastIntervalDays），
    // 以 primary 优先、secondary 补齐 —— 不丢字段、不改语义。
    const extraKeys = new Set(
      Object.keys(primary).concat(Object.keys(secondary))
    );
    for (const k of ["difficulty", "stability", "lastReview", "nextReview", "reviews", "history"]) {
      extraKeys.delete(k);
    }
    for (const k of extraKeys) {
      if (k in primary && primary[k] !== undefined) merged[k] = primary[k];
      else if (k in secondary && secondary[k] !== undefined) merged[k] = secondary[k];
    }

    return merged;
  }

  // 执行一次 ID 迁移（就地修改 state 对象）。
  // 返回诊断摘要。幂等：第二次运行 newIdsMoved === 0。
  function migrateIds(state) {
    const report = {
      moved: [],        // [{from,to,mode}] mode: "direct" | "merged"
      unresolved: [],   // 保留原样的历史 id
      skipped: []       // 映射目标不在当前知识库 / 源 id 不存在 → 跳过
    };
    if (!state || typeof state !== "object") return report;

    const kbIds = currentKnowledgeIds();
    const map = ID_MIGRATION_MAP;

    for (const from of Object.keys(map)) {
      const to = map[from];
      if (!to || from === to) { report.skipped.push({ from: from, to: to, reason: "映射无效" }); continue; }
      if (state[from] === undefined) { continue; }              // 源不存在：无需迁移
      if (!kbIds.has(to)) {
        report.skipped.push({ from: from, to: to, reason: "目标不在当前知识库" });
        continue;                                                // 目标无效：不动，保留旧 key
      }
      if (state[to] === undefined) {
        state[to] = state[from];                                 // 情况 A：直接迁移
        delete state[from];
        report.moved.push({ from: from, to: to, mode: "direct" });
      } else {
        state[to] = mergeStateEntry(state[from], state[to]);     // 情况 B：安全合并
        delete state[from];
        report.moved.push({ from: from, to: to, mode: "merged" });
      }
    }

    // 未确认的旧 id：保留原样，仅登记
    for (const id of UNRESOLVED_LEGACY_IDS) {
      if (state[id] !== undefined) report.unresolved.push(id);
    }

    return report;
  }

  // ============================================================
  // 四、loadState 护栏
  // ============================================================
  //
  // 返回值恒为对象，形如：
  //   { ok:true,  state:{...}, reason:"empty"|"loaded" }                      正常
  //   { ok:false, state:{},    reason:"corrupt"|"badtype", raw:"<原始字符串>" } 异常（危险）
  //
  // 关键：ok:false 表示「原本有数据但读坏了」——调用方**不得**把它当作
  //       新用户空态去覆盖存储。真正的新用户是 ok:true + reason:"empty"。
  function safeLoadState(key) {
    const STORAGE_KEY = key || "reviewer-state-v1";
    let raw = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      // localStorage 本身不可用（隐私模式等）：视为「无法读取」，不是损坏
      return { ok: false, state: {}, reason: "storage-unavailable", raw: null, error: String(e) };
    }
    if (raw === null || raw === "") {
      return { ok: true, state: {}, reason: "empty", raw: raw };   // 真正的新用户
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return { ok: false, state: {}, reason: "corrupt", raw: raw, error: String(e) };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, state: {}, reason: "badtype", raw: raw };
    }
    return { ok: true, state: parsed, reason: "loaded", raw: raw };
  }

  // ============================================================
  // 五、saveState 骤降保护
  // ============================================================
  //
  // 规则（阈值由「真实数据规模」推导，见 .workbuddy/第5阶段-只读事实记录.md）：
  //   · 当前条目数 < ABS_FLOOR(20)  → 不触发保护（小库/新用户，波动无意义）
  //   · 新条目数 >= 当前的 KEEP_RATIO(0.5) → 允许保存（正常增减）
  //   · 新条目数为 0 且当前 >= 1 → 一律视为骤降（清空）
  //   · 否则 → 阻止保存
  // 复核真实规模：正常态 324 条；撤销一张卡波动 ≤1 条 → 远不会触发。
  const DROP_ABS_FLOOR = 20;   // 低于此规模不启用保护
  const DROP_KEEP_RATIO = 0.5; // 新/旧 < 0.5 且旧 >= 20 → 拦截

  function countEntries(state) {
    if (!state || typeof state !== "object" || Array.isArray(state)) return 0;
    let n = 0;
    for (const k of Object.keys(state)) {
      const v = state[k];
      if (v && typeof v === "object") n++;
    }
    return n;
  }

  // 返回 { allow:boolean, reason:string, before:number, after:number }
  function guardSave(prevState, nextState) {
    const before = countEntries(prevState);
    const after = countEntries(nextState);

    if (before < DROP_ABS_FLOOR) {
      return { allow: true, reason: "below-floor", before: before, after: after };
    }
    if (after === 0) {
      return { allow: false, reason: "wiped-to-zero", before: before, after: after };
    }
    if (after < before * DROP_KEEP_RATIO) {
      return { allow: false, reason: "dropped-over-half", before: before, after: after };
    }
    return { allow: true, reason: "ok", before: before, after: after };
  }

  // ============================================================
  // 六、损坏数据保全（只在真正损坏时调用一次）
  // ============================================================
  //
  // 把无法解析的原始字符串另存为 <key>.corrupt.<ts>，供用户/开发者事后取回。
  // 只写备份键，**绝不改动原键**。
  function preserveCorrupt(raw, key, ts) {
    const STORAGE_KEY = key || "reviewer-state-v1";
    const stamp = ts || Date.now();
    const backupKey = STORAGE_KEY + ".corrupt." + stamp;
    try {
      localStorage.setItem(backupKey, raw === null ? "" : String(raw));
      return backupKey;
    } catch (e) {
      return null;
    }
  }

  // ============================================================
  // 导出
  // ============================================================

  window.StateSafety = {
    // 配置（只读快照）
    UNRESOLVED_LEGACY_IDS: UNRESOLVED_LEGACY_IDS.slice(),
    DROP_ABS_FLOOR: DROP_ABS_FLOOR,
    DROP_KEEP_RATIO: DROP_KEEP_RATIO,
    HISTORY_LIMIT: HISTORY_LIMIT,

    getMigrationMap: getMigrationMap,
    setMigrationMap: setMigrationMap,   // 仅供测试/扩展
    currentKnowledgeIds: currentKnowledgeIds,

    migrateIds: migrateIds,
    mergeStateEntry: mergeStateEntry,
    dedupeSortHistory: dedupeSortHistory,

    safeLoadState: safeLoadState,
    guardSave: guardSave,
    countEntries: countEntries,
    preserveCorrupt: preserveCorrupt
  };
})();
