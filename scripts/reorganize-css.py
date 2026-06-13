#!/usr/bin/env python3
"""Reorganize css/ and update all references."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSS = ROOT / "css"

# git mv (src relative to css/, dest relative to css/)
MOVES = [
    ("bootstrap.css", "vendor/bootstrap.css"),
    ("style.css", "styles/style.css"),
    ("home.css", "styles/home.css"),
    ("site-fonts.css", "styles/site-fonts.css"),
    ("intro-nav.css", "styles/intro-nav.css"),
    ("header-post.css", "styles/header-post.css"),
    ("archive.css", "styles/archive.css"),
    ("dialog.css", "styles/dialog.css"),
    ("vdonate.css", "unused/vdonate.css"),
    ("images/avatar.jpg", "images/site/favicon.jpg"),
    ("images/rocket.png", "images/site/back-to-top.png"),
    ("images/1-.jpg", "images/archive/legacy-bg-alt.jpg"),
    ("images/1.jpg", "images/archive/legacy-bg-full.jpg"),
    ("images/11.jpg", "images/archive/legacy-bg-11.jpg"),
    ("images/111.jpg", "images/archive/legacy-bg-111.jpg"),
    ("images/55.jpg", "images/archive/legacy-bg-55.jpg"),
    ("images/BG.jpg", "images/archive/legacy-bg-uppercase.jpg"),
    ("images/bg.jpg", "images/archive/legacy-bg.jpg"),
    ("images/bgpic1.jpg", "images/archive/legacy-bg-pic1.jpg"),
    ("images/avatar1.jpg", "images/archive/legacy-avatar-small.jpg"),
    ("images/avatar2.jpg", "images/archive/legacy-avatar-large.jpg"),
    ("images/bubble.jpg", "images/archive/legacy-bubble.jpg"),
    ("images/enamel.jpg", "images/archive/legacy-enamel.jpg"),
    ("images/home-bg.jpg", "images/archive/legacy-home-bg.jpg"),
    ("images/homelogo.jpg", "images/archive/legacy-homelogo.jpg"),
    ("images/img.jpg", "images/archive/legacy-img.jpg"),
    ("images/img1.jpeg", "images/archive/legacy-img1.jpeg"),
    ("images/pose.jpg", "images/archive/legacy-pose.jpg"),
    ("images/pose1.jpg", "images/archive/legacy-pose1.jpg"),
    ("images/sample.jpg", "images/archive/legacy-sample.jpg"),
    ("images/v.jpg", "images/archive/legacy-thumb-v.jpg"),
    ("images/view.jpg", "images/archive/legacy-view.jpg"),
]

HTML_STYLE_MAP = {
    "/css/style.css": "/css/styles/style.css",
    "/css/home.css": "/css/styles/home.css",
    "/css/site-fonts.css": "/css/styles/site-fonts.css",
    "/css/intro-nav.css": "/css/styles/intro-nav.css",
    "/css/header-post.css": "/css/styles/header-post.css",
    "/css/archive.css": "/css/styles/archive.css",
    "/css/dialog.css": "/css/styles/dialog.css",
    "/css/bootstrap.css": "/css/vendor/bootstrap.css",
    "/css/images/avatar.jpg": "/css/images/site/favicon.jpg",
}

CSS_PATCHES = {
    "css/vendor/bootstrap.css": [
        ("url('fonts/", "url('../fonts/"),
    ],
    "css/styles/style.css": [
        ('url("images/rocket.png")', 'url("../images/site/back-to-top.png")'),
        ("url('../assets/fonts/", "url('../../assets/fonts/"),
    ],
}

SCAN_EXT = {".html", ".css", ".js", ".md", ".json"}


def git_mv(src: Path, dest: Path) -> None:
    if not src.exists():
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        return
    subprocess.run(["git", "mv", str(src), str(dest)], check=True, cwd=ROOT)


def apply_moves() -> None:
    for src_rel, dest_rel in MOVES:
        git_mv(CSS / src_rel, CSS / dest_rel)


def patch_css_files() -> None:
    for rel, replacements in CSS_PATCHES.items():
        path = ROOT / rel
        if not path.exists():
            continue
        text = path.read_text()
        for old, new in replacements:
            text = text.replace(old, new)
        path.write_text(text)


def update_html_and_text() -> None:
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix not in SCAN_EXT:
            continue
        if ".git" in path.parts:
            continue
        text = path.read_text(errors="ignore")
        original = text
        for old, new in HTML_STYLE_MAP.items():
            text = text.replace(old, new)
        if text != original:
            path.write_text(text)


def main() -> None:
    apply_moves()
    patch_css_files()
    update_html_and_text()
    print("css/ reorganized and references updated.")


if __name__ == "__main__":
    main()
