# emotion-check 專案說明

## 網頁設計資源：Hallmark

本專案內建 [Hallmark](https://github.com/Nutlope/hallmark) v2.0.0 設計 skill（MIT 授權，Together AI 出品），位於 `.claude/skills/hallmark/`。凡在本專案設計或製作新網頁，使用 `/hallmark <需求>` 啟動；改版既有頁面用 `/hallmark redesign <路徑>`，只要檢查報告用 `/hallmark audit <路徑>`。

- 檢查工具：`node .claude/skills/hallmark/scripts/sloplint.mjs <檔案> --render`
- 主題清單：`node .claude/skills/hallmark/scripts/theme.mjs list`（50 個主題，每個附成品截圖於 `references/themes/`）
- 更新版本：重新 clone 上游後，以 `skills/hallmark/` 覆蓋 `.claude/skills/hallmark/`。請勿直接修改 vendored 檔案，在地化規則一律寫在本檔。

### 雲端工作階段啟用瀏覽器檢查（`--render`）

雲端容器每次重建，需重新執行以下指令（以 root 執行 Chromium 必須加 `--no-sandbox`）：

```bash
npm i -g puppeteer-core && mkdir -p ~/.local/bin && printf '#!/bin/sh\nexec /opt/pw-browsers/chromium-1243/chrome-linux64/chrome --no-sandbox "$@"\n' > ~/.local/bin/chromium-nosandbox && chmod +x ~/.local/bin/chromium-nosandbox
```

之後執行檢查時加上 `CHROME_PATH=~/.local/bin/chromium-nosandbox`。未安裝時靜態檢查仍可運作。

### 繁體中文頁面的在地化規則（覆寫 Hallmark 的拉丁字系預設）

Hallmark 的字型與排版規則以拉丁字系為前提，沒有中日韓文字規範。製作繁中頁面時，Hallmark 的 Floor 與 gates 照常遵守，另加：

1. **字型 token**：主題的拉丁字型保留給英文與數字，`:root` 的字型 token 後接中文備援。內文 `"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif`；文學體例或顯眼標題可用 `"Noto Serif TC"` 或 `"BiauKai", "DFKai-SB"`（標楷體）。Google Fonts 載入時以 `&display=swap` 並只取需要的字重。
2. **行高與字距**：中文內文 `line-height: 1.75` 至 `1.9`；不得對中文套用負的 `letter-spacing`（主題的標題常有 -0.02em，中文標題改為 0 或 0.02em）。
3. **斷行**：加 `line-break: strict; word-break: normal; overflow-wrap: anywhere;` 避免標點落在行首；標題的 `text-wrap: balance` 可保留。
4. **不用斜體**：中文沒有真斜體，瀏覽器只會傾斜變形。Floor 第 3 條在中文頁面延伸為「中文一律不用 italic」，強調改用字重或主題強調色。
5. **字數上限**：Floor 第 13 條「一屏約 80 個英文單字」，中文約折合 150 至 200 字【此處為推論，依閱讀量換算，請以實際畫面判斷】。
6. **標點**：使用全形標點與「」『』引號；Hallmark 的 F1 直引號警告在中文頁面同樣適用。
7. **語言標記**：`<html lang="zh-Hant-TW">`。
8. **讀者**：文字預設讀者為高中程度，避免術語堆疊。
