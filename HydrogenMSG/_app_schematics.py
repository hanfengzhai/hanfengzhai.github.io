"""Compact problem schematics for the Streamlit / stlite MSG–hydrogen app.

Each drawer takes a morph parameter ``t`` in ``[0, 1]``:
``t=0`` is the unloaded / before state, ``t=1`` is the loaded / after state.
"""

from __future__ import annotations

from io import BytesIO

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.patches import (
    Circle,
    Ellipse,
    FancyArrowPatch,
    Rectangle,
    Wedge,
)

MECH = "#0072B2"
HYDR = "#D55E00"
CARDINAL = "#8C1515"
FILL = "0.90"
FILL2 = "0.80"
EDGE = "0.25"
FS = 9


def _arrow(ax, p0, p1, color=EDGE, lw=0.9, scale=7, zorder=5):
    ax.annotate(
        "",
        xy=p1,
        xytext=p0,
        arrowprops=dict(
            arrowstyle="-|>",
            color=color,
            lw=lw,
            mutation_scale=scale,
            shrinkA=0,
            shrinkB=0,
        ),
        zorder=zorder,
    )


def _arc_arrow(ax, center, rx, ry, th0, th1, color=MECH, lw=1.0, scale=6):
    th = np.linspace(np.deg2rad(th0), np.deg2rad(th1), 50)
    x = center[0] + rx * np.cos(th)
    y = center[1] + ry * np.sin(th)
    ax.plot(x[:-1], y[:-1], color=color, lw=lw, solid_capstyle="round", zorder=5)
    _arrow(ax, (x[-2], y[-2]), (x[-1], y[-1]), color=color, lw=lw, scale=scale)
    return x[-1], y[-1]


def _dim(ax, p0, p1, color=EDGE, lw=0.7):
    ax.annotate(
        "",
        xy=p1,
        xytext=p0,
        arrowprops=dict(
            arrowstyle="<->",
            color=color,
            lw=lw,
            mutation_scale=5,
            shrinkA=0,
            shrinkB=0,
        ),
    )


def _finish(ax):
    ax.set_aspect("equal", adjustable="box")
    ax.axis("off")


def _title(ax, t):
    label = "Before" if t < 0.5 else "After"
    ax.set_title(label, fontsize=FS, pad=4, color=CARDINAL if t >= 0.5 else "0.35")


def _clamp01(t):
    return float(np.clip(t, 0.0, 1.0))


def draw_torsion(ax, t=1.0):
    """Wire under equal-and-opposite end torques. ``t=0`` undeformed, ``t=1`` twisted."""
    t = _clamp01(t)
    cx, cy, r = 0.0, 0.05, 0.92
    a = 0.50 * r
    y_bot, y_top = cy - 0.92 * r, cy + 0.92 * r
    ry = 0.26 * r
    ax.add_patch(Ellipse((cx, y_bot), 2 * a, 2 * ry, facecolor=FILL, edgecolor=EDGE, lw=0.8, zorder=1))
    ax.add_patch(Rectangle((cx - a, y_bot), 2 * a, y_top - y_bot, facecolor=FILL, edgecolor="none", zorder=2))
    ax.plot([cx - a, cx - a], [y_bot, y_top], color=EDGE, lw=0.8, zorder=3)
    ax.plot([cx + a, cx + a], [y_bot, y_top], color=EDGE, lw=0.8, zorder=3)
    ax.add_patch(Ellipse((cx, y_top), 2 * a, 2 * ry, facecolor="0.96", edgecolor=EDGE, lw=0.8, zorder=4))

    # Helical surface marks grow with twist.
    if t > 0.05:
        n_marks = 5
        for i in range(n_marks):
            frac = (i + 0.5) / n_marks
            y0 = y_bot + frac * (y_top - y_bot)
            amp = 0.55 * a * t
            xs = np.linspace(cx - a * 0.92, cx + a * 0.92, 24)
            phase = 2.2 * np.pi * frac * t
            ys = y0 + 0.04 * r * np.sin(np.pi * (xs - cx) / a + phase)
            ax.plot(xs, ys, color=MECH, lw=0.55, alpha=0.25 + 0.55 * t, zorder=3.5)

    # Near-surface GND shade after load.
    if t > 0.15:
        gnd_w = 0.12 * a * t
        ax.add_patch(
            Rectangle(
                (cx + a - gnd_w, y_bot),
                gnd_w,
                y_top - y_bot,
                facecolor=FILL2,
                edgecolor="none",
                alpha=0.55 * t,
                zorder=2.5,
            )
        )
        ax.add_patch(
            Rectangle(
                (cx - a, y_bot),
                gnd_w,
                y_top - y_bot,
                facecolor=FILL2,
                edgecolor="none",
                alpha=0.55 * t,
                zorder=2.5,
            )
        )

    if t > 0.2:
        _arc_arrow(ax, (cx, y_top + 0.04 * r), 0.82 * a, 1.05 * ry, 200, 340)
        _arc_arrow(ax, (cx, y_bot - 0.04 * r), 0.82 * a, 1.05 * ry, 20, 160)
        ax.text(cx + 1.25 * a, y_top + 0.18 * r, r"$T$", color=MECH, fontsize=FS, ha="left", va="center")
        ax.text(cx + 1.25 * a, y_bot - 0.18 * r, r"$-T$", color=MECH, fontsize=FS, ha="left", va="center")
    _dim(ax, (cx, y_bot - 0.02), (cx + a, y_bot - 0.02))
    ax.text(cx + 0.5 * a, y_bot - 0.48 * r, r"$a$", fontsize=FS, ha="center", va="top", color=MECH)
    ax.set_xlim(-1.55, 1.85)
    ax.set_ylim(-1.75, 1.65)
    _finish(ax)
    _title(ax, t)


def draw_bending(ax, t=1.0):
    """Plane-strain beam. ``t=0`` straight, ``t=1`` bent with end moments."""
    t = _clamp01(t)
    cx, cy, w, h = 0.0, 0.15, 2.2, 0.65
    xs = np.linspace(cx - w / 2, cx + w / 2, 60)
    sag = 0.55 * ((xs - cx) / (w / 2)) ** 2 * (h / 2) * t
    mid = cy - sag
    ax.fill_between(xs, mid - h / 2, mid + h / 2, facecolor=FILL, edgecolor=EDGE, lw=0.9)
    ax.plot(xs, mid, ls=(0, (3, 2)), color="0.45", lw=0.6)

    # Neutral-fiber GND bands after bending.
    if t > 0.2:
        ax.fill_between(
            xs,
            mid + 0.15 * h,
            mid + h / 2,
            facecolor=FILL2,
            edgecolor="none",
            alpha=0.45 * t,
            zorder=2,
        )
        ax.fill_between(
            xs,
            mid - h / 2,
            mid - 0.15 * h,
            facecolor=FILL2,
            edgecolor="none",
            alpha=0.45 * t,
            zorder=2,
        )

    half = 0.42 * h
    gap = 0.10
    r = 0.85 * half
    th = np.linspace(-0.92 * np.pi / 2, 0.92 * np.pi / 2, 50)
    if t > 0.2:
        xL, yL = xs[0], mid[0]
        cxL = xL - gap
        xLarc = cxL - r * np.cos(th)
        yLarc = yL + r * np.sin(th)
        ax.plot(xLarc[:-1], yLarc[:-1], color=MECH, lw=1.0, zorder=5)
        _arrow(ax, (xLarc[-2], yLarc[-2]), (xLarc[-1], yLarc[-1]), color=MECH, scale=7)
        xR, yR = xs[-1], mid[-1]
        thR = th[::-1]
        cxR = xR + gap
        xRarc = cxR + r * np.cos(thR)
        yRarc = yR + r * np.sin(thR)
        ax.plot(xRarc[:-1], yRarc[:-1], color=MECH, lw=1.0, zorder=5)
        _arrow(ax, (xRarc[-2], yRarc[-2]), (xRarc[-1], yRarc[-1]), color=MECH, scale=7)
        ax.text(float(np.min(xLarc)) - 0.08, yL, r"$+M$", color=MECH, fontsize=FS, ha="right", va="center")
        ax.text(float(np.max(xRarc)) + 0.08, yR, r"$-M$", color=MECH, fontsize=FS, ha="left", va="center")
        ax.text(cx, cy - 1.55 * h - 0.15 * t, r"$\kappa$", ha="center", va="top", fontsize=FS, color=MECH)

    xm = cx
    ym = float(np.interp(xm, xs, mid))
    y0 = ym - h / 2
    ax.plot([xm, xm], [y0 - 0.02, y0 - 0.18], color=EDGE, lw=0.6)
    ax.plot([xm - 0.04, xm + 0.04], [y0 - 0.18, y0 - 0.18], color=EDGE, lw=0.6)
    ax.text(xm + 0.08, y0 - 0.18, r"$h$", fontsize=FS, ha="left", va="center", color=MECH)
    ax.set_xlim(-2.05, 2.05)
    ax.set_ylim(-1.35, 1.25)
    _finish(ax)
    _title(ax, t)


def draw_void(ax, *, help_note=False, t=1.0):
    """Hydrostatic spherical void. ``t=0`` unloaded, ``t=1`` expanded + GND shell."""
    t = _clamp01(t)
    cx, cy = 0.0, 0.08
    R0_0, R0_1 = 0.32, 0.48
    R0 = R0_0 + (R0_1 - R0_0) * t
    Rg = R0 + (0.18 + 0.22 * t)
    Rout = 1.05
    ax.add_patch(Circle((cx, cy), Rout, facecolor="0.965", edgecolor=EDGE, lw=0.8))
    if t > 0.05:
        ax.add_patch(
            Wedge(
                (cx, cy),
                Rg,
                0,
                360,
                width=max(Rg - R0, 1e-3),
                facecolor=FILL2,
                edgecolor="none",
                alpha=0.35 + 0.55 * t,
            )
        )
    ax.add_patch(Circle((cx, cy), R0, facecolor="white", edgecolor=EDGE, lw=1.0))

    ax.text(cx, cy + 0.22 * R0, "Free", ha="center", va="center", fontsize=FS - 1, color="0.45")
    if t > 0.25:
        ax.text(
            cx,
            cy + 0.55 * (R0 + Rg),
            "GND",
            ha="center",
            va="center",
            fontsize=FS - 1,
            color="0.3",
            alpha=min(1.0, 1.5 * (t - 0.25)),
        )
    y_dim = cy - 0.48 * R0
    ax.plot([cx, cx + R0], [y_dim, y_dim], color=EDGE, lw=0.7)
    ax.plot([cx, cx], [y_dim - 0.04 * R0, y_dim + 0.04 * R0], color=EDGE, lw=0.7)
    ax.plot([cx + R0, cx + R0], [y_dim - 0.04 * R0, y_dim + 0.04 * R0], color=EDGE, lw=0.7)
    ax.text(cx + 0.5 * R0, y_dim - 0.22 * R0, r"$R_0$", fontsize=FS, ha="center", va="top", color=MECH)

    if t > 0.15:
        alpha_arr = min(1.0, 1.4 * (t - 0.15))
        for ang in (22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5):
            if 240 <= ang <= 300:
                continue
            th = np.deg2rad(ang)
            _arrow(
                ax,
                (cx + 1.02 * Rout * np.cos(th), cy + 1.02 * Rout * np.sin(th)),
                (cx + 1.16 * Rout * np.cos(th), cy + 1.16 * Rout * np.sin(th)),
                color=MECH,
                lw=0.8,
                scale=5,
            )
        if not help_note:
            ax.text(
                cx,
                cy - 1.38 * Rout,
                r"$\sigma^{\infty}$",
                ha="center",
                va="top",
                fontsize=FS,
                color=MECH,
                alpha=alpha_arr,
            )

    if help_note and t > 0.35:
        ax.text(
            cx,
            cy - 1.42 * Rout,
            r"HELP: $(1-\xi\,\theta_{\mathrm{T}})$",
            ha="center",
            va="top",
            fontsize=FS - 1,
            color=HYDR,
            alpha=min(1.0, 2.0 * (t - 0.35)),
        )
        half = 1.75
    else:
        half = 1.70
    ax.set_xlim(cx - half, cx + half)
    ax.set_ylim(cy - half, cy + half)
    _finish(ax)
    _title(ax, t)


def draw_fem_void(ax, t=1.0):
    """Axisymmetric meridian of a void under non-hydrostatic remote tension.

    Matches the SI FEM: $\\sigma_{zz}^{\\infty}/\\sigma_{\\mathrm{Y}}=3.6$,
    $\\sigma_{rr}^{\\infty}/\\sigma_{\\mathrm{Y}}=2.2$ (axial > radial), so the
    loaded cavity elongates along $z$.
    """
    t = _clamp01(t)
    cx, cy = 0.0, 0.0
    Rout = 1.05
    # Undeformed spherical void; after load: prolate ellipse (S_z > S_r).
    R0 = 0.36
    stretch_z = 1.0 + 0.38 * t
    stretch_r = 1.0 + 0.12 * t
    a_r = R0 * stretch_r
    a_z = R0 * stretch_z
    gnd = 0.16 + 0.10 * t

    ax.add_patch(Circle((cx, cy), Rout, facecolor="0.965", edgecolor=EDGE, lw=0.8, zorder=1))

    # Near-wall GND shell (elliptical after load).
    if t > 0.08:
        ax.add_patch(
            Ellipse(
                (cx, cy),
                2 * (a_r + gnd),
                2 * (a_z + gnd),
                facecolor=FILL2,
                edgecolor="none",
                alpha=0.40 + 0.35 * t,
                zorder=2,
            )
        )
    ax.add_patch(
        Ellipse(
            (cx, cy),
            2 * a_r,
            2 * a_z,
            facecolor="white",
            edgecolor=EDGE,
            lw=1.05,
            zorder=3,
        )
    )

    ax.text(cx, cy + 0.18 * a_z, "Free", ha="center", va="center", fontsize=FS - 1, color="0.45", zorder=4)
    if t > 0.25:
        ax.text(
            cx + 0.55 * (a_r + gnd),
            cy + 0.55 * (a_z + gnd),
            "GND",
            ha="center",
            va="center",
            fontsize=FS - 1,
            color="0.3",
            alpha=min(1.0, 1.6 * (t - 0.25)),
            zorder=4,
        )

    # R0 on the undeformed equator (reference radius).
    y_dim = cy - 0.12
    ax.plot([cx, cx + R0], [y_dim, y_dim], color=EDGE, lw=0.7, zorder=4)
    ax.plot([cx, cx], [y_dim - 0.03, y_dim + 0.03], color=EDGE, lw=0.7, zorder=4)
    ax.plot([cx + R0, cx + R0], [y_dim - 0.03, y_dim + 0.03], color=EDGE, lw=0.7, zorder=4)
    ax.text(cx + 0.5 * R0, y_dim - 0.10, r"$R_0$", fontsize=FS, ha="center", va="top", color=MECH, zorder=4)

    # Axis of revolution (axisymmetric FEM).
    ax.plot([cx, cx], [cy - 1.22 * Rout, cy + 1.22 * Rout], ls=(0, (2.5, 2.0)), color="0.55", lw=0.7, zorder=0)
    ax.text(cx + 0.06, cy + 1.28 * Rout, r"$z$", fontsize=FS - 1, ha="left", va="bottom", color="0.4")
    ax.text(cx + 1.22 * Rout, cy - 0.06, r"$\rho$", fontsize=FS - 1, ha="left", va="top", color="0.4")

    if t > 0.12:
        # Remote traction on the outer perimeter: t = (S_r n_ρ, S_z n_z),
        # matching fem_msg._outer_traction (S_z=3.6, S_r=2.2). Arrows follow
        # the circular boundary (not Cartesian left/right stubs).
        S_r, S_z = 2.2, 3.6
        arrow_len = 0.16 * Rout
        # Skip a gap at the bottom so the inequality caption stays clear.
        for deg in np.arange(-150.0, 151.0, 30.0):
            ang = np.deg2rad(deg)
            n_r, n_z = np.cos(ang), np.sin(ang)
            tx, ty = S_r * n_r, S_z * n_z
            tn = np.hypot(tx, ty)
            ux, uy = tx / tn, ty / tn
            x0 = cx + 1.02 * Rout * n_r
            y0 = cy + 1.02 * Rout * n_z
            _arrow(
                ax,
                (x0, y0),
                (x0 + arrow_len * ux, y0 + arrow_len * uy),
                color=MECH,
                lw=0.85,
                scale=4.8,
            )
        # Labels sit on the perimeter belts they refer to.
        ax.text(
            cx + 0.42 * Rout,
            cy + 1.28 * Rout,
            r"$\sigma_{zz}^{\infty}$",
            ha="left",
            va="bottom",
            fontsize=FS - 1,
            color=MECH,
        )
        ax.text(
            cx + 1.28 * Rout,
            cy + 0.08 * Rout,
            r"$\sigma_{rr}^{\infty}$",
            ha="left",
            va="center",
            fontsize=FS - 1,
            color=MECH,
        )
        ax.text(
            cx,
            cy - 1.38 * Rout,
            r"$\sigma_{zz}^{\infty}>\sigma_{rr}^{\infty}$",
            ha="center",
            va="top",
            fontsize=FS - 2,
            color="0.35",
        )

    half = 1.70
    ax.set_xlim(cx - half, cx + half)
    ax.set_ylim(cy - half, cy + half)
    _finish(ax)
    _title(ax, t)


def draw_cavitation(ax, t=1.0):
    """Growing void with HELP softening annotation."""
    draw_void(ax, help_note=True, t=t)


def draw_slit(ax, t=1.0):
    """Mode-I centre-crack. ``t=0`` closed notch, ``t=1`` opened faces."""
    t = _clamp01(t)
    ax.add_patch(Rectangle((-1, -1), 2, 2, fill=False, ec="0.15", lw=1.2, zorder=3))

    open_amp = 0.18 * t
    # Upper and lower faces diverge with opening.
    xs = np.linspace(-1.0, 0.0, 40)
    tip_blend = np.clip((-xs) / 0.35, 0.0, 1.0)  # open more away from tip
    yu = open_amp * tip_blend
    yl = -open_amp * tip_blend
    ax.plot(xs, yu, color="0.15", lw=2.0, solid_capstyle="butt", zorder=4)
    ax.plot(xs, yl, color="0.15", lw=2.0, solid_capstyle="butt", zorder=4)
    if t > 0.05:
        ax.fill_between(xs, yl, yu, color="white", zorder=3.5, alpha=1.0)
    ax.plot([0.0], [0.0], "o", color="0.15", ms=3.5, zorder=5)
    ax.text(-0.5, 0.18 + 0.6 * open_amp, "Notch", fontsize=FS - 1, color="0.25", ha="center")

    ax.plot([-1.0, 0.0], [-1.14, -1.14], color="0.3", lw=0.7)
    ax.plot([0.0, 1.0], [-1.14, -1.14], color="0.3", lw=0.7)
    ax.text(-0.5, -1.28, r"$a$", ha="center", va="top", fontsize=FS)
    ax.text(0.5, -1.28, r"$a$", ha="center", va="top", fontsize=FS)

    if t > 0.15:
        for x in np.linspace(-0.8, 0.8, 6):
            ax.add_patch(
                FancyArrowPatch(
                    (x, 1.02),
                    (x, 1.16),
                    arrowstyle="-|>",
                    mutation_scale=8,
                    lw=0.8,
                    color="0.15",
                    shrinkA=0,
                    shrinkB=0,
                )
            )
        ax.text(0.0, 1.28, r"$\sigma^{\infty}$", ha="center", va="bottom", fontsize=FS)

    # Softening / H band near tip after load.
    if t > 0.35:
        ax.add_patch(
            Circle(
                (0.12, 0.0),
                0.22 * t,
                facecolor=HYDR,
                edgecolor="none",
                alpha=0.18 * t,
                zorder=2,
            )
        )

    for x in np.linspace(-0.7, 0.7, 5):
        ax.add_patch(Circle((x, -1.08), 0.035, facecolor="w", edgecolor="0.15", lw=0.6, zorder=4))
    ax.set_xlim(-1.45, 1.45)
    ax.set_ylim(-1.55, 1.55)
    _finish(ax)
    _title(ax, t)


def _drawer(kind: str):
    drawers = {
        "torsion": draw_torsion,
        "bending": draw_bending,
        "void": draw_void,
        "cavitation": draw_cavitation,
        "fem_void": draw_fem_void,
        "slit": draw_slit,
    }
    return drawers[kind]


def schematic_figure(kind: str, figsize=(2.6, 2.6), t=1.0):
    """Return a standalone schematic figure for the given case name."""
    fig, ax = plt.subplots(figsize=figsize)
    _drawer(kind)(ax, t=t)
    fig.tight_layout(pad=0.25)
    return fig


def _frame_rgb(kind: str, t: float, *, figsize, dpi):
    """Render one opaque RGB frame (avoids GIF transparency / white-flash bugs)."""
    from PIL import Image

    fig, ax = plt.subplots(figsize=figsize)
    fig.patch.set_facecolor("#ffffff")
    ax.set_facecolor("#ffffff")
    _drawer(kind)(ax, t=float(t))
    fig.tight_layout(pad=0.25)
    buf = BytesIO()
    fig.savefig(buf, format="png", dpi=dpi, facecolor="#ffffff", edgecolor="none")
    plt.close(fig)
    buf.seek(0)
    return Image.open(buf).convert("RGB")


def schematic_gif_bytes(
    kind: str,
    *,
    figsize=(3.15, 3.15),
    dpi=110,
    hold_ms=1400,
):
    """Looping two-frame GIF: Before → After → Before … (opaque RGB, no morph)."""
    try:
        from PIL import Image
    except ImportError as exc:  # pragma: no cover
        raise ImportError("Pillow is required for schematic animations") from exc

    before = _frame_rgb(kind, 0.0, figsize=figsize, dpi=dpi)
    after = _frame_rgb(kind, 1.0, figsize=figsize, dpi=dpi)
    # Shared palette keeps file size small without introducing transparency.
    before_p = before.quantize(colors=128, method=Image.MEDIANCUT)
    after_p = after.quantize(colors=128, method=Image.MEDIANCUT, palette=before_p)

    out = BytesIO()
    before_p.save(
        out,
        format="GIF",
        save_all=True,
        append_images=[after_p],
        duration=[hold_ms, hold_ms],
        loop=0,
        disposal=1,  # leave frame in place; never clear to white
        optimize=False,
    )
    out.seek(0)
    return out.getvalue()
