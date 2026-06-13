#!/usr/bin/env python3
"""Apply path-map.json: git mv files and update HTML/CSS/JS references."""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCAN_EXT = {".html", ".css", ".js", ".json", ".xml", ".md"}


def load_map() -> dict[str, str]:
    data = json.loads((ROOT / "scripts" / "path-map.json").read_text())
    return data["path_map"]


def apply_moves(mapping: dict[str, str]) -> None:
    # Longest paths first to avoid nested conflicts.
    for old_url in sorted(mapping, key=len, reverse=True):
        new_url = mapping[old_url]
        old_path = ROOT / old_url.lstrip("/")
        new_path = ROOT / new_url.lstrip("/")
        if not old_path.exists():
            continue
        if new_path.exists():
            continue
        new_path.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run(["git", "mv", str(old_path), str(new_path)], check=True, cwd=ROOT)


def apply_replacements(mapping: dict[str, str]) -> None:
    # Longest old URLs first.
    items = sorted(mapping.items(), key=lambda kv: len(kv[0]), reverse=True)
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix not in SCAN_EXT:
            continue
        if ".git" in path.parts:
            continue
        text = path.read_text(errors="ignore")
        original = text
        for old_url, new_url in items:
            text = text.replace(old_url, new_url)
            encoded = old_url.replace("\u200e", "%E2%80%8E")
            if encoded != old_url:
                text = text.replace(encoded, new_url)
        if text != original:
            path.write_text(text)


def main() -> None:
    mapping = load_map()
    apply_moves(mapping)
    apply_replacements(mapping)
    print(f"Applied {len(mapping)} path mappings.")


if __name__ == "__main__":
    main()
