#!/usr/bin/env node
// generate.cjs
// 暖青畢業生媒體採訪準備手冊
// 對象：兩位接受中正E報採訪的暖青畢業生（現為大學生）
// 編製：G5．郭駿武
// 執行：NODE_PATH=/home/claude/.npm-global/lib/node_modules node generate.cjs

const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  PageOrientation, BorderStyle, ShadingType, HeightRule,
  Footer, Header, PageNumber, NumberFormat,
  PositionalTab, PositionalTabAlignment, PositionalTabRelativeTo, PositionalTabLeader,
  Table, TableRow, TableCell, WidthType, VerticalAlign,
} = require('docx');
const fs = require('fs');
const path = require('path');

// ======= 設計系統 =======
const FOREST = '3A5A40';   // 主色
const GOLD   = 'C8A87C';   // 強調
const OCEAN  = '3D6B8E';   // 次層
const TEXT   = '1A1A1A';
const MUTED  = '5A5A5A';
const WARN   = '8B4513';
const SOFT   = 'F5F1E8';

const SANS  = '微軟正黑體';
const SERIF = '標楷體';

// ======= Helpers =======
const run = (text, opts = {}) => new TextRun({
  text, font: opts.font || SANS, size: opts.size || 24,
  color: opts.color || TEXT,
  bold: opts.bold || false, italics: opts.italics || false,
});

const para = (text, opts = {}) => new Paragraph({
  children: [run(text, opts)],
  spacing: { before: opts.before ?? 0, after: opts.after ?? 120, line: opts.line ?? 360 },
  alignment: opts.alignment || AlignmentType.JUSTIFIED,
  indent: opts.indent,
  pageBreakBefore: opts.pageBreakBefore || false,
});

const richPara = (children, opts = {}) => new Paragraph({
  children,
  spacing: { before: opts.before ?? 0, after: opts.after ?? 120, line: opts.line ?? 360 },
  alignment: opts.alignment || AlignmentType.JUSTIFIED,
  indent: opts.indent,
  pageBreakBefore: opts.pageBreakBefore || false,
});

// 封面主標
const titleHuge = (text) => para(text, {
  font: SERIF, size: 72, color: FOREST, bold: true,
  alignment: AlignmentType.CENTER,
  before: 0, after: 240, line: 480,
});

const titleSub = (text) => para(text, {
  font: SANS, size: 32, color: OCEAN,
  alignment: AlignmentType.CENTER,
  before: 120, after: 480, line: 400,
});

// 章節標題
const h1 = (text, opts = {}) => para(text, {
  font: SERIF, size: 40, color: FOREST, bold: true,
  alignment: AlignmentType.LEFT,
  before: 240, after: 240, line: 400,
  pageBreakBefore: opts.pageBreakBefore !== false,
});

const h2 = (text) => para(text, {
  font: SANS, size: 28, color: FOREST, bold: true,
  alignment: AlignmentType.LEFT,
  before: 240, after: 120, line: 400,
});

// 題目大標
const questionTitle = (num, text) => richPara([
  run(`Q${num}　`, { font: SERIF, size: 36, color: GOLD, bold: true }),
  run(text, { font: SERIF, size: 32, color: FOREST, bold: true }),
], {
  before: 240, after: 180, line: 400,
  alignment: AlignmentType.LEFT,
  pageBreakBefore: true,
});

// 子標籤
const tag = (text, color = OCEAN) => para(text, {
  font: SANS, size: 26, color, bold: true,
  before: 180, after: 80, line: 360,
  alignment: AlignmentType.LEFT,
});

const tagWarn = (text) => tag(text, WARN);
const tagGold = (text) => tag(text, GOLD);

// 條列項
const bullet = (text, opts = {}) => new Paragraph({
  children: [run(text, opts)],
  spacing: { after: opts.after ?? 80, line: opts.line ?? 360 },
  alignment: AlignmentType.JUSTIFIED,
  bullet: { level: 0 },
});

// 引文示範句
const exampleQuote = (text) => richPara([
  run('「', { font: SERIF, size: 28, color: GOLD, bold: true }),
  run(text, { font: SERIF, size: 26, color: TEXT }),
  run('」', { font: SERIF, size: 28, color: GOLD, bold: true }),
], {
  before: 120, after: 240, line: 400,
  alignment: AlignmentType.LEFT,
  indent: { left: 480 },
});

// 灰色說明
const muted = (text) => para(text, {
  color: MUTED, italics: false, size: 23,
  after: 180, line: 360,
});

const spacer = () => para('', { after: 0 });

// TOC entry
const tocEntry = (label, page) => new Paragraph({
  children: [
    run(label, { font: SANS, size: 24 }),
    new TextRun({
      children: [new PositionalTab({
        alignment: PositionalTabAlignment.RIGHT,
        relativeTo: PositionalTabRelativeTo.MARGIN,
        leader: PositionalTabLeader.DOT,
      })],
    }),
    run(String(page), { font: SANS, size: 24 }),
  ],
  spacing: { after: 100, line: 360 },
});

// 渲染一題
function renderQuestion(q) {
  const els = [questionTitle(q.num, q.title)];
  if (q.reporter) {
    els.push(tag('記者想要的是什麼'));
    els.push(muted(q.reporter));
  }
  if (q.directions && q.directions.length) {
    els.push(tag('思考方向'));
    q.directions.forEach(d => els.push(bullet(d)));
  }
  if (q.examples) {
    els.push(tag('可以舉的例子'));
    els.push(para(q.examples));
  }
  if (q.avoid && q.avoid.length) {
    els.push(tagWarn('要避開的陷阱'));
    q.avoid.forEach(a => els.push(bullet(a, { color: WARN })));
  }
  if (q.opening) {
    els.push(tagGold('一個可以參考的開場句（不是台詞）'));
    els.push(exampleQuote(q.opening));
  }
  return els;
}

// ======= 內容資料 =======

const questions = [
  // ====== 第一部分 ======
  {
    num: 1,
    title: '可以先簡單介紹一下「暖暖蛇青少年共學團」是什麼嗎？',
    reporter: '這是開場破冰題。記者要的是一段可以放在報導前段的「機構簡介」，最好包含「是什麼、有多少人、做什麼」的基本資訊。但官方介紹式的回答常會被讀者跳過——機會在於妳能不能用一句話讓讀者「看見」這個社群。',
    directions: [
      '先校正一個常見誤解：暖暖蛇是國小階段、暖青是國中／高中階段——讓記者不要混為一談。',
      '用一句話定位：它不是學校，也不是補習班，比較接近「一群家庭一起陪青少年長大的學習社群」。',
      '補一個具體畫面（妳記憶裡某個日常場景），讓「社群」這個抽象詞落地。',
    ],
    examples: '可以描述一週的節奏（線上課、實體日、田野出走、學員自治會議），或者妳剛加入暖青時印象最深的某個畫面——比如第一次遇到學長姐、第一次參與議題討論的感覺。',
    avoid: [
      '照官方簡介背——讀起來像新聞稿，沒有「人」。',
      '用「我們是體制外教育」這種對立語言——這會讓讀者立刻把妳們框架成「異類」。',
      '強調人數規模——共學團的價值不是靠規模證明的。',
    ],
    opening: '暖青跟一般人想的「學校」不太一樣，它比較像一個社群——是一群家庭一起陪青少年長大的地方。',
  },
  {
    num: 2,
    title: '加入共學團的契機是什麼？',
    reporter: '這是個人故事題，記者在找敘事素材，希望寫出有戲劇張力的轉折。但戲劇張力不一定要美化——真實的猶豫反而動人。',
    directions: [
      '把「家庭的契機」與「自己的契機」分開講——這兩件事不一樣。',
      '坦白「最初是父母的選擇」，再講自己什麼時候開始接受、選擇這條路。',
      '如果有，講一個轉折點：某次活動、某次對話、某個發現讓妳「決定留下來」。',
    ],
    examples: '不必勉強虛構戲劇性，可以是很小的事——一次田野中看到的東西、一次與學長姐的對話、一個自己第一次發現「這跟以前的學校不一樣」的瞬間。',
    avoid: [
      '把選擇神化成「命中注定」或「我從小就知道體制不適合我」——這種話聽起來不真實。',
      '反過來把選擇講成被動的「就是這樣啊」——對方會用這個寫成「沒主見」。',
    ],
    opening: '老實說一開始不是我選的——是我爸媽選的。我自己真正開始接受這條路，是大概⋯⋯',
  },
  {
    num: 3,
    title: '共學團主要提供哪些有別於一般學校沒有的課程類型或學習活動？',
    reporter: '記者要一份「課程清單」，方便寫報導時跟一般學校做對比。但清單式回答會落入「我們有／他們沒有」的二元框架——這對共學團跟對學校都不公平。',
    directions: [
      '拒絕「我們有／他們沒有」框架——學校也有很好的老師、很好的課。',
      '從「方法的差異」切入，而不是「內容的差異」：同樣是學歷史，進入方式不一樣。',
      '講一個具體場景，讓記者「看見」差異是什麼，而不是聽妳列舉。',
    ],
    examples: '田野走讀（一個地點停留好幾小時、跟在地人對話）、議題討論（時事、法律、政治）、長期專題、跨齡學習、生活共同決議。挑一個妳印象最深的，講細節。',
    avoid: [
      '列舉式介紹——讓報導變成廣告型錄。',
      '把暖青講成「比較好的學校」——這樣對方會用妳的話去批評學校，妳會變成代罪羊。',
    ],
    opening: '與其說「我們有什麼別人沒有的課」，不如說方法不一樣。我可以舉一個例子⋯⋯',
  },
  {
    num: 4,
    title: '通常在共學團裡的同學都是什麼原因加入？加入需要符合哪些條件嗎？',
    reporter: '記者要的是社群輪廓與篩選機制——希望弄清楚這是「誰的選擇」。回答得不好會聽起來像招生簡介。',
    directions: [
      '不替別人發言：用「我觀察到的是⋯⋯」「我認識的家庭裡面，有幾種狀況」這種觀察語氣。',
      '條件問題清楚回答：沒有篩選機制，但「家庭願意參與」是基本前提。',
      '暖青的特殊性可以提一下：青少年自己要願意——這個年紀如果完全是父母逼的，是來不了的。',
    ],
    examples: '可以講妳認識的家庭類型輪廓（不要點名、不要透露隱私），例如：原本在體制內遇到困難的家庭、從小就在共學的家庭、家長自己是教育工作者的家庭。',
    avoid: [
      '替別人解釋他們的選擇——這既不公平也不準確。',
      '聽起來像招生說明會——「歡迎大家加入」這種話不是妳要說的。',
    ],
    opening: '我不能替別人講他們的原因，我只能講我自己觀察到的——大概有幾種家庭⋯⋯',
  },
  {
    num: 5,
    title: '在共學團課程裡，你主要擔任什麼角色或負責哪些工作？像每週三上午的線上課通常會怎麼安排？',
    reporter: '這題假設了妳們有帶課的角色——記者想看實務運作的樣子。注意：這題如果回答得太像「老師助手」，會把共學團的師生關係扁平化成體制內模式。',
    directions: [
      '角色定位很重要：妳比較像「過來人」，不是「老師」——共學團沒有師生階級，這是核心特質。',
      '描述具體流程，但要連到「為什麼這樣設計」的教育思考——不是只交代 SOP。',
      '可以提：暖青的自治精神——很多事情是學員自己決議、自己分工的。',
    ],
    examples: '一週線上課的具體流程（題目選擇、討論、回饋、總結），可以提誰提議、誰反對、最後怎麼決定的。也可以講線上跟實體的搭配。',
    avoid: [
      '說自己是「老師」或「助教」——這會讓記者把暖青寫成「另一種學校」。',
      '把線上課說成單向授課——共學團最重要的就是雙向。',
    ],
    opening: '我比較像過來人，不是老師。我們週三早上會做的是⋯⋯',
  },
  {
    num: 6,
    title: '在線上課程的設計與帶領過程中，你覺得最具挑戰或最需要花心力的是什麼？',
    reporter: '這是實務經驗題，記者想避開報導太美好的風險，希望聽到真實的困難。妳越坦白，報導越有質地。',
    directions: [
      '講具體挑戰：線上互動的薄弱、學弟妹的沉默、自己準備時的不確定。',
      '可以分「設計」與「帶領」兩階段——規劃時想得很美、實際帶課常常崩壞，這個落差就是挑戰本身。',
      '把挑戰當成學習素材，而不是缺點——這才符合共學團的精神。',
    ],
    examples: '某次卡住的課（妳怎麼處理）、某次學弟妹反應冷淡的經驗（妳事後的反思）、某次自己準備充分但現場走偏的時刻。',
    avoid: [
      '「都很順利」——記者會直接跳過這段。',
      '「都很有趣」——這是廣告語，不是經驗談。',
    ],
    opening: '最難的，是怎麼讓沉默不會變成尷尬。我有過一次⋯⋯',
  },
  {
    num: 7,
    title: '從負責教課與課程規劃的經驗中，你獲得了哪些成長或收穫？',
    reporter: '記者要金句，要勵志清單。但「我學到了 xx 能力」式的清單回答最容易被讀者打折扣——大家都聽過了。',
    directions: [
      '把「成長」具體化，不要落入熟語。',
      '講一個轉折點：某次失敗的課之後妳怎麼想、某次學弟妹的回饋讓妳重新理解某事。',
      '比起「成長」這個詞，講「我以前以為⋯⋯後來才發現⋯⋯」這種句型更有說服力。',
    ],
    examples: '某個特定的學弟妹（不要點名）、某個讓妳重新理解教學的瞬間、某個發現自己預設錯了的時刻。',
    avoid: [
      '「我學到了表達能力、領導能力、溝通能力」這種清單。',
      '「教是最好的學」這種被引用太多次的熟語。',
    ],
    opening: '我以前以為教課就是把自己懂的講出來，後來才發現⋯⋯',
  },

  // ====== 第二部分 ======
  {
    num: 8,
    title: '在共學團期間，你有特別為自己規劃哪些學習計畫嗎？自主學習的模式，對你最大的幫助是什麼？',
    reporter: '記者要的是自主學習的成功故事——希望寫出「沒有老師管，孩子也能很自律」的敘事。但浪漫化的回答會失去可信度。',
    directions: [
      '誠實：包含失敗的、半途而廢的計畫——這比成功故事更有說服力。',
      '「最大的幫助」與「最大的代價」一起談——自主學習不是浪漫的，它讓妳必須面對自己。',
      '可以講「我學到的不是『有紀律』，是怎麼跟自己的怠惰共處」這類更深的反思。',
    ],
    examples: '某個自己規劃過但沒做完的計畫、某個本來只想學一週結果延伸出新方向的學習、某個跟同學一起組讀書會的經驗。',
    avoid: [
      '把自主學習神化——「我每天都很有紀律」是廣告語。',
      '把它講得太簡單——讀者會認為妳在說謊或妳很特別。',
    ],
    opening: '自主學習聽起來很自由，但其實它最大的挑戰是——妳必須面對自己的怠惰。我做過好幾個計畫，有些半途而廢⋯⋯',
  },
  {
    num: 9,
    title: '你覺得自己在這段過程中學會了哪些課本外的重要能力？',
    reporter: '記者要清單。但「能力」這個詞本身就有點空——清單式回答會讓報導讀起來像勵志書摘。',
    directions: [
      '選一兩個能力就好，用一個故事串起來——不要列清單。',
      '比起「能力」，講「習慣」或「方式」可能更準確——「能力」常常是事後才命名的。',
      '可以反過來說：我以前不會這樣做，現在會這樣做——對比比命名更清楚。',
    ],
    examples: '在一次衝突／合作／田野中具體學到的東西。比如「跟意見不同的人繼續對話」「被質疑時不馬上反擊」「面對不確定不焦慮」這類具體的能力，配一個場景。',
    avoid: [
      '「溝通能力、表達能力、批判思考」清單——讀者已經聽過 100 次。',
      '過度抽象的能力詞——越抽象越沒有重量。',
    ],
    opening: '與其說「能力」，我覺得是養成了一種習慣——意見不同的時候不放棄繼續說話。我可以舉一個例子⋯⋯',
  },
  {
    num: 10,
    title: '在準備升學考試前，你通常怎麼規劃自己的學習進度？',
    reporter: '實務題，記者想要實用資訊，給未來考慮共學的家庭一個參考。妳越具體越好。',
    directions: [
      '講具體方法、工具、節奏——不要抽象描述。',
      '坦白沒有完美規劃、有過混亂期——這比「井井有條」可信。',
      '強調這是「我個人的方式」，不是「正確方式」——避免被當成共學團的標準答案。',
    ],
    examples: '自己使用的工具（哪些書、哪些線上資源、有沒有讀書會、有沒有去補習）、時間切分方式、遇到瓶頸時怎麼處理。',
    avoid: [
      '鼓吹某個特定方法——這對其他學生不一定適用。',
      '「我從很早就開始準備」——聽起來像超人，沒有參考價值。',
    ],
    opening: '我自己的方式不一定是最好的，給大家參考——我大概是從⋯⋯',
  },
  {
    num: 11,
    title: '面對學測或其他體制內考試時，你覺得最大的挑戰是什麼？你會覺得自己在哪些科目或能力上需要額外補強嗎？',
    reporter: '陷阱題。記者潛意識在找「體制外的弱點」，方便做對比敘事。回答得不好會強化「體制外不會考試」的刻板印象。',
    directions: [
      '先打破預設：考試本來就是技術活，跟在不在共學團其實沒有絕對關係——體制內學生也都覺得學測很難。',
      '坦白共學團不太強調應試技巧是事實，但這不等於「不會考試」——是「沒有特別練」。',
      '補強這部分要具體：自己怎麼補（線上資源、補習、自學、讀書會），不要含糊。',
      '把這當成「選擇後的處理」，而不是「弱點懺悔」——心理位置要站穩。',
    ],
    examples: '具體哪一科自己花比較多時間、用了哪些資源（誠實講有沒有補習）、考前最焦慮的是什麼。',
    avoid: [
      '強化「體制外不會考試」的刻板印象——這對學弟妹有害。',
      '反過來說「我們考試也很強」——這是另一種焦慮，沒有必要證明。',
    ],
    opening: '考試本來就是一個技術活，跟在不在共學團其實沒有絕對關係。我自己補強的方式是⋯⋯',
  },
  {
    num: 12,
    title: '和體制內學生相比，你認為自己在升學準備上有哪些優勢或劣勢？',
    reporter: '陷阱題之二。比較框架本身就是陷阱——一旦進入比較，妳的回答怎麼說都會傷到一邊。',
    directions: [
      '拒絕全面比較——體制內的學生彼此就差很多了，「體制內」不是一個同質的群體。',
      '只比較自己有實際接觸的層面——大學認識的同學給了什麼刺激、自己看到哪些沒長出來的東西。',
      '雙向反思：講自己的「優勢」之外，也講自己的「不足」——這比單向講自己強更可信。',
      '心理位置：避免高姿態、也避免自貶。',
    ],
    examples: '大學的具體經驗——某次討論課、某次小組合作、某次跟體制內同學的對話讓妳重新看自己。',
    avoid: [
      '全面比較——「我們比較會獨立思考、他們比較會考試」這種話既傲慢又不準確。',
      '把自己當成「體制外的代表」——妳代表的只有妳自己。',
    ],
    opening: '這個比較我覺得有點假，因為體制內的學生彼此就差很多了。如果只講我自己——',
  },
  {
    num: 13,
    title: '回頭看共學團的學習方式，你覺得它對你最大的幫助是什麼？',
    reporter: '記者要產品見證。但「共學團讓我變得 xx」式的回答聽起來像廣告，讀者會自動打折扣。',
    directions: [
      '講具體場景——大學生活某個時刻、某個情境，讓妳想起共學團教過自己什麼。',
      '「最大的幫助」最好是結構性的（思考方式、與人的關係），而不是技能性的——後者體制內也學得到。',
      '也可以坦白：「最大的幫助我現在還在發現」——這是誠實的，不是退讓。',
    ],
    examples: '大學討論課中、做專題時、跟室友相處時、面對某個選擇時，妳發現自己在用共學團教過妳的方式處理。',
    avoid: [
      '「共學團讓我變得 xx」廣告口吻。',
      '過度浪漫化——讓報導看起來像招生宣傳。',
    ],
    opening: '最直接的幫助，可能是大學討論課的時候我發現⋯⋯',
  },

  // ====== 第三部分 ======
  {
    num: 14,
    title: '你認為目前體制內的升學制度（學測、分科、特殊選才等等，以及學習歷程多元表現等等，或是其他學校課程分配）有哪些可以矛盾或可以改進的點？',
    reporter: '陷阱題之三，金句題。記者最想要這題的回答來當報導的爆點。但泛泛批評（「學測太死板、學習歷程很形式」）誰都會講，沒有重量。',
    directions: [
      '只選一個自己有實際觀察、有經驗的點，深入講——廣度換深度。',
      '立論基礎要清楚：不是「我覺得」，而是「因為我看到 xx，所以我認為 yy」。',
      '建議切入點（擇一）：學習歷程的形式化、特殊選才管道的可貴與限制、108 課綱實踐落差、分科考試的負擔分配。',
      '批判要有建設性——指出問題，提出方向。否則會被當成「就是討厭體制」。',
    ],
    examples: '某個具體觀察（看 xx 同學在做學習歷程的時候，發現⋯⋯）、與某位體制內朋友的對話、某個自己經歷過的政策落差。',
    avoid: [
      '全盤否定——「學校教育全錯」這種大批判。',
      '沒有立論的情緒語言——讀者會覺得妳在抱怨。',
      '替老師、學校、教育部背鍋——批判的對象是「制度」，不是「人」。',
    ],
    opening: '我比較有觀察的是學習歷程這部分。我看到的矛盾是——',
  },
  {
    num: 15,
    title: '你會推薦哪些類型的學生考慮共學團這樣的教育模式？',
    reporter: '陷阱題之四。「推薦」這個動詞本身就有問題——它預設了篩選。回答時要先翻轉這個動詞。',
    directions: [
      '把「推薦」轉成「邀請」：任何家庭都可以先來看看，重點不是孩子適不適合。',
      '重點放在「家庭的態度」，不在「孩子的特質」——這是共學團的核心。',
      '提醒選這條路有代價：時間、家庭參與、跟主流的拉扯——讓家庭清楚自己在選什麼。',
      '特別注意陷阱：不要說「適合自主性強的孩子」——這句話翻轉了共學團的核心，因為自主性是「在過程中長出來的」，不是「進來前要具備的」。',
    ],
    examples: '可以講：家庭需要的條件（願意花時間、願意參與、願意跟孩子做價值對話）、選擇後可能要面對的事情（被親友質疑、跟主流不同步）。',
    avoid: [
      '「適合自主性強的孩子」——核心翻轉，把共學團的精神講反了。',
      '條件化篩選——「適合 xx 不適合 xx」會讓共學團聽起來像精英教育。',
      '反過來「適合所有人」——這是另一種廣告語。',
    ],
    opening: '我不會說「推薦」哪一種學生——我覺得任何家庭都可以先來看看。重點不是孩子適不適合，是家庭願不願意一起參與這個過程。',
  },
];

// ======= 文件組裝 =======

const children = [];

// ---- 封面 ----
children.push(spacer());
children.push(spacer());
children.push(spacer());
children.push(spacer());
children.push(titleHuge('暖青畢業生'));
children.push(titleHuge('媒體採訪準備手冊'));
children.push(spacer());
children.push(titleSub('中正E報採訪題綱回應方向'));
children.push(spacer());
children.push(spacer());
children.push(spacer());
children.push(para('編製：G5．郭駿武', {
  font: SANS, size: 26, color: TEXT,
  alignment: AlignmentType.CENTER, after: 60,
}));
children.push(para('社團法人台灣親子共學教育促進會　秘書長', {
  font: SANS, size: 22, color: MUTED,
  alignment: AlignmentType.CENTER, after: 60,
}));
children.push(para('暖青共學團　全國召集人', {
  font: SANS, size: 22, color: MUTED,
  alignment: AlignmentType.CENTER, after: 240,
}));
children.push(para('2026.05', {
  font: SANS, size: 22, color: MUTED,
  alignment: AlignmentType.CENTER, after: 0,
}));

// ---- 目錄 ----
children.push(h1('目錄', { pageBreakBefore: true }));
children.push(spacer());
children.push(tocEntry('給妳們的話', 3));
children.push(tocEntry('採訪基本心態', 4));
children.push(tocEntry('第一部分　共學團日常與基本介紹', 6));
children.push(tocEntry('　　Q1　暖青是什麼？', 6));
children.push(tocEntry('　　Q2　加入的契機', 7));
children.push(tocEntry('　　Q3　不一樣的課程與活動', 8));
children.push(tocEntry('　　Q4　誰會加入？條件是什麼？', 9));
children.push(tocEntry('　　Q5　妳擔任的角色與線上課', 10));
children.push(tocEntry('　　Q6　線上課的挑戰', 11));
children.push(tocEntry('　　Q7　教課的成長與收穫', 12));
children.push(tocEntry('第二部分　學習經驗', 13));
children.push(tocEntry('　　Q8　自主學習的計畫與幫助', 13));
children.push(tocEntry('　　Q9　課本外的能力', 14));
children.push(tocEntry('　　Q10　考試前的學習規劃', 15));
children.push(tocEntry('　　Q11　考試的挑戰與補強', 16));
children.push(tocEntry('　　Q12　跟體制內的優劣比較', 17));
children.push(tocEntry('　　Q13　共學團的最大幫助', 18));
children.push(tocEntry('第三部分　延伸反思', 19));
children.push(tocEntry('　　Q14　升學制度的矛盾與改進', 19));
children.push(tocEntry('　　Q15　會推薦給哪些學生？', 20));
children.push(tocEntry('隨身四句話', 21));
children.push(tocEntry('採訪前後的儀式', 22));

// ---- 引言 ----
children.push(h1('給妳們的話', { pageBreakBefore: true }));
children.push(para('這份手冊不是讓妳們背稿用的——記者最容易嗅出背稿的氣味，那會讓整篇報導失去溫度。'));
children.push(para('這份手冊是讓妳們在採訪前，先把自己的經驗整理一次。每一題我都列了「記者想要的是什麼」，那是隱性的敘事框架——妳們要先看見這個框架，才能決定要不要進入它、或者怎麼用自己的方式回應它。'));
children.push(para('每一題的「思考方向」是給妳們鋪路，不是給妳們答案。「可以舉的例子」是素材線索，但具體的故事是妳們自己的——只有妳們知道哪一個畫面最真實。'));
children.push(para('「要避開的陷阱」用紅褐色標記，那不是禁區，是值得多想一秒的地方。如果妳們覺得自己有把握處理那個陷阱，當然可以說——這份手冊不是限制妳們，是提醒妳們。'));
children.push(para('「示範開場句」是參考，不是台詞。妳們可以用自己的語感重寫，重點是那個結構——它讓妳們在開口的前三秒就站穩位置。'));
children.push(para('最後一件事：媒體採訪是一個機會，不是一個考試。妳們不需要「表現好」——妳們只需要誠實地呈現自己。誠實本身，就是最好的表現。'));
children.push(para(''));
children.push(para('—— G5', {
  font: SERIF, size: 26, color: GOLD, italics: false,
  alignment: AlignmentType.RIGHT, after: 0,
}));

// ---- 採訪基本心態 ----
children.push(h1('採訪基本心態', { pageBreakBefore: true }));
children.push(para('採訪前先把這三件事放在心上。它們不是技術，是位置——妳站在什麼位置上，決定了妳怎麼回答。'));

children.push(h2('一、妳是當事人，不是代言人'));
children.push(para('妳說的是「我的經驗」，不是「暖青的經驗」、也不是「體制外教育的經驗」。記者很容易把個案放大成通則，妳要在語言上自己先把它定錨：'));
children.push(bullet('「我自己的話啦，我是覺得⋯⋯」'));
children.push(bullet('「不知道別人怎麼樣，我那時候是⋯⋯」'));
children.push(bullet('「這只是我的版本，xx 同學可能完全不同。」'));
children.push(para('這不是怯懦，這是準確。'));

children.push(h2('二、真實的矛盾，比漂亮的答案更有力'));
children.push(para('如果說「共學團讓我變得很好」——這是公關語言，記者也聽過十次了，沒有重量。如果說「共學團讓我有自由，但我也曾經懷疑這個自由是不是只是我爸媽的選擇」——這才是有重量的話。'));
children.push(para('說出掙扎、說出當年的遲疑、說出某些後來才補上的能力，不會傷害共學團，反而會讓報導有可信度。美化的敘事最後反而會被讀者打折扣。'));

children.push(h2('三、慢，是一種權利'));
children.push(para('學生記者常常急著問下一題、急著抓金句。受訪者有權利說：'));
children.push(bullet('「這個我想一下喔。」（沉默五秒沒關係）'));
children.push(bullet('「這個問題我覺得不太能直接回答，我先說一下背景⋯⋯」'));
children.push(bullet('「妳這題想了解什麼？我怕我答歪掉。」'));
children.push(para('反問記者「妳想了解什麼」是合法的——這不是刁難，是釐清。'));

// ---- 第一部分 ----
children.push(h1('第一部分　共學團日常與基本介紹', { pageBreakBefore: true }));
children.push(para('這一段是報導的背景介紹，妳的回答會決定整篇報導的「視角」。如果這段答得太機構化，後面再怎麼有溫度都救不回來。重點是：讓讀者「看見」一個社群，而不是「認識」一個機構。'));

[1, 2, 3, 4, 5, 6, 7].forEach(n => {
  const q = questions.find(x => x.num === n);
  renderQuestion(q).forEach(el => children.push(el));
});

// ---- 第二部分 ----
children.push(h1('第二部分　學習經驗', { pageBreakBefore: true }));
children.push(para('這一段是報導的核心——記者最想知道的是「妳怎麼學？學得怎麼樣？」這幾題的回答決定了讀者對共學團的整體印象。'));
children.push(para('這一段最大的風險是兩個極端：把自己講得太完美（讀者會打折扣）、或者把自己講得太謙虛（讀者會懷疑共學團）。中間的路徑是「具體與真實」——講細節、講掙扎、講後來才理解的事。'));

[8, 9, 10, 11, 12, 13].forEach(n => {
  const q = questions.find(x => x.num === n);
  renderQuestion(q).forEach(el => children.push(el));
});

// ---- 第三部分 ----
children.push(h1('第三部分　延伸反思', { pageBreakBefore: true }));
children.push(para('這一段是金句區——記者最想抓報導爆點的兩題。妳們有沒有準備、用什麼角度切入，會直接影響報導的標題。'));
children.push(para('這一段最重要的提醒是：批判要有立論基礎，推薦要有保留條件。情緒性的話會被當作金句使用，但會傷害妳自己的可信度。'));

[14, 15].forEach(n => {
  const q = questions.find(x => x.num === n);
  renderQuestion(q).forEach(el => children.push(el));
});

// ---- 隨身四句話 ----
children.push(h1('隨身四句話', { pageBreakBefore: true }));
children.push(para('採訪當天，把這四句話寫在小紙條上、或記在心裡。當妳被問到難題、需要時間、或者想拒絕回答的時候——這四句話可以幫妳把節奏拿回來。'));
children.push(spacer());

children.push(para('一、', { font: SERIF, size: 36, color: GOLD, bold: true, after: 60 }));
children.push(exampleQuote('這是我的經驗，不一定代表別人。'));
children.push(muted('用在：當妳感覺記者把妳的話往「整個共學團」推時，先把自己抽離出來。'));

children.push(para('二、', { font: SERIF, size: 36, color: GOLD, bold: true, after: 60 }));
children.push(exampleQuote('我可以先想一下嗎？'));
children.push(muted('用在：被問到沒準備過的問題、或者準備過但當下卡住時。沉默五秒，比急著回答好。'));

children.push(para('三、', { font: SERIF, size: 36, color: GOLD, bold: true, after: 60 }));
children.push(exampleQuote('這個問題妳想了解什麼？我怕答偏。'));
children.push(muted('用在：題目本身有點模糊、或者妳懷疑這題有預設立場時。反問是合法的。'));

children.push(para('四、', { font: SERIF, size: 36, color: GOLD, bold: true, after: 60 }));
children.push(exampleQuote('這題我可能不太想回答。'));
children.push(muted('用在：涉及他人隱私、或者妳覺得回答了會被誤用時。這句話比妳以為的更可以說出口。'));

// ---- 採訪前後的儀式 ----
children.push(h1('採訪前後的儀式', { pageBreakBefore: true }));

children.push(h2('採訪前一晚'));
children.push(bullet('把這份手冊翻一遍，但不要逐題背稿——只挑妳最在意的三題重新想過。'));
children.push(bullet('準備兩三個自己印象最深的具體場景（一次田野、一次討論、一次衝突），這些畫面是妳的素材庫。'));
children.push(bullet('早睡。睡眠對前額葉的判斷力影響比妳以為的大。'));

children.push(h2('採訪當下'));
children.push(bullet('如果記者錄音，跟記者說一聲妳自己也錄一份——這是受訪者的基本權利，也是萬一報導失真時妳的依據。'));
children.push(bullet('開場第一題不要急著進入內容——可以先介紹自己（暖青幾年、現在哪所大學什麼系），讓記者有基本認識，妳也有時間進入狀態。'));
children.push(bullet('記者問完最後一題之後，可以問一句：「妳這次主要想寫的角度是什麼？」這句話讓妳知道報導的走向，也提醒記者妳是有意識的受訪者。'));
children.push(bullet('採訪結束後，禮貌詢問：「能不能在刊登前看一下我自己的引述部分？」學生記者不一定會答應，但問了至少留下一個校正機會。'));

children.push(h2('採訪結束之後'));
children.push(bullet('找對方（另一位受訪者）一起聊一聊：哪些題妳們的答案差很多？為什麼？這個對話本身就是學習。'));
children.push(bullet('找我（駿武）復盤一次：哪些題妳當下沒答好？哪些題事後才想到更精準的說法？這次的反思比採訪本身更有意義。'));
children.push(bullet('報導刊出後，不要急著評價——讓它沉澱兩天再讀。第一時間的反應常常是情緒，不是判斷。'));

children.push(spacer());
children.push(spacer());
children.push(para('—— 完 ——', {
  font: SERIF, size: 28, color: GOLD,
  alignment: AlignmentType.CENTER, after: 240,
}));
children.push(para('祝採訪順利。記住——妳們不需要表現好，妳們只需要誠實。', {
  font: SERIF, size: 26, color: FOREST, italics: false,
  alignment: AlignmentType.CENTER, after: 0,
}));

// ======= Document =======

const doc = new Document({
  creator: 'G5．郭駿武',
  title: '暖青畢業生媒體採訪準備手冊',
  description: '中正E報採訪題綱回應方向',
  styles: {
    default: {
      document: { run: { font: SANS, size: 24 } },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: {
          top: 1440, right: 1440, bottom: 1440, left: 1440,
        },
      },
    },
    headers: {
      default: new Header({
        children: [para('暖青畢業生媒體採訪準備手冊', {
          font: SANS, size: 18, color: MUTED,
          alignment: AlignmentType.RIGHT, after: 0,
        })],
      }),
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          children: [
            run('G5．郭駿武　', { font: SANS, size: 18, color: MUTED }),
            new TextRun({
              children: [PageNumber.CURRENT],
              font: SANS, size: 18, color: MUTED,
            }),
            run(' / ', { font: SANS, size: 18, color: MUTED }),
            new TextRun({
              children: [PageNumber.TOTAL_PAGES],
              font: SANS, size: 18, color: MUTED,
            }),
          ],
          alignment: AlignmentType.CENTER,
        })],
      }),
    },
    children,
  }],
});

// ======= Output =======
const outDir = '/mnt/user-data/outputs';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
const outPath = path.join(outDir, '暖青畢業生媒體採訪準備手冊.docx');

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(outPath, buf);
  console.log(`✓ 已產出：${outPath}`);
  console.log(`  檔案大小：${(buf.length / 1024).toFixed(1)} KB`);
}).catch(err => {
  console.error('產生失敗：', err);
  process.exit(1);
});
