"""Minimal matplotlib style for the browser MSG–hydrogen app."""

from __future__ import annotations

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

FONT_SIZE = 15
COLORS = ["#000000", "blue", "tab:red", "tab:green", "#CC79A7"]
COLORS_THREE = ["blue", "tab:red", "tab:green"]
LINESTYLES_THREE = ["-", "--", "-."]
LINE_LW = 1.9

_RC = {
    "font.family": "serif",
    "font.serif": ["DejaVu Serif", "cmr10"],
    "mathtext.fontset": "cm",
    "mathtext.default": "it",
    "axes.formatter.use_mathtext": True,
    "font.size": FONT_SIZE,
    "axes.titlesize": FONT_SIZE,
    "axes.labelsize": FONT_SIZE,
    "xtick.labelsize": FONT_SIZE,
    "ytick.labelsize": FONT_SIZE,
    "legend.fontsize": FONT_SIZE,
    "figure.titlesize": FONT_SIZE,
    "axes.unicode_minus": False,
    "axes.linewidth": 0.8,
    "lines.linewidth": LINE_LW,
    "figure.dpi": 120,
    "legend.frameon": True,
    "legend.fancybox": False,
    "legend.framealpha": 0.95,
    "legend.edgecolor": "0.7",
}


def apply_style(**extra):
    cfg = dict(_RC)
    cfg.update(extra)
    plt.rcParams.update(cfg)
