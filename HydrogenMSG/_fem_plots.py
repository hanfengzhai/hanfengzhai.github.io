"""Contour helpers for the appendix FEM pages (browser deploy)."""

from __future__ import annotations

import numpy as np
import matplotlib.pyplot as plt
from matplotlib.colors import LogNorm
from matplotlib.patches import Circle

from _style import FONT_SIZE

ZOOM = 3.0
SLIT_ZOOM = 1.0


def meridian(sol, key, zoom=ZOOM):
    mesh = sol["mesh"]
    nr, nt = 2 * mesh.n_rho + 1, 2 * mesh.n_th + 1
    F = sol["kin"].project(sol[key])[:, 0].reshape(nr, nt)

    rho = np.hypot(mesh.coords[:, 0], mesh.coords[:, 1]).reshape(nr, nt)[:, -1]
    th = np.arctan2(mesh.coords[:, 0], mesh.coords[:, 1]).reshape(nr, nt)[0]
    keep = rho <= zoom * mesh.R0 * 1.02
    rho, F = rho[keep], F[keep]

    th_full = np.concatenate(
        [th, np.pi - th[::-1][1:], np.pi + th[1:], 2.0 * np.pi - th[::-1][1:]]
    )
    F_full = np.concatenate(
        [F, F[:, ::-1][:, 1:], F[:, 1:], F[:, ::-1][:, 1:]], axis=1
    )
    s = rho[:, None] / mesh.R0
    return s * np.sin(th_full), s * np.cos(th_full), F_full


def _add_colorbar(fig, ax, cf, cticks, clabels, label=None, *, mode="axes"):
    if mode == "axes":
        cb = fig.colorbar(cf, ax=ax, fraction=0.045, pad=0.08, aspect=16)
        tick_fs = max(8, FONT_SIZE - 4)
        label_fs = max(8, FONT_SIZE - 3)
    else:
        pos = ax.get_position()
        cax = fig.add_axes([pos.x1 + 0.012, pos.y0 + 0.045, 0.012, pos.height - 0.09])
        cb = fig.colorbar(cf, cax=cax)
        tick_fs = FONT_SIZE
        label_fs = FONT_SIZE
    cb.set_ticks(cticks)
    cb.set_ticklabels(clabels)
    cb.outline.set_linewidth(0.6)
    cb.ax.tick_params(width=0.6, labelsize=tick_fs)
    if label is not None:
        cb.set_label(label, fontsize=label_fs)
    return cb


def draw_meridian_contour(
    ax,
    fig,
    sol,
    key,
    tag,
    label,
    cmap,
    *,
    log=False,
    nlev=13,
    cbar=True,
    show_title=False,
    cbar_label=None,
    cbar_mode="axes",
):
    del tag, label, show_title
    r, z, F = meridian(sol, key)
    if log:
        lev = np.logspace(np.log10(F.min()), np.log10(F.max()), nlev)
        cf = ax.contourf(r, z, F, levels=lev, norm=LogNorm(), cmap=cmap)
        lo, hi = np.ceil(np.log10(F.min())), np.floor(np.log10(F.max()))
        cticks = 10.0 ** np.arange(lo, hi + 1)
        clabels = [rf"$10^{{{int(k)}}}$" for k in np.arange(lo, hi + 1)]
    else:
        lev = np.linspace(F.min(), F.max(), nlev)
        cf = ax.contourf(r, z, F, levels=lev, cmap=cmap)
        vmin, vmax = F.min(), F.max()
        cticks = [vmin, 0.5 * (vmin + vmax), vmax]
        clabels = [f"{t:.2f}" for t in cticks]
    ax.contour(r, z, F, levels=lev, colors="w", linewidths=0.25, alpha=0.6)
    ax.add_patch(
        Circle((0, 0), 1.0, facecolor="w", edgecolor="0.15", lw=0.9, zorder=5)
    )
    ax.set_aspect("equal")
    ax.set_xlim(-ZOOM, ZOOM)
    ax.set_ylim(-ZOOM, ZOOM)
    ax.set_xlabel(r"$\rho/R_0$", labelpad=1)
    ax.set_ylabel(r"$z/R_0$", labelpad=0)
    ax.set_xticks([-3, 0, 3])
    ax.set_yticks([-3, 0, 3])
    if cbar:
        _add_colorbar(fig, ax, cf, cticks, clabels, label=cbar_label, mode=cbar_mode)
    return cf


def _slit_window_mask(sol, zoom=SLIT_ZOOM):
    a = sol["mesh"].a
    x = sol["kin"].x.ravel() / a
    y = sol["kin"].y.ravel() / a
    xt = x - 1.0
    m = (xt >= -1.02) & (xt <= zoom) & (y <= zoom) & (y >= -1e-12)
    return xt[m], y[m], m


def _slit_structured_field(sol, key, zoom=SLIT_ZOOM, n=560, smooth=2.5, clip_pct=(5.0, 95.0)):
    from scipy.interpolate import griddata
    from scipy.ndimage import gaussian_filter

    xt, y, m = _slit_window_mask(sol, zoom)
    f = sol[key].ravel()[m]
    upper = y > 1e-12
    x_u, y_u, f_u = xt[upper], y[upper], f[upper]
    x_all = np.concatenate([xt, x_u])
    y_all = np.concatenate([y, -y_u])
    if key in ("uy_a",):
        f_all = np.concatenate([f, -f_u])
    else:
        f_all = np.concatenate([f, f_u])

    lo_g, hi_g = np.percentile(f_all, clip_pct)
    f_all = np.clip(f_all, lo_g, hi_g)

    xi = np.linspace(-1.05, zoom, n)
    yi = np.linspace(-zoom, zoom, n)
    Xi, Yi = np.meshgrid(xi, yi)
    pts = np.column_stack([x_all, y_all])
    Fi = griddata(pts, f_all, (Xi, Yi), method="linear")
    slit = (Xi < -1e-3) & (np.abs(Yi) < 0.03)
    miss = ~np.isfinite(Fi) & ~slit
    if miss.any():
        Fi[miss] = griddata(pts, f_all, (Xi[miss], Yi[miss]), method="nearest")
    Fi = np.where(slit, np.nan, Fi)
    valid = np.isfinite(Fi)
    weights = gaussian_filter(valid.astype(float), sigma=smooth, mode="nearest")
    blur = gaussian_filter(np.where(valid, Fi, 0.0), sigma=smooth, mode="nearest")
    Fi = np.divide(blur, np.maximum(weights, 1e-8))
    Fi = np.where(slit | ~valid, np.nan, Fi)
    Fi = np.ma.array(Fi, mask=~np.isfinite(Fi) | slit)
    return Xi, Yi, Fi, xi, yi


def _slit_axes_frame(ax, zoom=SLIT_ZOOM):
    ax.set_aspect("equal")
    ax.set_xlim(-1.05, max(zoom, 1.0) + 0.05)
    ax.set_ylim(-zoom - 0.05, zoom + 0.05)
    ax.set_xlabel(r"$(x-a)/a$", labelpad=1)
    ax.set_ylabel(r"$y/a$", labelpad=0)
    ax.set_xticks([-1, 0, 1] if zoom <= 1.0 + 1e-9 else [-1, 0, 1, 2])
    ax.set_yticks([-1, 0, 1] if zoom <= 1.0 + 1e-9 else [-2, 0, 2])
    ax.plot([-1.0, 0.0], [0.0, 0.0], color="0.15", lw=1.6, zorder=5)
    ax.plot([0.0], [0.0], "o", color="0.15", ms=3.5, zorder=6)


def draw_slit_contour(ax, fig, sol, key, cmap, *, label=None, nlev=12, cbar=True, zoom=SLIT_ZOOM, pct=(5.0, 95.0), cbar_mode="axes"):
    Xi, Yi, Fi, xi, yi = _slit_structured_field(sol, key, zoom=zoom, clip_pct=pct)
    vals = np.asarray(Fi[~np.ma.getmaskarray(Fi)]).ravel()
    lo, hi = np.percentile(vals, (2.0, 98.0))
    if key in ("uy_a",):
        lim = max(abs(lo), abs(hi), 1e-14)
        lo, hi = -lim, lim
    elif abs(hi - lo) < 1e-14:
        hi = lo + 1e-14
    lev = np.linspace(lo, hi, nlev)
    cf = ax.imshow(
        Fi,
        origin="lower",
        aspect="equal",
        cmap=cmap,
        extent=(xi[0], xi[-1], yi[0], yi[-1]),
        vmin=lo,
        vmax=hi,
        interpolation="bilinear",
        rasterized=True,
    )
    cf.set_clim(lo, hi)
    ax.contour(Xi, Yi, Fi, levels=lev, colors="w", linewidths=0.2, alpha=0.35)
    _slit_axes_frame(ax, zoom=zoom)
    if cbar and fig is not None:
        cticks = [lo, 0.5 * (lo + hi), hi]
        clabels = [f"{t:.3g}" for t in cticks]
        _add_colorbar(fig, ax, cf, cticks, clabels, label=label, mode=cbar_mode)
    return cf
