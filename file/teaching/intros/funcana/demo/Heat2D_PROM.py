import os, time
import numpy as np
from tqdm import tqdm

_pkg = os.path.join(os.environ.get("CONDA_PREFIX", ""), "lib", "pkgconfig")
if os.path.isdir(_pkg):
    os.environ["PKG_CONFIG_PATH"] = _pkg + os.pathsep + os.environ.get("PKG_CONFIG_PATH", "")

import dolfin as df
from Heat2D_FEniCS import Heat2DFEM

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "Output")


class Heat2DPROM:
    R = 10
    XI_TRAIN = np.linspace(0.5, 2.0, R)

    @staticmethod
    def _solve_dual(A0, A1, L_load, V, xi):
        A = Heat2DFEM._operator(A0, A1, xi)
        bb = L_load.copy()
        psi = df.Function(V)
        df.solve(A, psi.vector(), bb, "mumps")
        return psi

    @staticmethod
    def _pair_mat(snaps_a, snaps_b, weighted=False):
        r = len(snaps_a)
        M = np.zeros((r, r))
        beta = df.Expression("x[0]<0.5 ? 1.0 : 0.4", degree=1) if weighted else None
        for i in range(r):
            for j in range(r):
                integrand = df.dot(df.grad(snaps_a[i]), df.grad(snaps_b[j]))
                M[i, j] = df.assemble((beta * integrand if weighted else integrand) * df.dx)
        return M

    @staticmethod
    def build_basis(mesh_n=64):
        mesh = df.UnitSquareMesh(mesh_n, mesh_n)
        V, _, A0, A1, b, L = Heat2DFEM.assemble(mesh)
        b_vec, L_vec = b.get_local(), L
        L_load = b.copy()
        L_load.set_local(L_vec)
        L_load.apply("insert")
        snaps_u, snaps_q = [], []
        t_off = time.perf_counter()
        for xi in tqdm(Heat2DPROM.XI_TRAIN, desc="PROM offline"):
            u_vec = Heat2DFEM.solve_vec(A0, A1, b, V, xi)
            u = df.Function(V)
            u.vector().set_local(u_vec)
            u.vector().apply("insert")
            snaps_u.append(u)
            snaps_q.append(Heat2DPROM._solve_dual(A0, A1, L_load, V, xi))
        t_off = time.perf_counter() - t_off
        r = Heat2DPROM.R
        G0 = Heat2DPROM._pair_mat(snaps_u, snaps_u, weighted=False)
        G1 = Heat2DPROM._pair_mat(snaps_u, snaps_u, weighted=True)
        WQG0 = Heat2DPROM._pair_mat(snaps_q, snaps_q, weighted=False)
        WQG1 = Heat2DPROM._pair_mat(snaps_q, snaps_q, weighted=True)
        WQG0cross = Heat2DPROM._pair_mat(snaps_q, snaps_u, weighted=False)
        WQG1cross = Heat2DPROM._pair_mat(snaps_q, snaps_u, weighted=True)
        br = np.array([np.dot(b_vec, snaps_u[i].vector().get_local()) for i in range(r)])
        WQb = np.array([np.dot(b_vec, snaps_q[i].vector().get_local()) for i in range(r)])
        Lr = np.array([np.dot(L_vec, snaps_u[i].vector().get_local()) for i in range(r)])
        LWQ = np.array([np.dot(L_vec, snaps_q[i].vector().get_local()) for i in range(r)])
        return dict(G0=G0, G1=G1, WQG0=WQG0, WQG1=WQG1, WQG0cross=WQG0cross,
                    WQG1cross=WQG1cross, br=br, WQb=WQb, Lr=Lr, LWQ=LWQ, t_off=t_off)

    @staticmethod
    def online(basis, xi_test):
        s_pg, s_pd, t_each = [], [], []
        t0 = time.perf_counter()
        for xi in tqdm(xi_test, desc="PROM online"):
            t1 = time.perf_counter()
            Ar = basis["G0"] + xi * basis["G1"]
            y = np.linalg.solve(Ar, basis["br"])
            s_g = basis["Lr"] @ y
            WAr = basis["WQG0"] + xi * basis["WQG1"]
            rhs = basis["WQb"] - (basis["WQG0cross"] + xi * basis["WQG1cross"]) @ y
            z = np.linalg.solve(WAr, rhs)
            t_each.append(time.perf_counter() - t1)
            s_pg.append(s_g)
            s_pd.append(s_g + basis["LWQ"] @ z)
        return np.array(s_pg), np.array(s_pd), np.array(t_each), time.perf_counter() - t0


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    basis = Heat2DPROM.build_basis()
    s_pg, s_pd, t_each, t_on = Heat2DPROM.online(basis, Heat2DFEM.XI_TEST)
    np.savez(os.path.join(OUT, "prom_results.npz"),
             xi_test=Heat2DFEM.XI_TEST, s_pg=s_pg, s_pd=s_pd, t_each=t_each,
             t_online=t_on, t_offline=basis["t_off"], t_per_xi=t_on / len(Heat2DFEM.XI_TEST),
             r=Heat2DPROM.R)
    tqdm.write(f"PROM offline: {basis['t_off']:.3f} s  |  online: {t_on:.3f} s  "
               f"({t_on/len(Heat2DFEM.XI_TEST)*1e3:.2f} ms/query)")
