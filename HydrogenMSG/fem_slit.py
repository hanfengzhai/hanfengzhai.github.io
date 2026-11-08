"""Plane-strain mode-I slit FEM with MSG plasticity and HELP softening.

Qualitative appendix demonstration: a center-crack quarter model under remote
tension, solved with the same lower-order CMSG deformation-theory secant
scheme as ``fem_msg.py``, but in plane strain and with Formulation~C HELP
amplitude softening (``Params.xi > 0``) active in the constitutive loop.

Geometry (quarter model)
------------------------
Crack of half-length ``a`` along ``y = 0``, ``0 <= x <= a`` (traction free).
Ligament ``y = 0``, ``x >= a`` has ``u_y = 0``. Symmetry ``x = 0`` has
``u_x = 0``. Remote tension ``sigma_yy = S * sigY`` is applied on ``y = H``.

Discretisation
--------------
Nine-node biquadratic plane-strain elements on a tip-graded Cartesian mesh.
B-bar (Q2/P1) volumetric projection; effective strain gradient from an L2
projection of Gauss-point strains (Cartesian plane-strain reduction of the
``eta_ijk = u_{k,ij}`` invariant used in ``fem_msg``).

Usage:  python3 scripts/fem_slit.py
"""

from __future__ import annotations

import os
import sys
from dataclasses import dataclass

import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import spsolve, splu

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from msg_hydrogen import (Params, f_elastic_power, theta_L_local, theta_T)

NDOF_E = 18
_M = np.array([1.0, 1.0, 1.0, 0.0])


def _shape(xi, et):
    """Q9 shape functions and parent derivatives; node index = j*3 + i."""
    lx = np.array([0.5 * xi * (xi - 1.0), 1.0 - xi * xi, 0.5 * xi * (xi + 1.0)])
    ly = np.array([0.5 * et * (et - 1.0), 1.0 - et * et, 0.5 * et * (et + 1.0)])
    dx = np.array([xi - 0.5, -2.0 * xi, xi + 0.5])
    dy = np.array([et - 0.5, -2.0 * et, et + 0.5])
    return (np.outer(ly, lx).ravel(), np.outer(ly, dx).ravel(),
            np.outer(dy, lx).ravel())


def _graded_segment(x0, x1, n_el, tip_at_right, ratio=1.18):
    """Interior + endpoint node abscissae with geometric grading toward a tip."""
    n = 2 * n_el + 1
    if abs(ratio - 1.0) < 1e-12:
        t = np.linspace(0.0, 1.0, n)
    else:
        g = np.array([ratio ** k for k in range(n)], dtype=float)
        t = (g - g[0]) / (g[-1] - g[0])
    if tip_at_right:
        t = 1.0 - t[::-1]
    return x0 + (x1 - x0) * t


@dataclass
class Mesh:
    coords: np.ndarray       # (nnode, 2) -> (x, y)
    conn: np.ndarray         # (nelem, 9)
    a: float
    W: float
    H: float
    nx_c: int
    nx_l: int
    ny: int
    left: np.ndarray         # x = 0
    crack: np.ndarray        # y = 0, x < a (exclude tip)
    ligament: np.ndarray     # y = 0, x >= a
    top_edges: np.ndarray    # (n_top, 3) node triples on y = H
    tip: int                 # crack-tip node index

    @property
    def nnode(self):
        return self.coords.shape[0]

    @property
    def ndof(self):
        return 2 * self.nnode

    @property
    def nx(self):
        return self.nx_c + self.nx_l


def _join_segments(*segs):
    """Concatenate 1D node arrays, dropping duplicated joints."""
    out = [np.asarray(segs[0], dtype=float)]
    for s in segs[1:]:
        s = np.asarray(s, dtype=float)
        if len(s) == 0:
            continue
        out.append(s[1:] if np.isclose(s[0], out[-1][-1]) else s)
    return np.concatenate(out)


def make_mesh(a=1.0, W=None, H=None, nx_c=14, nx_l=18, ny=20, ratio=1.10,
              tip_box=1.0, nx_box=None, ny_box=None):
    """Quarter-plate Q9 mesh with a uniform fine tip window.

    A uniform Cartesian patch covers ``[0, a+tip_box*a] x [0, tip_box*a]``
    (the SI tip window of side ``2a`` when ``tip_box=1``). Mild geometric
    grading is used only outside that window to reach the remote boundary.
    """
    W = W if W is not None else 12.0 * a
    H = H if H is not None else 12.0 * a
    tb = float(tip_box) * a
    # Uniform tip-box resolution (elements). Defaults keep cost moderate.
    nx_box = int(nx_box if nx_box is not None else max(2 * ((nx_c + 1) // 1), 28))
    ny_box = int(ny_box if ny_box is not None else max(ny, 28))
    if nx_box % 2:
        nx_box += 1
    n_left = max(nx_box // 2, 4)           # crack side of tip
    n_right_box = max(nx_box // 2, 4)      # ligament inside tip box
    n_out_x = max(nx_l, 6)                 # graded ligament outside tip box
    n_out_y = max(max(ny - ny_box, 0) + 6, 6)

    x_box = min(a + tb, W)
    y_box = min(tb, H)
    xs = _join_segments(
        np.linspace(0.0, a, 2 * n_left + 1),
        np.linspace(a, x_box, 2 * n_right_box + 1),
        (_graded_segment(x_box, W, n_out_x, tip_at_right=False, ratio=ratio)
         if x_box < W - 1e-14 * a else np.array([W])),
    )
    ys = _join_segments(
        np.linspace(0.0, y_box, 2 * ny_box + 1),
        (_graded_segment(y_box, H, n_out_y, tip_at_right=False, ratio=ratio)
         if y_box < H - 1e-14 * a else np.array([H])),
    )
    xs = np.unique(np.round(xs, decimals=12))
    ys = np.unique(np.round(ys, decimals=12))
    # Ensure odd node counts for Q9 (drop last interior if needed).
    if len(xs) % 2 == 0:
        xs = np.delete(xs, -2)
    if len(ys) % 2 == 0:
        ys = np.delete(ys, -2)

    nx_nodes, ny_nodes = len(xs), len(ys)
    n_ex = (nx_nodes - 1) // 2
    n_ey = (ny_nodes - 1) // 2
    tip_ix = int(np.argmin(np.abs(xs - a)))
    if tip_ix % 2:
        # Snap tip to nearest even node index (element corner).
        tip_ix = tip_ix - 1 if tip_ix > 0 else tip_ix + 1
    nx_c_eff = tip_ix // 2
    nx_l_eff = n_ex - nx_c_eff

    X, Y = np.meshgrid(xs, ys, indexing="ij")
    coords = np.column_stack([X.ravel(), Y.ravel()])
    nid = np.arange(nx_nodes * ny_nodes).reshape(nx_nodes, ny_nodes)

    conn = np.empty((n_ex * n_ey, 9), dtype=int)
    e = 0
    for ix in range(n_ex):
        for iy in range(n_ey):
            i0, j0 = 2 * ix, 2 * iy
            conn[e] = [nid[i0 + di, j0 + dj]
                       for dj in range(3) for di in range(3)]
            e += 1

    left = nid[0, :].copy()
    bottom = nid[:, 0].copy()
    tip = int(nid[tip_ix, 0])
    crack = bottom[coords[bottom, 0] < a - 1e-14 * a]
    ligament = bottom[coords[bottom, 0] >= a - 1e-14 * a]

    top = nid[:, ny_nodes - 1]
    top_edges = np.array([[top[2 * ix + k] for k in range(3)]
                          for ix in range(n_ex)])
    return Mesh(coords, conn, a, W, H, nx_c_eff, nx_l_eff, n_ey,
                left, crack, ligament, top_edges, tip)


class Kinematics:
    """Plane-strain Q9 kinematics with B-bar volumetric projection."""

    def __init__(self, mesh):
        gp, gw = np.polynomial.legendre.leggauss(3)
        pts = [(gp[i], gp[j]) for j in range(3) for i in range(3)]
        wts = np.array([gw[j] * gw[i] for j in range(3) for i in range(3)])

        ne, ng = mesh.conn.shape[0], len(pts)
        xy = mesh.coords[mesh.conn]
        self.mesh, self.ne, self.ng = mesh, ne, ng
        self.N = np.empty((ne, ng, 9))
        self.dNdx = np.empty((ne, ng, 9))
        self.dNdy = np.empty((ne, ng, 9))
        self.x = np.empty((ne, ng))
        self.y = np.empty((ne, ng))
        self.w = np.empty((ne, ng))

        for g, ((xi, et), wg) in enumerate(zip(pts, wts)):
            N, dxi, det = _shape(xi, et)
            J = np.einsum("na,eni->eia", np.column_stack([dxi, det]), xy)
            detJ = J[:, 0, 0] * J[:, 1, 1] - J[:, 0, 1] * J[:, 1, 0]
            inv = np.empty_like(J)
            inv[:, 0, 0] = J[:, 1, 1] / detJ
            inv[:, 1, 1] = J[:, 0, 0] / detJ
            inv[:, 0, 1] = -J[:, 0, 1] / detJ
            inv[:, 1, 0] = -J[:, 1, 0] / detJ
            self.N[:, g] = N
            self.dNdx[:, g] = (inv[:, 0, 0][:, None] * dxi
                               + inv[:, 1, 0][:, None] * det)
            self.dNdy[:, g] = (inv[:, 0, 1][:, None] * dxi
                               + inv[:, 1, 1][:, None] * det)
            self.x[:, g] = xy[:, :, 0] @ N
            self.y[:, g] = xy[:, :, 1] @ N
            self.w[:, g] = detJ * wg

        self._pbasis = np.array([[1.0, xi, et] for xi, et in pts])
        self._lu = None
        self.B0 = self._bmat()
        self.B = self._bbar()
        self.dofs = np.empty((ne, NDOF_E), dtype=int)
        self.dofs[:, 0::2] = 2 * mesh.conn
        self.dofs[:, 1::2] = 2 * mesh.conn + 1
        self.rows = np.repeat(self.dofs, NDOF_E, axis=1).ravel()
        self.cols = np.tile(self.dofs, (1, NDOF_E)).ravel()

    def _bmat(self):
        # Strain order: [eps_xx, eps_yy, eps_zz=0, gamma_xy].
        B = np.zeros((self.ne, self.ng, 4, NDOF_E))
        B[:, :, 0, 0::2] = self.dNdx
        B[:, :, 1, 1::2] = self.dNdy
        B[:, :, 3, 0::2] = self.dNdy
        B[:, :, 3, 1::2] = self.dNdx
        return B

    def _bbar(self):
        B = self.B0.copy()
        bvol = (B[:, :, 0] + B[:, :, 1] + B[:, :, 2]) / 3.0
        phi = self._pbasis
        M = np.einsum("eg,ga,gb->eab", self.w, phi, phi)
        rhs = np.einsum("eg,ga,egi->eai", self.w, phi, bvol)
        c = np.linalg.solve(M, rhs)
        btil = np.einsum("ga,eai->egi", phi, c)
        for k in range(3):
            B[:, :, k] += btil - bvol
        return B

    def strains(self, u, bbar=True):
        B = self.B if bbar else self.B0
        return np.einsum("egij,ej->egi", B, u[self.dofs])

    def project(self, q):
        if self._lu is None:
            conn = self.mesh.conn
            Me = np.einsum("eg,egm,egn->emn", self.w, self.N, self.N)
            rows = np.repeat(conn, 9, axis=1).ravel()
            cols = np.tile(conn, (1, 9)).ravel()
            M = coo_matrix((Me.ravel(), (rows, cols)),
                           shape=(self.mesh.nnode,) * 2).tocsc()
            self._lu = splu(M)
        q = np.atleast_3d(q)
        rhs = np.zeros((self.mesh.nnode, q.shape[2]))
        np.add.at(rhs, self.mesh.conn.ravel(),
                  np.einsum("eg,egn,egc->enc", self.w, self.N, q)
                  .reshape(-1, q.shape[2]))
        return self._lu.solve(rhs)

    def nodal_gradient(self, nodal):
        vals = nodal[self.mesh.conn]
        return (np.einsum("egn,enc->egc", self.dNdx, vals),
                np.einsum("egn,enc->egc", self.dNdy, vals))


def effective_strain_gradient(kin, eps):
    """eta^e = sqrt(eta_ijk eta_ijk / 4) for plane strain.

    Index order (x, y, z) = (0, 1, 2). Out-of-plane shear strains vanish and
    eps_zz = 0, so only in-plane Cartesian derivatives of (eps_xx, eps_yy,
    gamma_xy) enter.
    """
    nodal = kin.project(eps)
    dx, dy = kin.nodal_gradient(nodal)
    ne, ng = kin.ne, kin.ng
    D = np.zeros((ne, ng, 3, 3, 3))
    # eps_xx, eps_yy stored as comps 0, 1; gamma_xy as comp 3.
    D[:, :, 0, 0, 0] = dx[:, :, 0]
    D[:, :, 0, 0, 1] = dy[:, :, 0]
    D[:, :, 1, 1, 0] = dx[:, :, 1]
    D[:, :, 1, 1, 1] = dy[:, :, 1]
    D[:, :, 0, 1, 0] = D[:, :, 1, 0, 0] = 0.5 * dx[:, :, 3]
    D[:, :, 0, 1, 1] = D[:, :, 1, 0, 1] = 0.5 * dy[:, :, 3]
    T1 = D.transpose(0, 1, 2, 4, 3)
    eta = T1 + T1.transpose(0, 1, 3, 2, 4) - D
    return np.sqrt(np.einsum("egijk,egijk->eg", eta, eta) / 4.0)


def _top_traction(mesh, S, sigY):
    """Consistent nodal forces for t = (0, S sigY) on y = H."""
    f = np.zeros(mesh.ndof)
    gp, gw = np.polynomial.legendre.leggauss(3)
    for edge in mesh.top_edges:
        xy = mesh.coords[edge]
        for s, wg in zip(gp, gw):
            L = np.array([0.5 * s * (s - 1.0), 1.0 - s * s, 0.5 * s * (s + 1.0)])
            dL = np.array([s - 0.5, -2.0 * s, s + 0.5])
            jac = abs(dL @ xy[:, 0])
            t = np.array([0.0, S * sigY])
            fe = jac * wg * np.outer(L, t)
            f[2 * edge] += fe[:, 0]
            f[2 * edge + 1] += fe[:, 1]
    return f


def hydrogen_fields(sol):
    """Trap and lattice hydrogen from the mechanical fields (Oriani).

    Formulation~C: $N_T$ uses the hydrogen-free Taylor density
    $\rho_T=[f^2+l\eta]/(l b)$, not the softened flow stress.
    """
    p = sol["p"]
    rho_hat = f_elastic_power(sol["eps_e"], p) ** 2 + sol["l_eta"]
    thL = theta_L_local(sol["sig_m_hat"], p)
    thT = theta_T(thL, p)
    thT0 = theta_T(p.thetaL0, p)
    return dict(rho_T_hat=rho_hat,
                N_T=p.chi * rho_hat / (p.l * p.b ** 2),
                cL_rel=thL / p.thetaL0,
                theta_T=thT,
                soft=1.0 - p.xi * thT,
                cT_norm=(thT / thT0) * rho_hat)


def solve(l_over_a=5.0, S=1.0, p=None, a=None,
          nx_c=14, nx_l=18, ny=20, W_over_a=12.0, H_over_a=12.0,
          ratio=1.10, tip_box=1.0, nx_box=None, ny_box=None,
          nu=None, tol=1e-7, itmax=400, relax=0.4,
          verbose=False, progress=None, tol_mu=None):
    """Secant-iteration CMSG plane-strain slit solution with HELP softening.

    ``l_over_a = 0`` recovers classical J2 deformation theory. Returns a dict
    of Gauss-point fields plus mesh / kinematics / nodal displacement.

    Elastic constants: Young modulus from ``p.E_over_sigY``; Poisson ratio
    defaults to ``p.nu_fem``. The MSG length uses constitutive
    ``p.mu_over_sigY``, distinct from the FEM elastic shear modulus.

    ``progress``, if given, is called as ``progress(frac, message)`` with
    ``frac`` in ``[0, 1]`` after each secant iteration.
    """
    p = p or Params(xi=0.3)
    nu = p.nu_fem if nu is None else float(nu)
    tol_mu = tol if tol_mu is None else float(tol_mu)
    a = a or (p.l / l_over_a if l_over_a > 0 else 1e-5)
    mesh = make_mesh(a, W=W_over_a * a, H=H_over_a * a,
                     nx_c=nx_c, nx_l=nx_l, ny=ny, ratio=ratio,
                     tip_box=tip_box, nx_box=nx_box, ny_box=ny_box)
    kin = Kinematics(mesh)

    E = p.E_over_sigY * p.sigY
    mu_e = E / (2.0 * (1.0 + nu))
    K = E / (3.0 * (1.0 - 2.0 * nu))

    fixed = np.unique(np.concatenate([
        2 * mesh.left,                 # u_x = 0 on x = 0
        2 * mesh.ligament + 1,         # u_y = 0 on ligament
    ]))
    free = np.setdiff1d(np.arange(mesh.ndof), fixed)
    fext = _top_traction(mesh, S, p.sigY)[free]

    Idev = np.eye(3) - np.ones((3, 3)) / 3.0
    mu = np.full((kin.ne, kin.ng), mu_e)
    u = np.zeros(mesh.ndof)

    def state(u_vec):
        eps = kin.strains(u_vec)
        tr = eps[:, :, :3].sum(axis=2)
        dev = eps.copy()
        dev[:, :, :3] -= tr[:, :, None] / 3.0
        eps_e = np.maximum(
            np.sqrt(2.0 / 3.0 * (np.sum(dev[:, :, :3] ** 2, axis=2)
                                 + 0.5 * eps[:, :, 3] ** 2)), 1e-14)
        eta = (effective_strain_gradient(kin, kin.strains(u_vec, bbar=False))
               if l_over_a > 0.0 else np.zeros_like(eps_e))
        sig_m = K * tr / p.sigY
        soft = (1.0 - p.xi * theta_T(theta_L_local(sig_m, p), p)
                if p.xi > 0.0 else 1.0)
        sig_e = soft * p.sigY * np.sqrt(f_elastic_power(eps_e, p) ** 2
                                        + p.l * eta)
        mu_s = np.minimum(sig_e / (3.0 * eps_e), mu_e)
        return dict(eps=eps, dev=dev, tr=tr, eps_e=eps_e, eta=eta,
                    sig_e=sig_e, mu=mu_s, soft=soft)

    # Simple load ramp: a few proportional steps improve secant convergence
    # under HELP softening near the tip.
    n_ramp = 4
    resid = np.inf
    resid_mu = np.inf
    it_total = 0
    if progress is not None:
        progress(0.05, "Mesh ready — starting load ramp")
    for step in range(1, n_ramp + 1):
        load_fac = step / n_ramp
        fstep = load_fac * fext
        for it in range(itmax // n_ramp):
            D = np.zeros((kin.ne, kin.ng, 4, 4))
            D[:, :, :3, :3] = (2.0 * mu[:, :, None, None] * Idev
                               + K * np.ones((3, 3)))
            D[:, :, 3, 3] = mu
            DB = np.einsum("egij,egjk->egik", D, kin.B)
            Ke = np.einsum("eg,egji,egjk->eik", kin.w, kin.B, DB)
            A = coo_matrix((Ke.ravel(), (kin.rows, kin.cols)),
                           shape=(mesh.ndof, mesh.ndof)).tocsr()
            unew = np.zeros(mesh.ndof)
            unew[free] = spsolve(A[free][:, free], fstep)

            st = state(unew)
            resid = np.max(np.abs(unew - u)) / max(np.max(np.abs(unew)), 1e-30)
            mu_new = (1.0 - relax) * mu + relax * st["mu"]
            resid_mu = (np.max(np.abs(mu_new - mu))
                        / max(np.max(np.abs(mu_new)), 1e-30))
            u = unew
            mu = mu_new
            it_total += 1
            if verbose and it_total % 40 == 0:
                print(f"  step {step}/{n_ramp} it {it_total:3d}  "
                      f"|du|/|u| = {resid:.2e}  |dμ|/|μ| = {resid_mu:.2e}")
            if progress is not None:
                per_step = max(itmax // n_ramp, 1)
                frac = ((step - 1) + (it + 1) / per_step) / n_ramp
                progress(
                    min(0.99, frac),
                    f"Load step {step}/{n_ramp}, iteration {it_total}  "
                    f"|Δu|/|u| = {resid:.2e}, |Δμ|/|μ| = {resid_mu:.2e}",
                )
            if resid < tol and resid_mu < tol_mu and it > 2:
                break

    converged = bool(resid < tol and resid_mu < tol_mu)
    if progress is not None:
        if converged:
            progress(1.0, f"Converged in {it_total} iterations")
        else:
            progress(
                1.0,
                f"Not converged after {it_total} iterations "
                f"(|Δu|/|u| = {resid:.2e}, |Δμ|/|μ| = {resid_mu:.2e})",
            )

    st = state(u)
    sig = 2.0 * st["mu"][:, :, None] * st["dev"] + K * st["tr"][:, :, None] * _M
    ux = u[0::2]
    uy = u[1::2]
    u_mag = np.sqrt(ux ** 2 + uy ** 2)

    out = dict(mesh=mesh, kin=kin, p=p, u=u, ux=ux, uy=uy, u_mag=u_mag,
               iters=it_total, resid=resid, resid_mu=resid_mu,
               converged=converged, tol=tol, tol_mu=tol_mu,
               l_over_a=l_over_a, S=S, a=a, nu=nu,
               mu_fem_over_sigY=mu_e / p.sigY,
               mu_ref_over_sigY=p.mu_over_sigY,
               eps=st["eps"], eps_e=st["eps_e"], eta=st["eta"],
               l_eta=p.l * st["eta"], soft=st["soft"],
               sig_m_hat=sig[:, :, :3].sum(axis=2) / 3.0 / p.sigY,
               sig_e_hat=st["sig_e"] / p.sigY,
               sig_xx_hat=sig[:, :, 0] / p.sigY,
               sig_yy_hat=sig[:, :, 1] / p.sigY)
    out["u_mag_a"] = _nodal_to_gauss(kin, u_mag) / a
    out["uy_a"] = _nodal_to_gauss(kin, uy) / a
    out.update(hydrogen_fields(out))
    # Half-opening on the symmetry model: u_y(0,0+)/a.
    # Full Mode-I COD/a between opposite faces is twice this value.
    out["cod"] = float(uy[mesh.left[0]] / a)
    out["cod_full"] = 2.0 * out["cod"]
    return out


def _nodal_to_gauss(kin, nodal):
    """Interpolate a nodal scalar to Gauss points with the Q9 shape functions."""
    return np.einsum("egn,en->eg", kin.N, nodal[kin.mesh.conn])


def crack_opening(sol):
    """Half-opening u_y(0,0+)/a on the upper symmetry face.

    For a full centre crack the conventional COD/a between opposite faces is
    twice this value. Prefer ``sol['cod']`` / ``sol['cod_full']`` from ``solve``.
    """
    mesh, uy = sol["mesh"], sol["uy"]
    mouth = mesh.left[0]   # (x,y) = (0,0)
    return float(uy[mouth] / mesh.a)


def tip_window_metrics(sol, r_probe=0.25, r_lo=0.20, r_hi=0.80):
    """Scalar tip-window monitors (COD, ligament probe, ring averages)."""
    mesh = sol["mesh"]
    a = mesh.a
    x = sol["kin"].x.ravel()
    y = sol["kin"].y.ravel()
    r = np.hypot(x - a, y) / a

    def g(key):
        return sol[key].ravel()

    lig = (x >= a) & (np.abs(y) <= 0.08 * a)
    if not np.any(lig):
        raise RuntimeError("no ligament samples for probe metrics")
    order = np.argsort(r[lig])
    rr = r[lig][order]

    def lig_at(key):
        return float(np.interp(r_probe, rr, g(key)[lig][order]))

    ring = (r >= r_lo) & (r <= r_hi) & (y >= 0.0)
    if not np.any(ring):
        raise RuntimeError("empty tip ring for average metrics")

    tip_box = float(getattr(mesh, "tip_box", 0.55))
    # Prefer explicit tip_box stored on the solve if present.
    tip_box = float(sol.get("tip_box", tip_box))
    h = (2.0 * tip_box * a) / max(sol.get("nx_box", mesh.nx_c + mesh.nx_l), 1)

    return dict(
        cod=float(sol["cod"]),
        ne=int(mesh.conn.shape[0]),
        nnode=int(mesh.nnode),
        ndof=int(mesh.ndof),
        nx_c=int(mesh.nx_c),
        nx_l=int(mesh.nx_l),
        ny=int(mesh.ny),
        r_probe=float(r_probe),
        eps_e_p=lig_at("eps_e"),
        sig_m_p=lig_at("sig_m_hat"),
        soft_p=lig_at("soft"),
        cT_p=lig_at("cT_norm"),
        soft_ring=float(g("soft")[ring].mean()),
        cT_ring=float(g("cT_norm")[ring].mean()),
        eps_e_ring=float(g("eps_e")[ring].mean()),
        iters=int(sol["iters"]),
        resid=float(sol["resid"]),
        h=float(h / a),  # tip-box element size / a
    )


def sample_field_on_grid(sol, key, xi, yi):
    """Interpolate a Gauss-point field onto a structured tip-centred grid.

    ``xi``, ``yi`` are tip-centred coordinates ``(x-a)/a``, ``y/a``.
    """
    from scipy.interpolate import griddata

    a = sol["a"]
    x = sol["kin"].x.ravel() / a - 1.0
    y = sol["kin"].y.ravel() / a
    f = sol[key].ravel()
    # Mirror across the crack plane (uy odd; other scalars even).
    upper = y > 1e-12
    x_all = np.concatenate([x, x[upper]])
    y_all = np.concatenate([y, -y[upper]])
    if key in ("uy_a",):
        f_all = np.concatenate([f, -f[upper]])
    else:
        f_all = np.concatenate([f, f[upper]])
    Xi, Yi = np.meshgrid(xi, yi)
    Fi = griddata(np.column_stack([x_all, y_all]), f_all, (Xi, Yi),
                  method="linear")
    slit = (Xi < -1e-3) & (np.abs(Yi) < 0.03)
    miss = ~np.isfinite(Fi) & ~slit
    if miss.any():
        Fi[miss] = griddata(np.column_stack([x_all, y_all]), f_all,
                            (Xi[miss], Yi[miss]), method="nearest")
    Fi = np.where(slit, np.nan, Fi)
    return Fi


def relative_L2(F, Fref, dA):
    """Relative L2 norm ``||F-Fref||_2 / ||Fref||_2`` on a uniform grid."""
    diff = np.asarray(F - Fref, dtype=float)
    ref = np.asarray(Fref, dtype=float)
    num = np.sqrt(np.nansum(diff * diff) * dA)
    den = np.sqrt(np.nansum(ref * ref) * dA)
    return float(num / max(den, 1e-30))


def observed_rate(h, err):
    """Local observed order ``p`` from consecutive ``(h, err)`` pairs."""
    h = np.asarray(h, dtype=float)
    err = np.asarray(err, dtype=float)
    p = np.full(len(h), np.nan)
    for i in range(len(h) - 1):
        if err[i] > 0.0 and err[i + 1] > 0.0 and h[i] > h[i + 1]:
            p[i] = np.log(err[i] / err[i + 1]) / np.log(h[i] / h[i + 1])
    return p


def mesh_refinement_ladder():
    """Nested uniform tip-window meshes for the SI L2 convergence study.

    Outer box ``W/a = H/a = 14``, tip window ``tip_box = 1`` (side ``2a``),
    and outer grading ``ratio = 1.12`` are fixed. Element aspect is kept
    near unity (``ny_box = nx_box / 2``). Production mesh is M3 (``80 x 40``).
    """
    return (
        dict(label="M1", nx_c=10, nx_l=8, ny=10, nx_box=20, ny_box=10,
             tip_box=1.0),
        dict(label="M2", nx_c=20, nx_l=10, ny=20, nx_box=40, ny_box=20,
             tip_box=1.0),
        dict(label="M3", nx_c=40, nx_l=12, ny=40, nx_box=80, ny_box=40,
             tip_box=1.0),
        dict(label="M4", nx_c=60, nx_l=14, ny=60, nx_box=120, ny_box=60,
             tip_box=1.0),
    )


def run_mesh_convergence(l_over_a=5.0, S=1.0, xi=0.3,
                         W_over_a=14.0, H_over_a=14.0,
                         verbose=True, n_grid=160, **solve_kw):
    """Solve the HELP slit ladder and attach tip-window relative L2 errors.

    Relative L2 norms use the finest mesh as reference, sampled on a common
    structured grid over the tip window ``|x-a|<=a``, ``|y|<=a`` (``tip_box=1``).
    """
    p = Params(xi=xi)
    rows = []
    sols = []
    for spec in mesh_refinement_ladder():
        tip_box = float(spec.get("tip_box", 1.0))
        kw = dict(nx_c=spec["nx_c"], nx_l=spec["nx_l"], ny=spec["ny"],
                  nx_box=spec["nx_box"], ny_box=spec["ny_box"],
                  tip_box=tip_box,
                  W_over_a=W_over_a, H_over_a=H_over_a, ratio=1.12,
                  itmax=600, relax=0.35, tol=1e-6)
        kw.update(solve_kw)
        if verbose:
            print(f"  {spec['label']}: tip_window={spec['nx_box']}x{spec['ny_box']} "
                  f"...", flush=True)
        sol = solve(l_over_a=l_over_a, S=S, p=p, **kw)
        sol["tip_box"] = tip_box
        sol["nx_box"] = int(spec["nx_box"])
        met = tip_window_metrics(sol)
        met["label"] = spec["label"]
        met["nx_box"] = spec["nx_box"]
        met["ny_box"] = spec["ny_box"]
        met["tip_box"] = tip_box
        if verbose:
            print(f"    ne={met['ne']}, h/a={met['h']:.4e}, COD/a={met['cod']:.6e}, "
                  f"iters={met['iters']}, resid={met['resid']:.2e}",
                  flush=True)
        rows.append(met)
        sols.append(sol)

    # Common tip-window evaluation grid (finest mesh = reference).
    tip_box = float(rows[-1]["tip_box"])
    xi = np.linspace(-tip_box, tip_box, n_grid)
    yi = np.linspace(-tip_box, tip_box, n_grid)
    dA = (xi[1] - xi[0]) * (yi[1] - yi[0])
    keys = ("uy_a", "eps_e", "sig_m_hat", "cT_norm")
    ref = {k: sample_field_on_grid(sols[-1], k, xi, yi) for k in keys}
    for row, sol in zip(rows, sols):
        for k in keys:
            F = sample_field_on_grid(sol, k, xi, yi)
            row[f"L2_{k}"] = relative_L2(F, ref[k], dA)
        if verbose:
            print(f"  {row['label']} L2: uy={row['L2_uy_a']:.3e}, "
                  f"eps_e={row['L2_eps_e']:.3e}, "
                  f"sig_m={row['L2_sig_m_hat']:.3e}, "
                  f"cT={row['L2_cT_norm']:.3e}", flush=True)
    # Observed rates from successive (h, e) pairs excluding the exact-zero finest.
    h = np.array([r["h"] for r in rows], dtype=float)
    for k in keys:
        err = np.array([r[f"L2_{k}"] for r in rows], dtype=float)
        rates = observed_rate(h[:-1], err[:-1])
        for i, r in enumerate(rows[:-1]):
            r[f"rate_{k}"] = float(rates[i]) if np.isfinite(rates[i]) else None
        rows[-1][f"rate_{k}"] = None
        # Least-squares rate over all nonzero errors vs finest.
        mask = err[:-1] > 0.0
        if np.count_nonzero(mask) >= 2:
            p_fit = float(np.polyfit(np.log(h[:-1][mask]),
                                     np.log(err[:-1][mask]), 1)[0])
        else:
            p_fit = None
        for r in rows:
            r[f"p_fit_{k}"] = p_fit
    return rows


def gauss_points(sol):
    kin = sol["kin"]
    return kin.x.ravel(), kin.y.ravel()


def tip_profile(sol, key, tol=0.08):
    """Sample a field along the ligament ahead of the tip (y ~ 0, x >= a)."""
    x, y = gauss_points(sol)
    a = sol["a"]
    m = (x >= a) & (np.abs(y) <= tol * a)
    order = np.argsort(x[m])
    return (x[m][order] - a) / a, sol[key].ravel()[m][order]


def verify_elastic(S=0.05, a=1.0):
    """Near-tip sigma_yy vs K_I / sqrt(2 pi r) for an infinite-plate estimate.

    Uses classical elasticity (l = 0, no HELP) at a small remote load. The
    infinite-plate K_I = S sigY sqrt(pi a) is only approximate on a finite
    plate, so the check reports the median relative error on a tip ring.
    """
    p = Params(xi=0.0)
    sol = solve(l_over_a=0.0, S=S, p=p, a=a, nx_c=16, nx_l=20, ny=22,
                W_over_a=20.0, H_over_a=20.0, itmax=8, tol=1e-8)
    r, sy = tip_profile(sol, "sig_yy_hat", tol=0.03)
    # Infinite-plate estimate: sigma_yy/sigY ~ S sqrt(pi a) / sqrt(2 pi r).
    m = (r > 0.08) & (r < 0.40)
    exact = S * np.sqrt(a / (2.0 * r[m]))
    err = np.abs(sy[m] / exact - 1.0)
    return dict(cod=sol["cod"], median_err=float(np.median(err)),
                max_err=float(np.max(err)), n=int(m.sum()),
                iters=sol["iters"])


def verify_softening_runs():
    """Smoke test: HELP-on solve converges and softens near the tip."""
    sol = solve(l_over_a=5.0, S=1.0, p=Params(xi=0.3),
                nx_c=10, nx_l=12, ny=14, W_over_a=10.0, H_over_a=10.0,
                verbose=False)
    soft = sol["soft"].ravel()
    return dict(iters=sol["iters"], resid=sol["resid"], cod=sol["cod"],
                soft_min=float(soft.min()), soft_mean=float(soft.mean()),
                eps_e_max=float(sol["eps_e"].max()),
                sig_e_max=float(sol["sig_e_hat"].max()))


if __name__ == "__main__":
    print("mesh + kinematics smoke ...")
    m = make_mesh(a=1.0, nx_c=8, nx_l=10, ny=10)
    k = Kinematics(m)
    print(f"  nodes {m.nnode}, elems {k.ne}, tip at ({m.coords[m.tip, 0]:.3f}, "
          f"{m.coords[m.tip, 1]:.3f})")

    e = verify_elastic()
    print("elastic near-tip sigma_yy vs K_I/sqrt(2 pi r):"
          f"  median {e['median_err']:.1%}, max {e['max_err']:.1%},"
          f" COD/a={e['cod']:.4e}, iters={e['iters']}")

    s = verify_softening_runs()
    print("HELP softening demo:"
          f"  iters={s['iters']}, resid={s['resid']:.2e},"
          f" COD/a={s['cod']:.4e},"
          f" soft in [{s['soft_min']:.3f}, 1], mean {s['soft_mean']:.3f},"
          f" max eps_e={s['eps_e_max']:.4f}, max sig_e/sigY={s['sig_e_max']:.3f}")
