# CHANGELOG

## [2026-08-31] 导入剩余三章：就业 / 社会文化 / 专业词汇 + 部署 1.12.0（全部场景导入完成）

### 完成
- 将 Word《四六级场景词附积累_并入版》剩余章节"七、就业与职业发展场景""八、社会与文化场景""十一、专业词汇：学科与领域类"转换为知识库并同步线上，**至此全部场景导入完成**：
  - 母数据 `knowledge-studio/data/knowledge/word-education.json`：224 → **249 主题** / 346 → **381 卡**，新增 25 主题 35 卡：
    - **七、就业与职业发展**（12 主题 12 卡）：business growth / revenue growth（公司销售增长，汉译英方向）、align career goals with strengths、plan for one's career、outlook / view on life、invoice、administrative task、quality control、approval process、workflow、CV、work one's way into / through、an ornament to the profession。
    - **八、社会与文化**（6 主题 14 卡）：statue（词义 / erect a statue / unveil a statue / a bronze statue of sb. / 与 sculpture 辨析 / of 与 to 用法）、a national treasure、applause goes to、belated（含 a belated birthday wish）、distorted（distorted image / distorted facts）、modernity。
    - **十一、专业词汇**（7 主题 9 卡）：volunteer information、congestion、corporate（corporate interests / a corporate body）、policy mix、an indicative offer（related indicative）、cost-effective、fuel-efficient。
  - 跨章节处理：school district 已含于 district 主题，不重复导入。
  - source：25 个新主题中 23 个由 raw 词条块回填真实 source；2 个保留 legacy（business growth / revenue growth 无对应词条块标题、fuel-efficient 与 cost-effective 同词条块）。
- 重新构建 `knowledge-studio/web/build/data.js`（249 主题 / 381 卡）并同步 `deploy/`；`validate.py` 0 错误 0 警告。
- `version.json` / 页脚版本号：1.11.0 → **1.12.0**（2026-08-31，根 + deploy 同步）。

### 修改的文件
- 修改：`knowledge.js`（新增三章）、`knowledge-studio/data/knowledge/word-education.json`（追加 25 主题）、`knowledge-studio/web/build/data.js`（重生成）、`deploy/knowledge-studio/web/build/data.js`（同步）、`deploy/index.html`、根 `index.html`、`deploy/version.json`、根 `version.json`、`CHANGELOG.md`

---

## [2026-08-31] 导入第四~六批：健康 / 法律 / 地理三场景 + 部署 1.11.0

### 完成
- 将 Word《四六级场景词附积累_并入版》"四、健康与心理场景""五、法律与行政场景""六、地理与自然环境场景"三章转换为知识库并同步线上：
  - 母数据 `knowledge-studio/data/knowledge/word-education.json`：211 → **224 主题** / 323 → **346 卡**，新增 13 主题 23 卡：
    - **四、健康与心理**（5 主题 11 卡）：reducing stigma around counselling、major transitions、keep sth. at bay（含 in the bay、bay 作动词）、be winded（related wind）、stab（词义 / a stab wound / stab sb. in the arm / a stab in the dark / 过去式 stabbed）。
    - **五、法律与行政**（5 主题 9 卡）：dismissed without trial、file a complaint（含 file 作动词"提交"、in single file）、the defence（与 the prosecution 相对）、furnish（furnish documents / furnish sb. with sth.）、hinder sb.'s rehabilitation（related hinder-sb-from-doing）。
    - **六、地理与自然环境**（3 主题 3 卡）：reed bed、wetland species、可直接套写例句 It is the same across much of this plateau, which encompasses an area a third of the size of the US.
  - 跨章节处理（考点相同不重复导入）：case disposition（已含于 dispose-group）、citation（已含于 cite-group）、life sentence（已含于 life 相关表达）、plateau / vicinity（已在预保留主题中完整覆盖，含 Deaths in Brazil… 例句）。
  - source：新主题中 9 个由 raw 词条块回填真实 source，4 个保留 legacy（keep sth. at bay 词头用了 sth. 与原文 something 不同、dismissed without trial / hinder sb.'s rehabilitation / wetland species 无独立词条块）。
- 重新构建 `knowledge-studio/web/build/data.js`（224 主题 / 346 卡）并同步 `deploy/`；`validate.py` 0 错误 0 警告。
- `version.json` / 页脚版本号：1.10.0 → **1.11.0**（2026-08-31，根 + deploy 同步）。

### 修改的文件
- 修改：`knowledge.js`（新增三章）、`knowledge-studio/data/knowledge/word-education.json`（追加 13 主题）、`knowledge-studio/web/build/data.js`（重生成）、`deploy/knowledge-studio/web/build/data.js`（同步）、`deploy/index.html`、根 `index.html`、`deploy/version.json`、根 `version.json`、`CHANGELOG.md`

---

## [2026-08-31] 导入第三批：外交与国际关系场景 + 部署 1.10.0

### 完成
- 将 Word《四六级场景词附积累_并入版》"三、外交与国际关系场景"转换为知识库并同步线上（https://reve-dev413.github.io/my-vocabulary-reviewer/）：
  - 母数据 `knowledge-studio/data/knowledge/word-education.json`：207 → **211 主题** / 315 → **323 卡**，新增 4 主题 8 卡——the Commonwealth / commonwealth（3 卡：英联邦大写专名用法、Commonwealth countries、a commonwealth of independent states，词源放 materials）、alliance（3 卡：an unlikely alliance、alliance with / between、be allied with）、civilian sector（1 卡）、be incorporated into（1 卡）。
  - source：commonwealth / alliance / civilian-sector 由 raw 词条块回填真实 source（block-0204 / 0205 / 0206）；be incorporated into 与 civilian sector 同词条块，按 accord 先例保留 legacy source。
  - 跨章节处理：accord 系列考点（词义/辨析、in accord with、of one's own accord、reach an accord on something、reach a peace accord、可直接套写例句）已在预保留主题中完整覆盖，本批次不重复导入。
- 重新构建 `knowledge-studio/web/build/data.js`（211 主题 / 323 卡，draft 0）并同步 `deploy/`；`validate.py` 0 错误 0 警告。
- `version.json`：1.9.2 → 1.10.0（2026-08-31，根 + deploy 同步）。

### 修改的文件
- 修改：`knowledge-studio/data/knowledge/word-education.json`（追加 4 主题）、`knowledge-studio/web/build/data.js`（重生成）、`deploy/knowledge-studio/web/build/data.js`（同步）、`deploy/version.json`、根 `version.json`、`CHANGELOG.md`

---

## [2026-08-31] 第五轮题库修正 + 同步知识库管线（knowledge.js → 母数据 → data.js）

### 题库修正（knowledge.js，全部同步到 knowledge-studio 母数据与 web/build/data.js）
- **占位词统一**：题库中表某物/事的 something 全部改为 sth.（intrinsic to sth.、an advertisement for sth.、reach an accord on sth. 等），criticize 卡改为「criticize sb. **for** doing sth.」。
- **单独考点**：a disposition to do；digest 拆成动词卡（消化+absorb/process）与名词卡（文摘）；citation for bravery 与 citation 分开。
- **介词标红**（**…** 渲染为红色）：be characterized **by** / remain accountable **for** / **under** uncertainty / be compatible **with** / hinder sb **from** doing / assist **with** / criticize sb. **for** doing sth.
- **判断题答案格式**：equipment / district / emerge / guidance 四张判断卡答案统一改为「正确答案：对。…+一句解析」（如 guidance 没有复数形式）。
- **派生词格式**：vulgarly→vulgar 的副词形式是什么、vulgarity→vulgar 的名词形式、clumsily→clumsy 的副词形式、clumsiness→clumsy 的名词形式。
- **词义答案标注词性**：全库「X 是什么意思？」单词语义卡答案补词性（约 30 张：solemn 隆重（形容词）、impart 传授（动词）、retrieve（动词）、stakeholder（名词）、inevitably（副词）等）。
- **beyond the immediate horizon**：由例句卡改为短语考点卡，原句放入补充材料。
- 其他：impart/solemn 释义补词性；cradle-to-grave care、lofty rhetoric 等沿用上轮修正。

### 规则固化（AGENTS.md）
- 第 9 条③：派生词题格式改为「xxx 的 XX 形式是什么？」；新增 ⑤ 词义卡答案标注词性、⑥ 占位词统一 sth./sb.。
- 第 15 条：判断题答案以「正确答案：对/错」开头并附解析。
- 第 4 条：用户明确要求把完整例句降为辅助材料时以用户要求为准。

### 数据管线同步
- `knowledge-studio/tools/migrate_legacy.py`：knowledge.js → `data/knowledge/word-education.json`（207 主题 / 315 卡，0 warning）。
- `knowledge-studio/tools/build_web_data.py`：→ `web/build/data.js`。
- `knowledge-studio/tools/validate.py`：0 错误 0 警告。
- 注意：正式 App 的知识库来自 `knowledge-studio/web/build/data.js`（旧根目录 knowledge.js 不再被 index.html 引用，仅作工作副本）。

### 修改的文件
- 修改：`knowledge.js`、`AGENTS.md`、`README.md`、`CHANGELOG.md`、`knowledge-studio/data/knowledge/word-education.json`（重生成）、`knowledge-studio/web/build/data.js`（重生成）、`knowledge-studio/CHANGELOG.md`

---

## [2026-08-31] 「无内容」提示改为应用内轻提示，去除网址/项目名，部署 1.9.2

### 需求
- 「今天没有需要复习的内容」弹窗目前是浏览器原生 `alert()`，其标题会显示来源网址（如 `…github.io 显示`）与项目名。用户要求此处**不显示网址和项目名**，界面只显示「复习完成，休息一下吧」。

### 改动（纯 UI，未触碰 PDM / 数据结构 / 判定 / 同步）
- `app.js`：新增应用内轻提示 `showNotice(text)`（底部居中、随类名 `show` 淡入、约 2.8s 自动消失），替代所有原生 `alert()`——队列为空时改为 `showNotice("复习完成，休息一下吧")`；导入失败/成功提示也改用 `showNotice`（避免再出现来源标题）。
- `index.html`：新增 `.notice-box` 样式（深/浅色自适应、无来源标题、无按钮、仅文字）。
- `version.json`：1.9.1 → 1.9.2（2026-08-31）；页脚版本号同步 v1.9.2。

### 验证
- `node --check app.js` 通过；`app.js` 已无残留 `alert()`。

---

## [2026-08-31] 「开始复习」等按钮去蓝色，融入卡片操作层，部署 1.9.1

### 需求
- 让「开始复习」按钮与新版卡片操作层统一：去掉突兀的蓝色药丸按钮，改为底部操作层里的文字选项（无背景框、无圆角、文字+箭头、颜色用 `--text`）；卡片整体可点击也开始复习。同步处理其他残留蓝色按钮。

### 改动（纯 UI/交互，未触碰 PDM / 数据结构 / 判定 / 同步）
- `index.html`：
  - 移除 `#readyView` 里的 `#startBtn`（蓝色 `btn-primary`）与 `#doneView` 里的 `#againBtn`（`btn-plain`）。
  - 底部操作层 `#actionBar` 新增 `readyOptions`（开始复习 ▶，`id=startBtn`）与 `doneOptions`（再复习一轮 ▶，`id=againBtn`），均为 `option option-full` 单选项。
  - 新增 `.option-full`：仅文字+箭头、无背景框/圆角、颜色 `--text`、`::after` 隐藏圆点。
  - `.btn-primary` 改为中性（同 `.btn-plain`），去掉蓝色背景——同步消除 `#importMergeBtn`/`#tokenConfirmBtn`/`#judgeNextBtn` 的蓝色。
  - 页脚版本号 v1.9.0 → v1.9.1。
- `app.js`：
  - `setActionBar(mode)` 扩展支持 `ready` / `done` 模式（展开操作层并显示对应单选项）。
  - `refreshReadyView` → `setActionBar("ready")`；`finishSession` → `setActionBar("done")`。
  - 新增 `#readyView` 整卡点击 → `startSession`（点击卡片任意位置即可开始复习）。
- `version.json`：1.9.0 → 1.9.1（2026-08-31）。

### 验证
- `node --check app.js` 通过；无残留蓝色 `btn-primary` / 失效选择器。
- 说明：`--accent`（#0066cc）仍用于文字链接/图表；update 横幅「立即更新」按钮（update.js 动态创建的非 `.btn-primary`）仍为蓝色，如需一并去蓝可告知。

---

## [2026-08-31] 复习界面交互改版：整卡点击显示答案 + 底部操作层（莫兰迪记忆程度），部署 1.9.0

### 需求
- 把复习界面评价交互改为「卡片整体可点击」：问题态底部只有一条细横线指示器（iOS Home Indicator），点击卡片任意位置显示答案；答案态底部操作层向上展开为四档记忆程度（忘记/困难/记得/简单）或判断题两档（错/对），选项只有文字 + 小圆点、无按钮背景框，主色为莫兰迪色系。

### 改动（纯 UI/交互，未触碰 PDM 算法 / 数据结构 / 复习判定 / 同步）
- **`index.html`**：
  - 新增莫兰迪记忆程度变量（亮/暗各一套）：`--grade-forget/hard/remember/easy`、`--judge-wrong/right`、`--home-indicator`、`--option-divider`。
  - 新增底部操作层 `.action-bar`（默认 4px 细横线，`.expanded` 展开为 48px，高度过渡）+ `.option` 选项（文字+小圆点、无背景框、相邻 `0.5px` 分隔、hover 极微变亮）+ `@keyframes optFade` 依次淡入 + `.anim-out/.anim-in` 整卡滑出滑入。
  - 移除 `#showAnswerBtn` 药丸按钮（改为整卡 `#recallView` 点击）、移除 `.grade-row` 四档/判断题原按钮（改为操作层），新增 `.recall-hint` 提示「点击卡片任意位置显示答案」。
  - 页脚版本号 v1.8.0 → v1.9.0。
- **`app.js`**：
  - `#showAnswerBtn` 点击 → `#recallView` 点击（revealAnswer）。
  - `.grade-btn` 绑定 → `.option[data-grade]`；判断题按钮保留 id（`judgeTrueBtn`/`judgeFalseBtn`）。
  - 新增 `setActionBar(mode)`（recall / collapsed / grade / judge）切换操作层展开与选项；`advanceWithSlide()` 评价后整卡滑入滑出（不阻塞流程、动画期间锁定点击、不支持动画时直接切换）。
  - 各视图切换函数（showNext / showAnswerContent / showJudge / judgeChoose / finishSession / refreshReadyView / startSession）同步设置操作层状态与 `body.reviewing`。
- **`version.json`**：1.8.0 → 1.9.0（2026-08-31）；SW 缓存名随版本自动更换。

### 验证
- `node --check app.js` 通过；index.html 无残留 `showAnswerBtn`/`judgeButtons`/`grade-btn`/`grade-row` 选择器。
- 本地截图目检（准备态 / 回忆态 / 评价态 / 判断题态，浅色 + 深色）通过。

### 部署
- 由 GitHub Desktop 提交推送（根 + deploy），线上打开后提示「发现新版本 v1.9.0」。

---

## [2026-08-31] 页脚显示版本号

- `index.html`（根 + deploy 同步）：页脚「导出进度」提示下方新增一行版本号 `v1.8.0`（继承页脚字体/格式/颜色，与 `version.json` 保持一致）。
- 根与 deploy 的 index.html SHA256 一致校验通过。
- 修改：`index.html`（根 + deploy）、`CHANGELOG.md`。

---

## [2026-08-31] 界面改版为 Apple 设计风格（依据 awesome-design-md 的 apple DESIGN.md），部署 1.8.0

### 需求
- 将 GitHub 热门项目 [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) 中 **apple** 的设计风格应用到复习器（线上地址 https://reve-dev413.github.io/my-vocabulary-reviewer/ ）。

### 改动范围（纯外观，逻辑零改动）
- **`index.html`（根 + deploy 同步）**：重写 `<style>` 为 Apple 设计令牌体系——
  - 颜色：Action Blue `#0066cc` 单一交互蓝；亮面白/米白 `#f5f5f7`；暗面近黑 `#000/#1d1d1f/#2a2a2c`；暗面链接用 Sky Blue `#2997ff`。
  - 顶部导航改为 Apple global-nav 纯黑全宽条（44px，工具按钮为 8px 圆角暗色胶囊）。
  - 复习卡片：白底 18px 圆角 + hairline 描边，**去除卡片投影**（Apple 原则：无装饰阴影）。
  - 按钮：签名式 pill（9999px 圆角），按下 `scale(0.95)` 微交互，聚焦环 2px `#0071e3`。
  - 深色模式四档评价按钮改为半透明 Apple 色调；弹窗/输入框（pill）/统计卡片同步新风格。
  - 字体栈：`-apple-system / SF Pro Text / system-ui / PingFang SC / Microsoft YaHei`。
- **`manifest.json`**：`background_color` → `#f5f5f7`、`theme_color` → `#000000`。
- **`version.json`**：1.7.0 → 1.8.0（2026-08-31）；SW 缓存名随版本自动更换，无需改 service-worker.js。
- **未动**：PDM 算法 / 调度器 / 数据结构 / 复习流程 / sync / cloud-sync / update / stats 逻辑、HTML 结构与全部 ID。

### 验证
- 本地截图（浅色/深色）目检通过：黑色导航条、白色 18px 圆角卡片、蓝色 pill 按钮、无卡片阴影。
- 根与 deploy 的 index.html / manifest.json / version.json SHA256 一致。

### 部署
- 由 GitHub Desktop 提交推送（根 + deploy 两份），线上打开后 update.js 会提示「发现新版本 v1.8.0」。

---

## [2026-08-29] 新增「学习统计」页（学习量 / 复习状态 / 数据积累观察），部署 1.7.0

### 需求
- 用户计划先正常使用网站约一个月积累真实复习数据，之后再做 PDM 优化分析。本次**只加学习统计**：不修改/重构/优化 PDM 算法与参数、不改复习流程与判定、不改数据结构、不加登录/后端/排行榜等。

### 约束（已遵守）
- 统计全部**实时计算自现有 reviewState**（`reviewer-state-v1`），不新增独立数据系统、不重复记录复习、不写死任何数字。
- 页面**不含任何对错评价类指标**（无正确率/错误率等字样）；底层 history 的每次评价记录照常保存，未删除。

### 修改
- **新增 `stats.js`**：纯函数 `Stats.compute(state, knowledge, now)`，只读计算、不碰 localStorage/DOM。数据来源全部来自现有字段：`reviews`（累计复习次数）、`history[].time`（每日复习 / 新词归属 / 最早记录日 / 连续天数）、`nextReview`（待复习数，与调度器口径一致：新卡视为立即到期）。只统计当前知识库内的对象，排除历史残留键（与 `Sync.countLearned` 口径一致）。
- **`index.html`**：右上角新增「📊 学习统计」按钮；新增全屏统计浮层（总体 / 数据积累时间 / 最近 7 天 / 最近 30 天柱状图 / 复习状态 / PDM 数据积累），空数据时显示合理空状态；新增对应 CSS（深浅色模式自适应）。
- **`app.js`**：新增 `openStats / closeStats / renderStats`（每次打开实时重算）与按钮事件绑定；其余逻辑未动。
- **`service-worker.js`**：SHELL 预缓存列表加入 `./stats.js`（离线可用）。
- **`version.json`**：1.6.2 → 1.7.0（2026-08-29）。
- **`README.md`**：结构表新增 stats.js 行、新增「学习统计」小节、更新已知限制文案。

### 统计数据与现有字段对照
| 统计项 | 数据来源 |
|---|---|
| 累计学习单词/对象 | 知识库内 `reviews ≥ 1` 的对象数 |
| 累计复习次数 | 知识库内各对象 `reviews` 之和 |
| 累计学习天数 / 连续学习天数 / 最近一次学习日期 / 开始记录 | `history[].time`（缺失时退回 `lastReview`），按本地日去重 |
| 最近 7/30 天每日复习次数 | `history[].time` 落在当日窗口内计数 |
| 每日新词数 | 仅对 history 完整（条数 == reviews，未被 50 条上限截断）的对象，按最早一条 history 归属 |
| 今日 / 当前待复习 | `nextReview ≤ 今日结束 / 现在`（新卡视为 0 到期） |
| PDM 数据积累 | 同上（复习次数 / 已学对象 / 开始记录至今天数） |

### 验证
- 4 个 JS 文件 `node --check` 通过；`Stats.compute` 单元测试 **48/48 通过**（新用户无数据 / 完成一次复习 / 连续复习多天 / 断档 / history 截断 / 残留键排除 / 撤销与导入恢复后重算一致 / 到期口径）。
- 无头浏览器截图验证空状态与有数据状态：无 NaN / undefined，数字与手算一致（如 9 对象 22 次复习、7 天、单日最高 8 次、开始记录 2026-08-23）。
- 根目录与 `deploy/` 五份改动文件 SHA256 一致。

### 修改的文件
- 新增：`stats.js`（根 + `deploy/stats.js`）
- 修改：`index.html`、`app.js`、`service-worker.js`、`version.json`（根 + deploy 同步）、`README.md`、`CHANGELOG.md`
- 未动：`PDM_CONFIG` / `applyReview` / `buildReviewQueue` / `sync.js` / `cloud-sync.js` / `update.js` / 复习流程与数据结构。

### 部署
- 用 GitHub Desktop 提交推送（根目录 + `deploy/` 里的 `app.js`、`index.html`、`stats.js`、`service-worker.js`、`version.json`）；线上打开 App 会自动提示更新（version.json 已升 1.7.0），更新后右上角出现「📊 学习统计」。

---

## [2026-08-28] 云端提示文案：显示"已背词数"而非"全部条目数"

### 需求
- 云端上传/恢复成功提示原来显示 `Object.keys(reviewState).length`（含历史残留键的全部条目数，如 324），用户希望显示**已背词数**。

### 修改（仅显示文案与一个只读计数函数；同步逻辑/数据格式/迁移/SW 均未动）
- `sync.js`：新增纯函数 `Sync.countLearned(reviewState)`——统计**当前知识库中存在复习状态条目且 reviews≥1 的记忆对象数**（排除不在知识库中的历史残留键）。
- `cloud-sync.js`：上传成功提示 → `云端备份成功，已背 N 词 ✅`；恢复成功提示 → `云端恢复成功，已背 N 词 ✅`。
- `app.js`：导入/恢复弹窗计数改用 `Sync.countLearned(...)`。
- `index.html`：弹窗文案 `备份中共 N 张卡…` → `备份中已背 N 张卡…`。
- 空状态拦截（nUpload/n === 0）与诊断日志仍用总数，逻辑不变；上传 PATCH/POST、恢复、gist 发现均未改。

### 验证
- 4 个 JS 文件 `node --check` 通过；根与 deploy 四份 SHA 一致。
- VM 真实代码测试全过：`countLearned` 在混合状态（3 个已背 + 残留/非知识库键）返回 3；上传/恢复成功提示显示「已背 3 词」且不含「共保存/共恢复」；弹窗计数为 3。
- 全项目搜索：无残留「共保存 N 项 / 共恢复 N 项」。

### 修改的文件
- 修改：`sync.js`、`cloud-sync.js`、`app.js`、`index.html`（根 + deploy 同步）、`CHANGELOG.md`

---

## [2026-08-28] SW 冷启动修复（旧 cache-first SW 卡住新版本）+ 部署 1.6.2

- 问题：设备若已装旧 cache-first SW，它一直发旧外壳；旧外壳可能没有 controllerchange→reload，导致新 SW 装上也无法接管 → 永久停在旧版（需手动注销）。
- 修改：`service-worker.js` activate 中，检测到存在旧缓存（说明是更新）时，`clients.claim()` 后**强制对所有窗口客户端 `client.navigate()` 重载**，把旧外壳踢掉；首次安装（无旧缓存）不触发。network-first / skipWaiting / update.js 机制保留。
- `version.json` → 1.6.2；根与 deploy 同步。
- 验证：VM 测试 4 场景全过（更新→强制导航+删旧缓存；首次安装→不导航；无窗口客户端→正常；静态断言机制在位）。
- 已部署：通过 GitHub Contents API 推送 `service-worker.js`（commit `095993b3`）与 `version.json`（commit `b7508e52`），GitHub Pages 构建 built，线上 version=1.6.2、SW 与本地逐字节一致。

---

## [2026-08-28] 修复：旧 SM-2 遗留数据（difficulty/stability/nextReview 为 null）无法迁移，导致卡永远排第一

### 问题（用户实测确认）
- `equipment-uncountable` 是 SM-2 时代遗留条目（`n/ef/lastIntervalDays` 旧字段 + `difficulty/stability/nextReview` 三个 null）；
- 调度器 `nextReview <= now` 对 null 恒真 → 永远到期 → 每次打开复习页面都排第一；
- 根因：`ensureState` 原迁移只处理 `=== undefined`，不处理 `null`，且只在复习时调用——不复习就永远不迁移（线上已是 PDM 版、同步链路无损，均排除）。

### 修改（仅 `app.js`，4 处）
1. 新增 `migrateLegacyState(s)`：把 null 与缺失同等对待，只补 null/缺失的 PDM 字段——
   - `difficulty` ← ef 换算（ef 2.5→0.05 易、1.3→0.95 难）；
   - `stability` ← `lastIntervalDays / k`（S×k ≈ 原计划间隔）；无间隔信息保持 null（下次复习按首次处理，原设计不变）；
   - `nextReview` ← 已复习过（有 lastReview 且 reviews>0）：`lastReview + 一个间隔`（间隔 = S×k，无间隔信息用最短 12h），**不改成 0 或当前时间**；从未复习过：0（新卡语义不变）。
   - 已是数字的字段一律不动；不删除 history / reviews / n / ef / lastIntervalDays；幂等。
2. 新增 `migrateAllState()`：遍历全部状态执行迁移。
3. 加载时迁移：`clamp` 定义之后调用 `migrateAllState()`（注意不能放在 `loadState()` 后——`PDM_CONFIG`/`K_INTERVAL` 是 const，会触发 TDZ）。
4. `applyImport` 合并/覆盖后、saveState 前调用 `migrateAllState()`（旧 Gist/备份导入后自愈）。
- `ensureState` 内原三个 `=== undefined` 迁移块替换为「默认值 + migrateLegacyState 调用」，4h 提升逻辑保留。
- 未动：PDM_CONFIG / 算法 / sync.js / cloud-sync.js / UI / 数据结构 / 上传逻辑。

### 验证（真实修改后的 app.js，VM 模拟 26/26 全过）
- T1 真实 equipment 数据**加载后无需复习**自动迁移：difficulty≈0.367、stability≈4.263、nextReview=lastReview+1天（未来，不再第一）；history/reviews/n/ef 全保留；
- T2 正常 PDM 数据逐字节不变；T3 新卡（nextReview=0）不变；T4 真过期卡保持到期；T5 无间隔→最短 12h；T6 正常数字 nextReview 不动；T7 今天复习过的卡不误判为今天到期；
- T8 equipment 不在 due 列表与复习队列；T9 二次迁移零变化（幂等）；
- T10 上传→Gist→手机恢复（真实 sync.js/cloud-sync.js）保真、仍走 PATCH 无孤儿 Gist；
- T11 导入旧备份（未迁移数据）→ 导入后自动迁移。
- `node --check` 通过（根 + deploy 两份一致，SHA256 相同）。

### 修改的文件
- 修改：`app.js`（根 + `deploy/app.js` 同步）、`CHANGELOG.md`

### 部署
- 用 GitHub Desktop 提交推送 `app.js`（根目录与 deploy/ 两份都推）；线上页面打开后自动迁移，**无需重新答题、无需删除数据**；随后重新「☁ 上传云端」→ 手机「☁ 从云端恢复」即全端一致。

---

## [2026-08-28] 运行环境约束记录（仅文档，无代码改动）

- 用户明确日常使用方式变更，**本次只记录、不修改任何代码**（PDM / 复习算法 / 数据结构 / 云同步逻辑均未动）：
  - **正式运行环境 = GitHub Pages 线上地址**（电脑和手机统一）：`https://reve-dev413.github.io/my-vocabulary-reviewer/`；
  - `file://` 双击打开的本地 `index.html` 仅作开发、调试和离线备份，不再是日常复习入口；
  - GitHub Desktop 仅用于管理、修改、提交、推送项目代码，其本地仓库里的 `index.html` 不作为复习入口；
  - 排查同步问题时默认以 GitHub Pages 的 https 环境为准，注意 `file://` 与 `https://` 的 localStorage 是不同存储空间（进度互不相通，属预期行为）；
  - 未来涉及同步、缓存、Service Worker 或数据迁移的代码修改，先检查运行环境，不擅自改现有同步机制。
- 修改的文件（纯文档）：`AGENTS.md`（新增「运行环境约束」一节）、`README.md`（「如何运行」改为线上地址为主入口）、`CHANGELOG.md`。
- 无代码改动，无需测试；日常复习统一走线上地址。

---

## [2026-08-28] Gist 云同步增加诊断与空数据拦截（定位"恢复后无记录"）

- 背景：电脑端 192 项上传成功、手机端同一 Token 恢复"成功"但仍是全部单词——疑似云端备份内容为空或恢复被静默中断，要求加诊断，不猜测。
- 修改（仅 `cloud-sync.js`，其余文件未动）：
  - `uploadGist()` 上传前打印诊断日志：`reviewer-state-v1 是否存在`、`本地记忆对象数`、`上传 JSON 中 reviewState 数量`；**数量为 0 时阻止上传**，提示「当前设备没有复习记录，无法上传云端」；
  - `applyCloudRestore()` 恢复前打印诊断日志：`Gist 文件名`、`backup.version`、`reviewState 数量`；**数量为 0 时禁止恢复**，提示「云端备份没有复习记录，已禁止恢复」，不进合并/覆盖弹窗；
  - 成功提示带数量：上传「云端备份成功，共保存 N 项 ✅」；恢复「云端恢复成功，共恢复 N 项 ✅」；
  - 保留：自动发现 gist、gist-id 缓存、PATCH 更新、Token modal 逻辑不变。
- 验证：`node --check` 通过；模拟测试 6 项断言组全过（空状态上传被阻止且无请求 / 非空上传提示含数量 / 空备份恢复被禁止且不进导入 / 非空恢复回调含数量并刷新 / PATCH 回归 / 自动发现绑定回归）；诊断日志逐条输出核对；根目录与 `deploy/` 两份一致。

---

## [2026-08-28] PWA 自动更新 + 深色模式

### PWA 自动更新（第一阶段）
- 新增 `version.json`（版本源 `{version:"1.6.0", updated}`）与 `update.js`：页面加载后后台读取 `version.json?t=时间戳`（绕过缓存），与本地 `app-version` 比较——首次打开静默记录版本不提示；发现新版本显示「发现新版本 vX」+ [立即更新]/[稍后]；立即更新 = 先写版本 → `registration.update()` → 新 SW 接管（controllerchange）→ reload（5 秒超时兜底），刷新后一次性「更新完成 ✅」。
- `service-worker.js`：**真 network-first**——fetch 加 `{cache:"reload"}` 绕过浏览器 HTTP 缓存（旧 app.js / sync.js / cloud-sync.js / data.js 不再被缓存糊住）；缓存名从 `version.json` 版本号派生（取不到退回默认名），activate 自动删除旧缓存；保留 `skipWaiting` / `clients.claim`；只缓存无查询参数的稳定资源，避免 `version.json?t=` 临时 URL 污染缓存；SHELL 加入 update.js。
- `index.html`：引入 update.js；新增更新提示样式 `.update-box`（深浅色自适应）；theme-color 支持浅/深两套。
- 安全边界：只新增独立 localStorage 键 `app-version`；**不触碰** `reviewer-state-v1` / `gist-token` / `gist-id`；未修改 app.js / sync.js / cloud-sync.js / data.js / PDM / 知识库格式。

### 深色模式（第二阶段）
- CSS 全部改为主题变量（`:root` 浅色值 = 原配色不变，`[data-theme="dark"]` 覆盖）：深灰背景（非纯黑 #1d2126）、稍亮灰卡片（#272c33）、高对比文字；卡片阴影、弹窗、输入框、更新提示全部变量化自适应。
- 主题切换：工具栏新增 ☀️/🌙 按钮；localStorage `theme-preference`（`dark` / `light` / `system` 三态，未设置=跟随系统）；手动选择优先于系统；`prefers-color-scheme` 变化时 system 模式自动跟随；head 内立即应用避免首屏闪烁，DOMContentLoaded 同步按钮图标（修复首屏图标不同步）。
- 深色下四档评价按钮按档着色：忘记红 / 困难橙 / 记得绿 / 简单蓝（浅色模式按钮样式保持原样）。

### 验证
- `node --check`：app.js / sync.js / cloud-sync.js / service-worker.js / update.js（根 + deploy 各一份）全部通过；index.html 内联脚本（主题脚本 + SW 注册脚本）语法通过。
- update.js `decide` 纯逻辑 6 项断言通过（首次打开 / 发现新版 / 版本相同 / 服务器无版本 / 版本回退 / 空格处理）。
- 浅色模式像素对比：与改动前基线仅顶部工具栏（新增 🌙 按钮）区域有差异，卡片区与其余页面 0 差异。
- 深色模式与移动端（390px 宽）截图核对：无横向滚动、无元素溢出、文字清晰可读、工具栏按钮换行整齐不重叠。
- 路径检查：SW SHELL 清单与 index.html 脚本 src 全部存在（根 + deploy）；根与 deploy 四份文件 SHA256 一致。
- localStorage 不冲突：现有 `reviewer-state-v1` / `gist-token` / `gist-id` 未动；新增 `app-version` / `theme-preference` 两个独立键。

### 修改的文件
- 新增：`version.json`、`update.js`（根 + deploy 各一份）
- 修改：`service-worker.js`、`index.html`、`README.md`、`CHANGELOG.md`（根 + deploy 同步）

### 部署
- 需上传到 GitHub Pages 站点根：`version.json`、`update.js`、`service-worker.js`、`index.html`（`deploy/` 副本与根目录内容一致）。

---

## [2026-08-27] Gist 云备份支持跨设备恢复（自动发现 + PATCH 更新）

- 问题：`gist-id` 只存本机 localStorage，新设备没有该值，恢复流程直接提示"先上传"，无法跨设备恢复。
- 修改（仅 `cloud-sync.js`，其余文件未动）：
  - `downloadGist()`：本地有 `gist-id` → 直接 `GET /gists/{id}`（快路径）；gist 失效（404）→ 回退自动发现；本地无 `gist-id`（新设备）→ 用当前 Token `GET /gists?per_page=100` 列出账号全部 Gist，按文件名 `reviewer-backup.json` 过滤、取 `updated_at` 最新一条，**自动保存 gist-id** 后再按 id 拉完整内容，进入原有合并/覆盖恢复流程。Token 无效等硬错误只提示一次，不叠加多余弹窗。
  - `uploadGist()`：已有 `gist-id` 改用 `PATCH /gists/{id}` 更新同一个 Gist（不再每次新建、不再堆积孤儿 Gist）；PATCH 遇 404（Gist 被删）自动改回 POST 新建并保存新 id；首次上传才 POST。
- 安全：Token 仍只存 `gist-token`（localStorage）、只放请求头，不写入 Gist；输入方式（自定义 modal）不变；无新依赖。
- 验证：`node --check` 通过；模拟测试 10 项断言组全过（POST 首次新建 / PATCH 更新不新建 / PATCH 404 回退 / 有 id 快路径 / 无 id 自动发现取最新并绑定 / 账号无备份提示 / id 失效回退 / Token 无效单次提示 / modal 流程回归）；根目录与 `deploy/` 两份一致。
- 部署：重新上传 `cloud-sync.js` 到 GitHub（覆盖同名文件）即可，无需动其他文件。

---

## [2026-08-27] Token 输入改用自定义 modal（修复手机端无法输入 Token）

- 问题：手机端（iOS Safari / PWA 独立模式）点「上传云端」时 `window.prompt()` 不弹输入框，只显示文字。
- 修复：移除 `window.prompt()`，改为自定义 HTML modal（`#tokenModal`）：
  - `index.html`：新增 token 弹窗（`type=password` 输入框 + 确认/取消，复用 modal 样式；新增 `.modal-input`，font-size 16px 避免 iOS 聚焦自动放大）；
  - `cloud-sync.js`：`getToken()` 改为 Promise 化——无 token 时打开 modal，确认后 trim 并保存到 `gist-token` 再继续上传/恢复；取消返回 null 中止流程；支持回车=确认、Esc=取消；空输入提示不关闭；modal 已打开时重复触发直接取消（不叠加）；DOM 缺失时安全降级。上传/恢复其余逻辑不变。
- 验证：`node --check` 通过；模拟测试 9 项断言组全过（打开/空输入/确认保存并继续上传/已有 token 不弹窗/取消/Enter/Esc/重复触发/DOM 缺失降级）；全项目已无 `prompt(` 调用；根目录与 `deploy/` 两份一致。
- 部署：需重新上传 `index.html` 与 `cloud-sync.js` 到 GitHub（网页上传覆盖同名文件）。

---

## [2026-08-27] 更新部署后旧版页面自动刷新（移动端更新生效）

- 问题：移动端输入网址打开后仍是旧版（无 ☁ 按钮）——旧 Service Worker 控制页面时，新版部署后需再刷新一次才生效。
- 修复：`index.html` 的 SW 注册脚本新增 `controllerchange` 监听——已由 Service Worker 控制的设备，新版 SW 接管后自动刷新一次跳到新版；首次访问不刷新。根目录与 `deploy/` 同步。
- 仍受部署与缓存影响的情况：线上文件尚未重新发布 / GitHub Pages CDN 未刷新 / 手机浏览器 HTTP 缓存，需强刷一次或清站点数据。

---

## [2026-08-27] GitHub Gist 云备份（手动上传 / 手动恢复）

### 需求
- 电脑/手机/iPad 之间手动同步复习进度：不是实时同步，只做「☁ 上传云端」+「☁ 从云端恢复」两个按钮；不重构、不碰 PDM 算法/调度器/知识数据。

### 实现
- 新增 `cloud-sync.js`（`window.CloudSync`）：
  - `uploadGist()`：读 localStorage `reviewer-state-v1` → 用 `Sync.exportState` 生成备份 `{version, timestamp, reviewState, settings}` → POST `https://api.github.com/gists` 创建**私有** Gist（文件名 `reviewer-backup.json`，内容格式化 JSON）→ 成功保存 `gist-id`；
  - `downloadGist()`：检查 `gist-token` / `gist-id`（缺则提示先上传）→ GET gist → 取 `reviewer-backup.json` → **复用已有导入逻辑**（`app.js` 的 `importBackupText`，走「合并 / 覆盖」弹窗，内部即 sync.js 的 `importState` / `mergeState`）→ 成功提示「云端恢复成功」并刷新页面；
  - token 管理：首次使用弹窗输入（`prompt`），保存到 localStorage 键 `gist-token`，以后自动使用；**不写死在代码**，只提示勾选 gist 权限（不要 repo 权限）。
- `app.js`（仅备份段）：`importBackup` 的解析主体抽为 `importBackupText(text, onSuccess)`（文件导入与云端恢复共用，不重复写恢复逻辑）；`applyImport` 成功后若带回调则执行（云端恢复提示+刷新），否则维持「导入成功 ✅」；绑定 `uploadCloudBtn` / `downloadCloudBtn` 两个按钮事件。
- `index.html`：工具栏在「导出进度 / 导入进度」旁新增「☁ 上传云端」「☁ 从云端恢复」按钮；引入 `cloud-sync.js`（在 app.js 之后加载）。
- `service-worker.js`：SHELL 缓存清单加入 `cloud-sync.js`，CACHE_VERSION v1 → v2（旧缓存自动清理，离线也能打开新页面）。
- `deploy/` 部署副本与根目录同步更新（index.html / app.js / cloud-sync.js / service-worker.js 内容一致）。

### 验证
- `node --check` 通过（app.js / sync.js / cloud-sync.js / service-worker.js，根目录与 deploy 两套）。
- 模拟测试（临时脚本，验证后已删除）通过：上传请求体 = 私有 gist + `reviewer-backup.json` 含 `{version, timestamp, reviewState, settings}`；成功保存 gist-id；token 缺失时弹窗输入并保存；恢复时无 gist-id 提示先上传；下载内容交给 `importBackupText` 走合并/覆盖；GitHub 错误信息（Bad credentials 等）正确提示。
- 根目录与 deploy 四份文件 hash 核对一致。

### 修改的文件
- 新增：`cloud-sync.js`、`deploy/cloud-sync.js`
- 修改：`index.html`、`app.js`（仅备份段与按钮绑定）、`service-worker.js`、`README.md`、`CHANGELOG.md`；deploy 对应副本同步

---

## [2026-08-27] PWA 化 + 移动端适配 + 进度备份格式升级（电脑/手机/iPad）

### 完成
- **P0 移动端适配**（仅 index.html 内联 CSS，PC 外观不变）：
  - 按钮统一 min-height 48px（≥44px 触控标准）；手机（≤600px）四档评价变 2×2 大网格，工具栏允许换行；
  - 手机卡片单列、左右留 12px；iPad 竖屏卡片 680px、字号加大；iPad 横屏（触屏大屏）卡片放宽到 760px 合理利用宽度；
  - 防横向滚动（overflow-x hidden）、100dvh 适配 Safari 地址栏、安全区 env(safe-area-inset-*) 留白、禁双击缩放延迟与长按选中。
- **P1 PWA**：
  - 新增 `manifest.json`（standalone 全屏、主题色 #2f6fed）、`service-worker.js`（network-first：在线必拿最新 data.js，离线回退缓存；缓存名版本化，升级自动清理）；
  - 新增图标 icon-192/icon-512/apple-touch-icon（「记」字蓝底，System.Drawing 生成）；
  - Safari「分享 → 添加到主屏幕」→ 全屏运行；SW 注册加守卫，双击 index.html（file://）静默跳过、照常可用。
- **P2 手动同步（最简单版）**：
  - 导出按钮改名「导出进度」，生成 `reviewer-backup.json`（`{version, timestamp, reviewState, settings}`）；
  - 导入按钮改名「导入进度」，选文件后弹窗选「合并 / 覆盖 / 取消」；合并=逐对象取 lastReview 较新者（最近复习者优先）；覆盖=整体替换（二次确认）；
  - 自动兼容旧备份（`state` 字段格式）；存储键 `reviewer-state-v1` 不变；
  - 新增 `sync.js`（exportState / importState / mergeState 纯函数 + 云同步适配器接口预留，当前不实现）。

### 验证
- 数据核对：207 主题 / 312 记忆对象（判断题 4、直接卡 5）与改动前一致；
- `node --check` 通过（app.js / sync.js / service-worker.js）；sync.js 单测通过（新格式导出、新旧格式导入、合并规则、非法文件拒绝）；
- PC 1200px / 手机 390px / iPad 竖屏 768px / iPad 横屏 1180px 四种视口截图核对，无横向滚动、按钮不拥挤。

### 修改的文件
- 修改：`index.html`、`app.js`（仅备份段）、`README.md`、`CHANGELOG.md`
- 新增：`manifest.json`、`service-worker.js`、`sync.js`、`icon-192.png`、`icon-512.png`、`apple-touch-icon.png`

---

## [2026-08-26] 澄清：arrange one's times 的正确说法是 manage one's time

- 用户明确：**不要说 arrange one's times，英语习惯说 manage one's time；arrange one's times 是错误的**。
- `knowledge.js`：avoid-arrange-times 卡答案改为正确在前、错误在后——「英语习惯说 manage one's time；不要写 arrange one's times、time arrangement ability（中式表达，arrange one's times 是错误的）。时间管理的其他自然表达：manage time effectively / allocate time / set priorities / meet deadlines / build in a buffer（留出缓冲）。」
- 验证：知识库语法与 id 唯一性校验通过。

### 修改的文件
- 修改：`knowledge.js`、`CHANGELOG.md`

---

## [2026-08-26] 空格键显示答案

- `app.js`：新增键盘监听——在"回忆视图"下按空格键等于点击「显示答案」；阻止空格滚动页面与长按重复触发；其他视图下无副作用。
- 验证：模拟测试 6 项断言全部通过（回忆视图按空格显示答案、答案视图无副作用、长按不重复触发、每张卡均可用）。
- 修改：`app.js`、`CHANGELOG.md`

---

## [2026-08-26] 导入第二批：科技与人工智能场景

### 完成
- 按转换规则，将 Word《四六级场景词附积累_并入版》"二、科技与人工智能场景"全部内容转换为知识库：**207 主题 / 312 记忆对象**（本批净增 41 主题 / 52 对象，语法与 id 唯一性校验通过）。
- 覆盖条目类型：普通单词（volatile、convert、audit、encrypt、alteration、thermostat、marketplace……）、词块搭配（battery life、cloud backup、data leak、restore a backup、in real time、address a risk、content moderation……）、可直接套写例句 3 句（Digital technology changes… / AI can recognize patterns… / Big data refers not merely…）。
- 应用规则：
  - 搭配拆分（每点独立记忆对象）：compatible（词义 / be compatible with / backward-compatible / 辨析）、spiral（名词义 / 动词义 / spiraling costs / spiral staircase / positive spiral）、explode（popularity has exploded / explode a myth）；
  - life 相关表达合成一个主题：battery life / life sentence / shelf life / bring sth. to life——life sentence 与法律章节考点完全相同（无期徒刑），本批先导入，法律批次不再重复；
  - 辨析组放同一张卡：compatible 与 interoperable / well-suited / consistent with 对比；
  - gravitate 已预保留主题（gravitate towards / to + 例句），科技章节考点完全相同，不重复导入；
  - 大数据"四个 V"（volume / velocity / variety / veracity）属同一知识点，一张卡。
- 例句卡均配中文翻译；内容全部来自资料原文，materials 不编造。

### 验证
- 临时脚本（验证后已删除）校验通过：207 主题 / 312 对象，主题与对象 id 全部唯一、字段完整；判断题 4 张、直接卡 5 张（均为原有内容，本批无新增）。

### 修改的文件
- 修改：`knowledge.js`、`README.md`、`CHANGELOG.md`

### 下一步
- 其余场景分批导入：三（外交）、四（健康）、五（法律）、六（地理）、七（就业）、八（社会文化）、十一（专业词汇）。

---

## [2026-08-25] 新增"上一题"功能

### 需求
- 误选熟练度后返回修改；只能返回当前流程的上一题；重新选择以最后一次为准；不产生两次复习记录。

### 实现
- `index.html`：工具栏新增"上一题"按钮（默认隐藏）。
- `app.js`：
  - `gradeCurrent` 评价前保存该对象状态深拷贝快照（`lastAction`，prevState 为 null 表示评价前无状态），并置 `canGoBack = true`。
  - 新增 `goBack`：恢复快照（新卡删除状态）→ 回退指针、撤销计数 → 重新显示上一题评价界面（判断题回到判断按钮，普通卡/直接卡回到答案页）；`canGoBack` 置 false（只能退一步）。
  - 新增 `updateBackBtn` 控制按钮显示；startSession/refreshReadyView 重置。
- 未改动记忆算法（PDM v1 applyReview）、调度器及其他 UI。

### 验证
- 模拟测试 20 项断言全部通过：评价后回退恢复原状态；重评以最后一次为准（PDM 重新计算 stability/difficulty/间隔）；history 与 reviews 不重复；判断卡回退后判断按钮重新可见；只能回退一步。

### 修改的文件
- 修改：`index.html`、`app.js`、`CHANGELOG.md`

---

## [2026-08-25] 记忆算法更换：SM-2 简化版 → PDM v1（Personal Dynamic Memory）

### 需求（用户确认设计）
- 旧算法"第 1 次 1 天 / 第 2 次 6 天 / 之后 ×EF"的固定阶梯与"忘记→4 小时"不符合实际使用体验，暂停沿用。
- 目标：每个记忆对象按自身历史表现动态形成记忆状态；实际复习间隔参与稳定性变化；下次复习时间由稳定性动态推算。设计文档：`DESIGN-MEMORY-ALGORITHM.md`（先设计、模拟确认，后实现）。

### 实现（app.js）
- `MEMORY_CONFIG` → `PDM_CONFIG`：目标保留率 0.85、首次稳定性表（忘记0.6/困难1.0/记得2.0/简单3.5）、base/creditWeight 表、阻尼 0.15、难度钳位 [0.05,0.95]、稳定性钳位 [0.3,730]、12h 最短间隔、忘记后恢复钳位 [24h,48h]——全部集中一处可调。
- `applyReview` 整体重写为 PDM v1：
  - 遗忘曲线 R = 2^(-elapsed/S)，credit = 1 - R（复习得越晚还能记住，S 涨得越多）；
  - 首次复习 S 查表、D 固定增量；后续 S_new = S × (base + creditWeight×credit) × (1 - 0.15×D)；
  - D：忘记 +0.02+0.08×R（越出乎模型预期加得越多）、困难 +0.03、记得 0、简单 -0.02；
  - 下次间隔：忘记 → clamp(S×k, 1, 2) 天；其他 → max(S×k, 12h)；k = log2(1/0.85) ≈ 0.2345。
- `ensureState` 惰性迁移：旧 n/ef/lastIntervalDays → difficulty/stability（ef 2.5→0.05、1.3→0.95；S = I/k 使迁移后下次间隔 ≈ 原计划），不覆盖 lastReview/nextReview/reviews/history；旧"忘记→4 小时"残留 nextReview（未来但不足 12h）提升到 12h。
- `GRADE_Q`（SM-2 质量分）移除。调度器 `buildReviewQueue`/`getDueList` 未改动；界面未改动；知识库未改动；存储键 `reviewer-state-v1` 不变（原地迁移，数据不丢）。

### 验证
- 临时脚本 `_verify-pdm.js`（验证后已删除）：81 项断言全部通过——
  - 案例 1 S 2.00→2.83→3.98→5.61→10.12、间隔 0.50/0.66/0.93/1.31/2.37 天；
  - 案例 2 S 1.00→1.13→1.26→1.39、D 0.33→0.42、间隔恒 0.50 天；
  - 案例 3 S 0.60→0.99→1.44、忘记后间隔 1.00 天；
  - 案例 4 S=30 隔 7 天忘记 → 9.52→13.48→19.17→27.26、D 0.15→0.24、恢复间隔 2.00 天；
  - 案例 5 S 0.60→0.34→0.58→0.30→0.51→0.78→1.46、D 0.38→0.47；
  - 边界：忘记后间隔恒在 [24h,48h]、非忘记 ≥12h、复习后 nextReview 必在未来；
  - 迁移：旧数据换算、4h 残留提升、已过期不动、nextReview/reviews/history 保留；调度器回归正常。

### 修改的文件
- 修改：`app.js`、`README.md`、`AGENTS.md`、`CHANGELOG.md`
- 新增：`DESIGN-MEMORY-ALGORITHM.md`（设计文档，上一轮已确认）

---

## [2026-08-25] 第四轮反馈：再复习一轮残留修复 + 提醒卡原因 + 词性题格式 + 释义修正

### Bug 修复（app.js）
- 点「再复习一轮」后，上一轮的「本轮复习完成」区域没有隐藏，残留在蓝色「显示答案」按钮下方——`startSession` 中补上 `doneView` 隐藏。

### 知识库（knowledge.js）
- principle：stick to one's principles 与「不能说 insist 直接接 principle」合并为一张**避免中式表达**题（汉译英方向）：「坚持原则」→ stick to one's principles；不能写 insist 直接接 principle。原提醒卡删除。
- avoid-arrange-times（避免中式表达）：补答案，**正确表达在前**（manage time effectively / allocate time / set priorities / meet deadlines / build in a buffer），错误表达在后（arrange one's times、time arrangement ability）。
- 派生词词性题改直接问形式：vulgarly / vulgarity（vulgar 的副词/名词形式）、clumsily / clumsiness（clumsy 的副词/名词形式）。
- 「不能写/不说」提醒卡答案补原因：cite-writing-warning（cite 是及物动词，直接接宾语，不用 that 从句或 from）、discipline-punishment（discipline 作「惩戒」义通常不可数，不用 a discipline）。
- 释义修正：cradle-to-grave care → 终生看护；lofty rhetoric → 高妙辞藻（用户确认）。
- plateau 作动词的例句 sales have plateaued **at** 10 million：介词 at 标红。

### 规则固化（AGENTS.md）
- 第 8 条：「不能写/不说 xxx」提醒卡必须在 answer 中标明原因；「避免中式表达」卡答案正确表达在前、错误表达在后。
- 第 9 条③：派生词词性题直接问「xxx 是 xxxx 的什么形式？」。

### 验证
- 知识库 166 主题 / 260 记忆对象（本批合并删除 1 对象），语法与 id 唯一性校验通过；判断题 4 张、直接卡 6 张。

### 修改的文件
- 修改：`app.js`、`knowledge.js`、`README.md`、`AGENTS.md`、`CHANGELOG.md`

---

## [2026-08-25] 第三轮反馈：答案页显示题干 + 介词标红 + 词性题干格式 + 考点拆分

### 界面（index.html / app.js）
- 答案页（评价视图）在答案**上方**显示题干，灰色小字（`.prompt-in-answer`）；直接卡题干即内容本身，不重复显示。
- 新增富文本渲染 `renderRich`：知识库中 **…** 包裹的内容渲染为红色（`.hl-red`），用于介词/关键点标红；先转义 HTML 再替换标记，保证安全。应用到题干、答案、补充材料、主题名、判断题各视图。
- 应用示例：discover an aptitude **for** 的介词 for 标红。

### 知识库（knowledge.js）
- 考点拆分（每点独立记忆对象）：
  - peer：peer into 仔细观察；探究（peer 动词义卡不再混含）
  - advocate：advocate doing / advocate reform / advocate for victims / 作名词时常与 for 搭配 → 4 张独立卡
  - peer pressure：resist peer pressure / give in to peer pressure 拆成两张
- guidance 卡由直接卡改为**判断题**（judge: true，命题「guidance 通常作不可数名词」）。
- cater to / embrace 翻译题考察点按用户确认改为「**达到**（要求/标准/期望）」（如 cater to expectations）。
- 例句卡「句中表达/句中搭配」标注：对应表达已单独成考点（in accord with / be indicative of / reach an accord on / hit a plateau / gravitate towards）的冗余标注全部移除；beyond the immediate horizon 未单独成考点，保留。
- 词性题干统一（AGENTS.md 第 9 条③）：temper / plateau / peer 的动词义卡改为「xxxx 的动词词性是什么？」；digest 改「作动词和作名词时分别表示什么」；熟词僻义卡 habit / benefit / saw / wind / quiver 题干补词性（如「habit 的名词少见含义是什么？」）。

### 验证
- 知识库 166 主题 / 261 记忆对象（本批净增 5 对象），语法与 id 唯一性通过；判断题 4 张（equipment / district 大写 / emerge / guidance）、直接卡 6 张。
- app.js 语法通过；renderRich 单测通过（标红 + HTML 转义）。
- an empty promise / an empty gesture / be empty of、saw 的搭配（an old saw / cut it with a saw）上一轮已拆为独立考点，本批核对确认无遗漏。

### 修改的文件
- 修改：`index.html`、`app.js`、`knowledge.js`、`README.md`、`AGENTS.md`、`CHANGELOG.md`

---

## [2026-08-25] 考点修正（续）：剩余 materials 中的搭配/词组全部提升为考点

### 需求（用户确认：全部拆成考点）
- 上一轮清单之外，知识库仍有 8 处 `materials` 放着搭配/词组，按「我给的词组大多都是考点」原则一并拆为独立记忆对象：
  - repertoire：a musical repertoire / a repertoire of techniques / add a skill to one's repertoire
  - district：school district 学区（另「专有地名中 District 大写」做成判断题 judge）
  - vacant / blank / empty 辨析组：an empty promise / an empty gesture / be empty of → 新主题「empty 搭配」，与原辨析组互记 related
  - plateau：reach / hit a plateau / plateau 作动词（sales have plateaued at 10 million）/ the Tibetan Plateau（词源仍留在 materials）
  - saw：an old saw 老话 / cut it with a saw 用锯切开
  - clumsy：clumsy 搭配组（movement / apology / wording / handling of the crisis）+ clumsily 副词 + clumsiness 名词
  - cite：cite A as evidence / an example；「不能写 cite the author that... / cite from several reasons」做成直接卡（direct）
  - intrinsic：intrinsic rights 内在权利
- wicked 卡：原稿只有「与 harmful、evil 区分」提示、无具体区别内容（不编造），将该提醒并入答案，不再作 materials。
- 句中表达类 materials（如 hit a plateau / be indicative of 等例句卡标注）保留——这些表达本身已是独立考点，标注仅辅助例句回忆。

### 验证
- 语法与 id 唯一性校验通过；知识库现为 **166 主题 / 256 记忆对象**（本批净增 1 主题、19 对象）。
- 判断题共 3 张（equipment / district 大写 / emerge），直接卡共 7 张，字段检查全部正常。

### 修改的文件
- 修改：`knowledge.js`、`README.md`、`CHANGELOG.md`

---

## [2026-08-25] 考点修正：搭配提升为独立考点 + emerge 改判断题（第二轮测试反馈）

### 需求（用户反馈）
- emerge 改为判断题。
- 用户明确指出：**资料中给出的词组/搭配大多是考点，不是补充材料**。以下内容由 `materials` 提升为独立记忆对象（各自独立复习、独立评价熟练度）：
  - characterize：characterize A as B / be characterized by / features that characterize an era（词义卡不再混考搭配）
  - rhetoric：lofty rhetoric 宏大口号
  - eloquent：an eloquent speech / account；eloquent silence 意味深长的沉默
  - vulgar：vulgar language / a vulgar joke / a vulgar display of wealth；vulgarity；vulgarly；Vulgar Latin 通俗拉丁语
  - lofty：lofty ideals 崇高理想 / lofty ceiling 高耸的天花板 / in a lofty manner 以傲慢姿态 / lofty language 华丽空洞的语言
  - digest：digest food / take time to digest the news / a weekly digest 每周文摘 / hard to digest 难消化·难接受
  - weave：weave A into B / weave through traffic / 过去式 wove、过去分词 woven（新主题 weave，与 knit 辨析组互记 related）
  - temper：temper A with B / temper tantrum 发脾气
- be indicative of 与 indicative 词义拆成两张独立卡。
- anything less than 释义修正为「绝非；一点也不」（Word 原稿误写「完全是」，那是 nothing less than 的含义；按用户修正）。
- digest 词义卡并入考点：「消化知识」按语境用 absorb 或 process。
- temper 词义卡强调考动词义（题干改为「作动词时表示什么」）；habit 卡强调少见义（修道服，常见义为「习惯」）。

### 验证
- 语法与 id 唯一性校验通过；知识库现为 **165 主题 / 237 记忆对象**（本次净增 1 主题、24 对象）。
- emerge 判断题字段（judge: true / expected: true / 有 answer）与 equipment 卡一致；judge 流程走现有判断视图，无代码改动。
- criticize sth. for doing sth. 核对：已是独立搭配卡（考点），无需改动。

### 修改的文件
- 修改：`knowledge.js`、`README.md`、`AGENTS.md`、`CHANGELOG.md`
- 规则固化：`AGENTS.md` 知识模型第 4 条明确「资料中罗列的具体搭配/词组默认是考点（用户明确：我给的词组大多都是考点），应拆为独立记忆对象，不放进 materials」；`knowledge.js` 头部注释同步为第 1~15 条。

---

## [2026-08-25] 新增判断题类型（judge）

### 需求
- 提醒型知识点（如"equipment 通常不可数"）改为判断题：显示命题 → 判断对/错 → 显示答案；判断正确按"简单"记录、判断错误按"忘记"记录。

### 实现
- `index.html`：新增 judgeView（命题 + [对]/[错] + 答案 + 下一张）。
- `app.js`：showNext 支持 `judge: true` 卡；新增 showJudge / judgeChoose / judgeNext（对→简单、错→忘记，走 gradeCurrent 正常更新记忆状态）；各视图切换时正确隐藏 judgeView。
- `knowledge.js`：equipment 卡由 direct 改为 judge（expected: true）。
- `AGENTS.md`：知识模型新增第 15 条"判断题"规则；修正架构约束中过时的算法描述（SM-2 / applyReview）。

### 验证
- 模拟测试 12 项断言全部通过：判断正确 → 简单（n=1、间隔 1 天）；判断错误 → 忘记（n=0、间隔 4 小时）；普通卡不误入判断视图。

### 修改的文件
- 修改：`index.html`、`app.js`、`knowledge.js`、`AGENTS.md`、`CHANGELOG.md`

---

## [2026-08-25] 实现 SM-2 简化版记忆算法

### 实现（app.js）
- 新增 `MEMORY_CONFIG` 参数集中配置：首次 1 天 / 二次 6 天 / EF 初始 2.2、范围 1.3~2.5 / 忘记重学 4 小时 / 档位权重（困难 1.0、记得 1.0、简单 1.25）。
- 新增 `applyReview`（算法核心，可整体替换）与 `ensureState`（惰性迁移）。
- 规则（用户确认）：
  - 忘记 → 4 小时后复习，连续成功 n 归零，EF 下调
  - 困难 → 算成功，n+1，EF 下调，本次间隔正常计算（方案 B）
  - 记得 → 算成功，n+1，EF 不变
  - 简单 → 算成功，n+1，EF 上调，本次间隔 ×1.25
  - 间隔：第 1 次成功 1 天，第 2 次成功 6 天，之后 = 上次间隔 × EF × 档位权重
  - 间隔用当前 EF 计算，EF 更新供下次使用（SM-2 标准顺序）
- 记忆状态字段：n（连续成功）、ef（易度因子）、lastIntervalDays（上次间隔天）、reviews、lastReview、nextReview、history。
- 旧数据惰性迁移：缺失新字段补默认值，**不覆盖**已有 nextReview/reviews/history。
- 记忆算法与调度器保持分离；调度（两轮轮转去重）未改动；UI 未改动；未加新功能。

### 验证
- 模拟测试 29 项断言全部通过：连续困难 5 次间隔 1→6→11.5→20.5→33.6 天且 EF 降至 1.5；连续记得 5 次 1→6→13.2→29→63.9 天且 EF 不变；连续简单 5 次 EF 升至 2.5 上限、间隔 ×1.25；忘记归零 + 4 小时 + EF 下限 1.3 + 重学后 1 天；惰性迁移补默认不覆盖；调度去重回归正常；页面加载 213 项。

### 修改的文件
- 修改：`app.js`、`README.md`、`CHANGELOG.md`

---

## [2026-08-25] 汉译英方向：cater to / embrace 卡翻转

- 需求：中国考试翻译题为中文→英文，翻译/写作输出类考点应采用汉译英方向。
- `knowledge.js`：cater-to-embrace 卡改为汉译英方向（prompt 给中文「迎合」，answer 给英文 cater to / embrace）。
- `AGENTS.md`：知识模型新增第 14 条"回忆方向（汉译英）"——翻译/写作输出类考点用中文→英文，普通词义卡维持英译中。

---

## [2026-08-25] 修正：cater to / embrace 为翻译对应而非辨析

- 需求澄清：cater to / embrace 不是近义词辨析，而是翻译题中两个词都可按「迎合」翻译。
- `knowledge.js`：cater-to-embrace 卡 type 由辨析改为词块，题干/答案改为翻译对应表述（「在翻译中怎么处理？」→「在翻译题中都可按「迎合」翻译」）。
- `AGENTS.md`：第 13 条补充区分——并列词若是翻译对应关系而非近义词辨析，按词块卡处理，标注翻译对应即可。

---

## [2026-08-25] 近义词并列条目按辨析卡处理

- 需求：personality trait 中 personality 与 trait 是近义词，应在同一题中给出各自意思。
- `knowledge.js`：
  - personality-trait → 辨析卡："personality 与 trait 有何区别？" → "personality 人格；trait 特质。"
  - cater to / embrace（同为近义词并列）合并为一张辨析卡："「cater to / embrace」是什么意思？" → "迎合。"
- `AGENTS.md`：知识模型新增第 13 条"近义词并列条目"规则。
- 知识库现为 164 主题 / 213 记忆对象（校验通过）。

---

## [2026-08-25] 导入第一批：教育与校园场景（完整）

### 完成
- 按定稿转换规则，将 Word《四六级场景词附积累_并入版》"一、教育与校园场景"全部内容转换为知识库：**165 主题 / 214 记忆对象**（语法与 id 唯一性校验通过，程序加载正常）。
- 覆盖条目类型：普通单词、多词义单词、搭配、固定表达、无单独词头短语（plausible explanations 等）、词块、句型、辨析组（同一张卡）、熟词僻义、用法提醒（直接卡）、完整句子（例句卡，含"可直接套写"句）。
- 应用规则：搭配拆分（manage 时间管理 8 对象、heart 8 对象、principle 3+1 对象、cradle 5 对象等）；同场景同词归一个主题（access、intrinsic、peer、relieve、temper、vulgar、wicked、married、dispose 等）；跨场景词保留（accord/plateau/vicinity/gravitate 预先保留待其余场景批次）。
- 例句卡均配中文翻译；materials 只含资料原文的搭配/词源/补充。
- 原测试数据已由教育场景完整转换替换（含 competence 组辨析合并卡、emerge/discipline 直接卡）。

### 修改的文件
- 重写：`knowledge.js`（教育场景 165 主题 + 保留 4 个跨场景主题）
- 更新：`README.md`、`CHANGELOG.md`

### 下一步
- 其余场景分批导入：二（科技与AI）、三（外交）、四（健康）、五（法律）、六（地理）、七（就业）、八（社会文化）、十一（专业词汇）。

---

## [2026-08-25] 转换规则定稿并写入 AGENTS.md

### 用户确认的规则（已写入 AGENTS.md 知识模型）
- 第 1 条：主题不限于单词——独立学习意义的英语知识单元均可为主题（含无单独词头的短语）。
- 第 11 条（新增）：辨析组需辨析的词语们放同一张独立卡对比呈现；对比关系说明类辨析（enhance/increase）作为整体对象。
- 第 12 条（新增）：跨章节重复词——考点完全相同或包含关系则删除重复；考点不同则各自保留、可互记 related。
- 章节归属字段：用户确认不加。

### 测试数据同步
- `knowledge.js`：competence 组 3 张卡合并为 1 张辨析卡（competence / competency / capability / competitiveness 有何区别），答案用 Word 原文。总记忆对象 31 → 29（已验证加载）。

### 修改的文件
- 修改：`AGENTS.md`、`knowledge.js`、`CHANGELOG.md`

---

## [2026-08-25] accord 搭配拆分为独立考点

- 需求：每个搭配分别作为独立记忆对象，独立评价熟练度。
- `knowledge.js`：accord-collocations 一张罗列卡拆为 4 张独立搭配卡（in accord with / of one's own accord / reach an accord on something / reach a peace accord）。accord 主题现为 6 张卡；总记忆对象 28 → 31（已验证程序正常加载）。

---

## [2026-08-25] 答案补全：vicinity、intrinsic 卡搭配写入答案

- 需求原则：题干问到什么（意思/搭配），答案就要完整回答。
- `knowledge.js`：
  - vicinity-usage：答案补入常用搭配（in the vicinity of the airport / $2m / from the vicinity of），materials 只留词源。
  - intrinsic-usage：答案补入常用搭配（intrinsic value；be intrinsic to something），materials 保留补充解释（同类问题一并修正）。

---

## [2026-08-25] emerge 卡改为直接卡

- `knowledge.js`：emerge 用法卡改为直接卡（direct: true），复习时直接展示原则"emerge 是不及物动词，不能写 was emerged。"并自评熟练度。至此直接卡共 2 张（discipline、emerge）。
- 验证：模拟测试 6 项断言全部通过（两张直接卡均跳过回忆、内容正确；普通卡流程不变）。

---

## [2026-08-25] 新增"直接卡"类型：陈述型知识点直接展示自评

### 需求
- 用户：陈述型知识点（正确原则直接给出，无回忆价值）应直接展示原则，让用户判断熟练度即可（以 discipline 卡为例）。

### 实现
- `app.js`：复习流程支持 `direct: true` 标记的卡——跳过"回忆→显示答案"环节，直接展示内容（原则）并进入四档评价；抽出 `showAnswerContent` 复用展示逻辑。
- `knowledge.js`：discipline 卡改为直接卡（prompt 即原则本身）。
- `AGENTS.md`：知识模型新增第 8 条"直接卡（direct）"规则。

### 验证
- 模拟测试 9 项断言全部通过：direct 卡（discipline，队列第 4 位）直接进入评价视图、内容为原则本身、整体流程与状态保存正常。

### 修改的文件
- 修改：`app.js`、`knowledge.js`、`AGENTS.md`、`CHANGELOG.md`

---

## [2026-08-25] 题干措辞修正：access 卡不透露答案

- `knowledge.js`：access-verb 题干"access 作及物动词时怎么接宾语？"改为"access 作动词时，后面怎么接？"——去掉"及物动词"（其含义即"直接接宾语"，写在题干里等于泄露答案），保留回忆价值。

---

## [2026-08-25] 规则变更：例句是独立记忆对象

### 变更
- 用户明确：资料中的例句需要单独记忆，类似知识点。
- `AGENTS.md`：重写"例句规则"——完整例句（尤其"可直接套写"句）默认建立独立记忆对象，与知识点卡并存、各自独立调度；materials 只放搭配示例、词源、补充解释等非完整句子内容。

### 测试数据调整
- `knowledge.js`：把 3 个例句从辅助材料提升为独立记忆对象（附"句中表达/搭配"提示，内容均来自资料原文）：
  - accord-sentence（They also reached an accord on addressing climate change.）
  - plateau-sentence（Deaths in Brazil hit a plateau in the middle of last year and gradually tailed off.）
  - gravitate-sentence（Public enthusiasm gravitates towards technological novelty and global trends.）
- 测试数据现为 16 主题 / 28 记忆对象（已验证程序正常加载）。

### 修改的文件
- 修改：`AGENTS.md`、`knowledge.js`、`CHANGELOG.md`

---

## [2026-08-25] 导入 Word 资料测试数据（16 个代表词）

### 完成
- 读取并理解《四六级场景词附积累_并入版.docx》整体结构（按场景分章：教育、科技、外交、健康、法律、地理、就业、社会文化、专业词汇）。
- 从 Word 中选 16 个代表性词（覆盖各场景与条目类型：词义/搭配/用法/辨析/熟词僻义/套写例句），转换为知识库 JSON。
- 全部内容忠实于 Word 原文；例句与辅助材料均来自资料本身，无编造。
- 未转换剩余内容；未修改原始 Word 文件。

### 测试数据清单（16 主题 / 25 记忆对象）
manage（词义×3+时间管理）、access/accessible、acquisition、discipline、competence 辨析组×3、enhance/increase、cite/quote/citation×3、intrinsic、adapt、emerge、discrete/discreet、wind、accord（词义+搭配）、plateau、vicinity、gravitate

### 修改的文件
- 重写：`knowledge.js`（示例数据 → 真实 Word 测试数据）
- 更新：`README.md`（知识库说明与已知限制）

---

## [2026-08-25] 新增规则：例句与辅助材料不编造

- `AGENTS.md`：知识模型新增第 5 条"内容来源唯一性"——例句/辅助材料只能来自用户 Word 资料，资料里没有对应例句时 `materials` 留空，不编造、不拼凑、不从网上补。

---

## [2026-08-25] 内容修正：capability 辨析卡补充 competence 用法

### 修改
- `knowledge.js`：capability 卡的答案补充了 competence 的用法（competence in sth.）与两者区别（capability 侧重能不能做成；competence 侧重是否胜任），并在补充材料中加了对比例句。依据：用户反馈该卡提问"与 competence 有何区别"但答案未写出 competence 用法。

---

## [2026-08-25] Bug 修复：点击"开始复习"后页面空白

### 问题
`app.js` 中 `showNext` 和 `revealAnswer` 两个函数把 `document.getElementById` 解引用后调用（`const el = document.getElementById; el("...")`），导致 `this` 丢失、浏览器报 `Illegal invocation` 错误，点击"开始复习"后界面空白。

### 修复
- `app.js`：两处改为 `const el = (id) => document.getElementById(id);`

### 验证
- 重写模拟验证脚本，让 mock 的 `getElementById` 依赖 `this` 绑定（与真实浏览器一致），先复现了该错误，修复后 19 项断言全部通过（复习闭环、防重复调度、记忆间隔、状态保存）。

### 最近修改的文件
- 修改：`app.js`
- 新增（验证用，已删除）：`_verify.js`

---

## [2026-08-25] 第一阶段：最小可行版本（v0.1）

### 已完成
- 项目骨架：纯网页应用，双击 `index.html` 即用，零依赖、零服务器、本地存储。
- 示例知识库：manage（词义/搭配/词块）、access（用法/词义）、competence 辨析组（辨析 ×3），用于验证知识结构与复习机制。
- 复习闭环：显示提示 → 主动回忆 → 显示答案（含辅助材料）→ 四档评价 → 自动安排下次复习。
- 记忆算法（可替换）：查表实现，集中在 `app.js` 的 `computeNextInterval` 函数；忘记→4小时、困难→2天、记得→7天、简单→14天，连续成功间隔递增（封顶 5 倍）。
- 复习调度器：到期筛选 + 急迫度排序 + 两轮轮转（同一主题一轮最多 2 张，且两张之间隔着其他主题）。
- 记忆状态与知识库分离：知识库在 `knowledge.js`，记忆状态存 localStorage。
- 备份：右上角「导出备份 / 导入备份」按钮。
- 项目文档：`AGENTS.md`、`README.md`、`CHANGELOG.md`。

### 正在进行
- 无（等待用户测试反馈）。

### 尚未完成
- 导入用户真实 Word 资料（第一版用示例数据验证；Word 自动解析留待后续版本）。
- 知识主题之间的"相关/辨析"关系展示（数据结构已预留 `related` 字段，界面提示已实现，待真实资料填充）。
- 更科学的记忆算法（预留接口，等实际使用效果后再决定）。

### 已知问题
- 记忆状态只存在浏览器 localStorage，换浏览器/清理缓存会丢失——需依赖「导出备份」（已内置按钮）。
- 同一主题到期项超过 2 张时，多余的到期项要等下一轮/次日，可能显得"还有到期没复习"（设计如此，用于防重复轰炸）。

### 最近修改的文件
- 新增：`index.html`、`app.js`、`knowledge.js`、`AGENTS.md`、`README.md`、`CHANGELOG.md`
