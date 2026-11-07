"""Interactive examples for size-dependent hydrogen trapping in MSG plasticity."""

from __future__ import annotations

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import streamlit as st

from msg_hydrogen import (
    Params,
    bending_average_uptake,
    bending_fields,
    cavitation_stress,
    torsion_Q,
    torsion_cT_profile,
    void_fields,
)
from _style import (
    COLORS,
    COLORS_THREE,
    LINESTYLES_THREE,
    LINE_LW,
    apply_style,
)
import _app_schematics as _schematics
schematic_gif_bytes = _schematics.schematic_gif_bytes


apply_style()

PAGES = [
    "Wire torsion",
    "Beam bending",
    "Spherical void",
    "Cavitation",
    "Non-hydrostatic void",
    "Mode-I slit",
]

LEGEND_FS = 7
TITLE_FS = 9
# Near-square panel size; each panel lives in its own Streamlit column so the
# browser width sets the display scale while the aspect ratio stays stable.
PANEL = 3.15

# Cold, shallow tech-gray UI (works for local Streamlit and stlite).
_UI_CSS = """
<style>
  :root {
    --msg-bg: #e4e9ee;
    --msg-panel: #f1f4f7;
    --msg-ink: #1e293b;
    --msg-muted: #64748b;
    --msg-accent: #8c1515;
    --msg-accent-dark: #820000;
    --msg-accent-bright: #b1040e;
    --msg-line: #c5ced8;
  }
  html, body, [data-testid="stAppViewContainer"],
  [data-testid="stAppViewContainer"] > .main,
  .stApp {
    background-color: var(--msg-bg) !important;
    color: var(--msg-ink) !important;
    overflow-x: hidden !important;
  }
  [data-testid="stHeader"] {
    background: rgba(228, 233, 238, 0.92) !important;
    border-bottom: 1px solid var(--msg-line);
    height: 2.2rem !important;
  }
  [data-testid="stSidebar"] {
    background-color: var(--msg-panel) !important;
    border-right: 1px solid var(--msg-line);
  }
  [data-testid="stSidebar"] * {
    color: var(--msg-ink) !important;
  }
  [data-testid="stSidebar"] [data-testid="stMarkdownContainer"] p {
    font-size: 0.78rem !important;
    line-height: 1.35 !important;
    color: var(--msg-muted) !important;
  }
  section.main > div {
    overflow-x: hidden !important;
  }
  .main .block-container {
    padding-top: 0.6rem !important;
    padding-bottom: 0.4rem !important;
    padding-left: 1.2rem !important;
    padding-right: 1.2rem !important;
    max-width: 100% !important;
  }
  h1 {
    font-size: 1.35rem !important;
    margin: 0 0 0.25rem 0 !important;
    padding: 0 !important;
  }
  h2, h3 {
    font-size: 1.05rem !important;
    margin: 0.15rem 0 0.25rem 0 !important;
    padding: 0 !important;
  }
  .stMarkdown, .stCaption, label, p {
    color: var(--msg-ink) !important;
  }
  .main [data-testid="stMarkdownContainer"] p {
    font-size: 0.88rem !important;
    line-height: 1.35 !important;
    margin-bottom: 0.35rem !important;
  }
  [data-testid="stSidebar"] h1,
  [data-testid="stSidebar"] h2,
  [data-testid="stSidebar"] h3 {
    letter-spacing: 0.04em;
    text-transform: uppercase;
    font-size: 0.8rem !important;
    color: var(--msg-muted) !important;
  }
  div[data-baseweb="slider"] div[role="slider"] {
    background-color: var(--msg-accent) !important;
  }
  [data-testid="stSlider"] {
    padding-top: 0.1rem !important;
    padding-bottom: 0.15rem !important;
  }
  .stButton > button {
    background-color: var(--msg-accent) !important;
    color: #f8fafc !important;
    border: 1px solid var(--msg-accent-dark) !important;
    border-radius: 4px !important;
  }
  .stButton > button:hover {
    background-color: var(--msg-accent-bright) !important;
    border-color: var(--msg-accent) !important;
  }
  [data-testid="stProgress"] {
    margin: 0.35rem 0 0.15rem 0 !important;
  }
  [data-testid="stProgress"] > div > div,
  [data-testid="stProgress"] > div > div > div,
  [data-testid="stProgress"] > div > div > div > div {
    background-color: var(--msg-accent) !important;
  }
  /* Keep the track visible on the cold-gray page. */
  [data-testid="stProgress"] > div {
    background-color: #d7dee6 !important;
  }
  [data-testid="stMetric"] {
    background: var(--msg-panel);
    border: 1px solid var(--msg-line);
    border-radius: 6px;
    padding: 0.35rem 0.55rem;
  }
  /* Cap each panel by viewport height; never stretch PNG aspect (circles stay circular). */
  div[data-testid="stHorizontalBlock"]:has([data-testid="stPyplot"]) {
    --panel: min(36vh, 320px);
    max-width: min(100%, calc(4 * var(--panel) + 3rem)) !important;
    width: 100% !important;
    margin-left: auto !important;
    margin-right: auto !important;
    align-items: flex-start !important;
    gap: 0.45rem !important;
    justify-content: center !important;
  }
  div[data-testid="stHorizontalBlock"]:has([data-testid="stPyplot"])
    > div[data-testid="column"] {
    flex: 1 1 var(--panel) !important;
    max-width: var(--panel) !important;
    min-width: 0 !important;
  }
  [data-testid="stPyplot"], [data-testid="stImage"] {
    background: #ffffff;
    border: 1px solid var(--msg-line);
    border-radius: 6px;
    padding: 0.15rem;
    width: 100% !important;
    max-width: var(--panel, min(36vh, 320px)) !important;
    margin: 0 auto !important;
    overflow: hidden !important;
    box-sizing: border-box;
  }
  [data-testid="stPyplot"] img,
  [data-testid="stImage"] img {
    width: 100% !important;
    height: auto !important;
    max-width: 100% !important;
    max-height: none !important;
    object-fit: contain !important;
    display: block !important;
    margin: 0 auto !important;
  }
  /* Hide Streamlit corner chrome (RUNNING, deploy, toasts, toolbar). */
  [data-testid="stStatusWidget"],
  [data-testid="stStatusWidget"] *,
  [data-testid="stToolbar"],
  [data-testid="stToolbar"] *,
  [data-testid="stToolbarActions"],
  [data-testid="stDecoration"],
  [data-testid="stToast"],
  [data-testid="stToastContainer"],
  [data-testid="stToastContainer"] *,
  [data-testid="stNotification"],
  [data-testid="stBaseButton-header"],
  .stAppDeployButton,
  .stAppDeployButton *,
  [data-testid="stHeader"] [data-testid="stToolbarActions"],
  div[data-testid="stHeader"] button[kind="header"] {
    display: none !important;
    visibility: hidden !important;
    opacity: 0 !important;
    pointer-events: none !important;
    width: 0 !important;
    height: 0 !important;
    overflow: hidden !important;
  }
</style>
"""


def apply_ui_theme():
    st.markdown(_UI_CSS, unsafe_allow_html=True)


def ensure_scipy():
    """SciPy is only needed for the FEM pages. Install it lazily in stlite."""
    try:
        import scipy  # noqa: F401
        return True
    except ImportError:
        pass
    try:
        import micropip
    except ImportError:
        st.error("SciPy is required for this example.")
        return False
    st.warning("Installing SciPy in the browser (one-time, can take a minute)…")
    try:
        from pyodide.ffi import run_sync

        run_sync(micropip.install("scipy"))
    except Exception:
        import asyncio

        asyncio.run(micropip.install("scipy"))
    st.rerun()
    return False


def show(fig):
    fig.patch.set_facecolor("#ffffff")
    # Fill the Streamlit column; CSS keeps a near-square display box.
    st.pyplot(fig, clear_figure=True, use_container_width=True)
    plt.close(fig)


def _new_panel(schematic=False):
    fig, ax = plt.subplots(figsize=(PANEL, PANEL))
    return fig, ax


@st.cache_data(show_spinner=False)
def _schematic_gif(kind: str, version: int = 7) -> bytes:
    # ``version`` busts stale GIF caches when schematics change.
    return schematic_gif_bytes(kind, figsize=(PANEL, PANEL))


def show_schematic(kind: str):
    """Looping Before ↔ After schematic (animated GIF)."""
    try:
        gif = _schematic_gif(kind, version=7)
        try:
            st.image(gif, use_container_width=True)
        except TypeError:
            st.image(gif, use_column_width=True)
    except ImportError:
        # Pillow missing: fall back to a static After frame.
        show(_schematics.schematic_figure(kind, figsize=(PANEL, PANEL), t=1.0))


def _placeholder_fig(message="Press Solve to compute"):
    fig, ax = _new_panel()
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.text(0.5, 0.5, message, ha="center", va="center", fontsize=10, color="0.45",
            transform=ax.transAxes)
    ax.set_title(" ", fontsize=TITLE_FS)
    fig.tight_layout(pad=0.3)
    return fig


def _style_result_ax(ax):
    ax.tick_params(labelsize=7)
    ax.xaxis.label.set_size(8)
    ax.yaxis.label.set_size(8)
    ax.title.set_size(TITLE_FS)


def _legend(ax, *, loc="upper left", ncol=1, outside=False):
    """Place a compact legend that stays off the curves when possible."""
    kw = dict(fontsize=LEGEND_FS, framealpha=0.95, borderpad=0.25, handlelength=1.4,
              labelspacing=0.25, handletextpad=0.35, columnspacing=0.7)
    if outside:
        return ax.legend(loc="upper left", bbox_to_anchor=(1.02, 1.0), borderaxespad=0.0, **kw)
    return ax.legend(loc=loc, ncol=ncol, **kw)


@st.cache_data(show_spinner=False)
def _cavitation_curve(xi, theta_l0, l_over):
    pc = Params(thetaL0=max(theta_l0, 1e-16), xi=0.0 if theta_l0 == 0.0 else xi)
    grid = np.linspace(1.05, 5.0, 16)
    return [float(cavitation_stress(lr, pc, r0_grid=grid, n=400, n_iter=25)) for lr in l_over]


def _yield_to_browser():
    """Let stlite / the browser paint progress updates during a blocking solve."""
    try:
        from pyodide.ffi import run_sync
        import asyncio

        run_sync(asyncio.sleep(0))
        return
    except Exception:
        pass
    try:
        import time

        time.sleep(0)
    except Exception:
        pass


def _progress_ui(label="Solving"):
    """Visible progress panel; returns ``(callback, finish)``.

    The bar is left on screen at 100% when finished so a fast or stlite
    solve still shows that work happened (mid-loop paints are unreliable
    under blocking Pyodide compute).
    """
    box = st.container()
    with box:
        title = st.empty()
        title.markdown(f"**{label}**")
        try:
            bar = st.progress(0, text="Starting…")
        except TypeError:
            bar = st.progress(0)
        note = st.empty()
        note.caption("Starting…")

    state = {"n": 0}

    def _cb(frac, message=""):
        frac = float(np.clip(frac, 0.0, 1.0))
        msg = message or label
        try:
            bar.progress(frac, text=msg)
        except TypeError:
            bar.progress(frac)
        note.caption(msg)
        state["n"] += 1
        # Yield often enough for the browser to redraw under stlite.
        if state["n"] == 1 or state["n"] % 2 == 0 or frac >= 1.0:
            _yield_to_browser()

    def _finish(message="Done"):
        try:
            bar.progress(1.0, text=message)
        except TypeError:
            bar.progress(1.0)
        title.markdown(f"**{message}**")
        note.caption(message)
        _yield_to_browser()

    _cb(0.02, "Starting…")
    return _cb, _finish


def _solve_void(l_over_r0, s_z, s_r, progress=None):
    from fem_msg import Load, hydrogen_fields, solve as solve_void

    cache = st.session_state.setdefault("_void_sol_cache", {})
    key = (float(l_over_r0), float(s_z), float(s_r))
    if key in cache:
        if progress is not None:
            progress(1.0, "Cached solution")
        return cache[key]

    sol = solve_void(
        l_over_R0=l_over_r0,
        load=Load(S_z=s_z, S_r=s_r),
        n_rho=24,
        n_th=10,
        Rout_over_R0=20.0,
        verbose=False,
        progress=progress,
    )
    sol.update(hydrogen_fields(sol))
    cache[key] = sol
    return sol


def _solve_slit(l_over_a, remote_s, xi, progress=None):
    from fem_slit import solve as solve_slit

    cache = st.session_state.setdefault("_slit_sol_cache", {})
    key = (float(l_over_a), float(remote_s), float(xi))
    if key in cache:
        if progress is not None:
            progress(1.0, "Cached solution")
        return cache[key]

    sol = solve_slit(
        l_over_a=l_over_a,
        S=remote_s,
        p=Params(xi=xi),
        nx_c=16,
        nx_l=8,
        ny=16,
        nx_box=32,
        ny_box=16,
        tip_box=1.0,
        W_over_a=10.0,
        H_over_a=10.0,
        ratio=1.12,
        itmax=250,
        relax=0.35,
        tol=1e-5,
        verbose=False,
        progress=progress,
    )
    cache[key] = sol
    return sol


def page_torsion(p: Params):
    st.header("Wire torsion")
    st.markdown(
        r"Mean stress vanishes under the working closure, so the trapped field "
        r"is the trap-site density alone. At fixed surface strain $\Gamma = \kappa a$, "
        r"the GND floor scales as $l/a$."
    )
    gamma = st.slider(r"Surface strain $\Gamma$", 0.02, 0.20, 0.05, 0.01)
    r = np.linspace(0.0, 1.0, 200)
    c0, c1, c2 = st.columns(3, gap="small")

    with c0:
        show_schematic("torsion")

    with c1:
        fig, ax = _new_panel()
        for c, lh in zip(COLORS, [0.0, 2.0, 5.0, 10.0]):
            c_t = torsion_cT_profile(r, gamma, lh, p)
            lab = "SSD-only" if lh == 0 else rf"$l/a={lh:g}$"
            ax.plot(r, c_t, color=c, lw=LINE_LW, ls="--" if lh == 0 else "-", label=lab)
        ax.set_xlabel(r"$r/a$")
        ax.set_ylabel(r"$c_{\mathrm{T}}$ (norm.)")
        ax.set_title(rf"Trapped H, $\Gamma={gamma:g}$")
        _legend(ax, loc="lower right")
        _style_result_ax(ax)
        fig.tight_layout(pad=0.35)
        show(fig)

    with c2:
        fig, ax = _new_panel()
        a = np.logspace(np.log10(0.05), np.log10(50), 120)
        for c, ls, g in zip(COLORS_THREE, LINESTYLES_THREE, [0.05, 0.1, 0.2]):
            ax.plot(a, torsion_Q(a * 1e-6, g, p), color=c, ls=ls, lw=LINE_LW, label=rf"$\Gamma={g:g}$")
        ax.set_xscale("log")
        ax.set_xlabel(r"$a$ [$\mu\mathrm{m}$]")
        ax.set_ylabel(r"$Q$")
        ax.set_title("GND enhancement")
        _legend(ax, loc="upper right")
        _style_result_ax(ax)
        fig.tight_layout(pad=0.35)
        show(fig)


def page_bending(p: Params):
    st.header("Beam bending")
    st.markdown(
        r"The outer mean stress is antisymmetric. The strain gradient is uniform, "
        r"so the GND contribution to the trap-site density is even in $x_2$. "
        r"Fields inside $|x_2| \lesssim l_\varepsilon$ are left blank."
    )
    eps_s = st.slider(r"Surface strain $\varepsilon_s$", 0.01, 0.10, 0.05, 0.01)
    gap = 0.04
    z = np.concatenate([np.linspace(-0.5, -gap, 200), [np.nan], np.linspace(gap, 0.5, 200)])
    h = np.logspace(np.log10(0.2e-6), np.log10(50e-6), 40)
    c_l, c_t = zip(*[bending_average_uptake(hh, eps_s, p) for hh in h])
    c_l, c_t = np.asarray(c_l), np.asarray(c_t)

    cols = st.columns(4, gap="small")
    with cols[0]:
        show_schematic("bending")

    for col, key, xlab, title in (
        (cols[1], "sig_m_hat", r"$\sigma_{\mathrm{m}}/\sigma_{\mathrm{Y}}$", "Mean stress"),
        (cols[2], "cT_norm", r"$c_{\mathrm{T}}$ (norm.)", "Trapped H"),
    ):
        with col:
            fig, ax = _new_panel()
            for c, lh in zip(COLORS, [0.0, 2.0, 5.0, 10.0]):
                field = bending_fields(z, eps_s, lh, p)
                lab = "SSD" if lh == 0 else rf"$l/h={lh:g}$"
                ax.plot(field[key], z, color=c, lw=LINE_LW, ls="--" if lh == 0 else "-", label=lab)
            ax.axhspan(-gap, gap, color="0.92", zorder=0)
            ax.set_xlabel(xlab)
            ax.set_ylabel(r"$x_2/h$")
            ax.set_title(title)
            _legend(ax, loc="center", ncol=2)
            _style_result_ax(ax)
            fig.tight_layout(pad=0.35)
            show(fig)

    with cols[3]:
        fig, ax = _new_panel()
        ax.plot(h * 1e6, c_l / c_l[-1], color=COLORS_THREE[0], ls=LINESTYLES_THREE[0],
                lw=LINE_LW, label=r"$\bar c_{\mathrm{L}}$")
        ax.plot(h * 1e6, c_t / c_t[-1], color=COLORS_THREE[1], ls=LINESTYLES_THREE[1],
                lw=LINE_LW, label=r"$\bar c_{\mathrm{T}}$")
        ax.set_xscale("log")
        ax.set_xlabel(r"$h$ [$\mu\mathrm{m}$]")
        ax.set_ylabel("Avg / thick")
        ax.set_title(rf"Averages, $\varepsilon_s={eps_s:g}$")
        _legend(ax, loc="upper right")
        _style_result_ax(ax)
        fig.tight_layout(pad=0.35)
        show(fig)


def page_void(p: Params):
    st.header("Spherical void growth")
    st.markdown(
        r"At fixed expansion ratio $\delta = u_0/R_0$, the wall GND trap-site density "
        r"scales as $1/R_0$. Mean stress is lowest at the wall and rises toward the "
        r"remote tension. With $N = 0.2 < 2/3$, the GND fraction is largest at the wall."
    )
    delta = st.slider(r"Expansion ratio $\delta$", 0.05, 0.40, 0.20, 0.01)
    s = np.logspace(0.0, np.log10(8.0), 300)
    r0 = np.logspace(np.log10(0.05e-6), np.log10(20e-6), 80)
    gnd = 3.0 * np.sqrt(2.5) * delta * (p.l / r0)

    cols = st.columns(4, gap="small")
    with cols[0]:
        show_schematic("void")

    for col, key, ylab, title in (
        (cols[1], "sig_m_hat", r"$\sigma_{\mathrm{m}}/\sigma_{\mathrm{Y}}$", "Mean stress"),
        (cols[2], "cT_norm", r"$c_{\mathrm{T}}$ (norm.)", "Trapped H"),
    ):
        with col:
            fig, ax = _new_panel()
            for c, ls, lr in zip(COLORS_THREE, LINESTYLES_THREE, [1.0, 5.0, 10.0]):
                field = void_fields(s, delta, lr, p)
                ax.plot(s, field[key], color=c, ls=ls, lw=LINE_LW, label=rf"$l/R_0={lr:g}$")
            ax.set_xlabel(r"$R/R_0$")
            ax.set_ylabel(ylab)
            ax.set_title(title + rf", $\delta={delta:g}$")
            _legend(ax, loc="upper right")
            _style_result_ax(ax)
            fig.tight_layout(pad=0.35)
            show(fig)

    with cols[3]:
        fig, ax = _new_panel()
        ax.loglog(r0 * 1e6, gnd, color="black", lw=LINE_LW)
        ax.set_xlabel(r"$R_0$ [$\mu\mathrm{m}$]")
        ax.set_ylabel(r"$N_{\mathrm{T}}^{\mathrm{GND}}$")
        ax.set_title(rf"Wall GND, $\delta={delta:g}$")
        _style_result_ax(ax)
        fig.tight_layout(pad=0.35)
        show(fig)


def page_cavitation():
    st.header("Hydrogen-sensitive cavitation")
    st.markdown(
        r"Formulation C keeps the hydrogen-free Taylor density and multiplies the "
        r"flow stress by $1 - \xi\,\theta_{\mathrm{T}}$, with $l$ fixed. "
        r"The cavitation stress is the maximum remote tension over the growth history. "
        r"The quadrature is coarser than the manuscript maps."
    )
    xi = st.slider(r"Softening coefficient $\xi$", 0.0, 0.6, 0.3, 0.05)
    l_over = (0.0, 0.5, 1.0, 2.0, 5.0, 10.0)
    c0, c1 = st.columns([0.9, 1.2], gap="small")
    with c0:
        show_schematic("cavitation")
    with c1:
        fig, ax = _new_panel()
        with st.spinner("Evaluating the cavitation histories"):
            for c, ls, th0 in zip(COLORS_THREE, LINESTYLES_THREE, [0.0, 1e-6, 1e-5]):
                sig_c = _cavitation_curve(xi, th0, l_over)
                lab = "no hydrogen" if th0 == 0.0 else rf"$\theta_{{\mathrm{{L}}}}^{{0}}={th0:.0e}$"
                ax.plot(l_over, sig_c, color=c, ls=ls, lw=LINE_LW, marker="o", ms=3.5, label=lab)
        ax.set_xlabel(r"$l/R_0$")
        ax.set_ylabel(r"$\sigma_c/\sigma_{\mathrm{Y}}^{0}$")
        ax.set_title(rf"Cavitation, $\xi={xi:g}$")
        _legend(ax, loc="upper right")
        _style_result_ax(ax)
        fig.tight_layout(pad=0.35)
        show(fig)


def page_fem_void():
    if not ensure_scipy():
        return
    import importlib
    from _fem_plots import draw_meridian_contour

    st.header("Non-hydrostatic void")
    st.markdown(
        r"Axisymmetric CMSG void under remote biaxial tension. "
        r"Hydrogen is a one-way Oriani post-process. "
        r"The mesh ($n_\rho=24$, $n_\theta=10$) is coarser than the manuscript figure."
    )
    c1, c2, c3 = st.columns(3)
    l_over = c1.slider(r"$l/R_0$", 1.0, 10.0, 10.0, 1.0)
    s_z = c2.slider(r"$\sigma_{zz}^{\infty}/\sigma_{\mathrm{Y}}$", 1.0, 4.0, 3.6, 0.1)
    s_r = c3.slider(r"$\sigma_{rr}^{\infty}/\sigma_{\mathrm{Y}}$", 0.5, 3.0, 2.2, 0.1)
    st.caption("The first solve on a new setting takes about ten seconds. Repeated settings are cached.")
    if st.button("Solve void", type="primary"):
        st.session_state["void_key"] = (float(l_over), float(s_z), float(s_r))
    key = st.session_state.get("void_key")

    if key is None:
        cols = st.columns(3, gap="small")
        with cols[0]:
            show_schematic("fem_void")
        with cols[1]:
            show(_placeholder_fig("Mean stress after solve"))
        with cols[2]:
            show(_placeholder_fig("Trapped H after solve"))
        return

    cb, finish_bar = _progress_ui("Solving the non-hydrostatic void")
    try:
        sol = _solve_void(*key, progress=cb)
        finish_bar(f"Converged in {sol['iters']} iterations")
    except Exception:
        finish_bar("Solve failed")
        raise
    m1, m2 = st.columns(2)
    m1.metric("Iterations", f"{sol['iters']}")
    m2.metric(r"Expansion $\delta$", f"{sol['delta']:.3f}")
    cols = st.columns(3, gap="small")
    with cols[0]:
        show_schematic("fem_void")
    with cols[1]:
        fig, ax = _new_panel()
        draw_meridian_contour(
            ax, fig, sol, "sig_m_hat", "a", "mean stress", "coolwarm",
            cbar_label=r"$\sigma_{\mathrm{m}}/\sigma_{\mathrm{Y}}$",
            cbar_mode="axes",
        )
        ax.set_title(rf"Mean stress, $l/R_0={key[0]:g}$", fontsize=TITLE_FS)
        show(fig)
    with cols[2]:
        fig, ax = _new_panel()
        draw_meridian_contour(
            ax, fig, sol, "cT_norm", "b", "trapped H", "viridis",
            cbar_label=r"$c_{\mathrm{T}}/c_{T0}$",
            cbar_mode="axes",
        )
        ax.set_title("Trapped H", fontsize=TITLE_FS)
        show(fig)


def page_fem_slit():
    if not ensure_scipy():
        return
    import importlib
    from _fem_plots import draw_slit_contour

    st.header("Mode-I slit")
    st.markdown(
        r"Plane-strain centre crack of half-length $a$ with Formulation C softening. "
        r"The open slit face is masked. The mesh is coarser than the manuscript figure."
    )
    c1, c2, c3 = st.columns(3)
    l_over = c1.slider(r"$l/a$", 1.0, 8.0, 5.0, 0.5)
    remote = c2.slider(r"$\sigma_{yy}^{\infty}/\sigma_{\mathrm{Y}}$", 0.4, 1.4, 1.0, 0.1)
    xi = c3.slider(r"Softening $\xi$", 0.0, 0.5, 0.3, 0.05)
    st.caption("The first solve on a new setting takes about half a minute. Repeated settings are cached.")
    if st.button("Solve slit", type="primary"):
        st.session_state["slit_key"] = (float(l_over), float(remote), float(xi))
    key = st.session_state.get("slit_key")

    if key is None:
        cols = st.columns(3, gap="small")
        with cols[0]:
            show_schematic("slit")
        with cols[1]:
            show(_placeholder_fig("Opening after solve"))
        with cols[2]:
            show(_placeholder_fig("Trapped H after solve"))
        return

    cb, finish_bar = _progress_ui("Solving the mode-I slit")
    try:
        sol = _solve_slit(*key, progress=cb)
        finish_bar(f"Converged in {sol['iters']} iterations")
    except Exception:
        finish_bar("Solve failed")
        raise
    m1, m2 = st.columns(2)
    m1.metric("COD / a", f"{sol['cod']:.3e}")
    m2.metric("Minimum softening", f"{float(sol['soft'].min()):.3f}")
    cols = st.columns(3, gap="small")
    with cols[0]:
        show_schematic("slit")
    with cols[1]:
        fig, ax = _new_panel()
        draw_slit_contour(ax, fig, sol, "uy_a", "coolwarm", label=r"$u_y/a$", cbar_mode="axes")
        ax.set_title(rf"Opening, $l/a={key[0]:g}$", fontsize=TITLE_FS)
        show(fig)
    with cols[2]:
        fig, ax = _new_panel()
        draw_slit_contour(ax, fig, sol, "cT_norm", "viridis", label=r"$c_{\mathrm{T}}/c_{T0}$", cbar_mode="axes")
        ax.set_title(rf"Trapped H, $\xi={key[2]:g}$", fontsize=TITLE_FS)
        show(fig)


def main():
    st.set_page_config(
        page_title="Size-dependent hydrogen trapping in MSG plasticity",
        layout="wide",
        initial_sidebar_state="expanded",
    )
    apply_ui_theme()
    p = Params()
    kt_exp = int(np.floor(np.log10(p.KT)))
    kt_mant = p.KT / 10**kt_exp
    st.sidebar.markdown("**Size-dependent hydrogen trapping**")
    st.sidebar.caption(
        "Mechanism-based strain gradient plasticity · "
        "analytical and interactive examples"
    )
    st.sidebar.caption(
        rf"$l={p.l * 1e6:.1f}\,\mu\mathrm{{m}}$, "
        rf"$l_\varepsilon={p.l_eps * 1e6:.3f}\,\mu\mathrm{{m}}$, "
        rf"$N={p.N:g}$, $\chi={p.chi:g}$, "
        rf"$\varsigma={p.varsigma:.3f}$, "
        rf"$K_T={kt_mant:.2f}\times 10^{{{kt_exp}}}$"
    )
    page = st.sidebar.radio("Example", PAGES)
    if page == "Wire torsion":
        page_torsion(p)
    elif page == "Beam bending":
        page_bending(p)
    elif page == "Spherical void":
        page_void(p)
    elif page == "Cavitation":
        page_cavitation()
    elif page == "Non-hydrostatic void":
        page_fem_void()
    else:
        page_fem_slit()


main()
