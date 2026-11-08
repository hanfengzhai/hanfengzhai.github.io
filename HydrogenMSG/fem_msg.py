"""Axisymmetric finite-element solution of a spherical void in an MSG
plasticity matrix, with hydrogen trapping post-processed from the fields.

Formulation
-----------
The constitutive law of Section 2 is used in its conventional (lower-order)
form: higher-order stresses are dropped, which is the same approximation as
neglecting the O(l_eps^2) terms, so the MSG flow stress

    sigma_e = sigma_Y sqrt( f^2(eps_e) + l eta^e )

can be carried by an ordinary displacement formulation (Huang et al.,
Int. J. Plasticity 20 (2004) 753).  Deformation theory is retained, so each
load level is a nonlinear-elastic boundary value problem, solved here by
secant-modulus iteration.

Discretisation
--------------
Nine-node biquadratic axisymmetric elements on a logarithmically graded
spherical-shell sector R0 <= rho <= Rout, 0 <= theta <= pi/2.  The
volumetric part of B is replaced by its element average (B-bar) so that the
near-incompressible plastic response does not lock.  Remote loading is
applied as a traction sigma^inf_ij n_j on rho = Rout; the void surface is
traction free; symmetry gives u_r = 0 on the axis and u_z = 0 on the
equator.

Strain gradient
---------------
eta_ijk = u_{k,ij} is evaluated as eps_ik;j + eps_jk;i - eps_ij;k from an L2
projection of the Gauss-point strains, using cylindrical covariant
derivatives, and eta^e = sqrt(eta_ijk eta_ijk / 4).  `verify_eta` checks the
operator against the closed-form void value eta^e = 3 sqrt(5/2) u0 R0^2/R^4.

Usage:  python3 scripts/fem_msg.py        (runs the verification + a demo solve)
"""

import os
import sys
from dataclasses import dataclass

import numpy as np
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import spsolve, splu

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from msg_hydrogen import (Params, f_elastic_power, theta_L_local, theta_T,
                          void_fields)

# Strain vector ordering: [eps_rr, eps_zz, eps_pp, gamma_rz].
NDOF_E = 18
_M = np.array([1.0, 1.0, 1.0, 0.0])


# ----------------------------------------------------------------------
# Element technology
# ----------------------------------------------------------------------

def _shape(xi, et):
    """Q9 shape functions and parent derivatives; node index = j*3 + i."""
    lx = np.array([0.5 * xi * (xi - 1.0), 1.0 - xi * xi, 0.5 * xi * (xi + 1.0)])
    ly = np.array([0.5 * et * (et - 1.0), 1.0 - et * et, 0.5 * et * (et + 1.0)])
    dx = np.array([xi - 0.5, -2.0 * xi, xi + 0.5])
    dy = np.array([et - 0.5, -2.0 * et, et + 0.5])
    return (np.outer(ly, lx).ravel(), np.outer(ly, dx).ravel(),
            np.outer(dy, lx).ravel())


@dataclass
class Mesh:
    coords: np.ndarray      # (nnode, 2) -> (r, z)
    conn: np.ndarray        # (nelem, 9)
    R0: float
    Rout: float
    n_rho: int
    n_th: int
    axis: np.ndarray        # nodes on r = 0
    equator: np.ndarray     # nodes on z = 0
    outer_edges: np.ndarray # (n_th, 3) node triples on rho = Rout

    @property
    def nnode(self):
        return self.coords.shape[0]

    @property
    def ndof(self):
        return 2 * self.nnode


def make_mesh(R0, Rout, n_rho=40, n_th=16):
    """Graded spherical-shell sector meshed with Q9 elements."""
    nr, nt = 2 * n_rho + 1, 2 * n_th + 1
    rho = R0 * (Rout / R0) ** np.linspace(0.0, 1.0, nr)
    th = np.linspace(0.0, 0.5 * np.pi, nt)
    RHO, TH = np.meshgrid(rho, th, indexing="ij")
    coords = np.column_stack([(RHO * np.sin(TH)).ravel(),
                              (RHO * np.cos(TH)).ravel()])
    nid = np.arange(nr * nt).reshape(nr, nt)

    conn = np.empty((n_rho * n_th, 9), dtype=int)
    e = 0
    for a in range(n_rho):
        for b in range(n_th):
            i0, j0 = 2 * a, 2 * b
            # local xi runs with theta and eta with rho, which orients the
            # element positively in (r, z): d(r,z)/d(theta,rho) has det +rho.
            conn[e] = [nid[i0 + di, j0 + dj]
                       for di in range(3) for dj in range(3)]
            e += 1

    outer = np.array([[nid[nr - 1, 2 * b + k] for k in range(3)]
                      for b in range(n_th)])
    return Mesh(coords, conn, R0, Rout, n_rho, n_th,
                nid[:, 0].copy(), nid[:, nt - 1].copy(), outer)


class Kinematics:
    """Geometry-dependent element arrays, built once for a fixed mesh."""

    def __init__(self, mesh):
        gp, gw = np.polynomial.legendre.leggauss(3)
        pts = [(gp[i], gp[j]) for j in range(3) for i in range(3)]
        wts = np.array([gw[j] * gw[i] for j in range(3) for i in range(3)])

        ne, ng = mesh.conn.shape[0], len(pts)
        xy = mesh.coords[mesh.conn]                     # (ne, 9, 2)
        self.mesh, self.ne, self.ng = mesh, ne, ng
        self.N = np.empty((ne, ng, 9))
        self.dNdr = np.empty((ne, ng, 9))
        self.dNdz = np.empty((ne, ng, 9))
        self.r = np.empty((ne, ng))
        self.z = np.empty((ne, ng))
        self.w = np.empty((ne, ng))     # axisymmetric weight 2 pi r |J| wg
        self.wp = np.empty((ne, ng))    # plane weight |J| wg

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
            self.dNdr[:, g] = (inv[:, 0, 0][:, None] * dxi
                               + inv[:, 1, 0][:, None] * det)
            self.dNdz[:, g] = (inv[:, 0, 1][:, None] * dxi
                               + inv[:, 1, 1][:, None] * det)
            self.r[:, g] = xy[:, :, 0] @ N
            self.z[:, g] = xy[:, :, 1] @ N
            self.wp[:, g] = detJ * wg
            self.w[:, g] = 2.0 * np.pi * self.r[:, g] * self.wp[:, g]

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
        B = np.zeros((self.ne, self.ng, 4, NDOF_E))
        B[:, :, 0, 0::2] = self.dNdr
        B[:, :, 1, 1::2] = self.dNdz
        B[:, :, 2, 0::2] = self.N / self.r[:, :, None]
        B[:, :, 3, 0::2] = self.dNdz
        B[:, :, 3, 1::2] = self.dNdr
        return B

    def _bbar(self):
        """Volumetric row projected onto element-wise linear fields.

        Q9 with a constant volumetric part (the usual mean-dilatation B-bar)
        makes the pressure element-constant, which is only first-order accurate
        wherever sigma_m varies strongly -- as it does at the void surface.
        Projecting onto span{1, xi, eta} instead gives the inf-sup stable
        Q2/P1-discontinuous pair and a second-order pressure.
        """
        B = self.B0.copy()
        bvol = (B[:, :, 0] + B[:, :, 1] + B[:, :, 2]) / 3.0
        phi = self._pbasis                                  # (ng, 3)
        M = np.einsum("eg,ga,gb->eab", self.w, phi, phi)
        rhs = np.einsum("eg,ga,egi->eai", self.w, phi, bvol)
        c = np.linalg.solve(M, rhs)                         # (ne, 3, ndof)
        btil = np.einsum("ga,eai->egi", phi, c)
        for k in range(3):
            B[:, :, k] += btil - bvol
        return B

    def strains(self, u, bbar=True):
        """Gauss-point strain vectors, shape (ne, ng, 4)."""
        B = self.B if bbar else self.B0
        return np.einsum("egij,ej->egi", B, u[self.dofs])

    def project(self, q):
        """Consistent L2 projection of a Gauss-point field onto the nodes.

        The plane weight |J| w is used rather than the axisymmetric 2 pi r |J| w:
        both are legitimate L2 inner products, but the latter degenerates on the
        symmetry axis where r -> 0.
        """
        if self._lu is None:
            conn = self.mesh.conn
            Me = np.einsum("eg,egm,egn->emn", self.wp, self.N, self.N)
            rows = np.repeat(conn, 9, axis=1).ravel()
            cols = np.tile(conn, (1, 9)).ravel()
            M = coo_matrix((Me.ravel(), (rows, cols)),
                           shape=(self.mesh.nnode,) * 2).tocsc()
            self._lu = splu(M)
        q = np.atleast_3d(q)
        rhs = np.zeros((self.mesh.nnode, q.shape[2]))
        np.add.at(rhs, self.mesh.conn.ravel(),
                  np.einsum("eg,egn,egc->enc", self.wp, self.N, q)
                  .reshape(-1, q.shape[2]))
        return self._lu.solve(rhs)

    def nodal_gradient(self, nodal):
        """d/dr and d/dz of a nodal field at the Gauss points."""
        vals = nodal[self.mesh.conn]                    # (ne, 9, nc)
        return (np.einsum("egn,enc->egc", self.dNdr, vals),
                np.einsum("egn,enc->egc", self.dNdz, vals))


# ----------------------------------------------------------------------
# Effective strain gradient
# ----------------------------------------------------------------------

def effective_strain_gradient(kin, eps):
    """eta^e = sqrt(eta_ijk eta_ijk / 4) with eta_ijk = u_{k,ij}.

    eta_ijk is built from eps_ik;j + eps_jk;i - eps_ij;k using cylindrical
    covariant derivatives; with axisymmetry the only non-vanishing
    phi-derivatives are eps_rphi;phi = (eps_rr - eps_pp)/r and
    eps_phiz;phi = eps_rz/r.
    """
    nodal = kin.project(eps)
    dr, dz = kin.nodal_gradient(nodal)
    ne, ng = kin.ne, kin.ng

    # index order (r, phi, z) = (0, 1, 2)
    D = np.zeros((ne, ng, 3, 3, 3))
    for comp, (a, b) in enumerate([(0, 0), (2, 2), (1, 1)]):
        D[:, :, a, b, 0] = dr[:, :, comp]
        D[:, :, a, b, 2] = dz[:, :, comp]
    D[:, :, 0, 2, 0] = D[:, :, 2, 0, 0] = 0.5 * dr[:, :, 3]
    D[:, :, 0, 2, 2] = D[:, :, 2, 0, 2] = 0.5 * dz[:, :, 3]
    # eps_rphi;phi = (eps_rr - eps_pp)/r, which for eps_pp = u_r/r is exactly
    # d(eps_pp)/dr -- a form that stays accurate as r -> 0.
    D[:, :, 0, 1, 1] = D[:, :, 1, 0, 1] = dr[:, :, 2]
    D[:, :, 1, 2, 1] = D[:, :, 2, 1, 1] = 0.5 * eps[:, :, 3] / kin.r

    T1 = D.transpose(0, 1, 2, 4, 3)          # eps_ik;j
    eta = T1 + T1.transpose(0, 1, 3, 2, 4) - D
    return np.sqrt(np.einsum("egijk,egijk->eg", eta, eta) / 4.0)


# ----------------------------------------------------------------------
# Solver
# ----------------------------------------------------------------------

@dataclass
class Load:
    """Remote axisymmetric stress state, normalised by sigma_Y."""
    S_z: float
    S_r: float

    @property
    def mean(self):
        return (self.S_z + 2.0 * self.S_r) / 3.0

    @property
    def mises(self):
        return abs(self.S_z - self.S_r)


def _outer_traction(mesh, load, sigY):
    """Consistent nodal forces for t_i = sigma^inf_ij n_j on rho = Rout."""
    f = np.zeros(mesh.ndof)
    gp, gw = np.polynomial.legendre.leggauss(3)
    for edge in mesh.outer_edges:
        xy = mesh.coords[edge]
        for s, wg in zip(gp, gw):
            L = np.array([0.5 * s * (s - 1.0), 1.0 - s * s, 0.5 * s * (s + 1.0)])
            dL = np.array([s - 0.5, -2.0 * s, s + 0.5])
            tang = dL @ xy
            jac = np.hypot(*tang)
            r, z = L @ xy
            n = np.array([r, z]) / np.hypot(r, z)
            t = sigY * np.array([load.S_r * n[0], load.S_z * n[1]])
            fe = 2.0 * np.pi * r * jac * wg * np.outer(L, t)
            f[2 * edge] += fe[:, 0]
            f[2 * edge + 1] += fe[:, 1]
    return f


def solve(l_over_R0=1.0, load=Load(2.2, 1.6), p=None, R0=None,
          n_rho=40, n_th=16, Rout_over_R0=25.0, nu=None,
          tol=1e-7, itmax=300, relax=0.5, verbose=False,
          progress=None, tol_mu=None):
    """Secant-iteration solution of the CMSG void problem.

    `l_over_R0 = 0` recovers classical J2 deformation theory.
    Returns a dict of Gauss-point fields plus the mesh/kinematics.

    Elastic constants: Young modulus from ``p.E_over_sigY``; Poisson ratio
    defaults to ``p.nu_fem`` (near 1/2). The MSG length ``p.l`` still uses the
    constitutive reference ``p.mu_over_sigY``, which differs from the FEM
    elastic shear modulus at this ν.

    ``progress``, if given, is called as ``progress(frac, message)`` with
    ``frac`` in ``[0, 1]`` after each secant iteration.
    """
    p = p or Params()
    nu = p.nu_fem if nu is None else float(nu)
    tol_mu = tol if tol_mu is None else float(tol_mu)
    R0 = R0 or (p.l / l_over_R0 if l_over_R0 > 0 else 1e-5)
    mesh = make_mesh(R0, Rout_over_R0 * R0, n_rho, n_th)
    kin = Kinematics(mesh)

    E = p.E_over_sigY * p.sigY
    mu_e = E / (2.0 * (1.0 + nu))
    K = E / (3.0 * (1.0 - 2.0 * nu))

    fixed = np.concatenate([2 * mesh.axis, 2 * mesh.equator + 1])
    free = np.setdiff1d(np.arange(mesh.ndof), fixed)
    fext = _outer_traction(mesh, load, p.sigY)[free]

    Idev = np.eye(3) - np.ones((3, 3)) / 3.0
    mu = np.full((kin.ne, kin.ng), mu_e)
    u = np.zeros(mesh.ndof)

    def state(u):
        """Strain invariants, MSG flow stress and secant modulus at the
        Gauss points of the displacement field `u`."""
        eps = kin.strains(u)
        tr = eps[:, :, :3].sum(axis=2)
        dev = eps.copy()
        dev[:, :, :3] -= tr[:, :, None] / 3.0
        eps_e = np.maximum(
            np.sqrt(2.0 / 3.0 * (np.sum(dev[:, :, :3] ** 2, axis=2)
                                 + 0.5 * eps[:, :, 3] ** 2)), 1e-14)
        eta = (effective_strain_gradient(kin, kin.strains(u, bbar=False))
               if l_over_R0 > 0.0 else np.zeros_like(eps_e))
        sig_m = K * tr / p.sigY
        soft = (1.0 - p.xi * theta_T(theta_L_local(sig_m, p), p)
                if p.xi > 0.0 else 1.0)
        sig_e = soft * p.sigY * np.sqrt(f_elastic_power(eps_e, p) ** 2
                                        + p.l * eta)
        mu_s = np.minimum(sig_e / (3.0 * eps_e), mu_e)
        return dict(eps=eps, dev=dev, tr=tr, eps_e=eps_e, eta=eta,
                    sig_e=sig_e, mu=mu_s, soft=soft)

    if progress is not None:
        progress(0.05, "Mesh ready — starting secant iterations")

    resid = np.inf
    resid_mu = np.inf
    for it in range(itmax):
        D = np.zeros((kin.ne, kin.ng, 4, 4))
        D[:, :, :3, :3] = (2.0 * mu[:, :, None, None] * Idev
                           + K * np.ones((3, 3)))
        D[:, :, 3, 3] = mu
        DB = np.einsum("egij,egjk->egik", D, kin.B)
        Ke = np.einsum("eg,egji,egjk->eik", kin.w, kin.B, DB)
        A = coo_matrix((Ke.ravel(), (kin.rows, kin.cols)),
                       shape=(mesh.ndof, mesh.ndof)).tocsr()
        unew = np.zeros(mesh.ndof)
        unew[free] = spsolve(A[free][:, free], fext)

        st = state(unew)
        resid = np.max(np.abs(unew - u)) / max(np.max(np.abs(unew)), 1e-30)
        mu_new = (1.0 - relax) * mu + relax * st["mu"]
        resid_mu = (np.max(np.abs(mu_new - mu))
                    / max(np.max(np.abs(mu_new)), 1e-30))
        u = unew
        mu = mu_new
        if verbose and it % 20 == 0:
            print(f"  it {it:3d}  |du|/|u| = {resid:.2e}  "
                  f"|dμ|/|μ| = {resid_mu:.2e}")
        if progress is not None:
            progress(
                min(0.99, (it + 1) / itmax),
                f"Secant iteration {it + 1}/{itmax}  "
                f"|Δu|/|u| = {resid:.2e}, |Δμ|/|μ| = {resid_mu:.2e}",
            )
        if resid < tol and resid_mu < tol_mu and it > 2:
            break

    converged = bool(resid < tol and resid_mu < tol_mu)
    if progress is not None:
        if converged:
            progress(1.0, f"Converged in {it + 1} iterations")
        else:
            progress(
                1.0,
                f"Not converged after {it + 1} iterations "
                f"(|Δu|/|u| = {resid:.2e}, |Δμ|/|μ| = {resid_mu:.2e})",
            )

    st = state(u)
    sig = 2.0 * st["mu"][:, :, None] * st["dev"] + K * st["tr"][:, :, None] * _M
    out = dict(mesh=mesh, kin=kin, p=p, u=u, iters=it + 1, resid=resid,
               resid_mu=resid_mu, converged=converged, tol=tol, tol_mu=tol_mu,
               l_over_R0=l_over_R0, load=load, R0=R0, nu=nu,
               mu_fem_over_sigY=mu_e / p.sigY,
               mu_ref_over_sigY=p.mu_over_sigY,
               eps=st["eps"], eps_e=st["eps_e"], eta=st["eta"],
               l_eta=p.l * st["eta"],
               sig_m_hat=sig[:, :, :3].sum(axis=2) / 3.0 / p.sigY,
               sig_e_hat=st["sig_e"] / p.sigY)
    out.update(hydrogen_fields(out))
    out["delta"] = void_expansion(out)
    return out


def void_expansion(sol):
    """Mean normalised radial displacement of the void surface, u0/R0."""
    mesh, u = sol["mesh"], sol["u"]
    nt = 2 * mesh.n_th + 1
    surf = np.arange(nt)                       # rho = R0 nodes
    xy = mesh.coords[surf]
    n = xy / np.linalg.norm(xy, axis=1)[:, None]
    ur = u[2 * surf] * n[:, 0] + u[2 * surf + 1] * n[:, 1]
    return float(np.mean(ur) / mesh.R0)


def hydrogen_fields(sol):
    """Trap and lattice hydrogen inferred from the mechanical fields.

    Formulation C: $N_T$ uses the hydrogen-free Taylor density
    $\\rho_T=[f^2(\\varepsilon_e)+l\\eta]/(l b)$, never $(\\sigma_e/\\sigma_Y)^2$
    after HELP softening (which would insert $(1-\\xi\\theta_T)^2$).
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


# ----------------------------------------------------------------------
# Sampling helpers
# ----------------------------------------------------------------------

def gauss_points(sol):
    """Gauss-point coordinates (r, z) flattened."""
    kin = sol["kin"]
    return kin.r.ravel(), kin.z.ravel()


def radial_profile(sol, key, theta=0.5 * np.pi, tol=0.06):
    """Field sampled along a ray at polar angle `theta` (from the z axis)."""
    r, z = gauss_points(sol)
    rho = np.hypot(r, z)
    ang = np.arctan2(r, z)
    m = np.abs(ang - theta) < tol
    order = np.argsort(rho[m])
    return rho[m][order] / sol["R0"], sol[key].ravel()[m][order]


# ----------------------------------------------------------------------
# Verification
# ----------------------------------------------------------------------

def verify_eta(n_rho=40, n_th=16, Rout_over_R0=8.0):
    """Check eta^e against the closed-form spherical-void value.

    For the incompressible field u = A x/R^3 the MSG invariant is
    eta^e = 3 sqrt(5/2) A / R^4, i.e. l eta^e = 3 sqrt(5/2) delta (l/R0)/s^4.
    """
    R0 = 1.0
    mesh = make_mesh(R0, Rout_over_R0 * R0, n_rho, n_th)
    kin = Kinematics(mesh)
    A = 1e-3 * R0 ** 3
    xy = mesh.coords
    Rn = np.linalg.norm(xy, axis=1)
    u = np.zeros(mesh.ndof)
    u[0::2] = A * xy[:, 0] / Rn ** 3
    u[1::2] = A * xy[:, 1] / Rn ** 3

    eta = effective_strain_gradient(kin, kin.strains(u, bbar=False))
    rho = np.hypot(kin.r, kin.z)
    exact = 3.0 * np.sqrt(2.5) * A / rho ** 4
    # exclude the two element rings next to each radial boundary, where the
    # projected strain field is one-sided
    ring = np.repeat(np.arange(mesh.n_rho), mesh.n_th)
    keep = (ring > 1) & (ring < mesh.n_rho - 2)
    err = np.abs(eta[keep] - exact[keep]) / exact[keep]
    return float(err.max()), float(np.median(err))


def verify_elastic(S=1e-3):
    """Check the elastic limit against the Lame cavity solution.

    A spherical cavity under remote hydrostatic tension S has sigma_m = S
    everywhere, sigma_e = 3S/2 (R0/R)^3 and u0/R0 = S/(4 mu).
    """
    sol = solve(l_over_R0=0.0, load=Load(S, S), Rout_over_R0=60.0,
                n_rho=40, n_th=10, itmax=3)
    R, se = radial_profile(sol, "sig_e_hat")
    _, sm = radial_profile(sol, "sig_m_hat")
    p, nu = sol["p"], sol["nu"]
    mu = p.E_over_sigY * p.sigY / (2.0 * (1.0 + nu))
    m = R <= 6.0
    return dict(sig_m=float(np.abs(sm[m] / S - 1.0).max()),
                sig_e=float(np.abs(se[m] / (1.5 * S / R[m] ** 3) - 1).max()),
                delta=abs(sol["delta"] / (S * p.sigY / (4.0 * mu)) - 1.0))


def verify_void(l_over_R0=1.0, s_max=2.0):
    """Check the plastic fields against the closed form of Section 5.

    The comparison is limited to R <= `s_max`, inside the plastic zone: the
    closed form is a rigid-plastic infinite-medium result and necessarily
    departs from a finite remote load further out.
    """
    sol = solve(l_over_R0=l_over_R0, load=Load(2.6, 2.6), Rout_over_R0=40.0,
                n_rho=60, n_th=10)
    R, se = radial_profile(sol, "sig_e_hat")
    _, sm = radial_profile(sol, "sig_m_hat")
    _, le = radial_profile(sol, "l_eta")
    _, ee = radial_profile(sol, "eps_e")
    d = sol["delta"]
    an = void_fields(R, d, l_over_R0, sol["p"])
    m = R <= s_max

    def err(a, b):
        return float(np.abs(a[m] / b[m] - 1.0).max())

    out = dict(delta=d,
               eps_e=err(ee, 2.0 * d / R ** 3),
               sig_e=err(se, an["sig_e_hat"]),
               sig_m=err(sm, an["sig_m_hat"]))
    if l_over_R0 > 0.0:
        out["l_eta"] = err(le, 3.0 * np.sqrt(2.5) * d * l_over_R0 / R ** 4)
    return out


if __name__ == "__main__":
    emax, emed = verify_eta()
    print("strain-gradient operator vs 3 sqrt(5/2) A/R^4:"
          f"  median {emed:.2%}, max {emax:.2%}")

    e = verify_elastic()
    print("elastic limit vs Lame cavity solution:"
          f"  sigma_m {e['sig_m']:.2%}, sigma_e {e['sig_e']:.2%},"
          f" u0 {e['delta']:.2%}")

    for lr in (0.0, 1.0, 5.0):
        v = verify_void(lr)
        grad = f" l*eta {v['l_eta']:.2%}," if "l_eta" in v else ""
        print(f"plastic fields vs closed form, l/R0 = {lr}"
              f" (delta = {v['delta']:.4f}, R <= 2 R0):"
              f"  eps_e {v['eps_e']:.2%},{grad}"
              f" sigma_e {v['sig_e']:.2%}, sigma_m {v['sig_m']:.2%}")
