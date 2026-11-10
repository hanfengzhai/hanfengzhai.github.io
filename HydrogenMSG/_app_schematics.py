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
FS = 11


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


def _radius_mark(ax, cx, cy, R, label=r"$R_0$", *, color=MECH, zorder=5):
    """Radius dimension lying on the circle: centre → rim along +x."""
    ax.plot([cx, cx + R], [cy, cy], color=EDGE, lw=0.7, solid_capstyle="butt", zorder=zorder)
    ax.plot(cx, cy, "o", color=EDGE, ms=2.2, zorder=zorder + 1)
    tick = 0.045 * max(R, 0.2)
    ax.plot([cx + R, cx + R], [cy - tick, cy + tick], color=EDGE, lw=0.7, zorder=zorder)
    ax.text(
        cx + 0.55 * R,
        cy - 0.16 * max(R, 0.25),
        label,
        fontsize=FS,
        ha="center",
        va="top",
        color=color,
        zorder=zorder,
    )


def _radial_arrows(ax, cx, cy, Rout, *, length=0.14, step_deg=45.0,
                   offset=1.02, color=MECH, lw=0.8, scale=5.0, zorder=5):
    """Outward-normal arrows all the way around a circle (no gaps)."""
    for deg in np.arange(0.0, 360.0, step_deg):
        th = np.deg2rad(deg)
        n_r, n_z = np.cos(th), np.sin(th)
        x0 = cx + offset * Rout * n_r
        y0 = cy + offset * Rout * n_z
        _arrow(
            ax,
            (x0, y0),
            (x0 + length * Rout * n_r, y0 + length * Rout * n_z),
            color=color,
            lw=lw,
            scale=scale,
            zorder=zorder,
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
    # Wire radius on the bottom end-cap equator (centre → rim).
    _radius_mark(ax, cx, y_bot, a, label=r"$a$")
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

    # Keep "Free" above the true radius mark through the centre.
    ax.text(cx, cy + 0.38 * R0, "Free", ha="center", va="center", fontsize=FS - 1, color="0.45")
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
    _radius_mark(ax, cx, cy, R0)

    if t > 0.15:
        alpha_arr = min(1.0, 1.4 * (t - 0.15))
        _radial_arrows(ax, cx, cy, Rout, length=0.14, step_deg=45.0)
        if not help_note:
            ax.text(
                cx,
                cy - 1.48 * Rout,
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
            cy - 1.48 * Rout,
            r"HELP: $(1-\xi\,\theta_{\mathrm{T}})$",
            ha="center",
            va="top",
            fontsize=FS - 1,
            color=HYDR,
            alpha=min(1.0, 2.0 * (t - 0.35)),
        )
        half = 1.82
    else:
        half = 1.78
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

    ax.text(cx, cy + 0.38 * a_z, "Free", ha="center", va="center", fontsize=FS - 1, color="0.45", zorder=4)
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

    # Radius on the void equator (exact centre → current rim).
    _radius_mark(ax, cx, cy, a_r, zorder=5)

    # Axis of revolution (axisymmetric FEM).
    ax.plot([cx, cx], [cy - 1.22 * Rout, cy + 1.22 * Rout], ls=(0, (2.5, 2.0)), color="0.55", lw=0.7, zorder=0)
    ax.text(cx + 0.06, cy + 1.28 * Rout, r"$z$", fontsize=FS - 1, ha="left", va="bottom", color="0.4")
    ax.text(cx + 1.22 * Rout, cy - 0.06, r"$\rho$", fontsize=FS - 1, ha="left", va="top", color="0.4")

    if t > 0.12:
        # σ_rr^∞: equal outward normals all around the outer circle.
        # σ_zz^∞: longer outward normals on the polar arcs (still on the
        # perimeter; S_z > S_r as in the SI demo).
        S_r, S_z = 2.2, 3.6
        _radial_arrows(
            ax, cx, cy, Rout, length=0.11, step_deg=30.0, lw=0.75, scale=4.2,
        )
        # Extra polar belt for σ_zz^∞ (angles from +ρ axis).
        len_z = 0.11 * (S_z / S_r)
        for deg in (-100.0, -80.0, -60.0, 60.0, 80.0, 100.0):
            th = np.deg2rad(deg)
            n_r, n_z = np.cos(th), np.sin(th)
            x0 = cx + 1.02 * Rout * n_r
            y0 = cy + 1.02 * Rout * n_z
            _arrow(
                ax,
                (x0, y0),
                (x0 + len_z * Rout * n_r, y0 + len_z * Rout * n_z),
                color=MECH,
                lw=1.0,
                scale=5.2,
            )
        ax.text(
            cx + 0.48 * Rout,
            cy + 1.48 * Rout,
            r"$\sigma_{zz}^{\infty}$",
            ha="left",
            va="bottom",
            fontsize=FS - 1,
            color=MECH,
        )
        ax.text(
            cx + 1.32 * Rout,
            cy + 0.05 * Rout,
            r"$\sigma_{rr}^{\infty}$",
            ha="left",
            va="center",
            fontsize=FS - 1,
            color=MECH,
        )
        ax.text(
            cx,
            cy - 1.52 * Rout,
            r"default demo: $\sigma_{zz}^{\infty}>\sigma_{rr}^{\infty}$",
            ha="center",
            va="top",
            fontsize=FS - 2,
            color="0.35",
        )

    half = 1.85
    ax.set_xlim(cx - half, cx + half)
    ax.set_ylim(cy - half, cy + half)
    _finish(ax)
    _title(ax, t)


def draw_cavitation(ax, t=1.0):
    """Growing void with HELP softening annotation."""
    draw_void(ax, help_note=True, t=t)


def draw_slit(ax, t=1.0):
    """Local tip window of a Mode-I centre crack (side $2a$).

    Tip at the origin; open faces for $x\\le 0$; ligament $x\\ge 0$ with
    symmetry ticks $u_y=0$ (not roller supports). Remote tension on top.
    The FEM solves the upper-right quarter of the specimen.
    """
    t = _clamp01(t)
    ax.add_patch(Rectangle((-1, -1), 2, 2, fill=False, ec="0.15", lw=1.2, zorder=3))

    open_amp = 0.18 * t
    xs = np.linspace(-1.0, 0.0, 40)
    tip_blend = np.clip((-xs) / 0.35, 0.0, 1.0)
    yu = open_amp * tip_blend
    yl = -open_amp * tip_blend
    ax.plot(xs, yu, color="0.15", lw=2.0, solid_capstyle="butt", zorder=4)
    ax.plot(xs, yl, color="0.15", lw=2.0, solid_capstyle="butt", zorder=4)
    if t > 0.05:
        ax.fill_between(xs, yl, yu, color="white", zorder=3.5, alpha=1.0)
    # Ligament ahead of the tip (closed).
    ax.plot([0.0, 1.0], [0.0, 0.0], color="0.15", lw=1.2, solid_capstyle="butt", zorder=4)
    ax.plot([0.0], [0.0], "o", color="0.15", ms=3.5, zorder=5)
    ax.text(
        -0.5, 0.16 + 0.55 * open_amp, "Centre crack",
        fontsize=FS - 1, color="0.25", ha="center",
    )
    ax.text(
        0.0, 1.42, "Local tip window",
        fontsize=FS - 2, color="0.4", ha="center", va="bottom",
    )

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
        ax.text(0.0, 1.28, r"$\sigma_{yy}^{\infty}$", ha="center", va="bottom", fontsize=FS)

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

    # Ligament symmetry ticks on y = 0, x > 0 (uy = 0); not roller supports.
    for x in np.linspace(0.18, 0.92, 5):
        ax.plot([x, x], [-0.06, 0.06], color="0.15", lw=0.7, zorder=4)
    ax.text(
        0.55, -0.22, r"ligament symmetry ($u_y=0$)",
        fontsize=FS - 2, color="0.35", ha="center", va="top",
    )
    ax.set_xlim(-1.45, 1.45)
    ax.set_ylim(-1.55, 1.55)
    _finish(ax)
    _title(ax, t)


def _rel_sym(ax, x, y, w, h, math, *, active=False, accent=False, fs=None):
    """Symbol-only node: math in the box, almost no prose."""
    from matplotlib.patches import FancyBboxPatch

    if active:
        fc, ec, tw, tc = CARDINAL, CARDINAL, 1.55, "white"
    elif accent:
        fc, ec, tw, tc = "#f7f0f0", CARDINAL, 1.15, MECH
    else:
        fc, ec, tw, tc = "white", EDGE, 0.9, MECH
    ax.add_patch(
        FancyBboxPatch(
            (x, y), w, h,
            boxstyle="round,pad=0.02,rounding_size=0.1",
            facecolor=fc, edgecolor=ec, lw=tw, zorder=2,
        )
    )
    ax.text(
        x + 0.5 * w, y + 0.5 * h, math,
        ha="center", va="center", fontsize=FS if fs is None else fs,
        color=tc, zorder=3,
    )


def _rel_link(ax, p0, p1, *, active=False):
    _arrow(
        ax, p0, p1,
        color=CARDINAL if active else EDGE,
        lw=1.15 if active else 0.85,
        scale=8 if active else 7,
    )


def draw_msg_workflow(ax, highlight=None):
    """Symbol map: u → ε,η → ρ_T → {σ_e, N_T}; σ_m → θ_L → θ_T → c_T ← N_T."""
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5.55)
    ax.set_aspect("equal")
    ax.axis("off")

    def on(nid):
        return highlight == nid

    # Top chain
    _rel_sym(ax, 0.35, 4.15, 1.7, 0.95, r"$u_i$", active=on("kin"))
    _rel_sym(ax, 2.55, 4.15, 2.2, 0.95, r"$\varepsilon,\ \eta$", active=on("inv"))
    _rel_sym(
        ax, 5.3, 4.15, 4.3, 0.95,
        r"$\rho_{\mathrm{T}}=\rho_{\mathrm{S}}+\rho_{\mathrm{G}}$",
        active=on("taylor"), accent=True,
    )
    _rel_link(ax, (2.05, 4.62), (2.55, 4.62), active=on("kin") or on("inv"))
    _rel_link(ax, (4.75, 4.62), (5.3, 4.62), active=on("inv") or on("taylor"))

    # Split ρ_T → σ_e and N_T
    ax.plot([7.45, 7.45], [4.15, 3.7], color=EDGE, lw=0.85, zorder=1)
    ax.plot([2.15, 7.45], [3.7, 3.7], color=EDGE, lw=0.85, zorder=1)
    _rel_link(ax, (2.15, 3.7), (2.15, 3.35), active=on("taylor") or on("flow"))
    _rel_link(ax, (7.45, 3.7), (7.45, 3.35), active=on("taylor") or on("nt"))

    _rel_sym(
        ax, 0.55, 2.3, 3.2, 1.05,
        r"$\sigma_{\mathrm{e}}(\rho_{\mathrm{T}})$", active=on("flow"),
    )
    _rel_sym(
        ax, 5.85, 2.3, 3.6, 1.05,
        r"$N_{\mathrm{T}}=\chi\rho_{\mathrm{T}}/b$",
        active=on("nt"), accent=True,
    )

    # Occupancy lane: σ_m → θ_L → θ_T → c_T ← N_T
    _rel_sym(
        ax, 0.35, 0.45, 2.7, 1.0,
        r"$\theta_{\mathrm{L}}(\sigma_{\mathrm{m}})$", active=on("mean"),
    )
    _rel_sym(ax, 3.55, 0.45, 2.2, 1.0, r"$\theta_{\mathrm{T}}$", active=on("oriani"))
    _rel_sym(
        ax, 6.25, 0.45, 3.35, 1.0,
        r"$c_{\mathrm{T}}=N_{\mathrm{T}}\,\theta_{\mathrm{T}}$",
        active=on("ct"), accent=True,
    )
    _rel_link(ax, (3.05, 0.95), (3.55, 0.95), active=on("mean") or on("oriani"))
    _rel_link(ax, (5.75, 0.95), (6.25, 0.95), active=on("oriani") or on("ct"))
    _rel_link(ax, (7.65, 2.3), (7.9, 1.45), active=on("nt") or on("ct"))


def draw_equations_map(ax, highlight=None):
    """Symbol map among governing relations."""
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 3.9)
    ax.set_aspect("equal")
    ax.axis("off")

    def on(nid):
        return highlight == nid

    _rel_sym(
        ax, 0.25, 2.45, 3.05, 1.05,
        r"$\sigma_{\mathrm{e}}=\sigma_{\mathrm{Y}}\sqrt{f^{2}+l\eta}$",
        active=on("eq-flow"), fs=FS - 1,
    )
    _rel_sym(
        ax, 3.5, 2.45, 3.05, 1.05,
        r"$N_{\mathrm{T}}=\chi\rho_{\mathrm{T}}/b$",
        active=on("eq-nt"), accent=True,
    )
    _rel_sym(
        ax, 6.75, 2.45, 2.95, 1.05,
        r"$N_{\mathrm{T}}^{\mathrm{GND}}\sim 1/L$",
        active=on("eq-scale"),
    )
    _rel_link(ax, (3.3, 2.97), (3.5, 2.97), active=on("eq-flow") or on("eq-nt"))
    _rel_link(ax, (6.55, 2.97), (6.75, 2.97), active=on("eq-nt") or on("eq-scale"))

    _rel_sym(
        ax, 0.25, 0.45, 3.05, 1.05,
        r"$\theta_{\mathrm{L}}(\sigma_{\mathrm{m}})$", active=on("eq-thL"),
    )
    _rel_sym(
        ax, 3.5, 0.45, 3.05, 1.05,
        r"$\theta_{\mathrm{T}}\!\leftrightarrow\!\theta_{\mathrm{L}}$",
        active=on("eq-oriani"),
    )
    _rel_sym(
        ax, 6.75, 0.45, 2.95, 1.05,
        r"$(1-\xi\theta_{\mathrm{T}})\sigma_{\mathrm{e}}$",
        active=on("eq-help"), fs=FS - 1,
    )
    _rel_link(ax, (3.3, 0.97), (3.5, 0.97), active=on("eq-thL") or on("eq-oriani"))

    # Merge cue: N_T and θ_T → c_T
    ax.text(
        5.0, 1.85,
        r"$c_{\mathrm{T}}=N_{\mathrm{T}}\,\theta_{\mathrm{T}}$",
        ha="center", va="center", color=MECH, fontsize=FS,
    )
    _rel_link(ax, (5.0, 2.45), (5.0, 2.1), active=on("eq-nt") or on("eq-oriani"))


def draw_innovations_map(ax, highlight=None):
    """Symbol map: dual ρ_T roles → channels → examples → 1/L result."""
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 4.15)
    ax.set_aspect("equal")
    ax.axis("off")

    def on(nid):
        return highlight == nid

    _rel_sym(
        ax, 0.3, 2.85, 4.5, 1.05,
        r"$\rho_{\mathrm{T}}\ \Rightarrow\ \{\sigma_{\mathrm{e}},\,N_{\mathrm{T}}\}$",
        active=on("inn-bridge"), accent=True,
    )
    _rel_sym(
        ax, 5.2, 2.85, 4.5, 1.05,
        r"$c_{\mathrm{T}}=N_{\mathrm{T}}(\rho_{\mathrm{T}})\,\theta_{\mathrm{T}}(\sigma_{\mathrm{m}})$",
        active=on("inn-channels"), accent=True, fs=FS - 1,
    )
    _rel_link(ax, (4.8, 3.37), (5.2, 3.37), active=on("inn-bridge") or on("inn-channels"))

    _rel_sym(
        ax, 0.3, 1.35, 3.0, 1.0,
        r"$\sigma_{\mathrm{m}}\approx 0$", active=on("inn-torsion"),
    )
    _rel_sym(
        ax, 3.5, 1.35, 3.0, 1.0,
        r"$\sigma_{\mathrm{m}}^{\mathrm{odd}},\ N_{\mathrm{T}}^{\mathrm{even}}$",
        active=on("inn-bend"), fs=FS - 1,
    )
    _rel_sym(
        ax, 6.7, 1.35, 3.0, 1.0,
        r"$N_{\mathrm{T}}^{\mathrm{GND}}\sim 1/R_0$",
        active=on("inn-void"),
    )
    ax.plot([7.45, 7.45], [2.85, 2.55], color=EDGE, lw=0.85, zorder=1)
    ax.plot([1.8, 8.2], [2.55, 2.55], color=EDGE, lw=0.85, zorder=1)
    _rel_link(ax, (1.8, 2.55), (1.8, 2.35), active=on("inn-channels") or on("inn-torsion"))
    _rel_link(ax, (5.0, 2.55), (5.0, 2.35), active=on("inn-channels") or on("inn-bend"))
    _rel_link(ax, (8.2, 2.55), (8.2, 2.35), active=on("inn-channels") or on("inn-void"))

    _rel_sym(
        ax, 2.35, 0.2, 5.3, 0.95,
        r"$L\downarrow\ \Rightarrow\ N_{\mathrm{T}}^{\mathrm{GND}}\uparrow$",
        active=on("inn-scale"), accent=True,
    )
    ax.plot([5.0, 5.0], [1.35, 1.15], color=EDGE, lw=0.85, zorder=1)


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
    dpi=160,
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
