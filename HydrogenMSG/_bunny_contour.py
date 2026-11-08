"""Stanford-bunny property contours for the MSG–hydrogen Explore tab.

Pure NumPy + Matplotlib (stlite-safe). Fields are illustrative distributions
on the classic coarsened Turk–Levoy bunny, not a full FEM solve.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import numpy as np

CARDINAL = "#8C1515"


def _mesh_candidates() -> list[Path]:
    here = Path(__file__).resolve()
    return [
        Path("bunny.npz"),
        here.parent / "bunny.npz",
        here.parents[2] / "notebooks" / "data" / "bunny.npz",
        here.parents[1] / "data" / "bunny.npz",
    ]


@lru_cache(maxsize=1)
def load_bunny() -> tuple[np.ndarray, np.ndarray]:
    for path in _mesh_candidates():
        if path.is_file():
            data = np.load(path)
            return np.asarray(data["V"], dtype=np.float64), np.asarray(data["F"], dtype=np.int32)
    raise FileNotFoundError(
        "bunny.npz not found. Expected next to the app or under notebooks/data/."
    )


def face_normals(V: np.ndarray, F: np.ndarray) -> np.ndarray:
    i, j, k = F.T
    n = np.cross(V[j] - V[i], V[k] - V[i])
    n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-16)
    return n


def vertex_normals(V: np.ndarray, F: np.ndarray) -> np.ndarray:
    fn = face_normals(V, F)
    vn = np.zeros_like(V)
    np.add.at(vn, F[:, 0], fn)
    np.add.at(vn, F[:, 1], fn)
    np.add.at(vn, F[:, 2], fn)
    vn /= np.maximum(np.linalg.norm(vn, axis=1, keepdims=True), 1e-16)
    return vn


def curvature_proxy(V: np.ndarray, F: np.ndarray) -> np.ndarray:
    """Umbrella Laplacian magnitude as a cheap curvature stand-in."""
    acc = np.zeros_like(V)
    deg = np.zeros(len(V))
    i, j, k = F.T
    for a, b in ((i, j), (j, i), (j, k), (k, j), (k, i), (i, k)):
        np.add.at(acc, a, V[b])
        np.add.at(deg, a, 1.0)
    lap = V - acc / np.maximum(deg, 1.0)[:, None]
    kappa = np.linalg.norm(lap, axis=1)
    lo, hi = np.percentile(kappa, [5, 95])
    return np.clip((kappa - lo) / max(hi - lo, 1e-12), 0.0, 1.0)


def _unit(x: np.ndarray) -> np.ndarray:
    lo, hi = float(x.min()), float(x.max())
    if hi - lo < 1e-14:
        return np.zeros_like(x)
    return (x - lo) / (hi - lo)


def pattern_field(V: np.ndarray, name: str) -> np.ndarray:
    """Normalized spatial pattern in [-1, 1] used as a mean-stress template."""
    x, y, z = V.T
    if name == "Bending (vertical)":
        p = y
    elif name == "Lateral tension":
        p = x
    elif name == "Front–back":
        p = z
    elif name == "Ear tip hotspots":
        # High near the tallest vertices (ears), decaying downward.
        p = np.exp(-((y - y.max()) / 0.35) ** 2) * (1.0 + 0.35 * x)
    else:  # "Hydrostatic core"
        r = np.sqrt(x * x + y * y + z * z)
        p = 1.0 - 2.0 * _unit(r)
        return np.clip(p, -1.0, 1.0)
    p = p - p.mean()
    m = np.max(np.abs(p))
    return p / max(m, 1e-12)


def oriani_theta_T(theta_L: np.ndarray, KT: float) -> np.ndarray:
    ratio = KT * theta_L / np.maximum(1.0 - theta_L, 1e-30)
    return ratio / (1.0 + ratio)


PROPERTY_CHOICES = (
    "Mean stress",
    "Strain-gradient proxy",
    "Trap-site density",
    "Lattice occupancy",
    "Trapped hydrogen",
)

PATTERN_CHOICES = (
    "Bending (vertical)",
    "Lateral tension",
    "Front–back",
    "Ear tip hotspots",
    "Hydrostatic core",
)


def compute_fields(
    V: np.ndarray,
    F: np.ndarray,
    *,
    pattern: str,
    stress_amp: float,
    gnd_weight: float,
    ssd_level: float,
    theta0: float,
    KT: float,
    varsigma: float = 1.0,
) -> dict[str, np.ndarray]:
    """Return vertex scalars for each named property (already in plot units)."""
    kappa = curvature_proxy(V, F)
    sig_m = stress_amp * pattern_field(V, pattern)  # /σ_Y
    eta = (1.0 - gnd_weight) * 0.15 + gnd_weight * kappa
    N_T = ssd_level + gnd_weight * kappa
    theta_L = np.clip(theta0 * np.exp(varsigma * sig_m), 1e-8, 0.999)
    theta_T = oriani_theta_T(theta_L, KT)
    c_T = N_T * theta_T
    return {
        "Mean stress": sig_m,
        "Strain-gradient proxy": eta,
        "Trap-site density": N_T,
        "Lattice occupancy": theta_L,
        "Trapped hydrogen": c_T,
    }


PROPERTY_LABELS = {
    "Mean stress": r"$\sigma_{\mathrm{m}}/\sigma_{\mathrm{Y}}$",
    "Strain-gradient proxy": r"$\eta$ (norm.)",
    "Trap-site density": r"$N_{\mathrm{T}}$ (norm.)",
    "Lattice occupancy": r"$\theta_{\mathrm{L}}$",
    "Trapped hydrogen": r"$c_{\mathrm{T}}$ (norm.)",
}


def _project(V: np.ndarray, elev: float, azim: float):
    elev_r, azim_r = np.deg2rad(elev), np.deg2rad(azim)
    eye = np.array(
        [
            np.cos(elev_r) * np.cos(azim_r),
            np.sin(elev_r),
            np.cos(elev_r) * np.sin(azim_r),
        ]
    )
    up = np.array([0.0, 1.0, 0.0])
    zhat = eye / np.linalg.norm(eye)
    xhat = np.cross(up, zhat)
    if np.linalg.norm(xhat) < 1e-10:
        up = np.array([0.0, 0.0, 1.0])
        xhat = np.cross(up, zhat)
    xhat /= np.linalg.norm(xhat)
    yhat = np.cross(zhat, xhat)
    P = np.column_stack([V @ xhat, V @ yhat, V @ zhat])
    return P, zhat


def figure_property_contour(
    property_name: str,
    *,
    pattern: str = "Bending (vertical)",
    stress_amp: float = 1.0,
    gnd_weight: float = 0.7,
    ssd_level: float = 0.25,
    theta0: float = 1e-6,
    KT: float = 5.98e7,
    varsigma: float = 1.0,
    elev: float = 12.0,
    azim: float = -55.0,
    figsize=(5.4, 4.5),
):
    """Projected bunny contour (tripcolor) with colorbar — fast enough for stlite."""
    import matplotlib.pyplot as plt

    V, F = load_bunny()
    fields = compute_fields(
        V,
        F,
        pattern=pattern,
        stress_amp=stress_amp,
        gnd_weight=gnd_weight,
        ssd_level=ssd_level,
        theta0=theta0,
        KT=KT,
        varsigma=varsigma,
    )
    scalar = fields[property_name]
    cmap = "coolwarm" if property_name == "Mean stress" else "viridis"

    P, zhat = _project(V, elev, azim)
    fn = face_normals(V, F)
    # Keep faces that point toward the camera; paint far → near.
    front = (fn @ zhat) < 0.02
    Ff = F[front]
    depth = P[:, 2][Ff].mean(axis=1)
    order = np.argsort(depth)  # far first
    Ff = Ff[order]

    lo, hi = np.percentile(scalar, [2, 98])
    if hi - lo < 1e-14:
        lo, hi = float(scalar.min()), float(scalar.max() + 1e-12)

    fig, ax = plt.subplots(figsize=figsize)
    fig.patch.set_facecolor("#ffffff")
    ax.set_facecolor("#e4e9ee")
    tc = ax.tripcolor(
        P[:, 0],
        P[:, 1],
        Ff,
        scalar,
        shading="gouraud",
        cmap=cmap,
        vmin=lo,
        vmax=hi,
        linewidths=0.0,
    )
    ax.set_aspect("equal")
    ax.set_axis_off()
    pad = 0.04 * max(P[:, 0].ptp(), P[:, 1].ptp())
    ax.set_xlim(P[:, 0].min() - pad, P[:, 0].max() + pad)
    ax.set_ylim(P[:, 1].min() - pad, P[:, 1].max() + pad)
    cb = fig.colorbar(tc, ax=ax, fraction=0.046, pad=0.03, aspect=22)
    cb.set_label(PROPERTY_LABELS.get(property_name, property_name), fontsize=10)
    cb.ax.tick_params(labelsize=9)
    ax.set_title(property_name, fontsize=12, color=CARDINAL, pad=6)
    fig.tight_layout(pad=0.3)
    return fig
