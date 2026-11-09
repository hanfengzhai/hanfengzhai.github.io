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
    "Dislocation density",
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


def vertex_gradient_mag(V: np.ndarray, F: np.ndarray, s: np.ndarray) -> np.ndarray:
    """Cheap per-vertex |∇s| from edge slopes on each face (stlite-safe)."""
    i, j, k = F.T
    lij = np.maximum(np.linalg.norm(V[j] - V[i], axis=1), 1e-16)
    ljk = np.maximum(np.linalg.norm(V[k] - V[j], axis=1), 1e-16)
    lki = np.maximum(np.linalg.norm(V[i] - V[k], axis=1), 1e-16)
    gm = (
        np.abs(s[i] - s[j]) / lij
        + np.abs(s[j] - s[k]) / ljk
        + np.abs(s[k] - s[i]) / lki
    ) / 3.0
    acc = np.zeros(len(V))
    cnt = np.zeros(len(V))
    np.add.at(acc, F[:, 0], gm)
    np.add.at(acc, F[:, 1], gm)
    np.add.at(acc, F[:, 2], gm)
    np.add.at(cnt, F[:, 0], 1.0)
    np.add.at(cnt, F[:, 1], 1.0)
    np.add.at(cnt, F[:, 2], 1.0)
    return acc / np.maximum(cnt, 1.0)


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
    """Illustrative vertex scalars from one shared deformation pattern.

    Mean stress is the signed pattern. Dislocation density follows the
    Formulation C shape $\\rho_T\\propto f^{2}(\\varepsilon_e)+l\\eta$ on the
    same field: $\\varepsilon_e\\sim|\\mathrm{pattern}|$ with
    $f^{2}\\propto\\varepsilon_e^{2N}$ ($N=0.2$), and one shared normalized
    $\\eta$ proxy (gradient of $|\\varepsilon_e|$ mixed with mild curvature)
    for both the displayed strain-gradient field and the GND piece of
    $\\rho_T$. The GND weight scales only that $\\eta$ contribution to
    $\\rho_T$. Trap sites track $\\rho_T$ through $N_T=\\chi\\rho_T/b$.
    Visualization proxies only — not a FEM solve.
    """
    N = 0.2  # paper hardening exponent
    kappa = curvature_proxy(V, F)
    pat = pattern_field(V, pattern)
    sig_m = stress_amp * pat  # /σ_Y
    eps = np.abs(pat)
    f2 = eps ** (2.0 * N)  # ∝ f²(ε_e) = (E ε_e / σ_Y)^{2N}
    eta_grad = vertex_gradient_mag(V, F, eps)
    eta_grad = eta_grad / max(float(np.percentile(eta_grad, 98)), 1e-12)
    eta_grad = np.clip(eta_grad, 0.0, 1.5)
    # One η proxy for display and for the GND term in ρ_T.
    eta = 0.82 * eta_grad + 0.18 * kappa
    # SSD floor + outer-fiber f²; gnd_weight scales only the η piece.
    rho_T = ssd_level + 0.75 * f2 + gnd_weight * 0.55 * eta
    N_T = rho_T  # spatial proxy; N_T ∝ ρ_T
    theta_L = np.clip(theta0 * np.exp(varsigma * sig_m), 1e-8, 0.999)
    theta_T = oriani_theta_T(theta_L, KT)
    c_T = N_T * theta_T
    return {
        "Mean stress": sig_m,
        "Strain-gradient proxy": eta,
        "Dislocation density": rho_T,
        "Lattice occupancy": theta_L,
        "Trapped hydrogen": c_T,
    }


# Plain Unicode for Plotly colorbars (matplotlib $...$ is not rendered there).
PROPERTY_LABELS = {
    "Mean stress": "σₘ / σ_Y",
    "Strain-gradient proxy": "η proxy (norm.)",
    "Dislocation density": "ρ_T (norm.)",
    "Lattice occupancy": "θ_L",
    "Trapped hydrogen": "c_T proxy (norm.)",
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


def _scalar_limits(scalar: np.ndarray, *, symmetric: bool = False) -> tuple[float, float]:
    lo, hi = np.percentile(scalar, [2, 98])
    if hi - lo < 1e-14:
        lo, hi = float(scalar.min()), float(scalar.max() + 1e-12)
    lo, hi = float(lo), float(hi)
    if symmetric:
        vmax = max(abs(lo), abs(hi), 1e-12)
        return -vmax, vmax
    return lo, hi


def _draw_bunny_frame(
    ax,
    V: np.ndarray,
    F: np.ndarray,
    fn: np.ndarray,
    scalar: np.ndarray,
    *,
    elev: float,
    azim: float,
    cmap: str,
    vmin: float,
    vmax: float,
    radius: float,
):
    """One orthographic projected frame; fixed limits so rotation stays centered."""
    P, zhat = _project(V, elev, azim)
    front = (fn @ zhat) < 0.02
    Ff = F[front]
    depth = P[:, 2][Ff].mean(axis=1)
    Ff = Ff[np.argsort(depth)]
    tc = ax.tripcolor(
        P[:, 0],
        P[:, 1],
        Ff,
        scalar,
        shading="gouraud",
        cmap=cmap,
        vmin=vmin,
        vmax=vmax,
        linewidths=0.0,
    )
    ax.set_aspect("equal")
    ax.set_axis_off()
    # Sphere-based limits keep the bunny large and stable while spinning.
    lim = 1.02 * radius
    ax.set_xlim(-lim, lim)
    ax.set_ylim(-lim, lim)
    return tc


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
    elev: float = -4.0,
    azim: float = 262.0,
    figsize=(6.6, 5.6),
):
    """Single projected bunny contour (used as a still / GIF building block)."""
    import matplotlib.pyplot as plt

    V, F = load_bunny()
    fn = face_normals(V, F)
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
    if property_name == "Mean stress":
        cmap = "coolwarm"
    elif property_name == "Dislocation density":
        cmap = "BuPu"
    else:
        cmap = "viridis"
    lo, hi = _scalar_limits(scalar, symmetric=(property_name == "Mean stress"))
    radius = float(np.max(np.linalg.norm(V, axis=1)))

    fig, ax = plt.subplots(figsize=figsize)
    fig.patch.set_facecolor("#ffffff")
    ax.set_facecolor("#e4e9ee")
    tc = _draw_bunny_frame(
        ax, V, F, fn, scalar,
        elev=elev, azim=azim, cmap=cmap, vmin=lo, vmax=hi, radius=radius,
    )
    cb = fig.colorbar(tc, ax=ax, fraction=0.04, pad=0.02, aspect=26)
    cb.set_label(PROPERTY_LABELS.get(property_name, property_name), fontsize=11)
    cb.ax.tick_params(labelsize=10)
    ax.set_title(property_name, fontsize=13, color=CARDINAL, pad=4)
    fig.tight_layout(pad=0.2)
    return fig


def plotly_property_contour(
    property_name: str,
    *,
    pattern: str = "Bending (vertical)",
    stress_amp: float = 1.0,
    gnd_weight: float = 0.7,
    ssd_level: float = 0.25,
    theta0: float = 1e-6,
    KT: float = 5.98e7,
    varsigma: float = 1.0,
    height: int = 620,
):
    """Interactive Plotly Mesh3d — drag to rotate, scroll to zoom."""
    import plotly.graph_objects as go

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
    lo, hi = _scalar_limits(scalar, symmetric=(property_name == "Mean stress"))
    if property_name == "Mean stress":
        colorscale = "RdBu_r"
    elif property_name == "Dislocation density":
        colorscale = "PuBu"
    else:
        colorscale = "Viridis"

    fig = go.Figure(
        data=[
            go.Mesh3d(
                x=V[:, 0],
                y=V[:, 1],
                z=V[:, 2],
                i=F[:, 0],
                j=F[:, 1],
                k=F[:, 2],
                intensity=scalar,
                intensitymode="vertex",
                colorscale=colorscale,
                cmin=lo,
                cmax=hi,
                showscale=True,
                colorbar=dict(
                    title=dict(
                        text=PROPERTY_LABELS.get(property_name, property_name),
                        side="right",
                    ),
                    thickness=14,
                    len=0.72,
                ),
                lighting=dict(
                    ambient=0.18,
                    diffuse=1.0,
                    specular=0.65,
                    roughness=0.28,
                    fresnel=0.35,
                ),
                lightposition=dict(x=2.2e3, y=2.8e3, z=0.8e3),
                flatshading=False,
                hoverinfo="skip",
                name=property_name,
            )
        ]
    )
    fig.update_layout(
        title=dict(text=property_name, font=dict(size=16, color=CARDINAL), x=0.02, y=0.98),
        height=height,
        margin=dict(l=0, r=0, t=36, b=0),
        paper_bgcolor="#ffffff",
        scene=dict(
            bgcolor="#e4e9ee",
            xaxis=dict(visible=False),
            yaxis=dict(visible=False),
            zaxis=dict(visible=False),
            aspectmode="data",
            # Face toward camera, slight look-up (matches README elev=-4, azim=262).
            camera=dict(
                eye=dict(x=-0.30, y=-0.15, z=-2.12),
                up=dict(x=0, y=1, z=0),
                center=dict(x=0, y=0, z=0),
            ),
        ),
    )
    return fig
