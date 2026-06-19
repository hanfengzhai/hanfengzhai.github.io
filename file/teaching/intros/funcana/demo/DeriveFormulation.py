import os
import matplotlib.pyplot as plt

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "Output")
plotting_params = {"font.family": "serif", "font.serif": ["Libertinus Serif"],
                   "mathtext.fontset": "cm", "font.size": 15}


class Heat2DDerivation:
    STEPS = [
        r"Strong: $-\nabla\!\cdot\!(\kappa(\xi,x)\nabla u)=f$, "
        r"$u=0$ on $\Gamma_D$, $\kappa\,\partial_n u=g$ on $\Gamma_N$",
        r"Weak: $\int_\Omega \kappa\,\nabla u\!\cdot\!\nabla v"
        r"= \int_\Omega fv + \int_{\Gamma_N} gv$, $v\in H^1_{0,\Gamma_D}$",
        r"Operator: $\langle Au,v\rangle=a(u,v)$, $\langle b,v\rangle=\ell(v)$, $Au=b$",
        r"Output: $s=Lu$, $s(\xi)=\frac{1}{|\omega|}\int_\omega u(\xi)\,dx$",
        r"Parametric: $A(\xi)\,u(\xi)=b(\xi)$, $s(\xi)=L\,u(\xi)$, $\xi\in\Xi$",
        r"PROM: $\tilde s = Lu_h + Q_h^*(b-Au_h)$ (goal-oriented ROM)",
    ]

    @staticmethod
    def save(path=None):
        os.makedirs(OUT, exist_ok=True)
        path = path or os.path.join(OUT, "derivation.png")
        plt.rcParams.update(plotting_params)
        fig, ax = plt.subplots(figsize=(9, 5.5))
        fig.patch.set_facecolor("black")
        ax.set_facecolor("black")
        ax.axis("off")
        y = 0.92
        ax.text(0.5, 0.98,
                r"Formulation $\rightarrow$ weak form $\rightarrow$ operator $\rightarrow$ PROM",
                ha="center", va="top", fontsize=15, color="white", transform=ax.transAxes)
        for i, eq in enumerate(Heat2DDerivation.STEPS):
            ax.text(0.04, y - i * 0.13, rf"{i+1}. {eq}", ha="left", va="top",
                    fontsize=15, color="white", transform=ax.transAxes)
        fig.savefig(path, dpi=300, bbox_inches="tight", pad_inches=0.10,
                    facecolor="black", edgecolor="none")
        plt.close(fig)
        return path


if __name__ == "__main__":
    print(Heat2DDerivation.save())
