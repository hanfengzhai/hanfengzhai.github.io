"""Analytical solutions for hydrogen transport in mechanism-based strain
gradient (MSG) plasticity.

Implements the closed-form and semi-analytical solutions of the paper:
  - Taylor dislocation density / trap density (Proposition 1):
        rho_T = (sigma_e / sigma_Y)^2 / (l b)
  - torsion of thin wires      (Section 3)
  - bending of ultra-thin beams (Section 4)
  - spherical void growth and cavitation with HELP softening (Section 5)

Mechanical constants follow Huang et al. (JMPS 48, 2000); hydrogen data are
representative of bcc iron at 300 K (Sofronis & McMeeking 1989; Krom 1999;
Kumnick & Johnson 1980).
"""

from dataclasses import dataclass, field

import numpy as np

R_GAS = 8.314  # J/(mol K)


@dataclass
class Params:
    # Mechanical (Huang et al. 2000)
    sigY: float = 400e6          # yield stress [Pa]
    # Reference shear modulus for the MSG length l (and l_eps). This is the
    # Huang et al. constitutive μ/σ_Y = 200. It is intentionally distinct from
    # the near-incompressible FEM elastic shear modulus built from E and nu_fem.
    mu_over_sigY: float = 200.0
    E_over_sigY: float = 500.0   # Young's modulus / yield stress (hardening f)
    # FEM elastic Poisson ratio ≈ 1/2 for plastic incompressibility. Then
    # μ_FEM/σ_Y = (E/σ_Y) / (2(1+ν)) ≈ 166.7, which differs from mu_over_sigY.
    nu_fem: float = 0.4999
    N: float = 0.2               # hardening exponent
    alpha: float = 0.4           # Taylor coefficient
    b: float = 0.25e-9           # Burgers vector [m]
    beta_cell: float = 1.0       # mesoscale cell size coefficient

    # Hydrogen (bcc iron, 300 K)
    T: float = 300.0             # temperature [K]
    VH: float = 2.0e-6           # partial molar volume of H [m^3/mol]
    WB: float = 30e3             # trap binding energy [J/mol]
    NL: float = 5.1e29           # lattice site density [1/m^3]
    chi: float = 1.0             # trap sites per Burgers length of line
    thetaL0: float = 1e-6        # reference lattice occupancy
    xi: float = 0.0              # HELP softening coefficient

    @property
    def l(self):
        """Intrinsic material length l = 3 alpha^2 (mu/sigY)^2 b.

        Uses the constitutive reference ``mu_over_sigY``, not the FEM elastic μ.
        """
        return 3.0 * self.alpha**2 * self.mu_over_sigY**2 * self.b

    @property
    def mu_fem_over_sigY(self):
        """Elastic shear modulus used by the near-incompressible FEM solvers."""
        return self.E_over_sigY / (2.0 * (1.0 + self.nu_fem))

    @property
    def l_eps(self):
        """Mesoscale cell size l_eps = beta (mu/sigY) b."""
        return self.beta_cell * self.mu_over_sigY * self.b

    @property
    def varsigma(self):
        """Stress-drift group sigY VH / (R T)."""
        return self.sigY * self.VH / (R_GAS * self.T)

    @property
    def KT(self):
        """Oriani equilibrium constant exp(WB / RT)."""
        return np.exp(self.WB / (R_GAS * self.T))

    @property
    def cT_scale(self):
        """Trap concentration scale chi / (l b^2) [1/m^3]."""
        return self.chi / (self.l * self.b**2)


# ----------------------------------------------------------------------
# Constitutive functions
# ----------------------------------------------------------------------

def f_power(eps, p: Params):
    """Uniaxial hardening function f(eps) = (E eps / sigY)^N (power law)."""
    return (p.E_over_sigY * np.asarray(eps)) ** p.N


def f_elastic_power(eps, p: Params):
    """Elastic--power-law f(eps): linear below yield strain sigY/E."""
    eps = np.asarray(eps, dtype=float)
    eY = 1.0 / p.E_over_sigY
    return np.where(eps <= eY,
                    p.E_over_sigY * eps,
                    (p.E_over_sigY * np.maximum(eps, eY)) ** p.N)


def sig_e_hat(eps, eta, p: Params, f=f_power, soft=1.0):
    """Normalized MSG flow stress sigma_e / sigY = soft * sqrt(f^2 + l eta).

    `eta` is the effective strain gradient [1/m]; `soft` is the HELP
    softening factor (1 - xi theta_T).
    """
    return soft * np.sqrt(f(eps, p) ** 2 + p.l * np.asarray(eta))


def theta_T(theta_L, p: Params):
    """Oriani trap occupancy (exact denominator 1 - theta_L + K_T theta_L)."""
    thL = np.asarray(theta_L)
    K = p.KT
    return K * thL / (1.0 - thL + K * thL)


def theta_L_local(sig_m_hat, p: Params):
    """Lattice occupancy under mean stress sig_m_hat = sigma_m / sigY."""
    return p.thetaL0 * np.exp(p.varsigma * np.asarray(sig_m_hat))


def rho_T_hat(eps, eta, p: Params, f=f_power):
    """Dimensionless dislocation density  rho_T * l * b = f^2 + l eta."""
    return f(eps, p) ** 2 + p.l * np.asarray(eta)


# ----------------------------------------------------------------------
# Section 3: torsion of thin wires
# ----------------------------------------------------------------------

def torsion_torque(kappa_a, l_over_a, p: Params, n=400):
    """Normalized torque T / (sigY a^3) at normalized twist kappa*a.

    Implements Eq. (35) of Huang et al. (2000) including the l_eps terms
    (which require the physical radius a = l / (l/a); for l/a = 0 the
    classical limit is returned).
    """
    x = np.linspace(1e-6, 1.0, n)          # r/a
    eps = kappa_a * x / np.sqrt(3.0)
    if l_over_a == 0.0:
        sig = f_power(eps, p)               # classical: sigma_e/sigY = f
        le_a = 0.0
    else:
        a = p.l / l_over_a
        sig = np.sqrt(f_power(eps, p) ** 2 + l_over_a * kappa_a)
        le_a = p.l_eps / a
    ff = f_power(eps, p)
    dff = p.N * ff / eps                    # f'(eps) = N f / eps
    integrand = x * ((x**2 + le_a**2 / 12.0) * sig / eps
                     + (le_a**2 / 12.0) * ff * dff / sig)
    return (2.0 * np.pi / 3.0) * kappa_a * np.trapz(integrand, x)


def torsion_cT_profile(r_over_a, Gamma, l_over_a, p: Params):
    """Trapped hydrogen c_T(r) normalized by chi theta_T / (l b^2).

    Gamma = kappa a is the surface shear strain. sigma_m = 0, so theta_T is
    uniform and the normalized profile is just f^2 + l kappa.
    """
    eps = Gamma * np.asarray(r_over_a) / np.sqrt(3.0)
    return f_power(eps, p) ** 2 + l_over_a * Gamma


def torsion_Q(a, Gamma, p: Params):
    """Uptake enhancement factor Q(a), Eq. (torsion:Q)."""
    f2 = f_power(Gamma / np.sqrt(3.0), p) ** 2
    return 1.0 + (p.N + 1.0) * p.l * Gamma / (np.asarray(a) * f2)


# ----------------------------------------------------------------------
# Section 4: bending of ultra-thin beams
# ----------------------------------------------------------------------

def bending_fields(x2_over_h, eps_s, l_over_h, p: Params):
    """Through-thickness fields at fixed axial surface strain eps_s.

    Here eps_s = kappa h / 2 matches the manuscript definition. Returns dict
    with sig_m_hat = sigma_m/sigY, cL/cL0, and cT normalized by
    chi theta_T^0 / (l b^2)  (theta_T^0 = trap occupancy at zero stress).
    """
    z = np.asarray(x2_over_h)                     # x2 / h in [-1/2, 1/2]
    kappa_h = 2.0 * eps_s                         # eps_s = kappa h / 2
    eps = 2.0 * kappa_h * np.abs(z) / np.sqrt(3.0)
    l_kappa = l_over_h * kappa_h
    sig = np.sqrt(f_power(eps, p) ** 2 + l_kappa)
    sig_m = np.sign(z) * sig / np.sqrt(3.0)
    thL = theta_L_local(sig_m, p)
    thT = theta_T(thL, p)
    thT0 = theta_T(p.thetaL0, p)
    cL_rel = thL / p.thetaL0
    cT_norm = (thT / thT0) * (f_power(eps, p) ** 2 + l_kappa)
    return dict(sig_m_hat=sig_m, cL_rel=cL_rel, cT_norm=cT_norm,
                thT=thT, rhoT_hat=f_power(eps, p) ** 2 + l_kappa)


def bending_moment(kappa_h, l_over_h, p: Params, n=400):
    """Normalized moment M / (sigY h^2), Eq. (29) of Huang et al. (2000),
    neglecting the l_eps term."""
    z = np.linspace(1e-6, 0.5, n)
    eps = 2.0 * kappa_h * z / np.sqrt(3.0)
    sig = np.sqrt(f_power(eps, p) ** 2 + l_over_h * kappa_h)
    return (4.0 / np.sqrt(3.0)) * np.trapz(z * sig, z)


def bending_average_uptake(h, eps_s, p: Params, n=801, exclude_core=False):
    """Cross-section averaged lattice / trapped hydrogen at fixed eps_s.

    Returns (cL_avg / cL0, cT_avg normalized by chi theta_T^0/(l b^2)).

    If ``exclude_core`` is True, omit the unresolved higher-order layer
    $|x_2| < l_\\varepsilon$ (i.e. $|x_2/h| < l_\\varepsilon/h$) from the integral
    and renormalize by the retained thickness fraction.
    """
    l_over_h = p.l / h
    z = np.linspace(-0.5, 0.5, n)
    F = bending_fields(z, eps_s, l_over_h, p)
    if not exclude_core:
        return np.trapz(F["cL_rel"], z), np.trapz(F["cT_norm"], z)
    gap = min(0.45, p.l_eps / h)
    mask = np.abs(z) >= gap
    if not np.any(mask):
        return np.nan, np.nan
    z_m = z[mask]
    # trapz on discontinuous outer intervals: integrate each half separately
    left = z_m <= 0
    right = z_m >= 0
    def _avg(vals):
        acc = 0.0
        span = 0.0
        for sel in (left, right):
            if np.count_nonzero(sel) < 2:
                continue
            zz = z_m[sel]
            vv = vals[sel]
            acc += float(np.trapz(vv, zz))
            span += float(zz[-1] - zz[0])
        return acc / span if span > 0 else np.nan
    return _avg(F["cL_rel"][mask]), _avg(F["cT_norm"][mask])


# ----------------------------------------------------------------------
# Section 5.1: spherical void, small strains (one-way coupling)
# ----------------------------------------------------------------------

def void_fields(R_over_R0, delta, l_over_R0, p: Params):
    """Radial fields around a spherical void at expansion ratio delta=u0/R0.

    Returns dict with sig_e_hat, sig_m_hat, cL_rel, cT_norm on the given
    (increasing) grid R/R0 starting at 1.
    """
    s = np.asarray(R_over_R0, dtype=float)
    eps = 2.0 * delta / s**3
    l_eta = 3.0 * np.sqrt(2.5) * delta * l_over_R0 / s**4
    sig = np.sqrt(f_power(eps, p) ** 2 + l_eta)
    # sigma_m = (2/3) sig_e + 2 int_{1}^{s} sig_e / s' ds'  (in units of sigY)
    integ = _cumtrapz(sig / s, s)
    sig_m = (2.0 / 3.0) * sig + 2.0 * integ
    thL = theta_L_local(sig_m, p)
    thT = theta_T(thL, p)
    thT0 = theta_T(p.thetaL0, p)
    cL_rel = thL / p.thetaL0
    cT_norm = (thT / thT0) * (f_power(eps, p) ** 2 + l_eta)
    return dict(sig_e_hat=sig, sig_m_hat=sig_m, cL_rel=cL_rel,
                cT_norm=cT_norm)


def void_remote_stress(delta, l_over_R0, p: Params, s_max=1e3, n=2000):
    """Remote stress sigma_inf / sigY, Eq. (44) of Huang et al. (2000)
    without the l_eps term."""
    s = np.logspace(0.0, np.log10(s_max), n)
    eps = 2.0 * delta / s**3
    l_eta = 3.0 * np.sqrt(2.5) * delta * l_over_R0 / s**4
    sig = np.sqrt(f_power(eps, p) ** 2 + l_eta)
    return 2.0 * np.trapz(sig / s, s)


# ----------------------------------------------------------------------
# Section 5.2: cavitation with HELP softening (two-way coupling)
# ----------------------------------------------------------------------

def cavitation_sigma_inf(r0_over_R0, l_over_R0, p: Params,
                         s_max=1e3, n=1500, n_iter=40, tol=1e-10):
    """Remote stress sigma_inf/sigY for current void radius r0 (finite
    strain, elastic--power-law solid), with HELP softening solved by
    fixed-point iteration. Returns (sigma_inf_hat, info dict)."""
    c = float(r0_over_R0)
    # log-spaced current radii r / r0
    s = np.logspace(0.0, np.log10(s_max), n)          # r / r0
    # initial radius of the material point: R^3 = r^3 - r0^3 + R0^3 (units r0)
    R0_r0 = 1.0 / c                                    # R0 / r0
    R = (s**3 - 1.0 + R0_r0**3) ** (1.0 / 3.0)
    eps = 2.0 * np.log(s / R)
    # l * eta = (l/R0)*(R0/r0) * 3 sqrt(5/2) (r0/R - r0/r)
    l_eta = (l_over_R0 * R0_r0) * 3.0 * np.sqrt(2.5) * (1.0 / R - 1.0 / s)
    f2 = f_elastic_power(eps, p) ** 2
    base = np.sqrt(f2 + l_eta)                         # hydrogen-free sigma_e/sigY

    soft = np.ones_like(s)
    for _ in range(n_iter):
        sig = soft * base
        sig_m = (2.0 / 3.0) * sig + 2.0 * _cumtrapz(sig / s, s)
        thT = theta_T(theta_L_local(sig_m, p), p)
        soft_new = 1.0 - p.xi * thT
        if np.max(np.abs(soft_new - soft)) < tol:
            soft = soft_new
            break
        soft = soft_new
    sig = soft * base
    sigma_inf = 2.0 * np.trapz(sig / s, s)
    return sigma_inf, dict(s=s, sig=sig, soft=soft)


def cavitation_stress(l_over_R0, p: Params, r0_grid=None, **kw):
    """Cavitation stress sigma_c / sigY = max over void growth history."""
    if r0_grid is None:
        r0_grid = np.linspace(1.02, 6.0, 50)
    vals = [cavitation_sigma_inf(c, l_over_R0, p, **kw)[0] for c in r0_grid]
    return np.max(vals)


# ----------------------------------------------------------------------
# Utilities
# ----------------------------------------------------------------------

def _cumtrapz(y, x):
    """Cumulative trapezoid with leading zero."""
    out = np.zeros_like(np.asarray(y, dtype=float))
    dx = np.diff(x)
    out[1:] = np.cumsum(0.5 * dx * (y[1:] + y[:-1]))
    return out
