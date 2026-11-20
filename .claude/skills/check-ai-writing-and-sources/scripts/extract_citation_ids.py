#!/usr/bin/env python3
"""Extract DOI, ISBN, and URL candidates without claiming verification."""

from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
import zipfile
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree


DOI_RE = re.compile(r"(?i)(?:https?://(?:dx\.)?doi\.org/)?(10\.\d{4,9}/[-._;()/:A-Z0-9]+)")
URL_RE = re.compile(r"https?://[^\s<>\[\]{}\"']+", re.IGNORECASE)
ISBN_RE = re.compile(r"(?i)\bISBN(?:-1[03])?\s*:?[\s]*([0-9X][0-9X\s-]{8,24}[0-9X])")
TRAILING = ".,;:!?，。；：！？、)]}〉》」』”’"


def read_text(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix in {".txt", ".md", ".markdown"}:
        return path.read_text(encoding="utf-8-sig")
    if suffix == ".docx":
        return read_docx(path)
    raise ValueError("Supported input types: .txt, .md, .markdown, .docx")


def read_docx(path: Path) -> str:
    parts: list[str] = []
    with zipfile.ZipFile(path) as archive:
        names = [
            name
            for name in archive.namelist()
            if name == "word/document.xml"
            or re.fullmatch(r"word/(?:header|footer)\d+\.xml", name)
            or name in {"word/footnotes.xml", "word/endnotes.xml", "word/comments.xml"}
        ]
        for name in names:
            root = ElementTree.fromstring(archive.read(name))
            parts.append(" ".join(text for text in root.itertext() if text))
    return "\n".join(parts)


def normalize_doi(value: str) -> str:
    return value.rstrip(TRAILING).lower()


def normalize_url(value: str) -> str:
    return value.rstrip(TRAILING)


def isbn_checksum_ok(value: str) -> bool:
    if len(value) == 10:
        if not re.fullmatch(r"\d{9}[\dX]", value):
            return False
        total = sum((10 - index) * (10 if char == "X" else int(char)) for index, char in enumerate(value))
        return total % 11 == 0
    if len(value) == 13:
        if not value.isdigit():
            return False
        total = sum(int(char) * (1 if index % 2 == 0 else 3) for index, char in enumerate(value[:12]))
        check = (10 - total % 10) % 10
        return check == int(value[-1])
    return False


def extract(text: str) -> dict[str, Counter[str]]:
    dois = Counter(normalize_doi(match.group(1)) for match in DOI_RE.finditer(text))
    urls = Counter(normalize_url(match.group(0)) for match in URL_RE.finditer(text))
    isbns: Counter[str] = Counter()
    for match in ISBN_RE.finditer(text):
        candidate = re.sub(r"[^0-9X]", "", match.group(1).upper())
        if isbn_checksum_ok(candidate):
            isbns[candidate] += 1
    return {"doi": dois, "isbn": isbns, "url": urls}


def rows(items: dict[str, Counter[str]]) -> list[dict[str, object]]:
    return [
        {"type": kind, "value": value, "count": count}
        for kind in ("doi", "isbn", "url")
        for value, count in sorted(items[kind].items())
    ]


def render_json(path: Path, items: dict[str, Counter[str]]) -> str:
    payload = {
        "input": path.name,
        "notice": "Candidates only; no existence, metadata, or claim-support verification was performed.",
        "counts": {kind: len(values) for kind, values in items.items()},
        "items": rows(items),
    }
    return json.dumps(payload, ensure_ascii=False, indent=2)


def render_csv(items: dict[str, Counter[str]]) -> str:
    stream = io.StringIO()
    writer = csv.DictWriter(stream, fieldnames=["type", "value", "count"], lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows(items))
    return stream.getvalue()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="UTF-8 text, Markdown, or DOCX file")
    parser.add_argument("--format", choices=("json", "csv"), default="json")
    args = parser.parse_args()

    try:
        text = read_text(args.input)
        items = extract(text)
    except (OSError, UnicodeError, ValueError, zipfile.BadZipFile, ElementTree.ParseError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    output = render_json(args.input, items) if args.format == "json" else render_csv(items)
    print(output, end="" if output.endswith("\n") else "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
