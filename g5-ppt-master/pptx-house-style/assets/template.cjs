/**
 * template.cjs — G5．郭駿武 簡報產製骨架（pptxgenjs 4.x）
 * 執行：NODE_PATH=/home/claude/.npm-global/lib/node_modules node template.cjs
 * 產出：sample-deck.pptx（四張示範投影片；實際簡報以此為骨架改寫）
 *
 * ⚠️ 產出後必跑：python3 fix-presentation-order.py sample-deck.pptx
 *    （pptxgenjs 加備忘稿後 notesMasterIdLst 排序違反 OOXML schema，
 *      PowerPoint 可能拒檔；LibreOffice 與 validate.py 都不會替你抓——
 *      實戰紀錄：二〇二六年六月十九日拒檔事故，重排後解決。）
 *
 * 鐵則備忘（完整規格見 SKILL.md）：
 *  - 色碼不加 #、不用八碼；每個 add* 呼叫用全新的 options 物件（會被就地改寫）
 *  - 需要對齊時 margin:0；備忘稿一律 addNotes；財務與統計數字不得虛構，
 *    以【待填入】／【待確認】佔位並在備忘稿註明需查核
 */
'use strict';
const pptxgen = require('pptxgenjs');

/* ── 品牌常數（與 docx 文件系統同源）───────────────── */
const C = {
  FOREST:  '3A5A40',  // 森林綠：主色
  FORESTD: '2C4632',  // 森林綠深：情感頁底色
  GOLD:    'C8A87C',  // 暖金：強調、分隔線
  OCEAN:   '3D6B8E',  // 海藍：次要資訊
  PAPER:   'F7F4EF',  // 紙感米白：卡片底
  INK:     '2D2A26',  // 內文深褐
  WHITE:   'FFFFFF',
};
/* 字型：檔內保留 Windows 字串（使用者機器正確渲染）；
 * 容器內 LibreOffice 預覽靠 fontconfig 別名（見 references/pipeline.md）*/
const BODY = 'Microsoft JhengHei';  // 微軟正黑體：結構與內文
const KAI  = 'DFKai-SB';            // 標楷體：文學性顯眼標題
const SIGNATURE = 'G5．郭駿武';      // 全形間隔號 U+FF0E

const p = new pptxgen();
p.layout = 'LAYOUT_16x9';           // 10" × 5.625"——先設版面再加投影片
p.author = SIGNATURE;

/* ── 一、封面（深底情感頁）────────────────────────── */
{
  const s = p.addSlide();
  s.background = { color: C.FORESTD };
  s.addText('孩子是社會的孩子', {
    x: 0.92, y: 1.5, w: 8.4, h: 1.0, fontSize: 40, bold: true,
    color: C.WHITE, fontFace: KAI, align: 'left', margin: 0,
  });
  s.addText('——簡報骨架示範：G5 品牌系統的最小完整示例——', {
    x: 0.92, y: 2.55, w: 8.0, h: 0.5, fontSize: 16,
    color: C.GOLD, fontFace: BODY, align: 'left', margin: 0,
  });
  s.addShape('line', { x: 0.95, y: 3.9, w: 2.2, h: 0, line: { color: C.GOLD, width: 2 } });
  s.addText([
    { text: '社團法人台灣親子共學教育促進會', options: { bold: true, color: C.WHITE, fontSize: 14, breakLine: true } },
    { text: '網站：g5edusoc.org', options: { color: C.PAPER, fontSize: 12 } },
  ], { x: 0.95, y: 4.1, w: 7.0, h: 0.7, fontFace: BODY, align: 'left', valign: 'top', lineSpacingMultiple: 1.3, margin: 0 });
  s.addText(SIGNATURE, { x: 0.95, y: 4.85, w: 6, h: 0.4, fontSize: 13, bold: true, color: C.GOLD, fontFace: KAI, align: 'left', margin: 0 });
  s.addNotes('開場放慢。深底情感頁與白底內容頁交錯，是本品牌簡報的節奏骨架。');
}

/* ── 二、內容頁（白底＋圓角卡片＋正確條列）───────────── */
{
  const s = p.addSlide();
  s.background = { color: C.WHITE };
  s.addText('內容頁示範：卡片與條列', {
    x: 0.6, y: 0.42, w: 8.8, h: 0.7, fontSize: 30, bold: true,
    color: C.FOREST, fontFace: BODY, align: 'left', margin: 0,
  });
  // 圓角卡片：紙感底＋柔影（陰影物件不可跨呼叫共用；offset 不可為負）
  s.addShape('roundRect', {
    x: 0.6, y: 1.35, w: 5.4, h: 3.4, rectRadius: 0.08,
    fill: { color: C.PAPER },
    shadow: { type: 'outer', color: '999999', blur: 6, offset: 2, angle: 90, opacity: 0.35 },
  });
  s.addText([
    { text: '條列規則（公用 skill 實證）：', options: { bold: true, color: C.FOREST, breakLine: true } },
    { text: '每項 bullet: true，絕不用字面「•」', options: { bullet: true, breakLine: true } },
    { text: '除最後一項外皆 breakLine: true', options: { bullet: true, breakLine: true } },
    { text: '段距用 paraSpaceAfter，不用 lineSpacing', options: { bullet: true } },
  ], {
    x: 0.85, y: 1.6, w: 4.9, h: 2.9, fontSize: 15, color: C.INK,
    fontFace: BODY, align: 'left', valign: 'top', paraSpaceAfter: 8, margin: 0,
  });
  s.addText([
    { text: '右欄要點', options: { bold: true, fontSize: 18, color: C.OCEAN, breakLine: true } },
    { text: '需要與圖形對齊的文字一律 margin: 0；本骨架所有座標皆以 10×5.625 吋畫布計算，超界不會被裁切、只會消失。', options: { fontSize: 14, color: C.INK } },
  ], { x: 6.3, y: 1.5, w: 3.1, h: 3.2, fontFace: BODY, align: 'left', valign: 'top', lineSpacingMultiple: 1.25, margin: 0 });
  s.addNotes('內容頁：一張只講一件事。卡片用紙感底色區隔，不用邊條色帶。');
}

/* ── 三、原生圖表頁（addChart，勿貼圖）────────────────── */
{
  const s = p.addSlide();
  s.background = { color: C.WHITE };
  s.addText('歷年服務家庭數（示意數據【待填入】）', {
    x: 0.6, y: 0.42, w: 8.8, h: 0.7, fontSize: 30, bold: true,
    color: C.FOREST, fontFace: BODY, align: 'left', margin: 0,
  });
  s.addChart(p.ChartType.bar, [{
    name: '服務家庭數',
    labels: ['一一一年', '一一二年', '一一三年', '一一四年', '一一五年'],
    values: [100, 200, 300, 400, 500],   // ⚠️ 示意值——正式版必以查核後實數取代
  }], {
    x: 0.6, y: 1.35, w: 8.8, h: 3.6,
    barDir: 'col',
    chartColors: [C.FOREST],
    showValue: true, dataLabelPosition: 'outEnd', dataLabelColor: C.INK, dataLabelFontFace: BODY, dataLabelFontSize: 12,
    showTitle: false, showLegend: false,
    catAxisLabelColor: C.INK, catAxisLabelFontFace: BODY, catAxisLabelFontSize: 12,
    valAxisLabelColor: C.INK, valAxisLabelFontFace: BODY, valAxisLabelFontSize: 11,
    valGridLine: { color: 'E5E0D8', size: 1 }, catGridLine: { style: 'none' },
  });
  s.addNotes('圖表一律 addChart 原生產生，勿貼圖——除非是 PowerPoint 無原生型式的圖（桑基、網絡）。堆疊圖的 dataLabelPosition 禁用 outEnd。數字【待填入】：以會計查核後實數取代示意值。');
}

/* ── 四、收尾（深底＋QR 佔位）─────────────────────── */
{
  const s = p.addSlide();
  s.background = { color: C.FORESTD };
  s.addText([
    { text: '這十四年，我們走了很遠。', options: { breakLine: true } },
    { text: '接下來的路，想邀請你，一起走。', options: {} },
  ], { x: 0.92, y: 1.7, w: 7.4, h: 1.4, fontSize: 26, bold: true, color: C.WHITE, fontFace: KAI, align: 'left', lineSpacingMultiple: 1.3, margin: 0 });
  s.addShape('line', { x: 0.95, y: 3.55, w: 2.2, h: 0, line: { color: C.GOLD, width: 2 } });
  s.addText([
    { text: '捐款帳戶：【待填入】', options: { color: C.PAPER, fontSize: 13, breakLine: true } },
    { text: '聯絡方式：【待填入】', options: { color: C.PAPER, fontSize: 13 } },
  ], { x: 0.95, y: 3.75, w: 5.6, h: 0.8, fontFace: BODY, align: 'left', valign: 'top', lineSpacingMultiple: 1.3, margin: 0 });
  s.addShape('roundRect', { x: 7.7, y: 3.3, w: 1.5, h: 1.5, rectRadius: 0.08, fill: { color: C.WHITE, transparency: 8 }, line: { color: C.GOLD, width: 1 } });
  s.addText('QR\n待放置', { x: 7.7, y: 3.3, w: 1.5, h: 1.5, align: 'center', valign: 'middle', fontSize: 12, color: C.FORESTD, fontFace: BODY, margin: 0, lineSpacingMultiple: 1.1 });
  s.addText(`${SIGNATURE}　敬上`, { x: 0.95, y: 4.75, w: 6, h: 0.4, fontSize: 13, bold: true, color: C.GOLD, fontFace: KAI, align: 'left', margin: 0 });
  s.addNotes('收尾放慢，「一起走」之後留白三秒再講行動呼籲。帳號與 QR 皆為佔位，正式版填入前不得對外。');
}

p.writeFile({ fileName: 'sample-deck.pptx' }).then(() => {
  console.log('✅ sample-deck.pptx 已產出（記得跑 fix-presentation-order.py）');
});
