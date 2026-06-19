import os, numpy as np, matplotlib.pyplot as plt

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "Output")
plotting_params = {"font.family": "serif", "font.serif": ["Libertinus Serif"],
                   "mathtext.fontset": "cm", "font.size": 15,
                   "xtick.labelsize": 15, "ytick.labelsize": 15,
                   "axes.labelsize": 15, "axes.titlesize": 15, "legend.fontsize": 15}


def plot_comparison(fem, prom, speedup):
    xi = fem["xi_test"]
    s_fem, s_pd = fem["s_fem"], prom["s_pd"]
    rel = np.abs(s_pd - s_fem) / (np.abs(s_fem) + 1e-12)
    t_fem, t_prom = float(fem["t_per_xi"]), float(prom["t_per_xi"])
    plt.rcParams.update(plotting_params)
    fig, axes = plt.subplots(1, 3, figsize=(11.25, 3.375), constrained_layout=True)
    ax = axes[0]
    ax.plot(xi, s_fem, "k-", lw=2, label="FEM")
    ax.plot(xi, s_pd, "r--", lw=2, label="PROM (primal-dual)")
    ax.set_xlabel(r"$\xi$")
    ax.set_ylabel(r"QoI $s(\xi)$")
    ax.legend(loc="upper right")
    ax.grid(True, ls=":", alpha=0.7)
    ax = axes[1]
    ax.semilogy(xi, rel + 1e-16, "b-", lw=2)
    ax.set_xlabel(r"$\xi$")
    ax.set_ylabel(r"relative QoI error")
    ax.grid(True, which="both", ls=":", alpha=0.7)
    ax = axes[2]
    labels = ["FEM\n(full solve)", "PROM\n(online)"]
    times = [t_fem * 1e3, t_prom * 1e3]
    ymax = max(times) * 1.28
    bars = ax.bar(labels, times, color=["#8C1515", "#2E2D29"], width=0.45)
    ax.set_ylabel(r"time per query (ms)")
    ax.set_title(rf"speedup $\approx {speedup:.0f}\times$", pad=12)
    ax.set_ylim(0, ymax)
    ax.margins(x=0.08)
    for b, t in zip(bars, times):
        dy = max(0.35, 0.025 * ymax)
        ax.text(b.get_x() + b.get_width() / 2, t + dy, f"{t:.2f}",
                ha="center", va="bottom", fontsize=15)
    fig.savefig(os.path.join(OUT, "compare_results.png"), dpi=150, bbox_inches="tight",
                pad_inches=0.10, transparent=True)
    plt.close(fig)


if __name__ == "__main__":
    fem = np.load(os.path.join(OUT, "fenics_results.npz"))
    prom = np.load(os.path.join(OUT, "prom_results.npz"))
    xi = fem["xi_test"]
    s_fem, s_pd = fem["s_fem"], prom["s_pd"]
    rel = np.abs(s_pd - s_fem) / (np.abs(s_fem) + 1e-12)
    t_fem, t_prom = float(fem["t_per_xi"]), float(prom["t_per_xi"])
    speedup = t_fem / t_prom
    os.makedirs(OUT, exist_ok=True)
    plot_comparison(fem, prom, speedup)
    print("=" * 56)
    print("2D heat: full FEM vs goal-oriented PROM (primal-dual RB)")
    print("=" * 56)
    print(f"Test queries:           {len(xi)}")
    print(f"Reduced basis size:     {int(prom['r'])}")
    print(f"FEM time / query:       {t_fem*1e3:.3f} ms  (total {fem['t_total']:.3f} s)")
    print(f"PROM online / query:    {t_prom*1e3:.3f} ms  (total {prom['t_online']:.3f} s)")
    print(f"PROM offline (once):    {prom['t_offline']:.3f} s")
    print(f"Speedup (online):       {speedup:.1f}x faster per query")
    print(f"Max relative QoI error: {rel.max():.3e}")
    print(f"Mean relative QoI error:{rel.mean():.3e}")
    print("=" * 56)
