#!/usr/bin/env python3
"""Reorganize data/ and update notebook references."""

from __future__ import annotations

import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data"

MOVES = [
    ("MSE5720", "coursework/mse5720"),
    ("MAE6260", "coursework/mae6260"),
    ("DARPA", "projects/darpa"),
    ("A2_Q4_SuppMat.mov", "projects/thermag/A2_Q4_SuppMat.mov"),
    ("GeometryEvolution_TherMaG.mp4", "projects/thermag/GeometryEvolution_TherMaG.mp4"),
    ("gradoptimTherMaG.mp4", "projects/thermag/gradoptimTherMaG.mp4"),
    ("ARXDE.mlx", "projects/arxde/ARXDE.mlx"),
    ("ARXDE_SupportingVideo.mov", "projects/arxde/ARXDE_SupportingVideo.mov"),
    ("MDO_A2_Q1.mlx", "coursework/mdo/MDO_A2_Q1.mlx"),
    ("MDO_A2_Q2.mlx", "coursework/mdo/MDO_A2_Q2.mlx"),
    ("MDO_A3_Q3.mlx", "coursework/mdo/MDO_A3_Q3.mlx"),
    ("BAs.out", "coursework/mse5720/BAs.out"),
    ("airfoil_data.data", "archive/airfoil_data.data"),
    ("airfoil_data.xlsx", "archive/airfoil_data.xlsx"),
    ("cereal.csv", "archive/cereal.csv"),
    ("github_response.png", "archive/github_response.png"),
    ("response_github_2.png", "archive/response_github_2.png"),
    ("Latitude.txt", "archive/Latitude.txt"),
    ("Longitude.txt", "archive/Longitude.txt"),
    ("in.mdpd", "archive/in.mdpd"),
]

REPLACEMENTS = [
    ("https://hanfengzhai.net/data/MSE5720/", "/data/coursework/mse5720/"),
    ("https://hanfengzhai.github.io/data/MSE5720/", "/data/coursework/mse5720/"),
    ("https://hanfengzhai.net/data/MAE6260/", "/data/coursework/mae6260/"),
    ("https://hanfengzhai.github.io/data/MAE6260/", "/data/coursework/mae6260/"),
    ("data/MAE6260/", "data/coursework/mae6260/"),
    ("data/MSE5720/", "data/coursework/mse5720/"),
]

SCAN_EXT = {".html", ".ipynb", ".md", ".json"}


def git_mv(src: Path, dest: Path) -> None:
    if not src.exists():
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        return
    subprocess.run(["git", "mv", str(src), str(dest)], check=True, cwd=ROOT)


def apply_moves() -> None:
    for src_rel, dest_rel in MOVES:
        src = DATA / src_rel if "/" not in src_rel or src_rel in {"MSE5720", "MAE6260", "DARPA"} else DATA / src_rel
        if src_rel in {"MSE5720", "MAE6260", "DARPA"}:
            src = DATA / src_rel
            dest = DATA / dest_rel
        else:
            src = DATA / Path(src_rel).name if (DATA / src_rel).exists() else DATA / src_rel
            # src_rel is like "BAs.out" at root
            src = DATA / src_rel
            dest = DATA / dest_rel
        git_mv(src, dest)


def apply_replacements() -> None:
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix not in SCAN_EXT:
            continue
        if ".git" in path.parts:
            continue
        text = path.read_text(errors="ignore")
        original = text
        for old, new in REPLACEMENTS:
            text = text.replace(old, new)
        if text != original:
            path.write_text(text)


def main() -> None:
    apply_moves()
    apply_replacements()
    print("data/ reorganized and references updated.")


if __name__ == "__main__":
    main()
