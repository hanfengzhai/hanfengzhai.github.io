"""Browser Streamlit view of the MSG–hydrogen examples (stlite / GitHub Pages)."""

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

apply_style()

PAGES = [
    "Wire torsion",
    "Beam bending",
    "Spherical void",
    "Cavitation",
    "Appendix void",
    "Appendix slit",
]


def show(fig):
    st.pyplot(fig, clear_figure=True)
    plt.close(fig)


@st.cache_data(show_spinner=False)
def _cavitation_curve(xi, theta_l0, l_over):
    pc = Params(thetaL0=max(theta_l0, 1e-16), xi=0.0 if theta_l0 == 0.0 else xi)
    grid = np.linspace(1.05, 5.0, 16)
    return [float(cavitation_stress(lr, pc, r0_grid=grid, n=400, n_iter=25)) for lr in l_over]


@st.cache_resource(show_spinner=False)
def _solve_void(l_over_r0, s_z, s_r):
    from fem_msg import Load, hydrogen_fields, solve as solve_void

    sol = solve_void(
        l_over_R0=l_over_r0,
        load=Load(S_z=s_z, S_r=s_r),
        n_rho=24,
        n_th=10,
        Rout_over_R0=20.0,
        verbose=False,
    )
    sol.update(hydrogen_fields(sol))
    return sol


@st.cache_resource(show_spinner=False)
def _solve_slit(l_over_a, remote_s, xi):
    from fem_slit import solve as solve_slit

    return solve_slit(
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
    )


def page_torsion(p: Params):
    st.header("Wire torsion")
    st.markdown(
        r"Mean stress vanishes under the working closure, so the trapped field "
        r"is the trap-site density alone. At fixed surface strain $\Gamma = \kappa a$, "
        r"the GND floor scales as $l/a$."
    )
    gamma = st.slider(r"Surface strain $\Gamma$", 0.02, 0.20, 0.05, 0.01)
    r = np.linspace(0.0, 1.0, 200)
    fig, axes = plt.subplots(1, 2, figsize=(9.2, 4.0))
    ax = axes[0]
    for c, lh in zip(COLORS, [0.0, 2.0, 5.0, 10.0]):
        c_t = torsion_cT_profile(r, gamma, lh, p)
        lab = "SSD-only" if lh == 0 else rf"$l/a={lh:g}$"
        ax.plot(r, c_t, color=c, lw=LINE_LW, ls="--" if lh == 0 else "-", label=lab)
    ax.set_xlabel(r"$r/a$")
    ax.set_ylabel(r"$c_{\mathrm{T}}\, l b^{2}/(\chi\,\theta_{\mathrm{T}})$")
    ax.set_title(rf"Torsion, $\Gamma={gamma:g}$")
    ax.legend(fontsize=11)

    ax = axes[1]
    a = np.logspace(np.log10(0.05), np.log10(50), 120)
    for c, ls, g in zip(COLORS_THREE, LINESTYLES_THREE, [0.05, 0.1, 0.2]):
        ax.plot(a, torsion_Q(a * 1e-6, g, p), color=c, ls=ls, lw=LINE_LW, label=rf"$\Gamma={g:g}$")
    ax.set_xscale("log")
    ax.set_xlabel(r"Wire radius $a$ [$\mu\mathrm{m}$]")
    ax.set_ylabel(r"$Q=\bar c_{\mathrm{T}}/\bar c_{\mathrm{T}}^{\mathrm{SSD}}$")
    ax.set_title("GND enhancement")
    ax.legend(fontsize=11)
    fig.tight_layout()
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
    fig, axes = plt.subplots(1, 2, figsize=(9.2, 4.2))
    for ax, key, xlab, title in (
        (axes[0], "sig_m_hat", r"$\sigma_{\mathrm{m}}/\sigma_{\mathrm{Y}}$",
         rf"Outer mean stress, $\varepsilon_s={eps_s:g}$"),
        (axes[1], "cT_norm", r"$c_{\mathrm{T}}\, l b^{2}/(\chi\,\theta_{\mathrm{T}}^{0})$",
         "Trapped concentration"),
    ):
        for c, lh in zip(COLORS, [0.0, 2.0, 5.0, 10.0]):
            field = bending_fields(z, eps_s, lh, p)
            lab = "SSD-only" if lh == 0 else rf"$l/h={lh:g}$"
            ax.plot(field[key], z, color=c, lw=LINE_LW, ls="--" if lh == 0 else "-", label=lab)
        ax.axhspan(-gap, gap, color="0.92", zorder=0)
        ax.set_xlabel(xlab)
        ax.set_ylabel(r"$x_2/h$")
        ax.set_title(title)
        ax.legend(fontsize=11)
    fig.tight_layout()
    show(fig)

    h = np.logspace(np.log10(0.2e-6), np.log10(50e-6), 40)
    c_l, c_t = zip(*[bending_average_uptake(hh, eps_s, p) for hh in h])
    c_l, c_t = np.asarray(c_l), np.asarray(c_t)
    fig, ax = plt.subplots(figsize=(4.6, 4.0))
    ax.plot(h * 1e6, c_l / c_l[-1], color=COLORS_THREE[0], ls=LINESTYLES_THREE[0],
            lw=LINE_LW, label=r"$\bar c_{\mathrm{L}}$")
    ax.plot(h * 1e6, c_t / c_t[-1], color=COLORS_THREE[1], ls=LINESTYLES_THREE[1],
            lw=LINE_LW, label=r"$\bar c_{\mathrm{T}}$")
    ax.set_xscale("log")
    ax.set_xlabel(r"Beam thickness $h$ [$\mu\mathrm{m}$]")
    ax.set_ylabel("Average / thick-beam value")
    ax.set_title(rf"Bending averages, $\varepsilon_s={eps_s:g}$")
    ax.legend()
    fig.tight_layout()
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
    fig, axes = plt.subplots(1, 2, figsize=(9.2, 4.0))
    for c, ls, lr in zip(COLORS_THREE, LINESTYLES_THREE, [1.0, 5.0, 10.0]):
        field = void_fields(s, delta, lr, p)
        axes[0].plot(s, field["sig_m_hat"], color=c, ls=ls, lw=LINE_LW, label=rf"$l/R_0={lr:g}$")
        axes[1].plot(s, field["cT_norm"], color=c, ls=ls, lw=LINE_LW, label=rf"$l/R_0={lr:g}$")
    for ax, ylab, title in (
        (axes[0], r"$\sigma_{\mathrm{m}}/\sigma_{\mathrm{Y}}$", "Mean stress"),
        (axes[1], r"$c_{\mathrm{T}}\, l b^{2}/(\chi\,\theta_{\mathrm{T}}^{0})$", "Trapped concentration"),
    ):
        ax.set_xlabel(r"$R/R_0$")
        ax.set_ylabel(ylab)
        ax.set_title(title + rf", $\delta={delta:g}$")
        ax.legend(fontsize=11)
    fig.tight_layout()
    show(fig)

    r0 = np.logspace(np.log10(0.05e-6), np.log10(20e-6), 80)
    gnd = 3.0 * np.sqrt(2.5) * delta * (p.l / r0)
    fig, ax = plt.subplots(figsize=(4.6, 4.0))
    ax.loglog(r0 * 1e6, gnd, color="black", lw=LINE_LW)
    ax.set_xlabel(r"Void radius $R_0$ [$\mu\mathrm{m}$]")
    ax.set_ylabel(r"$N_{\mathrm{T}}^{\mathrm{GND}}(R_0)\, l b^{2}/\chi$")
    ax.set_title(rf"Wall GND trap sites, $\delta={delta:g}$")
    fig.tight_layout()
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
    fig, ax = plt.subplots(figsize=(5.2, 4.0))
    with st.spinner("Evaluating the cavitation histories"):
        for c, ls, th0 in zip(COLORS_THREE, LINESTYLES_THREE, [0.0, 1e-6, 1e-5]):
            sig_c = _cavitation_curve(xi, th0, l_over)
            lab = "no hydrogen" if th0 == 0.0 else rf"$\theta_{{\mathrm{{L}}}}^{{0}}={th0:.0e}$"
            ax.plot(l_over, sig_c, color=c, ls=ls, lw=LINE_LW, marker="o", ms=4, label=lab)
    ax.set_xlabel(r"$l/R_0$")
    ax.set_ylabel(r"$\sigma_c/\sigma_{\mathrm{Y}}^{0}$")
    ax.set_title(rf"Cavitation, Formulation C, $\xi={xi:g}$")
    ax.legend(fontsize=11)
    fig.tight_layout()
    show(fig)


def page_appendix_void():
    from _fem_plots import draw_meridian_contour

    st.header("Appendix: non-hydrostatic void")
    st.markdown(
        r"Axisymmetric CMSG void. Hydrogen is a one-way Oriani post-process. "
        r"The mesh ($n_\rho=24$, $n_\theta=10$) is coarser than the manuscript appendix. "
        r"The first solve in the browser can take a minute or more."
    )
    c1, c2, c3 = st.columns(3)
    l_over = c1.slider(r"$l/R_0$", 1.0, 10.0, 10.0, 1.0)
    s_z = c2.slider(r"$\sigma_{zz}^{\infty}/\sigma_{\mathrm{Y}}$", 1.0, 4.0, 3.6, 0.1)
    s_r = c3.slider(r"$\sigma_{rr}^{\infty}/\sigma_{\mathrm{Y}}$", 0.5, 3.0, 2.2, 0.1)
    st.caption("Repeated settings are cached in this browser session.")
    if st.button("Solve void", type="primary"):
        st.session_state["void_key"] = (float(l_over), float(s_z), float(s_r))
    key = st.session_state.get("void_key")
    if key is None:
        return
    with st.spinner("Solving the non-hydrostatic void"):
        sol = _solve_void(*key)
    m1, m2 = st.columns(2)
    m1.metric("Iterations", f"{sol['iters']}")
    m2.metric(r"Expansion $\delta$", f"{sol['delta']:.3f}")
    fig, axes = plt.subplots(1, 2, figsize=(12.2, 4.6), gridspec_kw={"wspace": 0.62})
    draw_meridian_contour(
        axes[0], fig, sol, "sig_m_hat", "a", "mean stress", "coolwarm",
        cbar_label=r"$\sigma_{\mathrm{m}}/\sigma_{\mathrm{Y}}$",
    )
    draw_meridian_contour(
        axes[1], fig, sol, "cT_norm", "b", "trapped H", "viridis",
        cbar_label=r"$c_{\mathrm{T}}/c_{T0}$",
    )
    fig.suptitle(rf"Appendix void, $l/R_0={key[0]:g}$")
    show(fig)


def page_appendix_slit():
    from _fem_plots import draw_slit_contour

    st.header("Appendix: mode-I slit")
    st.markdown(
        r"Plane-strain center crack of half-length $a$ with Formulation C softening. "
        r"The open slit face is masked. The mesh is coarser than the manuscript appendix. "
        r"The first solve in the browser can take several minutes."
    )
    c1, c2, c3 = st.columns(3)
    l_over = c1.slider(r"$l/a$", 1.0, 8.0, 5.0, 0.5)
    remote = c2.slider(r"$\sigma_{yy}^{\infty}/\sigma_{\mathrm{Y}}$", 0.4, 1.4, 1.0, 0.1)
    xi = c3.slider(r"Softening $\xi$", 0.0, 0.5, 0.3, 0.05)
    st.caption("Repeated settings are cached in this browser session.")
    if st.button("Solve slit", type="primary"):
        st.session_state["slit_key"] = (float(l_over), float(remote), float(xi))
    key = st.session_state.get("slit_key")
    if key is None:
        return
    with st.spinner("Solving the mode-I slit"):
        sol = _solve_slit(*key)
    m1, m2 = st.columns(2)
    m1.metric("COD / a", f"{sol['cod']:.3e}")
    m2.metric("Minimum softening", f"{float(sol['soft'].min()):.3f}")
    fig, axes = plt.subplots(1, 2, figsize=(12.2, 4.4), gridspec_kw={"wspace": 0.62})
    draw_slit_contour(axes[0], fig, sol, "uy_a", "coolwarm", label=r"$u_y/a$")
    draw_slit_contour(axes[1], fig, sol, "cT_norm", "viridis", label=r"$c_{\mathrm{T}}/c_{T0}$")
    fig.suptitle(rf"Appendix slit, $l/a={key[0]:g}$, $\xi={key[2]:g}$")
    show(fig)


def main():
    st.set_page_config(page_title="MSG hydrogen examples", layout="wide")
    p = Params()
    st.title("MSG plasticity and hydrogen trapping")
    kt_exp = int(np.floor(np.log10(p.KT)))
    kt_mant = p.KT / 10**kt_exp
    st.markdown(
        "The three one-way canonical solutions, the finite-strain cavitation extension, "
        "and the two qualitative appendix finite-element examples. "
        rf"Prototype bcc parameters: $l = {p.l * 1e6:.1f}\,\mu\mathrm{{m}}$, "
        rf"$l_\varepsilon = {p.l_eps * 1e6:.3f}\,\mu\mathrm{{m}}$, "
        rf"$N = {p.N:g}$, $\chi = {p.chi:g}$, "
        rf"$\varsigma = {p.varsigma:.3f}$, $K_T = {kt_mant:.2f}\times 10^{{{kt_exp}}}$."
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
    elif page == "Appendix void":
        page_appendix_void()
    else:
        page_appendix_slit()


main()
