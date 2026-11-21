"""離線測試：用 2026-11 從 oyc.yale.edu 存下的真實頁面驗證解析邏輯。

執行：  pytest -q
連線實測（會真的連 oyc.yale.edu，只抓第 1 講與期中考、不下載 MP3）：
        OYC_LIVE=1 pytest -q -k live
"""
import os
import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import oyc_archiver as oa  # noqa: E402

FX = ROOT / "tests" / "fixtures"
COURSE_URL = oa.DEFAULT_COURSE_URL


def load(name):
    return (FX / name).read_text(encoding="utf-8")


@pytest.fixture(scope="module")
def course():
    return oa.parse_course(load("course_econ-159.html"), COURSE_URL)


@pytest.fixture(scope="module")
def lecture1(course):
    ref = next(r for r in course.sessions if r.slug == "lecture-1")
    return oa.parse_session(load("lecture-1.html"), ref)


@pytest.fixture(scope="module")
def exam1(course):
    ref = next(r for r in course.sessions if r.slug == "exam-1")
    return oa.parse_session(load("exam-1.html"), ref)


# ── 課程首頁 ──

def test_course_metadata(course):
    assert course.title == "Game Theory"
    assert course.course_number == "ECON 159"
    assert "Ben Polak" in course.professor
    assert "Fall 2007" in course.structure
    assert "Nash equilibrium" in course.about


def test_course_lists_24_lectures_and_2_exams(course):
    kinds = [r.kind for r in course.sessions]
    assert kinds.count("lecture") == 24
    assert kinds.count("exam") == 2  # Gemini 原腳本只比對 "lecture-"，會漏掉這兩個
    assert course.sessions[0].title == "Introduction: Five First Lessons"
    assert course.sessions[12].slug == "exam-1"  # 期中考位於第 12 講之後
    assert course.sessions[-1].slug == "exam-2"


def test_syllabus_sections(course):
    assert {"Texts", "Grading"} <= set(course.syllabus)
    assert "Problem sets: 30%" in course.syllabus["Grading"]


# ── 單堂課頁 ──

def test_lecture_overview_and_chapters(lecture1):
    assert lecture1.overview.startswith("We introduce Game Theory by playing a game.")
    assert len(lecture1.chapters) == 9
    assert lecture1.chapters[0].start_seconds == 0
    assert lecture1.chapters[-1].title == "Lesson Recap"
    assert lecture1.chapters[-1].start_seconds == 4073  # 01:07:53
    assert oa.hms(4073) == "01:07:53"


def test_lecture_media(lecture1):
    assert lecture1.youtube_id == "nM3rTU927io"
    assert lecture1.audio_url.endswith("/econ159_01_090507.mp3")
    assert [d.filename for d in lecture1.documents] == [
        "Summary_Lecture_1.pdf",
        "Blackboard_Notes_Lecture_1.pdf",
    ]
    assert "Dutta" in lecture1.assignment


def test_lecture_transcript(lecture1):
    md = lecture1.transcript_md
    assert md.startswith("# ECON 159 - Lecture 1 - Introduction: Five First Lessons")
    assert "## Chapter 1. What Is Strategy? [00:00:00]" in md
    assert "**Professor Ben Polak:** So this is Game Theory Economics 159." in md
    assert md.rstrip().endswith("[end of transcript]")
    assert "Back to Top" not in md
    assert len(md.split()) > 10_000
    plain = oa.markdown_to_plain(md)
    assert "**" not in plain and "\n## " not in plain


def test_exam_has_pdfs_but_no_transcript(exam1):
    assert exam1.transcript_md == ""
    assert exam1.audio_url == ""
    assert [d.filename for d in exam1.documents] == [
        "Midterm_Exam_from_2007.pdf",
        "Solutions_to_Midterm_Exam.pdf",
    ]


def test_folder_names(lecture1, exam1):
    assert lecture1.folder_name == "Lecture-01_Introduction_Five_First_Lessons"
    assert exam1.folder_name == "Exam-1_Midterm_Exam"


# ── 輸出與工具函式 ──

def test_sanitize_is_cross_platform():
    s = oa.sanitize("Putting Yourselves into Other People's Shoes: A/B?")
    assert all(ch not in s for ch in '\\/:*?"<>|\' ')
    assert oa.sanitize("summary%20of%20first%20class") == "summary_of_first_class"


def test_selection(course):
    pick = lambda spec: [r.slug for r in oa.parse_selection(spec, course.sessions)]
    assert pick("1-3") == ["lecture-1", "lecture-2", "lecture-3"]
    assert pick("exams") == ["exam-1", "exam-2"]
    assert pick("24,exam-2") == ["lecture-24", "exam-2"]
    assert len(pick(None)) == 26


def test_generated_documents(course, lecture1, exam1):
    readme = oa.session_readme(course, lecture1, "audio.mp3")
    assert "https://www.youtube.com/watch?v=nM3rTU927io&t=4073s" in readme
    assert "CC BY-NC-SA 3.0" in readme
    idx = oa.course_index(course, [lecture1, exam1])
    assert "Lecture-01_Introduction_Five_First_Lessons/transcript.md" in idx
    script = oa.video_script([lecture1, exam1])
    assert script.count("yt-dlp ") == 1
    r = subprocess.run(["bash", "-n"], input=script, text=True, capture_output=True)
    assert r.returncode == 0, r.stderr
    bundles = oa.notebooklm_bundle(course, [lecture1, exam1])
    assert len(bundles) == 1 and "# Lecture 1: Introduction" in bundles[0]


def test_download_is_atomic(tmp_path, monkeypatch):
    """下載中斷時不應留下會被誤判為「已存在」的殘檔（Gemini 原腳本的問題）。"""
    class Boom:
        headers = {"Content-Length": "100"}
        def __enter__(self): return self
        def __exit__(self, *a): return False
        def iter_content(self, chunk_size):
            yield b"x" * 10
            raise ConnectionError("network dropped")
    f = oa.Fetcher(delay=0)
    monkeypatch.setattr(f, "get", lambda url, stream=False: Boom())
    dest = tmp_path / "a.pdf"
    with pytest.raises(ConnectionError):
        f.download("https://example.invalid/a.pdf", dest)
    assert not dest.exists()

    class Short(Boom):
        def iter_content(self, chunk_size):
            yield b"x" * 10
    monkeypatch.setattr(f, "get", lambda url, stream=False: Short())
    with pytest.raises(RuntimeError, match="不完整"):
        f.download("https://example.invalid/a.pdf", dest)
    assert not dest.exists()


def test_offline_end_to_end_and_partial_rerun(tmp_path, monkeypatch):
    """完整流程（以真實頁面快照代替網路）；只重跑一堂時，索引不可被覆寫成殘缺版。"""
    pages = {
        COURSE_URL: load("course_econ-159.html"),
        COURSE_URL + "/lecture-1": load("lecture-1.html"),
        COURSE_URL + "/exam-1": load("exam-1.html"),
    }
    monkeypatch.setattr(oa.Fetcher, "text", lambda self, url: pages[url])

    def fake_download(self, url, dest):
        if dest.exists():
            return "skip"
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_bytes(b"%PDF-1.4 fake" if dest.suffix == ".pdf" else b"ID3 fake")
        return "ok"
    monkeypatch.setattr(oa.Fetcher, "download", fake_download)

    assert oa.main(["--out", str(tmp_path), "--sessions", "1,exam-1", "--delay", "0"]) == 0
    l1 = tmp_path / "Lecture-01_Introduction_Five_First_Lessons"
    assert {p.name for p in l1.iterdir()} == {
        "README.md", "transcript.md", "transcript.txt", "audio.mp3",
        "Summary_Lecture_1.pdf", "Blackboard_Notes_Lecture_1.pdf"}
    assert (tmp_path / "syllabus.md").read_text(encoding="utf-8").count("## ") >= 4

    # 第二次只跑第 1 講且略過音訊：期中考仍須留在索引，README 仍連到已下載的音訊
    assert oa.main(["--out", str(tmp_path), "--sessions", "1", "--skip-audio", "--delay", "0"]) == 0
    idx = (tmp_path / "index.md").read_text(encoding="utf-8")
    assert "Exam-1_Midterm_Exam/README.md" in idx and "Lecture-01_" in idx
    import json
    m = json.loads((tmp_path / "course.json").read_text(encoding="utf-8"))
    assert [s["label"] for s in m["sessions"]] == ["Lecture 1", "Exam 1"]
    assert "[audio.mp3](audio.mp3)" in (l1 / "README.md").read_text(encoding="utf-8")
    nb = list((tmp_path / "notebooklm").glob("*.md"))
    assert len(nb) == 1 and "Five First Lessons" in nb[0].read_text(encoding="utf-8")


# ── 連線實測（需設定 OYC_LIVE=1）──

@pytest.mark.skipif(not os.environ.get("OYC_LIVE"), reason="設定 OYC_LIVE=1 才連線實測")
def test_live_end_to_end(tmp_path):
    rc = oa.main(["--out", str(tmp_path), "--sessions", "1,exam-1", "--skip-audio", "--delay", "0.5"])
    assert rc == 0
    l1 = tmp_path / "Lecture-01_Introduction_Five_First_Lessons"
    assert (l1 / "transcript.md").stat().st_size > 50_000
    for name in ["Summary_Lecture_1.pdf", "Blackboard_Notes_Lecture_1.pdf"]:
        assert (l1 / name).read_bytes()[:5] == b"%PDF-"
    ex = tmp_path / "Exam-1_Midterm_Exam"
    assert (ex / "Solutions_to_Midterm_Exam.pdf").read_bytes()[:5] == b"%PDF-"
    assert (tmp_path / "course.json").exists()
