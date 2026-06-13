#!/usr/bin/env python3
"""Comprehensive static-site verification after refactors."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
SCAN_EXT = {".html", ".css", ".js", ".json", ".xml", ".md"}
MAIN_PAGES = [
    "index.html",
    "research/index.html",
    "talk.html",
    "gallery.html",
    "note.html",
    "code.html",
    "research/overview/index.html",
]
HREF_SRC = re.compile(
    r'''(?:href|src)\s*=\s*["']((?:/(?:file|assets|data|css|js|research|content\.json|atom\.xml)[^"'#?]*))''',
    re.IGNORECASE,
)
CSS_URL = re.compile(r'''url\(\s*["']?([^"')]+)["']?\s*\)''', re.IGNORECASE)
EXTERNAL_PREFIXES = ("http://", "https://", "//", "data:", "javascript:", "mailto:", "#")


def is_local(url: str) -> bool:
    return not url.startswith(EXTERNAL_PREFIXES)


def resolve_css_url(css_file: Path, url: str) -> Path | None:
    url = url.split("#")[0].split("?")[0].strip()
    if not url or not is_local(url):
        return None
    if url.startswith("/"):
        return ROOT / url.lstrip("/")
    return (css_file.parent / url).resolve()


def main() -> int:
    missing: list[str] = []
    stale: list[str] = []

    stale_patterns = [
        "/css/style.css",
        "/css/bootstrap.css",
        "/css/images/avatar.jpg",
        "/research-overview.html",
        "/data/MSE5720/",
        "/data/MAE6260/",
    ]

    for page in MAIN_PAGES:
        path = ROOT / page
        if not path.exists():
            missing.append(f"Missing main page: {page}")

    for path in sorted(ROOT.rglob("*")):
        if not path.is_file() or path.suffix not in SCAN_EXT:
            continue
        if ".git" in path.parts or "scripts" in path.parts:
            continue
        rel = str(path.relative_to(ROOT))
        text = path.read_text(errors="ignore")

        for old in stale_patterns:
            if old in text:
                stale.append(f"{rel}: stale reference {old}")

        for match in HREF_SRC.finditer(text):
            url = unquote(match.group(1))
            if not is_local(url):
                continue
            target = ROOT / url.lstrip("/")
            if not target.exists():
                missing.append(f"{rel}: {url}")

        if path.suffix == ".css":
            # Strip block comments before checking url() references.
            text_no_comments = re.sub(r"/\*.*?\*/", "", text, flags=re.DOTALL)
            for match in CSS_URL.finditer(text_no_comments):
                url = unquote(match.group(1))
                target = resolve_css_url(path, url)
                if target is None:
                    continue
                try:
                    target.relative_to(ROOT.resolve())
                except ValueError:
                    continue
                if not target.exists():
                    missing.append(f"{rel}: url({url})")

    # Required site-root files referenced by pages
    for required in ("content.json", "atom.xml", "js/jquery-3.1.1.min.js", "js/scripts.js"):
        if not (ROOT / required).exists():
            missing.append(f"Missing required asset: /{required}")

    if missing or stale:
        if stale:
            print(f"STALE: {len(stale)} old-path reference(s)")
            for item in stale:
                print(f"  {item}")
        if missing:
            print(f"MISSING: {len(missing)} broken reference(s)")
            for item in missing:
                print(f"  {item}")
        return 1

    print(f"OK: {len(MAIN_PAGES)} main pages and all linked assets resolve.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
