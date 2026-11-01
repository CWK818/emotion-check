# G5 × ppt-master 整合套件

把開源簡報工作流 [hugohe3/ppt-master](https://github.com/hugohe3/ppt-master)（MIT 授權）接上 G5 簡報設計系統（`pptx-house-style`）。

ppt-master 的做法：AI 先讀懂素材，再把每頁畫成 SVG，最後轉成 **PowerPoint 原生可編輯** 的 .pptx（原生圖形、圖表、表格、母片）。這個套件把 G5 的品牌與內容倫理寫成 ppt-master 認得的兩個「模板工作區」，讓它產出的簡報直接符合 G5 規格。

## 內容一覽

| 路徑 | 用途 |
|---|---|
| `install.sh` | 一鍵安裝：ppt-master skill（固定 v6.8.0）＋Python 依賴＋註冊兩個 G5 工作區 |
| `workspaces/brands/g5-edusoc/` | **品牌工作區**：七色色票、微軟正黑體／標楷體、署名「G5．郭駿武」、語氣、線條圖示 |
| `workspaces/styles/g5-warm-rhythm/` | **風格工作區**：深底情感頁×白底內容頁節奏、一頁一事、卡片不用邊條色帶、財務數字不得虛構、心聲去識別化 |
| `pptx-house-style/` | 你的 `pptx-house-style` skill 更新版：新增「〇、路線選擇」一節 |
| `pptx-house-style.zip` | 同上，打包好可直接上傳到 claude.ai 的技能設定 |
| `examples/smoke-test/` | 三頁實測簡報（SVG 原稿、備忘稿、匯出的 .pptx、預覽圖） |

## 安裝

本機（Mac／Linux，需要 Python 3.10 以上與 git）：

```bash
bash g5-ppt-master/install.sh
```

裝好後重新啟動 Claude Code。腳本可重複執行；既有的 `~/.claude/skills/ppt-master` 會先備份。

## 使用方式

ppt-master **不接受只說模板名字**，請在指令裡給完整路徑。範例：

> 用 ppt-master 把這份 PDF 做成募款簡報。品牌用 `~/.claude/skills/ppt-master/templates/brands/g5-edusoc`，風格用 `~/.claude/skills/ppt-master/templates/styles/g5-warm-rhythm`，要備忘稿。

- 正式簡報走 Default 路線：中途會跳出確認畫面，讓你拍板溝通策略與模板。
- 說「快速做」則走 Quick 路線：不停下來確認，一次做完。

## 實測結果（二〇二六年十一月一日）

| 檢查項目 | 結果 |
|---|---|
| 兩個工作區的格式驗證與註冊 | 通過 |
| SVG 品質檢查（3 頁） | 全數通過，0 警告 |
| 匯出 .pptx 與備忘稿 | 3 頁、3 份備忘稿 |
| 校訂語言 | `zh-TW`（首頁要加 `lang="zh-TW"`，已寫進 skill 規則） |
| 主題字型 | 微軟正黑體；封面與收尾用標楷體 |
| `notesMasterIdLst` 順序 | ppt-master 匯出的順序本來就合乎 schema；`fix-presentation-order.py` 跑了也不會改動 |

**還沒驗證**：在你的 PowerPoint 裡實際打開。請開 `examples/smoke-test/g5_smoke.pptx` 確認一次——這才是最終驗收標準。

## 已知限制

- **雲端工作階段不會記住安裝**：Claude Code 雲端容器是一次性的，每次新的工作階段都要重新執行 `install.sh`（約一分鐘）。若想自動化，可以再加一個 SessionStart hook。
- **沒有標誌圖檔**：品牌工作區的 Logo 目前設為「無」，封面以文字署名代替。拿到正式標誌後放進 `workspaces/brands/g5-edusoc/images/`，並改寫 design_spec 的 §IV。
- **AI 生圖要另外設定**：ppt-master 的 AI 生圖功能需要另外設定生圖服務的 API 金鑰；沒設定時會改用圖示與原生圖形。
- **授權**：ppt-master 是 MIT 授權。它轉 PDF 用的 PyMuPDF 是 AGPL-3.0，自用沒問題，但若要把整包連同依賴再散布出去，請先看授權條款。
