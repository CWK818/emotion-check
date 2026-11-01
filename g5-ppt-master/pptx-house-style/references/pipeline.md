# 簡報產製管線（fontconfig／圖示／QA／拒檔排查）

## 一、LibreOffice 預覽的 CJK 字型別名（每個新容器跑一次）

交付檔內保留 Windows 字串，容器內預覽需別名對映，否則目視 QA 的字型失真：

```bash
mkdir -p ~/.config/fontconfig && cat > ~/.config/fontconfig/fonts.conf << 'EOF'
<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
 <alias><family>Microsoft JhengHei</family><prefer><family>Noto Sans CJK TC</family></prefer></alias>
 <alias><family>DFKai-SB</family><prefer><family>Noto Serif CJK TC</family></prefer></alias>
</fontconfig>
EOF
```

## 二、react-icons 圖示管線

```bash
npm install -g react-icons react react-dom sharp   # 未裝時
```

```javascript
// icon-to-base64.cjs 片段：在建檔腳本內直接使用
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const sharp = require('sharp');
const { FaSeedling } = require('react-icons/fa');

async function iconPng(IconComp, color, px = 256) {
  const svg = renderToStaticMarkup(React.createElement(IconComp, { color: '#' + color, size: px }));
  const buf = await sharp(Buffer.from(svg)).resize(px, px).png().toBuffer();
  return 'image/png;base64,' + buf.toString('base64');   // 前綴必加
}
// 用法：s.addImage({ data: await iconPng(FaSeedling, '3A5A40'), x:…, y:…, w:0.5, h:0.5 });
```

注意：整支建檔腳本因此需要 async 包裹（`(async()=>{ … })()`），`writeFile` 前先 await 所有圖示。

## 三、QA 指令鏈（順序有講究）

```bash
NODE_PATH=/home/claude/.npm-global/lib/node_modules node build_deck.cjs
markitdown deck.pptx | head -80                                  # 內容 QA
python /mnt/skills/public/pptx/scripts/office/validate.py deck.pptx   # 先驗證（此時全部檢查有效）
python3 fix-presentation-order.py deck.pptx                      # 後修復（最後一步，冪等）
python /mnt/skills/public/pptx/scripts/office/soffice.py --headless --convert-to pdf deck.pptx
rm -f slide-*.jpg && pdftoppm -jpeg -r 130 deck.pdf slide        # 逐張 view 目視
pdftotext deck.pdf - | grep -c "任一句關鍵中文"                   # 確認 CJK 非豆腐字
```

順序理由：修復後的 schema 正確序列會被現版 validate.py 誤報為錯誤並指示搬回——**先驗證、後修復**可同時取得驗證器的全部價值與正確的交付序列。修復後若必須再驗證，忽略且僅忽略「notesMasterIdLst 順序」該項。

## 四、拒檔排查（使用者回報「簡報無法呈現／打不開」）

1. 先查元素順序：
   ```bash
   python3 -c "
   import zipfile, re
   xml = zipfile.ZipFile('deck.pptx').read('ppt/presentation.xml').decode('utf-8')
   print(re.findall(r'<p:(sldMasterIdLst|notesMasterIdLst|sldIdLst|sldSz)', xml))"
   ```
   `notesMasterIdLst` 若在 `sldIdLst` 之後 → 跑修復腳本。這是二〇二六年六月十九日事故的元兇，機率最高，先查它。
2. 其次跑 validate.py 看圖表類錯誤（stacked 圖用了 `outEnd`、combo 圖缺 `valAxes`/`catAxes` 雙宣告——這兩種 PowerPoint 直接判毀損）。
3. zip 完整性：`python3 -c "import zipfile; print(zipfile.ZipFile('deck.pptx').testzip())"`（應為 None）。
4. 色碼檢查：建檔腳本內搜 `#` 開頭或八碼色值（兩者都會毀檔）。

## 五、大檔與照片

歷史照片等點陣圖先壓到合理尺寸再嵌入（sharp resize），避免簡報膨脹；佔位照片框以 `roundRect`＋「照片【待放置】」文字標示，正式版逐一替換後重跑整條 QA 鏈。
