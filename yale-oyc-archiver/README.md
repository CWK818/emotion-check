# OYC Archiver：耶魯開放式課程教學資料庫建置工具

把 Open Yale Courses 的 **ECON 159 賽局理論（Game Theory，Ben Polak 主講，2007 年秋季錄製）** 整理成可離線使用、可匯入 NotebookLM 的本地教學資料庫。其他 OYC 課程換網址也能用（`--course-url`）。

本工具是根據 Gemini 對話〈耶魯賽局理論課程資料庫建置指南〉改寫的。原始腳本拿到真實網站實測後問題不少，所以重寫成這一版。

---

## 一、Gemini 原始方案實測檢核（2026-11-20，oyc.yale.edu）

原腳本用真實網站跑過一次（只把檔案下載換成記錄，頁面都是實際抓取）：

| 項目 | Gemini 原腳本 | 本工具 |
|---|---|---|
| 逐字稿 | **0 份**（程式仍印出「✅ 已彙整完畢」） | 24 份，Markdown＋純文字，保留章節與講者，共約 26 萬英文字 |
| 期中／期末考 | **漏抓**（只比對網址 `lecture-`，`exam-1`、`exam-2` 沒進來） | 2 次考試，題目與解答共 6 份 PDF |
| `00_Syllabus_and_Exams` | 空資料夾（首頁沒有 PDF） | 大綱另存為 `syllabus.md` |
| 講義 PDF | 45 份 | 51 份（含考試），全數驗證為有效 PDF |
| 影片 | 用一個**無法查證**的播放清單 ID | 從每講官方頁面取出 YouTube ID，產生逐講下載腳本 |
| 章節時間軸、課程概述、指定閱讀 | 無 | 有，時間軸可點擊跳到影片該秒數 |
| 下載中斷 | 會留下殘檔，下次被當成「已存在」而略過 | 先寫入 `.part`，大小核對無誤才改名；可續跑 |
| 錯誤回報 | 失敗也顯示成功 | 結尾列出所有問題，有問題時結束碼為 1 |
| User-Agent | 偽裝成 Chrome | 誠實標示工具名稱，並遵守 robots.txt、每次請求間隔 1 秒 |

**逐字稿為何會是 0 份：** 原腳本把頁面中第一個 href 含 `transcript` 的連結當成逐字稿連結，而實際命中的是頁內錨點 `#transcript-top`（「Back to Top」）。程式於是去抓耶魯首頁，在首頁上找不到內文，就靜默略過。實際上逐字稿就內嵌在每講頁面的 `#inline_content` 裡。

**其他事實更正：**
- Gemini 說官網有「高畫質／低畫質 MP4」，但現行 Drupal 10 版官網的 ECON 159 頁面只提供 **YouTube 嵌入＋MP3**，沒有 MP4 下載連結。
- 原對話的繁中翻譯混入了簡體字（「技术」）。
- 原腳本若直接從 Google Docs 複製貼上，每行都包著反引號、縮排也會跑掉，無法直接執行。

---

## 二、安裝（以 Mac mini 為例）

```bash
cd yale-oyc-archiver
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

要下載影片，另外安裝：

```bash
brew install yt-dlp ffmpeg
```

Windows 可以用 `py -m venv .venv`，再執行 `.venv\Scripts\activate`；影片工具則改用 `winget install yt-dlp ffmpeg`。

---

## 三、使用

```bash
# 完整彙整：逐字稿＋PDF＋MP3（MP3 共約 1.6 GB，第一次約需 10–30 分鐘）
python oyc_archiver.py

# 只要文字與 PDF（約 15 MB、1 分鐘內完成）
python oyc_archiver.py --skip-audio

# 只處理部分課堂：第 1–3 講、第 5 講、兩次考試
python oyc_archiver.py --sessions 1-3,5,exams

# 其他 OYC 課程
python oyc_archiver.py --course-url https://oyc.yale.edu/psychology/psyc-110 --out PSYC-110
```

中斷後直接重跑即可，已下載的檔案會略過。只重跑部分課堂時，總索引仍會保留先前已彙整的課堂。

下載影片（在資料庫資料夾內執行；影片放在 YouTube，必須在你自己的電腦上執行）：

```bash
bash ECON-159_Game-Theory/download_videos.sh
```

---

## 四、輸出結構

```
ECON-159_Game-Theory/
├── index.md                 ← 總索引：課程介紹＋26 個課堂一覽表
├── syllabus.md              ← 課程大綱（教科書、修課要求、評分方式）
├── course.json              ← 機器可讀的完整清單（章節、文件、YouTube、字數）
├── download_videos.sh       ← yt-dlp 逐講下載影片＋英文字幕
├── notebooklm/
│   ├── ECON_159_transcripts_part1.md   ← 全課程逐字稿合輯（每份 ≤ 15 萬字）
│   └── ECON_159_transcripts_part2.md
├── Lecture-01_Introduction_Five_First_Lessons/
│   ├── README.md            ← 概述、可點擊的章節時間軸、指定閱讀、文件清單
│   ├── transcript.md / transcript.txt
│   ├── audio.mp3
│   ├── Summary_Lecture_1.pdf
│   └── Blackboard_Notes_Lecture_1.pdf
├── …（Lecture-02 至 Lecture-24）
├── Exam-1_Midterm_Exam/     ← 期中考題目與解答
└── Exam-2_Final_Exam/       ← 期末考、考前複習與練習題
```

**匯入 NotebookLM：** 把 `notebooklm/` 裡的兩份合輯上傳即可，兩個來源就涵蓋全部 24 講。想逐講檢索的話，也可以改傳各講的 `transcript.md`，再加上 PDF。

---

## 五、測試

```bash
pip install pytest
pytest -q                      # 離線測試（使用 tests/fixtures 中的真實頁面快照）
OYC_LIVE=1 pytest -q -k live   # 連線實測：抓第 1 講與期中考，不下載 MP3
```

2026-11-20 實測結果：

- 離線測試與連線測試共 14 項，全部通過。
- 全課程實際抓取 26/26 個課堂頁，得到 24 份逐字稿、51 份 PDF（逐一驗證檔頭都是 `%PDF-`），沒有任何錯誤。
- 第 1 講的 MP3 為 65.8 MB，用 ffprobe 驗證長度 68:33、128 kbps。
- 中斷後重跑，全部檔案正確略過；只重跑部分課堂時，總索引沒有被覆寫。
- `download_videos.sh` 通過 `bash -n` 語法檢查，yt-dlp 2026.10.26 也接受全部參數。實際下載影片因測試環境封鎖 YouTube 而無法驗證，需要在本機執行確認。

---

## 六、授權與使用倫理

- OYC 課程內容依 **CC BY-NC-SA 3.0**（姓名標示－非商業性－相同方式分享）授權；各講 Credits 中標示的第三方內容不在此授權範圍內。
- **可以：** 在共學團、教師培訓等非商業場合使用，並標示出處。
- **要注意：** 譯成中文或改編成教材屬於「改作」，必須同樣以 CC BY-NC-SA 釋出。收費課程是否算「商業性」使用，要依 OYC Terms of Use 個案判斷【待查證：協會收費工作坊的具體適用】。
- YouTube 服務條款原則上不允許下載影片。影片部分建議以官方連結觀看為主，下載只作個人離線備份。
- `tests/fixtures/` 中的 HTML 是 2026-11 從 oyc.yale.edu 存下的頁面快照，僅供解析測試使用，授權同上。

---

## 七、已知限制

- 程式依 2026-11 的網站版型撰寫，耶魯改版後可能需要調整選擇器。若遇到「找不到逐字稿」，執行結果會明確列出，不會靜默失敗。
- 第 1 講以外的 MP3 沒有逐一實際下載測試，只確認了 24 講都有音訊連結。

郭駿武．G5
