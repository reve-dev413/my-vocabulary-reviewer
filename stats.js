// ============================================================
// 学习统计（纯函数，只读计算，不新增任何存储）
//
// 数据来源（全部来自现有 reviewState，与复习记录同源，不另建数据系统）：
//   - st.reviews       该记忆对象累计复习次数（applyReview 每次 +1）
//   - st.history       最近 50 条评价记录 [{ time, grade }]，含每次复习的时间戳
//   - st.lastReview    最近一次复习时间戳
//   - st.nextReview    下次复习时间戳（调度器唯一入口；0/缺失 = 新卡立即到期）
//
// 设计约束：
//   1. 每次打开统计页都实时重算 → 刷新、导入、覆盖、云端恢复、撤销"上一题"
//      后统计天然一致（因为唯一的存储就是 reviewState 本身）。
//   2. 只统计"当前知识库中"的对象，排除旧知识版本的历史残留键
//      （与 sync.js 的 countLearned 口径一致）。
//   3. history 每对象最多保留 50 条：最近 7/30 天窗口内单对象复习次数远低于
//      50（最短间隔 12 小时），窗口内每日计数可靠；"最早记录日 / 累计学习天数"
//      以现有记录为准；单对象 history 不完整（reviews > 50）时，不再把它
//      归属到某一天的"新词"（避免把首学时间误算到近期）。
//   4. 全部按"本地时区的一天"统计（用户在北京时间使用）。
//   5. 本模块只展示学习量与复习状态，不做对错评价类统计。
// ============================================================

(function () {
  "use strict";

  var MS_DAY = 24 * 3600 * 1000;

  // 本地时区当天 0 点时间戳
  function dayStart(ts) {
    var d = new Date(ts);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  // 本地时区日键（可排序数字）：2026-08-29 → 20260829
  function dayKey(ts) {
    var d = new Date(ts);
    return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  }

  // 日键 → "2026-08-29"
  function keyToISO(key) {
    var y = Math.floor(key / 10000);
    var m = Math.floor(key / 100) % 100;
    var d = key % 100;
    return y + "-" + (m < 10 ? "0" : "") + m + "-" + (d < 10 ? "0" : "") + d;
  }

  // 日键 → "8月29日"
  function keyToLabel(key) {
    var m = Math.floor(key / 100) % 100;
    var d = key % 100;
    return m + "月" + d + "日";
  }

  // 日键 → "8/29"（30 天柱状图轴标用）
  function keyToShort(key) {
    var m = Math.floor(key / 100) % 100;
    var d = key % 100;
    return m + "/" + d;
  }

  // 某对象的复习时间戳列表：以 history 为准；history 缺失时退回 lastReview。
  function reviewTimes(st) {
    var times = [];
    if (Array.isArray(st.history)) {
      for (var i = 0; i < st.history.length; i++) {
        var h = st.history[i];
        if (h && typeof h.time === "number" && h.time > 0) times.push(h.time);
      }
    }
    if (times.length === 0 && typeof st.lastReview === "number" && st.lastReview > 0) {
      times.push(st.lastReview);
    }
    return times;
  }

  // 计算全部统计数据（纯函数：不读写 localStorage / DOM）
  // 入参：state（reviewer-state-v1 对象）、knowledge（KS_DATA.knowledge）、now（毫秒时间戳，可注入便于测试）
  function compute(state, knowledge, now) {
    state = state || {};
    knowledge = knowledge || [];
    now = typeof now === "number" ? now : Date.now();

    var todayStart = dayStart(now);
    var tomorrowStart = todayStart + MS_DAY;
    var d30Start = todayStart - 29 * MS_DAY; // 含今天共 30 天
    var d7Start = todayStart - 6 * MS_DAY;   // 含今天共 7 天

    // 收集知识库内全部对象（排除历史残留键）
    var items = [];
    var totalItems = 0;
    for (var t = 0; t < knowledge.length; t++) {
      var topic = knowledge[t];
      if (!topic || !Array.isArray(topic.items)) continue;
      for (var i = 0; i < topic.items.length; i++) {
        var item = topic.items[i];
        if (!item || !item.id) continue;
        totalItems++;
        items.push({ id: item.id, st: state[item.id] || null });
      }
    }

    // ---- 逐对象累计 ----
    var learned = 0;          // 已学习（至少复习过一次）
    var totalReviews = 0;     // 累计复习次数
    var daySet = {};          // 有复习记录的本地日键 → true
    var minTime = Infinity;
    var maxTime = -Infinity;
    var counts30 = {};        // 近 30 天每日复习次数：dayKey → n
    var newWords7 = {};       // 近 7 天每日新词数：dayKey → n

    for (var j = 0; j < items.length; j++) {
      var st = items[j].st;
      if (!st || (st.reviews || 0) < 1) continue; // 未学习：不计入学习统计
      learned++;
      totalReviews += st.reviews || 0;

      var times = reviewTimes(st);
      for (var k = 0; k < times.length; k++) {
        var ts = times[k];
        daySet[dayKey(ts)] = true;
        if (ts < minTime) minTime = ts;
        if (ts > maxTime) maxTime = ts;
        if (ts >= d30Start && ts < tomorrowStart) {
          var k30 = dayKey(ts);
          counts30[k30] = (counts30[k30] || 0) + 1;
        }
      }

      // 新词归属：仅当该对象 history 完整（无截断）时才可信。
      // history 完整 = 有记录 且 条数 == reviews（说明从未被 50 条上限截断）。
      var hist = Array.isArray(st.history) ? st.history : [];
      var complete = hist.length > 0 && (st.reviews || 0) === hist.length;
      if (complete) {
        var first = Infinity;
        for (var m = 0; m < hist.length; m++) {
          if (hist[m] && typeof hist[m].time === "number" && hist[m].time > 0 && hist[m].time < first) {
            first = hist[m].time;
          }
        }
        if (first !== Infinity && first >= d7Start && first < tomorrowStart) {
          var k7 = dayKey(first);
          newWords7[k7] = (newWords7[k7] || 0) + 1;
        }
      }
    }

    var hasData = learned > 0;
    var learningDays = Object.keys(daySet).length;
    var lastStudyKey = hasData ? dayKey(maxTime) : null;
    var firstStudyKey = hasData ? dayKey(minTime) : null;

    // 连续学习天数：今天有记录从今天起算；今天还没学则从昨天起算（保留一天宽限）
    var streak = 0;
    if (hasData) {
      var cursor = todayStart;
      if (!daySet[dayKey(cursor)]) cursor -= MS_DAY;
      while (daySet[dayKey(cursor)]) {
        streak++;
        cursor = dayStart(cursor - MS_DAY);
      }
    }

    // 数据累计天数（含首尾：开始当天即 1 天）
    var accumulatedDays = 0;
    if (hasData) {
      accumulatedDays = Math.floor((todayStart - dayStart(minTime)) / MS_DAY) + 1;
    }

    // ---- 复习状态（与首页调度器口径一致：新卡视为立即到期） ----
    var nowDue = 0;   // 当前待复习：nextReview <= 现在（含新卡、含历史遗留）
    var todayDue = 0; // 今日待复习：nextReview < 明日 0 点（含新卡、含历史遗留与今天稍后到期）
    for (var n = 0; n < items.length; n++) {
      var s2 = items[n].st;
      if (!s2 || typeof s2.nextReview !== "number" || s2.nextReview <= now) nowDue++;
      if (!s2 || typeof s2.nextReview !== "number" || s2.nextReview < tomorrowStart) todayDue++;
    }
    var never = totalItems - learned;

    // ---- 最近 7 天 ----
    var last7 = [];
    var maxReviews7 = 0;
    for (var i7 = 6; i7 >= 0; i7--) {
      var key7 = dayKey(todayStart - i7 * MS_DAY);
      var rev7 = counts30[key7] || 0; // 7 天窗口在 30 天窗口内，直接复用
      var nw7 = newWords7[key7] || 0;
      if (rev7 + nw7 > maxReviews7) maxReviews7 = rev7 + nw7;
      last7.push({
        key: key7,
        iso: keyToISO(key7),
        label: keyToLabel(key7),
        today: i7 === 0,
        reviews: rev7,
        newWords: nw7,
        total: rev7 + nw7
      });
    }

    // ---- 最近 30 天 ----
    var last30 = [];
    var maxReviews30 = 0;
    var totalReviews30 = 0;
    for (var i30 = 29; i30 >= 0; i30--) {
      var key30 = dayKey(todayStart - i30 * MS_DAY);
      var rev30 = counts30[key30] || 0;
      if (rev30 > maxReviews30) maxReviews30 = rev30;
      totalReviews30 += rev30;
      last30.push({
        key: key30,
        label: keyToLabel(key30),
        short: keyToShort(key30),
        reviews: rev30
      });
    }

    return {
      hasData: hasData,
      totalItems: totalItems,
      learned: learned,          // 累计学习单词/对象
      never: never,              // 未复习
      totalReviews: totalReviews, // 累计复习次数
      learningDays: learningDays, // 累计学习天数
      lastStudyKey: lastStudyKey,
      lastStudyISO: lastStudyKey === null ? null : keyToISO(lastStudyKey),
      firstStudyKey: firstStudyKey,
      firstStudyISO: firstStudyKey === null ? null : keyToISO(firstStudyKey),
      streak: streak,             // 连续学习天数
      accumulatedDays: accumulatedDays, // 数据累计天数（含首尾）
      nowDue: nowDue,
      todayDue: todayDue,
      last7: last7,
      maxReviews7: maxReviews7,
      last30: last30,
      maxReviews30: maxReviews30,
      totalReviews30: totalReviews30
    };
  }

  window.Stats = { compute: compute };
})();
