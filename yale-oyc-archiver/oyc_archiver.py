#!/usr/bin/env python3
"""Open Yale Courses 課程彙整工具（OYC Archiver）

把一門 Open Yale Courses 課程（預設 ECON 159 賽局理論）整理成本地教學資料庫：
  - 每堂課：概述、章節時間軸、指定閱讀、逐字稿（Markdown + 純文字）、PDF 講義、MP3
  - 期中／期末考：題目與解答 PDF
  - 全課程：課程介紹、大綱（syllabus）、索引頁、course.json、NotebookLM 合輯
  - 影片：產生 yt-dlp 下載腳本（影片放在 YouTube，由使用者自行在本機執行）

依據 2026-11 實測的 oyc.yale.edu（Drupal 10）頁面結構撰寫。
課程內容授權為 CC BY-NC-SA 3.0（第三方內容除外），僅供非商業教學使用。
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from urllib.parse import unquote, urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
from bs4 import BeautifulSoup, NavigableString, Tag

__version__ = "1.0.0"

DEFAULT_COURSE_URL = "https://oyc.yale.edu/economics/econ-159"
USER_AGENT = (
    f"OYC-Archiver/{__version__} (non-commercial educational archiving; "
    "python-requests)"
)
LICENSE_NOTE = (
    "本資料庫內容取自 Open Yale Courses（https://oyc.yale.edu），"
    "依 Creative Commons 姓名標示-非商業性-相同方式分享 3.0（CC BY-NC-SA 3.0）授權；"
    "各講 Credits 中標示的第三方內容不在此授權範圍內。僅供非商業教學使用，"
    "轉載或改作（含翻譯）須標示出處並以相同授權釋出。"
)


# ──────────────────────────── 資料結構 ────────────────────────────


@dataclass
class SessionRef:
    label: str  # 例如 "Lecture 1"、"Exam 1"
    title: str
    url: str

    @property
    def slug(self) -> str:
        return urlparse(self.url).path.rstrip("/").rsplit("/", 1)[-1]

    @property
    def kind(self) -> str:
        return "exam" if self.slug.startswith("exam") else "lecture"


@dataclass
class Document:
    label: str
    url: str
    filename: str = ""


@dataclass
class Chapter:
    title: str
    start_seconds: int


@dataclass
class Session:
    ref: SessionRef
    page_title: str = ""
    overview: str = ""
    chapters: list[Chapter] = field(default_factory=list)
    assignment: str = ""
    youtube_id: str = ""
    audio_url: str = ""
    documents: list[Document] = field(default_factory=list)
    transcript_md: str = ""

    @property
    def folder_name(self) -> str:
        m = re.match(r"(lecture|exam)-(\d+)", self.ref.slug)
        if m:
            kind, n = m.group(1), int(m.group(2))
            head = f"Lecture-{n:02d}" if kind == "lecture" else f"Exam-{n}"
        else:
            head = sanitize(self.ref.slug)
        return f"{head}_{sanitize(self.ref.title)}"


@dataclass
class Course:
    url: str
    title: str = ""
    course_number: str = ""
    professor: str = ""
    about: str = ""
    structure: str = ""
    syllabus: dict[str, str] = field(default_factory=dict)
    sessions: list[SessionRef] = field(default_factory=list)


# ──────────────────────────── 工具函式 ────────────────────────────


def sanitize(name: str, maxlen: int = 70) -> str:
    """轉成跨平台安全的檔名（Windows/macOS/Linux 皆可）。"""
    name = unquote(name)
    name = re.sub(r"\[(pdf|PDF)\]", "", name)
    name = re.sub(r"[\\/*?:\"<>|'’,.!()]", "", name)
    name = re.sub(r"[\s_-]+", "_", name.strip())
    return name[:maxlen].strip("_") or "untitled"


def text_of(node: Tag | None) -> str:
    if node is None:
        return ""
    paras = [p.get_text(" ", strip=True) for p in node.find_all("p")]
    paras = [p for p in paras if p]
    if paras:
        return "\n\n".join(paras)
    return node.get_text(" ", strip=True)


def hms(seconds: int) -> str:
    h, rem = divmod(int(seconds), 3600)
    m, s = divmod(rem, 60)
    return f"{h:02d}:{m:02d}:{s:02d}"


# ──────────────────────────── 解析：課程首頁 ────────────────────────────


def parse_course(html: str, course_url: str) -> Course:
    soup = BeautifulSoup(html, "lxml")
    c = Course(url=course_url)
    h1 = soup.select_one("h1.page-title")
    c.title = h1.get_text(" ", strip=True) if h1 else ""

    def field_text(css: str) -> str:
        node = soup.select_one(f"{css} .field-content")
        return text_of(node)

    c.course_number = field_text(".views-field-field-course-number")
    c.about = field_text(".view-display-id-page_5 .views-field-body")
    c.structure = field_text(".views-field-field-course-structure")
    c.professor = field_text(".views-field-field-course-professor-last-name")

    # 大綱分頁（SYLLABUS tab）：每個 views-field 都有一個 label
    syl = soup.select_one(".view-display-id-page_1")
    if syl:
        for fld in syl.select(".views-field"):
            lab = fld.select_one(".views-label")
            content = fld.select_one(".field-content")
            if lab and content:
                key = lab.get_text(" ", strip=True).rstrip(": ").strip()
                c.syllabus[key] = text_of(content)

    # 課堂列表（SESSIONS tab）
    seen: set[str] = set()
    for row in soup.select("tr"):
        a = row.select_one(".views-field-field-session-display-title a[href]")
        if not a:
            continue
        url = urljoin(course_url, a["href"])
        if url in seen:
            continue
        seen.add(url)
        lab = row.select_one(".views-field-field-session-display-number")
        c.sessions.append(
            SessionRef(
                label=lab.get_text(" ", strip=True) if lab else "",
                title=a.get_text(" ", strip=True),
                url=url,
            )
        )

    # 後備：版型改了找不到表格時，抓所有「課程網址/子頁」連結
    if not c.sessions:
        base = course_url.rstrip("/") + "/"
        for a in soup.find_all("a", href=True):
            url = urljoin(course_url, a["href"]).split("#")[0]
            if url.startswith(base) and url not in seen:
                seen.add(url)
                c.sessions.append(SessionRef("", a.get_text(" ", strip=True), url))
    return c


# ──────────────────────────── 解析：單堂課頁 ────────────────────────────


def transcript_to_markdown(container: Tag) -> str:
    """把逐字稿 HTML（h2/h3/p/strong）轉成 Markdown，保留章節與講者。"""
    out: list[str] = []
    for el in container.children:
        if isinstance(el, NavigableString) or not isinstance(el, Tag):
            continue
        if el.name == "h1":
            continue  # 「Game Theory」重複標題
        if el.name == "a" and "Back to Top" in el.get_text():
            continue
        if el.name == "h2":
            out.append(f"# {el.get_text(' ', strip=True)}")
        elif el.name == "h3":
            out.append(f"## {el.get_text(' ', strip=True)}")
        elif el.name == "p":
            parts = []
            for child in el.children:
                if isinstance(child, Tag) and child.name in ("strong", "b"):
                    t = child.get_text(" ", strip=True)
                    if t:
                        parts.append(f"**{t}**")
                elif isinstance(child, Tag) and child.name in ("em", "i"):
                    t = child.get_text(" ", strip=True)
                    if t:
                        parts.append(f"*{t}*")
                elif isinstance(child, Tag) and child.name == "br":
                    parts.append("  \n")
                else:
                    parts.append(child.get_text() if isinstance(child, Tag) else str(child))
            line = re.sub(r"[ \t ]+", " ", "".join(parts)).strip()
            if line:
                out.append(line)
        else:
            t = el.get_text(" ", strip=True)
            if t:
                out.append(t)
    return "\n\n".join(out).strip() + "\n"


def markdown_to_plain(md: str) -> str:
    txt = re.sub(r"^#+ ", "", md, flags=re.M)
    txt = txt.replace("**", "").replace("  \n", "\n")
    return re.sub(r"(?<![*\w])\*([^*\n]+)\*(?![*\w])", r"\1", txt)


def parse_session(html: str, ref: SessionRef) -> Session:
    soup = BeautifulSoup(html, "lxml")
    s = Session(ref=ref)
    if soup.title:
        s.page_title = soup.title.get_text(strip=True).replace(" | Open Yale Courses", "")

    body = soup.select_one(".session-full__body")
    if body:
        lab = body.select_one(".session-full__body-label")
        if lab:
            lab.extract()
        s.overview = text_of(body)

    names = [n.get_text(" ", strip=True) for n in soup.select(".views-field-field-session-chapters-name")]
    starts = [n.get_text(" ", strip=True) for n in soup.select(".views-field-field-session-chapter-start-time")]
    starts = [int(x) for x in starts if x.isdigit()]
    s.chapters = [Chapter(t, sec) for t, sec in zip(names, starts)]

    asg = soup.select_one(".field--name-field-session-assignment")
    s.assignment = text_of(asg)

    for fr in soup.select("iframe[src]"):
        m = re.search(r"youtube(?:-nocookie)?\.com/embed/([\w-]{6,})", fr["src"])
        if m:
            s.youtube_id = m.group(1)
            break

    audio = soup.select_one(".views-field-field-session-audio-file a[href]")
    if audio:
        s.audio_url = urljoin(ref.url, audio["href"])

    seen: set[str] = set()
    for a in soup.select(".views-field-field-media-document a[href]"):
        url = urljoin(ref.url, a["href"])
        if url not in seen:
            seen.add(url)
            s.documents.append(Document(a.get_text(" ", strip=True), url))
    # 後備：頁面其他位置的 PDF 連結（排除站務頁）
    for a in soup.select("main a[href$='.pdf'], main a[href$='.PDF']"):
        url = urljoin(ref.url, a["href"])
        if url not in seen:
            seen.add(url)
            s.documents.append(Document(a.get_text(" ", strip=True) or Path(url).stem, url))

    # 檔名：用連結文字（較易讀）＋原副檔名，避免重名
    used: set[str] = set()
    for d in s.documents:
        ext = Path(urlparse(d.url).path).suffix.lower() or ".pdf"
        base = sanitize(d.label) if d.label else sanitize(Path(unquote(urlparse(d.url).path)).stem)
        name, i = f"{base}{ext}", 2
        while name.lower() in used:
            name, i = f"{base}_{i}{ext}", i + 1
        used.add(name.lower())
        d.filename = name

    tr = soup.select_one("#inline_content")
    if tr:
        md = transcript_to_markdown(tr)
        # 考試頁只有標題沒有內文，不視為逐字稿
        if len(re.sub(r"^#.*$", "", md, flags=re.M).strip()) > 200:
            s.transcript_md = md
    return s


# ──────────────────────────── 網路層 ────────────────────────────


class Fetcher:
    def __init__(self, delay: float = 1.0, retries: int = 4, timeout: int = 60, respect_robots: bool = True):
        self.http = requests.Session()
        self.http.headers["User-Agent"] = USER_AGENT
        self.delay, self.retries, self.timeout = delay, retries, timeout
        self.respect_robots = respect_robots
        self._robots: dict[str, RobotFileParser] = {}
        self._last = 0.0

    def _allowed(self, url: str) -> bool:
        if not self.respect_robots:
            return True
        host = "{0.scheme}://{0.netloc}".format(urlparse(url))
        if host not in self._robots:
            rp = RobotFileParser()
            try:
                r = self.http.get(host + "/robots.txt", timeout=self.timeout)
                rp.parse(r.text.splitlines() if r.ok else [])
            except requests.RequestException:
                rp.parse([])
            self._robots[host] = rp
        return self._robots[host].can_fetch(USER_AGENT, url)

    def _wait(self):
        gap = time.monotonic() - self._last
        if gap < self.delay:
            time.sleep(self.delay - gap)
        self._last = time.monotonic()

    def get(self, url: str, stream: bool = False) -> requests.Response:
        if not self._allowed(url):
            raise PermissionError(f"robots.txt 不允許抓取：{url}")
        err: Exception | None = None
        for attempt in range(1, self.retries + 1):
            self._wait()
            try:
                r = self.http.get(url, timeout=self.timeout, stream=stream)
                if r.status_code in (429, 500, 502, 503, 504):
                    raise requests.HTTPError(f"HTTP {r.status_code}", response=r)
                r.raise_for_status()
                return r
            except requests.RequestException as e:
                err = e
                if attempt < self.retries:
                    time.sleep(2 ** attempt)
        raise RuntimeError(f"連續 {self.retries} 次失敗：{url}（{err}）")

    def text(self, url: str) -> str:
        r = self.get(url)
        r.encoding = r.encoding or "utf-8"
        return r.text

    def download(self, url: str, dest: Path) -> str:
        """下載到 dest；先寫入 .part，完成且大小核對無誤才改名，中斷可續跑。"""
        if dest.exists() and dest.stat().st_size > 0:
            return "skip"
        dest.parent.mkdir(parents=True, exist_ok=True)
        tmp = dest.with_name(dest.name + ".part")
        with self.get(url, stream=True) as r:
            expected = int(r.headers.get("Content-Length") or 0)
            with open(tmp, "wb") as f:
                for chunk in r.iter_content(chunk_size=1 << 16):
                    f.write(chunk)
        size = tmp.stat().st_size
        if expected and size != expected:
            tmp.unlink(missing_ok=True)
            raise RuntimeError(f"檔案不完整（{size}/{expected} bytes）：{url}")
        if size == 0:
            tmp.unlink(missing_ok=True)
            raise RuntimeError(f"空檔案：{url}")
        tmp.replace(dest)
        return "ok"


# ──────────────────────────── 輸出 ────────────────────────────


def session_readme(course: Course, s: Session, audio_file: str | None) -> str:
    yt = f"https://www.youtube.com/watch?v={s.youtube_id}" if s.youtube_id else ""
    lines = [f"# {s.ref.label}｜{s.ref.title}", ""]
    lines += [f"- 課程：{course.course_number} {course.title}（{course.professor}）",
              f"- 原始頁面：<{s.ref.url}>"]
    if yt:
        lines.append(f"- 影片（YouTube）：<{yt}>")
    if audio_file:
        lines.append(f"- 音訊：[{audio_file}]({audio_file})")
    elif s.audio_url:
        lines.append(f"- 音訊（未下載）：<{s.audio_url}>")
    if s.transcript_md:
        lines.append("- 逐字稿：[transcript.md](transcript.md)｜[transcript.txt](transcript.txt)")
    lines.append("")
    if s.overview:
        lines += ["## 課程概述（Overview）", "", s.overview, ""]
    if s.chapters:
        lines += ["## 章節時間軸", "", "| 時間 | 章節 |", "|---|---|"]
        for ch in s.chapters:
            stamp = hms(ch.start_seconds)
            cell = f"[{stamp}]({yt}&t={ch.start_seconds}s)" if yt else stamp
            lines.append(f"| {cell} | {ch.title} |")
        lines.append("")
    if s.assignment:
        lines += ["## 指定閱讀（Assignment）", "", s.assignment, ""]
    if s.documents:
        lines += ["## 講義與文件", ""]
        for d in s.documents:
            lines.append(f"- [{d.label}]({d.filename})　（來源：<{d.url}>）")
        lines.append("")
    lines += ["---", "", f"> {LICENSE_NOTE}", ""]
    return "\n".join(lines)


def course_index(course: Course, sessions: list[Session]) -> str:
    L = [f"# {course.course_number}：{course.title}", "",
         f"- 授課教師：{course.professor}", f"- 原始網址：<{course.url}>",
         f"- 彙整工具：OYC Archiver {__version__}", ""]
    if course.about:
        L += ["## 關於本課程", "", course.about, ""]
    if course.structure:
        L += [course.structure, ""]
    L += ["## 課堂索引", "", "| # | 課堂 | 主題 | 逐字稿 | 影片 | 音訊 | 文件 |", "|---|---|---|---|---|---|---|"]
    for i, s in enumerate(sessions, 1):
        folder = s.folder_name
        tr = f"[✓]({folder}/transcript.md)" if s.transcript_md else "—"
        yt = f"[▶](https://www.youtube.com/watch?v={s.youtube_id})" if s.youtube_id else "—"
        au = "✓" if s.audio_url else "—"
        L.append(f"| {i} | {s.ref.label} | [{s.ref.title}]({folder}/README.md) | {tr} | {yt} | {au} | {len(s.documents)} |")
    L += ["", "大綱（Syllabus）見 [syllabus.md](syllabus.md)；NotebookLM 合輯見 `notebooklm/`。", "",
          "---", "", f"> {LICENSE_NOTE}", ""]
    return "\n".join(L)


def syllabus_md(course: Course) -> str:
    L = [f"# {course.course_number} {course.title}：課程大綱（Syllabus）", ""]
    for k, v in course.syllabus.items():
        L += [f"## {k}", "", v, ""]
    L += ["---", "", f"> {LICENSE_NOTE}", ""]
    return "\n".join(L)


def video_script(sessions: list[Session]) -> str:
    L = ["#!/usr/bin/env bash",
         "# 下載各講 YouTube 影片與官方英文字幕到對應資料夾。",
         "# 需求：yt-dlp（pip install -U yt-dlp）與 ffmpeg。在資料庫根目錄執行：bash download_videos.sh",
         "# 提醒：YouTube 服務條款原則上不允許下載，請僅作個人／非商業教學離線備份。",
         "set -u", 'cd "$(dirname "$0")"', ""]
    for s in sessions:
        if not s.youtube_id:
            continue
        L.append(
            "yt-dlp -f 'bv*[ext=mp4][height<=720]+ba[ext=m4a]/b[ext=mp4]/b' --merge-output-format mp4 "
            "--write-subs --write-auto-subs --sub-langs 'en.*' --convert-subs srt "
            "--no-overwrites --continue "
            f"-o '{s.folder_name}/video.%(ext)s' 'https://www.youtube.com/watch?v={s.youtube_id}' "
            f"|| echo '[失敗] {s.folder_name}' >&2"
        )
    return "\n".join(L) + "\n"


def notebooklm_bundle(course: Course, sessions: list[Session], words_per_file: int = 150_000) -> list[str]:
    """把概述＋逐字稿合併成數個大檔，方便一次匯入 NotebookLM（單一來源上限約 50 萬字）。"""
    files, buf, count = [], [], 0
    header = f"# {course.course_number} {course.title}（{course.professor}）— 全課程逐字稿合輯\n\n> {LICENSE_NOTE}\n"
    for s in sessions:
        if not s.transcript_md:
            continue
        block = f"\n\n---\n\n# {s.ref.label}: {s.ref.title}\n\n來源：{s.ref.url}\n\n"
        if s.overview:
            block += f"**Overview.** {s.overview}\n\n"
        block += re.sub(r"^# .*\n", "", s.transcript_md, count=1).replace("\n## ", "\n### ")
        n = len(block.split())
        if buf and count + n > words_per_file:
            files.append(header + "".join(buf))
            buf, count = [], 0
        buf.append(block)
        count += n
    if buf:
        files.append(header + "".join(buf))
    return files


# ──────────────────────────── 主流程 ────────────────────────────


def parse_selection(spec: str | None, refs: list[SessionRef]) -> list[SessionRef]:
    if not spec:
        return refs
    wanted: set[str] = set()
    for tok in spec.split(","):
        tok = tok.strip().lower()
        m = re.fullmatch(r"(\d+)-(\d+)", tok)
        if m:
            wanted |= {f"lecture-{i}" for i in range(int(m.group(1)), int(m.group(2)) + 1)}
        elif tok.isdigit():
            wanted.add(f"lecture-{int(tok)}")
        elif tok == "exams":
            wanted |= {r.slug for r in refs if r.kind == "exam"}
        elif tok:
            wanted.add(tok)
    return [r for r in refs if r.slug in wanted]


def load_previous(out: Path, course: Course) -> dict[str, Session]:
    """讀回上次的 course.json 與磁碟上的逐字稿，讓「只重跑部分課堂」時不會把索引覆寫成殘缺版。"""
    path = out / "course.json"
    if not path.exists():
        return {}
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    refs = {r.url: r for r in course.sessions}
    prev: dict[str, Session] = {}
    for e in data.get("sessions", []):
        ref = refs.get(e.get("url"))
        if not ref:
            continue
        yt = e.get("youtube") or ""
        s = Session(
            ref=ref, overview=e.get("overview", ""), assignment=e.get("assignment", ""),
            youtube_id=yt.rsplit("v=", 1)[-1] if yt else "", audio_url=e.get("audio_url") or "",
            chapters=[Chapter(**c) for c in e.get("chapters", [])],
            documents=[Document(**d) for d in e.get("documents", [])],
        )
        tr = out / s.folder_name / "transcript.md"
        if tr.exists():
            s.transcript_md = tr.read_text(encoding="utf-8")
        prev[ref.url] = s
    return prev


def run(args: argparse.Namespace) -> int:
    f = Fetcher(delay=args.delay, respect_robots=not args.ignore_robots)
    out = Path(args.out)
    print(f"▶ 讀取課程首頁：{args.course_url}")
    course = parse_course(f.text(args.course_url), args.course_url)
    if not course.sessions:
        print("✗ 找不到任何課堂連結，網站版型可能已改變。", file=sys.stderr)
        return 2
    refs = parse_selection(args.sessions, course.sessions)
    print(f"  {course.course_number} {course.title}：共 {len(course.sessions)} 個課堂頁，本次處理 {len(refs)} 個")
    out.mkdir(parents=True, exist_ok=True)

    sessions: list[Session] = []
    problems: list[str] = []
    stats = {"transcript": 0, "pdf": 0, "audio": 0, "skip": 0}
    for i, ref in enumerate(refs, 1):
        print(f"\n[{i:02d}/{len(refs)}] {ref.label}｜{ref.title}")
        try:
            s = parse_session(f.text(ref.url), ref)
        except Exception as e:  # noqa: BLE001
            problems.append(f"{ref.url}：頁面讀取失敗（{e}）")
            print(f"  ✗ {e}")
            continue
        sessions.append(s)
        d = out / s.folder_name
        d.mkdir(parents=True, exist_ok=True)

        if s.transcript_md:
            (d / "transcript.md").write_text(s.transcript_md, encoding="utf-8")
            (d / "transcript.txt").write_text(markdown_to_plain(s.transcript_md), encoding="utf-8")
            stats["transcript"] += 1
            print(f"  ✓ 逐字稿 {len(s.transcript_md.split()):,} 字")
        elif ref.kind == "lecture":
            problems.append(f"{ref.label}：找不到逐字稿")
            print("  ! 找不到逐字稿")

        if not args.skip_pdf:
            for doc in s.documents:
                try:
                    st = f.download(doc.url, d / doc.filename)
                    stats["pdf" if st == "ok" else "skip"] += 1
                    print(f"  {'✓' if st == 'ok' else '·'} {doc.filename}")
                except Exception as e:  # noqa: BLE001
                    problems.append(f"{ref.label} {doc.filename}：{e}")
                    print(f"  ✗ {doc.filename}：{e}")

        audio_file = None
        if s.audio_url:
            audio_file = "audio" + (Path(urlparse(s.audio_url).path).suffix or ".mp3")
            if args.skip_audio:
                if not (d / audio_file).exists():
                    audio_file = None
            else:
                try:
                    st = f.download(s.audio_url, d / audio_file)
                    stats["audio" if st == "ok" else "skip"] += 1
                    print(f"  {'✓' if st == 'ok' else '·'} {audio_file}")
                except Exception as e:  # noqa: BLE001
                    problems.append(f"{ref.label} 音訊：{e}")
                    print(f"  ✗ 音訊：{e}")
                    audio_file = None
        elif ref.kind == "lecture":
            problems.append(f"{ref.label}：頁面沒有音訊連結")

        (d / "README.md").write_text(session_readme(course, s, audio_file), encoding="utf-8")

    # 合併：本次處理的課堂 ＋ 上次已彙整、本次未處理的課堂（依課程原始順序）
    done = {s.ref.url: s for s in sessions}
    previous = load_previous(out, course)
    sessions = [done.get(r.url) or previous[r.url] for r in course.sessions if r.url in done or r.url in previous]

    (out / "index.md").write_text(course_index(course, sessions), encoding="utf-8")
    (out / "syllabus.md").write_text(syllabus_md(course), encoding="utf-8")
    vs = out / "download_videos.sh"
    vs.write_text(video_script(sessions), encoding="utf-8")
    vs.chmod(0o755)
    nb = out / "notebooklm"
    nb.mkdir(exist_ok=True)
    for old in nb.glob("*.md"):
        old.unlink()
    bundles = notebooklm_bundle(course, sessions)
    for k, txt in enumerate(bundles, 1):
        (nb / f"{sanitize(course.course_number)}_transcripts_part{k}.md").write_text(txt, encoding="utf-8")

    manifest = {
        "tool": f"OYC Archiver {__version__}",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
        "license": LICENSE_NOTE,
        "course": {k: v for k, v in asdict(course).items() if k != "sessions"},
        "sessions": [
            {
                "label": s.ref.label, "title": s.ref.title, "url": s.ref.url, "kind": s.ref.kind,
                "folder": s.folder_name, "overview": s.overview,
                "youtube": f"https://www.youtube.com/watch?v={s.youtube_id}" if s.youtube_id else None,
                "audio_url": s.audio_url or None,
                "chapters": [asdict(c) for c in s.chapters],
                "assignment": s.assignment,
                "documents": [asdict(x) for x in s.documents],
                "transcript_words": len(s.transcript_md.split()),
            }
            for s in sessions
        ],
        "problems": problems,
    }
    (out / "course.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n══════════ 結果 ══════════")
    print(f"本次課堂頁 {len(done)}/{len(refs)}（索引共收錄 {len(sessions)}/{len(course.sessions)}）｜逐字稿 {stats['transcript']}｜新下載 PDF {stats['pdf']}｜"
          f"新下載音訊 {stats['audio']}｜已存在略過 {stats['skip']}｜NotebookLM 合輯 {len(bundles)} 檔")
    print(f"輸出位置：{out.resolve()}")
    if problems:
        print(f"\n⚠ 需要注意的問題（{len(problems)}）：")
        for p in problems:
            print(f"  - {p}")
        return 1
    print("✅ 全部完成，沒有錯誤。")
    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        description="把 Open Yale Courses 課程彙整成本地教學資料庫（預設：ECON 159 賽局理論）。")
    p.add_argument("--course-url", default=DEFAULT_COURSE_URL, help="OYC 課程網址（預設 ECON 159）")
    p.add_argument("--out", default="ECON-159_Game-Theory", help="輸出資料夾")
    p.add_argument("--sessions", help="只處理部分課堂，例：1-3、5,7、exam-1、exams")
    p.add_argument("--skip-audio", action="store_true", help="不下載 MP3（24 講約 1.6 GB）")
    p.add_argument("--skip-pdf", action="store_true", help="不下載 PDF")
    p.add_argument("--delay", type=float, default=1.0, help="每次請求間隔秒數（預設 1.0）")
    p.add_argument("--ignore-robots", action="store_true", help=argparse.SUPPRESS)
    p.add_argument("--version", action="version", version=__version__)
    return p


def main(argv: list[str] | None = None) -> int:
    return run(build_parser().parse_args(argv))


if __name__ == "__main__":
    sys.exit(main())
