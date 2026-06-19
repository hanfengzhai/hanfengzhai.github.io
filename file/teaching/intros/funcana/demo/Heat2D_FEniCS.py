import os, time
import numpy as np, matplotlib.pyplot as plt
import matplotlib.ticker as mticker
from tqdm import tqdm

_pkg = os.path.join(os.environ.get("CONDA_PREFIX", ""), "lib", "pkgconfig")
if os.path.isdir(_pkg):
    os.environ["PKG_CONFIG_PATH"] = _pkg + os.pathsep + os.environ.get("PKG_CONFIG_PATH", "")

import dolfin as df

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "Output")
plotting_params = {"font.family": "serif", "font.serif": ["Libertinus Serif"],
                   "mathtext.fontset": "cm", "font.size": 15,
                   "xtick.labelsize": 15, "ytick.labelsize": 15,
                   "axes.labelsize": 15, "axes.titlesize": 15, "legend.fontsize": 15}


class Heat2DFEM:
    X0, PROBE_R = (0.7, 0.35), 0.09
    SRC, SIGMA, G_FLUX = (0.4, 0.62), 0.05, 1.0
    XI_REF, XI_TEST = 1.0, np.linspace(0.5, 2.0, 80)

    @staticmethod
    def _source_expr():
        cx, cy, sig = Heat2DFEM.SRC[0], Heat2DFEM.SRC[1], Heat2DFEM.SIGMA
        return df.Expression(
            "A*exp(-((x[0]-cx)*(x[0]-cx)+(x[1]-cy)*(x[1]-cy))/(2*sig*sig))",
            A=20.0, cx=cx, cy=cy, sig=sig, degree=2)

    @staticmethod
    def _probe_expr():
        cx, cy, r = Heat2DFEM.X0[0], Heat2DFEM.X0[1], Heat2DFEM.PROBE_R
        return df.Expression(
            "((x[0]-cx)*(x[0]-cx)+(x[1]-cy)*(x[1]-cy)<=r*r)?1.0:0.0",
            cx=cx, cy=cy, r=r, degree=1)

    @staticmethod
    def probe_area():
        return np.pi * Heat2DFEM.PROBE_R ** 2

    @staticmethod
    def _mark_right(mesh):
        class Right(df.SubDomain):
            def inside(self, x, on_boundary):
                return on_boundary and df.near(x[0], 1.0)

        facets = df.MeshFunction("size_t", mesh, mesh.topology().dim() - 1, 0)
        Right().mark(facets, 1)
        return facets

    @staticmethod
    def assemble(mesh):
        V = df.FunctionSpace(mesh, "P", 1)
        bc = df.DirichletBC(V, df.Constant(0.0), "on_boundary && near(x[0], 0)")
        u, v = df.TrialFunction(V), df.TestFunction(V)
        facets = Heat2DFEM._mark_right(mesh)
        ds_r = df.Measure("ds", domain=mesh, subdomain_data=facets, subdomain_id=1)
        chi = Heat2DFEM._probe_expr()
        beta = df.Expression("x[0]<0.5 ? 1.0 : 0.4", degree=1)
        f, g = Heat2DFEM._source_expr(), df.Constant(Heat2DFEM.G_FLUX)
        A0 = df.assemble(df.dot(df.grad(u), df.grad(v)) * df.dx)
        A1 = df.assemble(beta * df.dot(df.grad(u), df.grad(v)) * df.dx)
        b = df.assemble(f * v * df.dx + g * v * ds_r)
        bc.apply(A0); bc.apply(A1); bc.apply(A0, b)
        L = df.assemble((1.0 / Heat2DFEM.probe_area()) * chi * v * df.dx).get_local()
        return V, bc, A0, A1, b, L

    @staticmethod
    def _operator(A0, A1, xi):
        A = A0.copy()
        A1s = A1.copy()
        A1s *= xi
        A += A1s
        return A

    @staticmethod
    def solve_vec(A0, A1, b, V, xi):
        A = Heat2DFEM._operator(A0, A1, xi)
        bb = b.copy()
        u = df.Function(V)
        df.solve(A, u.vector(), bb, "mumps")
        return u.vector().get_local()

    @staticmethod
    def qoi(L, u_vec):
        return float(L @ u_vec)

    @staticmethod
    def convergence(mesh_sizes=(8, 12, 16, 24, 32, 48, 64)):
        hs, ss = [], []
        for n in tqdm(mesh_sizes, desc="FEM convergence"):
            mesh = df.UnitSquareMesh(n, n)
            V, _, A0, A1, b, L = Heat2DFEM.assemble(mesh)
            u = Heat2DFEM.solve_vec(A0, A1, b, V, Heat2DFEM.XI_REF)
            hs.append(1.0 / n)
            ss.append(Heat2DFEM.qoi(L, u))
        hs, ss = np.array(hs), np.array(ss)
        err = np.abs(ss - ss[-1])
        plt.rcParams.update(plotting_params)
        fig, ax = plt.subplots(figsize=(6.5, 4.2))
        ax.loglog(hs, err + 1e-16, "o-", label=r"$|s-s_{\mathrm{ref}}|$")
        ax.loglog(hs, err[0] * (hs / hs[0]) ** 2, "k--", alpha=0.6, label=r"$h^2$ ref")
        ax.invert_xaxis()
        ax.set_xlabel(r"$h=1/n$")
        ax.set_ylabel(r"QoI error")
        ax.xaxis.set_major_locator(mticker.FixedLocator(hs))
        ax.xaxis.set_major_formatter(mticker.FixedFormatter([rf"$1/{n}$" for n in mesh_sizes]))
        ax.xaxis.set_minor_locator(mticker.NullLocator())
        ax.legend(loc="lower left")
        ax.grid(True, which="both", ls=":", alpha=0.7)
        fig.subplots_adjust(bottom=0.14)
        os.makedirs(OUT, exist_ok=True)
        fig.savefig(os.path.join(OUT, "fenics_convergence.png"), dpi=150, bbox_inches="tight",
                    pad_inches=0.12, transparent=True)
        plt.close(fig)
        return hs, ss, err

    @staticmethod
    def parametric_sweep(n_mesh=64):
        mesh = df.UnitSquareMesh(n_mesh, n_mesh)
        V, _, A0, A1, b, L = Heat2DFEM.assemble(mesh)
        s_list, t_list = [], []
        t0 = time.perf_counter()
        for xi in tqdm(Heat2DFEM.XI_TEST, desc="FEM parametric"):
            t1 = time.perf_counter()
            u = Heat2DFEM.solve_vec(A0, A1, b, V, xi)
            t_list.append(time.perf_counter() - t1)
            s_list.append(Heat2DFEM.qoi(L, u))
        return np.array(s_list), np.array(t_list), time.perf_counter() - t0, V, A0, A1, b, L

    @staticmethod
    def save_field(n_mesh=64, xi=1.0):
        mesh = df.UnitSquareMesh(n_mesh, n_mesh)
        V, _, A0, A1, b, L = Heat2DFEM.assemble(mesh)
        u_vec = Heat2DFEM.solve_vec(A0, A1, b, V, xi)
        u = df.Function(V)
        u.vector().set_local(u_vec)
        u.vector().apply("insert")
        plt.rcParams.update(plotting_params)
        fig, ax = plt.subplots(figsize=(5.4, 4.6))
        c = df.plot(u, cmap="seismic")
        cbar = fig.colorbar(c, ax=ax, label=r"$u$", shrink=0.75, pad=0.02)
        cbar.ax.tick_params(labelsize=15)
        cbar.set_label(r"$u$", fontsize=15)
        x0, y0, r = Heat2DFEM.X0[0], Heat2DFEM.X0[1], Heat2DFEM.PROBE_R
        probe = plt.Circle((x0, y0), r, fill=False, ec="cyan", lw=2, ls="--")
        ax.add_patch(probe)
        ax.plot(x0, y0, "o", color="cyan", ms=7, mew=1.5, mec="white", zorder=5)
        ax.annotate(r"$x_0$", (x0, y0), xytext=(x0 + 0.14, y0 + 0.06), textcoords="data",
                    color="cyan", fontsize=15,
                    arrowprops=dict(arrowstyle="-", color="cyan", lw=1.2, shrinkA=4, shrinkB=4))
        ax.set_aspect("equal")
        ax.set_xlim(-0.02, 1.02)
        ax.set_ylim(-0.02, 1.02)
        ax.set_title(rf"FEM field, $\xi={xi:.2f}$", pad=10, fontsize=15)
        fig.subplots_adjust(left=0.12, right=0.88, top=0.92, bottom=0.10)
        os.makedirs(OUT, exist_ok=True)
        fig.savefig(os.path.join(OUT, "fenics_field.png"), dpi=150, bbox_inches="tight",
                    pad_inches=0.08, transparent=True)
        plt.close(fig)
        return u_vec, L


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    hs, ss, err = Heat2DFEM.convergence()
    s_fem, t_each, t_total, _, _, _, _, _ = Heat2DFEM.parametric_sweep()
    u_ref, L_ref = Heat2DFEM.save_field()
    np.savez(os.path.join(OUT, "fenics_results.npz"),
             xi_test=Heat2DFEM.XI_TEST, s_fem=s_fem, t_each=t_each, t_total=t_total,
             t_per_xi=t_total / len(Heat2DFEM.XI_TEST), hs=hs, ss=ss, err=err,
             x0=np.array(Heat2DFEM.X0), probe_r=Heat2DFEM.PROBE_R, s_ref=s_fem[-1])
    tqdm.write(f"FEM QoI at xi={Heat2DFEM.XI_REF}: {Heat2DFEM.qoi(L_ref, u_ref):.6f}")
    tqdm.write(f"FEM total parametric time: {t_total:.3f} s  ({t_total/len(Heat2DFEM.XI_TEST)*1e3:.2f} ms/query)")
