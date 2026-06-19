import os
import numpy as np, matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyArrowPatch, Rectangle

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "Output")
CARDINAL, COOLGREY, PALOALTO = "#8C1515", "#4D4F53", "#175E54"
plotting_params = {"font.family": "serif", "font.serif": ["Libertinus Serif"],
                   "mathtext.fontset": "cm", "font.size": 15,
                   "xtick.labelsize": 15, "ytick.labelsize": 15,
                   "axes.labelsize": 15, "axes.titlesize": 15, "legend.fontsize": 15}


class Heat2DSchematic:
    X0, PROBE_R = (0.7, 0.35), 0.09
    SRC, SIGMA, G_FLUX = (0.4, 0.62), 0.05, 1.0

    @staticmethod
    def _flux_arrows(ax):
        for y in np.linspace(0.12, 0.88, 5):
            ax.add_patch(FancyArrowPatch((1.14, y), (1.01, y), arrowstyle="-|>",
                mutation_scale=12, lw=1.6, color=PALOALTO, clip_on=False))

    @staticmethod
    def _kappa_regions(ax):
        ax.add_patch(Rectangle((0, 0), 0.5, 1, fc=CARDINAL, alpha=0.06, ec="none", zorder=0))
        ax.add_patch(Rectangle((0.5, 0), 0.5, 1, fc=COOLGREY, alpha=0.08, ec="none", zorder=0))
        ax.plot([0.5, 0.5], [0, 1], ls=":", lw=1.2, color=COOLGREY, alpha=0.8)
        ax.text(0.25, 0.06, r"$\kappa=1+\xi$", ha="center", va="bottom", fontsize=15, color=CARDINAL)
        ax.text(0.75, 0.06, r"$\kappa=1+0.4\xi$", ha="center", va="bottom", fontsize=15, color=COOLGREY)

    @staticmethod
    def draw(ax=None):
        if ax is None:
            plt.rcParams.update(plotting_params)
            fig, ax = plt.subplots(figsize=(6.2, 5.8))
        else:
            fig = ax.figure
        ax.set_xlim(-0.22, 1.28)
        ax.set_ylim(-0.08, 1.12)
        ax.set_aspect("equal")
        ax.add_patch(Rectangle((0, 0), 1, 1, fc=CARDINAL, alpha=0.04, ec=COOLGREY, lw=2))
        Heat2DSchematic._kappa_regions(ax)
        ax.plot([0, 0], [0, 1], color=CARDINAL, lw=4, solid_capstyle="butt", zorder=3)
        ax.plot([1, 1], [0, 1], color=COOLGREY, lw=2, zorder=3)
        Heat2DSchematic._flux_arrows(ax)
        sx, sy, sig = Heat2DSchematic.SRC[0], Heat2DSchematic.SRC[1], Heat2DSchematic.SIGMA
        ax.add_patch(Circle((sx, sy), 3 * sig, fc=CARDINAL, alpha=0.35, ec="none"))
        ax.add_patch(Circle((sx, sy), 1.4 * sig, fc=CARDINAL, alpha=0.55, ec="none"))
        ax.plot(sx, sy, "o", color=CARDINAL, ms=5, zorder=4)
        ax.text(sx, sy + 0.11, r"$f$ (source)", ha="center", va="bottom", fontsize=15, color=CARDINAL)
        x0, y0, r = Heat2DSchematic.X0[0], Heat2DSchematic.X0[1], Heat2DSchematic.PROBE_R
        ax.add_patch(Circle((x0, y0), r, fill=False, ec=PALOALTO, lw=2.2, ls="--", zorder=4))
        ax.plot(x0, y0, "o", color=PALOALTO, ms=7, mew=1.5, mec="white", zorder=5)
        ax.annotate(r"$x_0$", (x0, y0), xytext=(x0 + 0.15, y0 + 0.07), textcoords="data",
                    color=PALOALTO, fontsize=15,
                    arrowprops=dict(arrowstyle="-", color=PALOALTO, lw=1.2, shrinkA=4, shrinkB=4))
        ax.text(x0, y0 - r - 0.05, r"$\omega$ (QoI disk)", ha="center", va="top", fontsize=15, color=PALOALTO)
        ax.text(-0.06, 0.5, r"$\Gamma_D:\ u=0$", rotation=90, ha="right", va="center",
                fontsize=15, color=CARDINAL)
        ax.text(1.22, 0.5, rf"$\Gamma_N:\ \kappa\,\partial_n u={Heat2DSchematic.G_FLUX:g}$",
                rotation=-90, ha="left", va="center", fontsize=15, color=PALOALTO)
        ax.set_xlabel(r"$x$")
        ax.set_ylabel(r"$y$")
        ax.set_title(r"$\Omega=(0,1)^2$ steady heat: BCs, source, QoI", fontsize=15, pad=12)
        ax.set_xticks(np.linspace(0, 1, 5))
        ax.set_yticks(np.linspace(0, 1, 5))
        fig.subplots_adjust(left=0.10, right=0.96, top=0.92, bottom=0.10)
        return fig, ax

    @staticmethod
    def save(path=None):
        os.makedirs(OUT, exist_ok=True)
        path = path or os.path.join(OUT, "heat2d_schematic.png")
        fig, _ = Heat2DSchematic.draw()
        fig.savefig(path, dpi=150, bbox_inches="tight", pad_inches=0.08, transparent=True)
        plt.close(fig)
        return path


if __name__ == "__main__":
    print(Heat2DSchematic.save())
