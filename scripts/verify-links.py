#!/usr/bin/env python3
"""Verify all /file/, /assets/, /data/, and /css/ href/src targets exist on disk."""

from __future__ import annotations

import re
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
SCAN_EXT = {".html", ".css", ".js", ".json", ".xml", ".md"}
REF_PATTERN = re.compile(
    r'''(?:href|src)\s*=\s*["']((?:/(?:file|assets|data|css)/[^"'#?]+))''',
    re.IGNORECASE,
)


def main() -> int:
    missing: list[tuple[str, str]] = []
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file() or path.suffix not in SCAN_EXT:
            continue
        if ".git" in path.parts:
            continue
        rel_file = str(path.relative_to(ROOT))
        text = path.read_text(errors="ignore")
        for match in REF_PATTERN.finditer(text):
            url = unquote(match.group(1).split("#")[0].split("?")[0])
            target = ROOT / url.lstrip("/")
            if not target.exists():
                missing.append((rel_file, url))

    if missing:
        print(f"FAILED: {len(missing)} broken link(s)")
        for src, url in missing:
            print(f"  {src}: {url}")
        return 1

    print("OK: all /file/, /assets/, /data/, and /css/ links resolve.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
