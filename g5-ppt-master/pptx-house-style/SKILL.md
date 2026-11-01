---
name: pptx-house-style
description: G5．郭駿武的簡報（.pptx）產製規格與已驗證可執行骨架。凡是要產出或修改簡報——募款簡報、理監事會議報告、研討會投影片、課程說明、提案 deck——無論使用者是否明說格式要求，一律與公用 pptx skill（或 ppt-master skill）一併使用本 skill。內含：雙路線選擇（pptxgenjs 手刻骨架／ppt-master 素材轉原生簡報，含 G5 品牌與風格工作區）、pptxgenjs（CommonJS .cjs）技術棧、品牌色彩與字型系統（深底情感頁×白底內容頁交錯）、notesMasterIdLst 拒檔地雷的實戰裁決與修復腳本、react-icons 圖示管線、備忘稿與內容倫理規則（財務數字不得虛構）、LibreOffice 目視 QA 鏈。即使使用者只說「幫我做簡報」「做幾張投影片」也應觸發。不適用於：Word 文件（docx）、試算表（xlsx）。
---

# G5 簡報產製規格（pptx house style）

## 〇、路線選擇：pptxgenjs 或 ppt-master

本 skill 的品牌（§三）與內容倫理（§四）兩條路線共用；技術棧與產出流程依路線分流。

| 情境 | 路線 |
|---|---|
| 手上有原始素材（PDF、Word、網頁、逐字稿、會議紀錄），要先讀懂、再組成論證與頁面 | **ppt-master** |
| 需要原生圖表與表格、母片與版面配置、轉場動畫或旁白錄音 | **ppt-master** |
| 使用者明說「用 ppt-master」 | **ppt-master** |
| 延續既有 `template.cjs` 系列簡報、要逐元素精準控制、頁面骨架已定 | **pptxgenjs**（下文 §一至§五） |
| 不確定 | 先問使用者；預設 pptxgenjs |

### ppt-master 路線規則

1. **安裝**：在 `cwk818/emotion-check` repo 的 `g5-ppt-master/` 執行 `bash install.sh`（冪等；固定在已驗證的 ppt-master v6.8.0）。會把 ppt-master 裝到 `~/.claude/skills/ppt-master`，並註冊兩個 G5 工作區。
2. **一律用 G5 工作區，且給完整路徑**——ppt-master 不接受只講名字：
   - 品牌：`~/.claude/skills/ppt-master/templates/brands/g5-edusoc`（色彩、字型、署名、語氣、圖示）
   - 風格：`~/.claude/skills/ppt-master/templates/styles/g5-warm-rhythm`（深底情感頁×白底內容頁節奏、卡片規則、§四倫理的 binding 版本）
3. **Default 與 Quick**：Default 路線會有 ⛔ 確認關卡（溝通契約與模板選擇），適合正式簡報；使用者說「快速」才走 Quick。
4. **繁體中文**：首頁根 `<svg>` 一律加 `lang="zh-TW"`，否則校訂語言與 docProps 不是繁中。字型字串用 `Microsoft JhengHei`；`DFKai-SB` 只用於封面、收尾與文學性標題。
5. **備忘稿**：寫入 `notes/total.md`（每頁 `# 編號_頁名`，頁間 `---`），匯出加 `--with-notes`。備忘稿只寫口語提示與節奏標記，不加條列符號。
6. **notesMasterIdLst**：實測（二〇二六年十一月一日，ppt-master v6.8.0）匯出檔順序本來就合乎 schema（sldMasterIdLst → notesMasterIdLst → sldIdLst）。`fix-presentation-order.py` 對它是空操作，可照跑當保險；**不要**對這條路線的產出跑公用 pptx skill 的 `validate.py`——它會把正確順序誤報為錯誤。
7. **品質關卡**：ppt-master 自帶 `svg_quality_checker.py --stage final` 必須全綠才匯出；匯出後照 §五第 5、6 步做 LibreOffice 目視與雙重校對。
8. **最終驗收**：同 §一第 4 點——以使用者的 PowerPoint 開得起來為準。

---

**使用順序（pptxgenjs 路線）**：先讀公用 pptx skill（`/mnt/skills/public/pptx/SKILL.md`）——其 gotchas 清單（色碼不加 #、options 物件不共用、陰影 offset 不可負、條列規則、圖表原生化、combo 圖雙軸宣告等）**全數採納**。本 skill 只覆寫其中**一點**（見下節），並疊加品牌與倫理規則。實作以 `assets/template.cjs` 為骨架改寫，勿從零手刻。

## 一、⚠️ 唯一覆寫點：notesMasterIdLst 順序（拒檔地雷）

這是本 skill 存在的首要理由，兩套權威文件在此**正面對立**，以下是完整事實與裁決：

**事實一**：pptxgenjs（實測至 4.0.1）使用 `addNotes` 後，將 `<p:notesMasterIdLst>` 寫在 `<p:sldIdLst>` 之後，違反 ECMA-376 對 CT_Presentation 的序列規範（正確為 sldMasterIdLst → notesMasterIdLst → sldIdLst → sldSz → notesSz）。

**事實二（實戰紀錄）**：二〇二六年六月十九日，理監事會議簡報在使用者機器上**無法開啟**；重排至 schema 順序後解決。六月二十二日起，「每次重建後修復順序」成為標準程序，募款簡報等後續交付均沿用且正常開啟。

**事實三**：公用 pptx skill 明文主張相反（「勿移動，移了反而打不開」），且現版 `validate.py` 會把**修復後的正確序列**報為錯誤、指示搬回。LibreOffice 兩種順序都容忍，所以預覽正常不代表 PowerPoint 開得起來。

**裁決（程序解法，兩邊的價值都拿到）**：

1. build 完成後，**先跑** `validate.py`——此時元素順位符合它的預期，圖表與投影片層級的全部檢查都有效，照它報的修。
2. 全綠之後，**最後一步**跑 `python3 assets/fix-presentation-order.py 檔名.pptx`（冪等，重複執行無害）。
3. 修復後**不要再跑** validate.py；若跑了，會且僅會出現「notesMasterIdLst 順序」這一項預期中的失敗——忽略它，其餘失敗仍照修。
4. 最終驗收標準永遠是**使用者的 PowerPoint 開得起來**。若未來 pptxgenjs 或 PowerPoint 版本組合行為改變，以重新實測為準，不以任何文件教義（包括本節）為準。

## 二、技術棧

- Node.js＋**pptxgenjs**，腳本一律 **CommonJS（.cjs）**；`NODE_PATH=/home/claude/.npm-global/lib/node_modules`
- 版面 `LAYOUT_16x9`（10"×5.625"），**先設版面再加投影片**；超界元素不裁切、直接消失
- 字型：檔內保留 Windows 字串——內文 `Microsoft JhengHei`（微軟正黑體）、文學顯眼標題 `DFKai-SB`（標楷體）。容器內 LibreOffice 預覽靠 fontconfig 別名對映 Noto CJK（設定見 `references/pipeline.md`），**別名只影響預覽，不影響交付檔**
- 圖示：react-icons → `renderToStaticMarkup` → sharp 轉 ≥256px PNG → base64 `addImage`（`image/png;base64,` 前綴必加）；依賴 `react-icons react react-dom sharp`（npm 全域）

## 三、品牌系統

- 色彩（與 docx 文件系統同源）：森林綠 `3A5A40`（主導）、森林綠深 `2C4632`（情感頁底）、暖金 `C8A87C`（強調、分隔線）、海藍 `3D6B8E`（次要）、紙感米白 `F7F4EF`（卡片底）、深褐 `2D2A26`（內文）
- 節奏骨架：**深底情感頁 × 白底內容頁交錯**；封面與收尾用深底＋標楷體＋暖金短分隔線＋署名「G5．郭駿武」（全形間隔號）
- 卡片：圓角矩形＋紙感底＋柔影（`shadow` 物件每次新建；offset ≥ 0）——**不用邊條色帶**區隔
- 內容頁標題 30pt 以上、左對齊；一張投影片只講一件事
- 台灣脈絡年份用民國紀年（如「一一五年」）

## 四、內容倫理（實戰定案，不可妥協）

- **財務與統計數字不得虛構**：實數未到手前一律【待填入】／【待確認】佔位，並在該頁備忘稿註明「以會計（或原始資料）查核後實數取代」
- 引述家長或孩子的心聲一律**去識別化改寫**，聚合統計不揭露個資
- 捐款帳號、QR、聯絡方式等填入前，簡報**不得對外**
- 每頁 `addNotes` 備忘稿：口語提示與節奏標記（何處放慢、何處留白），不寫在投影片上

## 五、產出流程（每份簡報照跑）

1. 讀公用 pptx skill 與本 skill；複製 `assets/template.cjs` 改寫
2. build → `markitdown` 內容 QA（錯字、順序、殘留佔位）
3. `validate.py`（此時全部檢查有效，照報修正、重建）
4. **最後**跑 `fix-presentation-order.py`
5. `soffice.py --headless --convert-to pdf` → `pdftoppm -jpeg -r 130` → **逐張** view 目視（溢版、疊字、對比、佔位殘留）
6. 雙重校對（錯字人名數據→繁簡與半形標點）→ 成品置於 `/mnt/user-data/outputs/`，present_files 交付

## 參考檔案

- `assets/template.cjs` — 已驗證骨架（深底封面、卡片內容頁、原生圖表頁、收尾頁，含備忘稿與倫理佔位示範）
- `assets/fix-presentation-order.py` — 順序修復腳本（冪等、只動元素順序、不碰關聯）
- `references/pipeline.md` — fontconfig 設定、圖示管線程式、QA 指令鏈、拒檔排查
