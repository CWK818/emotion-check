# Review report templates

Load this file for deep, combined, exhaustive, or submission-ready review. For a quick single-route task, use the compact output contract in `SKILL.md` instead of loading these templates.

## Contents

- Quick combined scan
- Writing-only scan
- Source-only audit
- Literature-selection review
- Author and discipline calibration
- AI-assisted process review
- Safe phrasing

## Quick combined scan

Use this order and omit empty sections.

### 整體結論

Give one or two sentences. Avoid authorship conclusions. Example:

> 這份文字有數處需要補充具體證據或作者判斷；兩筆參考文獻的書目資訊需要修正，另有三筆中文來源因無法直接存取相關資料庫，目前只能標示為「尚未核實」。

### 檢查範圍與存取限制

State:

- document type and portions reviewed;
- quick or deep mode;
- tools, indexes, publisher pages, or databases actually used;
- important access, OCR, paywall, or full-text limitations.
- author-facing purpose, discipline or method used for calibration, and any target-venue rule actually checked.

For a deep review or an audit with more than 15 sources, add a concise progress summary: sections reviewed, sources inventoried, sources verified in this batch, unresolved items, and remaining batches. Do not expose private reasoning or reproduce the internal checklist step by step.

### 值得修改的寫作問題

| 位置或原文 | 可觀察問題 | 為何影響本文 | 其他可能解釋 | 修改方向 |
|---|---|---|---|---|

Limit a quick scan to the five most useful findings. Do not add a total AI score.

### 來源查核

| 原引用形式 | 是否存在 | 書目資訊 | 是否支持主張 | 已查證據 | 下一步 |
|---|---|---|---|---|---|

Use only the labels defined in `source-verification.md`. State `metadata only` when the source content was not inspected.

### 資料品質與適用性

Include this section only when the user asks about source quality, literature selection, statistics, datasets, quotations, currentness, or a deep combined review.

| 資料或主張 | 品質面向 | 對本文是否適用 | 納入／排除理由 | 限制與下一步 |
|---|---|---|---|---|

Do not use an overall credibility score. State which dimension was inspected: provenance, method, time/version, applicability, independence/bias, or completeness. For statistics, include the denominator, date, definition, and original table status when material. For direct quotations, state whether the original wording and location were inspected.

### 作者接下來的三個步驟

Give up to three prioritized actions that the author can complete, such as opening the original article, correcting a DOI, running an exact-title query in TCI-HSS, narrowing a claim, or checking the target venue's current rule.

### 提醒

> 這份檢查只標示需要修改與查證的項目，不能判定是否使用 AI，也不能認定學術不端。提交前仍應開啟並閱讀原始來源。

For teacher-facing reviews, add:

> 文字特徵只能作為進一步提問與教學性複核的起點，不應單獨作為扣分、懲處或學術不端判定。後續應依課程事先公布的規範，讓學生說明論證、來源與寫作歷程。

## Writing-only scan

Use:

1. overall writing assessment;
2. up to five located issues;
3. revision priorities;
4. optional short demonstration when requested;
5. no source table unless factual claims require verification.

## Source-only audit

Use:

1. audit scope and access statement;
2. counts by status;
3. per-source table;
4. claim-support table only for sources whose content was inspected;
5. unresolved Chinese-source search instructions;
6. prioritized corrections.

## Literature-selection review

Use:

1. research question and stated search scope;
2. databases, queries, dates, and access limitations actually used;
3. inclusion and exclusion criteria;
4. selected-source table with relevance, evidence type, quality dimensions, suitability, and reason;
5. evidence gaps, dependence, contrary findings, and language or database bias;
6. the smallest next search needed.

Label a search exploratory, targeted, selective, reproducible, or systematic according to what was actually done. Never call a short web search systematic or exhaustive.

## Author and discipline calibration

- Default to author self-review; use teacher-facing language only when explicitly requested.
- For novice authors, briefly explain method terms and prioritize a small number of feasible corrections.
- For experienced researchers, distinguish errors from defensible choices and focus on inference, reproducibility, competing explanations, and venue-specific risk.
- Name the discipline, method, guideline, or policy used to justify a field-specific finding.
- If the applicable rule was unavailable or possibly outdated, label the advice provisional and ask for the current official document.

## AI-assisted process review

Include only when the author asks about AI workflow, responsibility, disclosure, reproducibility, or research agents.

1. State which research stages were reviewed and which evidence was available: author account, prompts, logs, drafts, code, data, or policies.
2. Separate output quality, process integrity, and policy compliance.
3. Use the compact provenance table in `ai-assisted-research-process.md` only for consequential contributions.
4. Identify decisions the author must reclaim, validation still required, and sensitive inputs that should not be exposed.
5. Draft disclosure wording only after checking the current governing rule; label it provisional otherwise.
6. For agentic workflows, distinguish internal model checks from independent human, empirical, or external validation.

## Safe phrasing

Prefer:

- `這項寫作特徵值得修改，因為……`
- `這段文字雖然流暢，但尚未提供……`
- `這筆來源確實存在，但年份與頁碼和原始紀錄不一致。`
- `在目前可存取的來源中尚未確認這筆資料。`
- `目前只能看到摘要，因此無法確認原文是否支持這項較強的主張。`
- `多項書目資訊彼此衝突，應列為優先人工複核項目。`
- `這筆來源確實存在，但研究對象與本文概括的母體不一致。`
- `這項統計仍缺少原始分母、定義或發布版本，尚不能支持目前的比較。`
- `目前尚未核對原文頁面，因此不能把這段話標示為逐字引文已確認。`

Avoid:

- `這是 AI 寫的。`
- `AI 生成機率為 85%。`
- `這種寫法證明作者作弊。`
- `搜尋不到，所以這筆來源是假的。`
- 只確認 DOI 能開啟時就寫成 `引用已通過查核`。
- 只看到二手說明或摘要時就寫成 `研究已證明`。
- 因來源真實存在就寫成 `資料品質良好` 或 `適合支持本文主張`。
- 未記錄檢索範圍與納入標準時就宣稱 `已完成系統性文獻回顧`。
