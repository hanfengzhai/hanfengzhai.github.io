#!/usr/bin/env python3
"""Generate Reveal.js HTML deck for the ME 340 course intro (teaching/intros/me340/)."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "index.html"

ME340_CATALOG = "https://explorecourses.stanford.edu/search?view=catalog&filter-coursestatus-Active=on&q=ME340"
ME340_CAI_NOTES = "https://micro.stanford.edu/~caiwei/me340/"
ELASTICITY_NOTES = "/file/teaching/notes/elasticity_notes.pdf"
INTRO_PDF = "/file/teaching/intros/ME340_Intro.pdf"

# Minimal alt-text only; labels live in slide LaTeX


def img(name, alt="", caption=""):
    cap = f'<div class="figcap">{caption}</div>' if caption else ""
    return (
        f'<div class="diagram-wrap">'
        f'<img class="slide-fig" src="figs/{name}" alt="{alt}" loading="lazy">'
        f'{cap}</div>'
    )


def fig_cell(name, alt="", label=""):
    label_html = f'<div class="fig-label">{label}</div>' if label else ""
    return (
        f'<div class="fig-cell">'
        f'<img class="slide-fig" src="figs/{name}" alt="{alt}" loading="lazy">'
        f'{label_html}</div>'
    )


def fig_row(*cells):
    return f'<div class="fig-row">{"".join(cells)}</div>'


def fig_grid(*cells):
    return f'<div class="fig-grid">{"".join(cells)}</div>'


def gb(lec, topic):
    return f'<div class="lec-badge">Lec.&nbsp;{lec} [{topic}]</div>'


def sym(*parts):
    return '<p class="sym-note meta-text"><strong>Symbols:</strong> ' + "; ".join(parts) + ".</p>"


def assemble(body):
    return (
        body.replace("{ME340_CATALOG}", ME340_CATALOG)
        .replace("{ME340_CAI_NOTES}", ME340_CAI_NOTES)
        .replace("{ELASTICITY_NOTES}", ELASTICITY_NOTES)
        .replace("{INTRO_PDF}", INTRO_PDF)
    )


def slide(title, body, center=False, bg=None):
    cls_parts = []
    if center:
        cls_parts.append("center-slide")
    cls = f' class="{" ".join(cls_parts)}"' if cls_parts else ""
    bg_attr = f' data-background-color="{bg}"' if bg else ""
    if title:
        title_html = f'<div class="slide-title">{title}</div>'
        body_html = f'<div class="slide-body">{body}</div>'
    else:
        title_html = ""
        body_html = body
    return f'<section{cls}{bg_attr}>{title_html}{body_html}</section>'


def title_slide(body):
    return f"""<section class="title-slide-section center-slide">
<div class="title-slide-banner"><h1 class="textsc">Mechanics: Elasticity and Inelasticity</h1></div>
<div class="title-slide-body slide-content">
{body}
</div>
</section>"""


THREE_PART = r"""
<div class="flow-row">
  <div class="fbox">Part I<br>Elasticity<br>\(\sigma,\ \mathbf{u}\)</div><span class="arrow">→</span>
  <div class="gbox">Part II<br>Plasticity<br>\(\varepsilon^{p},\ f=0\)</div><span class="arrow">→</span>
  <div class="kbox">Part III<br>Fracture<br>\(K_{I},\ J\)</div>
</div>
<div class="flow-row">
  <div class="fbox" style="min-width:11em;">Applications: contact, vessels, fatigue</div>
</div>"""


SLIDES = [
    title_slide(assemble(r"""
<p class="title-slide-meta">A brief intro • <a href="{ME340_CATALOG}">ME 340</a> • <a href="{INTRO_PDF}">PDF</a></p>
<p class="author"><strong>Hanfeng Zhai</strong></p>
<p class="institute">Department of Mechanical Engineering, Stanford University</p>
<p class="date">Winter 2025-26</p>
""")),

    slide("Course at a glance", assemble(r"""
<div class="cols">
  <div class="slide-content">
    <ul>
      <li><a href="{ME340_CATALOG}">ME 340</a> (Wei Cai): elasticity, plasticity, fracture.</li>
      <li><strong>I</strong>: 2D \(\phi\), 3D \(G\), contact; <strong>II</strong>: yield, flow, hardening; <strong>III</strong>: LEFM, \(J\), fatigue.</li>
      <li>Analytic + Matlab.</li>
      <li>Barber (2010); Anderson (2005).</li>
      <li><a href="{ELASTICITY_NOTES}">consolidated study notes</a>.</li>
    </ul>
    """ + sym(
        r"\(\phi\): Airy stress function (2D)",
        r"\(G\): Green's function (3D)",
        r"LEFM: linear elastic fracture mechanics",
        r"\(J\): path-independent contour integral",
    ) + r"""
  </div>
  <div>""" + img("fig1.png", "Reference and deformed configurations") + r"""</div>
</div>""")),

    slide("Three-part course structure", assemble(r"""
<div class="slide-content">
""" + THREE_PART + r"""
<div class="cols-33 meta-text" style="margin-top:0.55em;">
  <div><strong>I.</strong> stress, strain, equilibrium</div>
  <div><strong>II.</strong> yield, flow, hardening</div>
  <div><strong>III.</strong> crack-tip fields, energy release</div>
</div>
<p class="meta-text" style="margin-top:0.55em;"><em>Core idea:</em> well-posed BVP \(\rightarrow\) elastic solution \(\rightarrow\) plasticity if \(f > 0\) \(\rightarrow\) fracture if cracks grow.</p>
""" + sym(
        r"\(\boldsymbol{\sigma}\): Cauchy stress tensor",
        r"\(\mathbf{u}\): displacement field",
        r"\(\varepsilon^{p}\): plastic strain",
        r"\(f\): yield function (\(f\le 0\) elastic)",
        r"\(K_I\): mode-I stress intensity factor",
        r"\(J\): \(J\)-integral (fracture)",
    ) + r"""
</div>
"""), center=True),

    slide("Outline", """
<div class="slide-content">
<div class="toc-list">
  <div><h4 class="textsc">Tensors and Einstein notation</h4></div>
  <div><h4 class="textsc">Foundations</h4></div>
  <div><h4 class="textsc">One-dimensional and rod problems</h4></div>
  <div><h4 class="textsc">Two-dimensional elasticity</h4></div>
  <div><h4 class="textsc">Three-dimensional elasticity</h4></div>
  <div><h4 class="textsc">Plasticity</h4></div>
  <div><h4 class="textsc">Fracture mechanics</h4></div>
  <div><h4 class="textsc">Problem-solving workflow</h4></div>
</div>
<p class="meta-text" style="margin-top:0.75em;">Use ← → keys, swipe, or scroll to navigate.</p>
</div>
"""),

    slide("Tensors and Einstein notation", assemble(r"""
<div class="slide-content">
<ul>
  <li><strong>Scalars</strong> (one number): \(E\), \(\nu\), \(\rho\). <strong>Vectors</strong> \(\mathbf{a}\): components \(a_i\). <strong>Tensors</strong> \(\mathbf{T}\): components \(T_{ij}\) (and higher order).</li>
  <li><strong>Einstein summation:</strong> repeated indices are summed, e.g. \(a_i b_i = a_1 b_1 + a_2 b_2 + a_3 b_3\); \(\sigma_{ii}=\sigma_{xx}+\sigma_{yy}+\sigma_{zz}\).</li>
  <li><strong>Comma notation:</strong> \(u_{i,j}=\partial u_i/\partial x_j\); \(\sigma_{ij,j}=\partial\sigma_{ij}/\partial x_j\) (sum on \(j\)).</li>
  <li><strong>Kronecker delta</strong> \(\delta_{ij}=1\) if \(i=j\), else \(0\). <strong>Levi-Civita</strong> \(\varepsilon_{ijk}\) for cross products / determinants.</li>
  <li>Bold symbols (\(\boldsymbol{\sigma}\), \(\mathbf{u}\)) denote tensors/vectors; indicial form (\(\sigma_{ij}\), \(u_i\)) is equivalent.</li>
</ul>
""" + sym(
        r"\(i,j,k\in\{1,2,3\}\): Cartesian indices (\(x_1,x_2,x_3\))",
        r"\(\delta_{ij}\): Kronecker delta",
        r"\(T_{ij}\): second-order tensor components",
        r"\(C_{ijkl}\): fourth-order stiffness components",
    ) + gb("2", "Tensors") + r"""
</div>
""")),

    slide("Continuum body: reference and deformed configurations", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <ul>
      <li>Reference \(\Omega_0\) \(\rightarrow\) deformed \(\Omega\) under load.</li>
      <li>\(\mathbf{X}\mapsto\mathbf{x}=\mathbf{X}+\mathbf{u}(\mathbf{X})\); displacement \(\mathbf{u}(\mathbf{x})\).</li>
      <li>Small strain: \(\varepsilon_{ij} = \tfrac{1}{2}(u_{i,j} + u_{j,i})\).</li>
      <li>Body \(V\) with boundary \(\partial V=S_u\cup S_t\).</li>
    </ul>
    """ + sym(
        r"\(\Omega_0,\Omega\): reference / deformed material domains",
        r"\(\mathbf{X},\mathbf{x}\): material / spatial position vectors",
        r"\(\mathbf{u}\): displacement (\(\mathbf{x}=\mathbf{X}+\mathbf{u}\))",
        r"\(\varepsilon_{ij}\): infinitesimal strain tensor",
        r"\(V,\partial V\): body and its boundary",
        r"\(S_u,S_t\): displacement / traction boundary segments",
    ) + gb("1", "Introduction") + r"""
  </div>
  <div>""" + img("fig1.png", "Reference and deformed configurations") + r"""</div>
</div>""")),

    slide("Stress and strain", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <p>\[ \sigma_{ij}=\sigma_{ji},\qquad \varepsilon_{ij}=\tfrac{1}{2}\!\left(\frac{\partial u_i}{\partial x_j}+\frac{\partial u_j}{\partial x_i}\right). \]</p>
    <ul>
      <li>Cauchy stress \(\boldsymbol{\sigma}\); traction \(\mathbf{t}=\boldsymbol{\sigma}\cdot\mathbf{n}\), \(t_i=\sigma_{ij}n_j\).</li>
      <li>Equilibrium (no body force): \(\partial\sigma_{ij}/\partial x_j = 0\).</li>
    </ul>
    """ + sym(
        r"\(\sigma_{ij}\): Cauchy stress (symmetric)",
        r"\(\varepsilon_{ij}\): small-strain tensor",
        r"\(u_i\): displacement components",
        r"\(\mathbf{t},t_i\): traction vector / components",
        r"\(n_j\): outward unit normal on a surface",
    ) + gb("1–2", "Introduction, Tensors") + r"""
  </div>
  <div>""" + img("fig2.png", "Cauchy stress and traction") + r"""</div>
</div>""")),

    slide("Hooke's law and elastic energy", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <p>\[ \sigma_{ij}=C_{ijkl}\,\varepsilon_{kl}, \qquad \sigma = E\varepsilon\ \text{(1D)},\qquad u=\tfrac{1}{2}\sigma\varepsilon. \]</p>
    <ul>
      <li>Isotropic: \(\varepsilon_{ij} = \tfrac{1+\nu}{E}\sigma_{ij} - \tfrac{\nu}{E}\sigma_{kk}\delta_{ij}\).</li>
      <li>Shaded area under \(\sigma\)–\(\varepsilon\) curve = strain-energy density \(u\) at \((\varepsilon^*,\sigma^*)\).</li>
    </ul>
    """ + sym(
        r"\(C_{ijkl}\): elasticity tensor (Hooke's law)",
        r"\(E\): Young's modulus",
        r"\(\nu\): Poisson's ratio",
        r"\(u\): strain-energy density per unit volume",
        r"\(\sigma_{kk}\): trace of stress (\(\sigma_{xx}+\sigma_{yy}+\sigma_{zz}\))",
        r"\(\delta_{ij}\): Kronecker delta",
    ) + gb("3", "Hooke's Law") + r""", """ + gb("4", "Fundamental Equations") + r"""
  </div>
  <div>""" + img("fig3.png", "Hooke's law graph") + r"""</div>
</div>""")),

    slide("Fundamental boundary-value problem", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <p>\[ \boldsymbol{\varepsilon}=\tfrac{1}{2}(\nabla\mathbf{u}+\nabla\mathbf{u}^{\top}),\quad \boldsymbol{\sigma}=\mathbb{C}:\boldsymbol{\varepsilon},\quad \nabla\!\cdot\!\boldsymbol{\sigma}+\mathbf{f}=\mathbf{0}\ \text{in }V. \]</p>
    <p>\[ \mathbf{u}=\mathbf{u}_0\ \text{on }S_u,\qquad \boldsymbol{\sigma}\cdot\mathbf{n}=\mathbf{t}\ \text{on }S_t,\qquad \partial V=S_u\cup S_t. \]</p>
    """ + sym(
        r"\(\mathbb{C}\): fourth-order elastic stiffness tensor",
        r"\(\mathbf{f}\): body-force vector per unit volume",
        r"\(\mathbf{u}_0\): prescribed displacement on \(S_u\)",
        r"\(\mathbf{t}\): prescribed traction on \(S_t\)",
        r"\(\mathbf{n}\): outward unit normal",
        r"\(\nabla,\cdot\): gradient / divergence",
    ) + gb("4", "Fundamental Equations") + r"""
  </div>
  <div>""" + img("fig4.png", "Boundary value problem") + r"""</div>
</div>""")),

    slide("Elastic rod (1D building block)", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <p>\[ \varepsilon=\frac{\mathrm{d} u}{\mathrm{d} x},\qquad N=EA\,\varepsilon,\qquad \frac{\mathrm{d} N}{\mathrm{d} x}+f=0. \]</p>
    <ul>
      <li>Reference length \(L_0\); deformed \(L=L_0+u(L_0)\); fixed at \(x=0\), load \(N\) at \(x=L_0\).</li>
      <li>Cross-section \(A\); rigidity \(EA\); same BVP pattern as 3D.</li>
    </ul>
    """ + sym(
        r"\(\varepsilon\): axial strain",
        r"\(u(x)\): axial displacement",
        r"\(N\): axial normal force",
        r"\(EA\): axial rigidity (stiffness \(\times\) area)",
        r"\(f\): distributed axial body force per unit length",
        r"\(L_0,A\): reference length and cross-sectional area",
    ) + gb("4–5", "Fund. Eqs., 2D Elasticity") + r"""
  </div>
  <div>""" + img("fig5.png", "Elastic rod") + r"""</div>
</div>""")),

    slide("2D formulations", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <p>Airy stress function \(\phi(x,y)\), \(\nabla^4\phi=0\):</p>
    <p>\[ \sigma_{xx}=\phi_{,yy},\quad \sigma_{yy}=\phi_{,xx},\quad \sigma_{xy}=-\phi_{,xy}. \]</p>
    <p><strong>Plane stress</strong> (\(t\ll L\), \(\sigma_{33}=\sigma_{13}=\sigma_{23}=0\)):</p>
    <p>\[ \varepsilon_{xx}=\tfrac{1}{E}(\sigma_{xx}-\nu\sigma_{yy}),\quad \varepsilon_{yy}=\tfrac{1}{E}(\sigma_{yy}-\nu\sigma_{xx}),\quad \varepsilon_{xy}=\tfrac{1+\nu}{E}\sigma_{xy}. \]</p>
    <p><strong>Plane strain</strong> (long in \(x_3\), \(\varepsilon_{33}=\varepsilon_{13}=\varepsilon_{23}=0\)):</p>
    <p>\[ \sigma_{xx}=\tfrac{E}{(1+\nu)(1-2\nu)}\bigl[(1-\nu)\varepsilon_{xx}+\nu\varepsilon_{yy}\bigr],\quad \sigma_{yy}=\tfrac{E}{(1+\nu)(1-2\nu)}\bigl[(1-\nu)\varepsilon_{yy}+\nu\varepsilon_{xx}\bigr],\quad \sigma_{xy}=\tfrac{E}{1+\nu}\varepsilon_{xy}. \]</p>
    """ + sym(
        r"\(\phi\): Airy stress function",
        r"\(\nabla^4\): biharmonic operator",
        r"\(\sigma_{xx},\sigma_{yy},\sigma_{xy}\): in-plane Cauchy stresses",
        r"\(\varepsilon_{xx},\varepsilon_{yy},\varepsilon_{xy}\): in-plane strains",
        r"\(E,\nu\): Young's modulus and Poisson's ratio",
        r"\(t,L\): plate thickness and in-plane length scale",
    ) + gb("5", "2D Elasticity") + r"""
  </div>
  <div>""" + fig_row(
        fig_cell("fig6a.png", "Thin plate",
                 r"<strong>Plane stress</strong>: thin plate, \(t\ll L\)<br>\(\sigma_{33}=\sigma_{13}=\sigma_{23}=0\)"),
        fig_cell("fig6b.png", "Long body",
                 r"<strong>Plane strain</strong>: long in \(x_3\)<br>\(\varepsilon_{33}=\varepsilon_{13}=\varepsilon_{23}=0\)"),
    ) + r"""</div>
</div>""")),

    slide("Classic 2D solution routes", assemble(r"""
<div class="slide-content" style="margin-bottom:0.35em;">
  <p>Four recurring routes for \(\nabla^4\phi=0\) with different geometry / BCs:</p>
</div>
""" + fig_grid(
        fig_cell("fig7a.png", "Rectangular beam",
                 r"<strong>Beam</strong> (Lec.&nbsp;7): \(q(x)\), \(L\), \(2h\)"),
        fig_cell("fig7b.png", "Fourier strip",
                 r"<strong>Fourier</strong> (Lec.&nbsp;8): \(p(x+L)=p(x)\)"),
        fig_cell("fig7c.png", "Half space",
                 r"<strong>Half space</strong> (Lec.&nbsp;9): line load \(P\), \(\sigma\sim 1/r\)"),
        fig_cell("fig7d.png", "Contact",
                 r"<strong>Contact</strong> (Lec.&nbsp;10): \(p(x)\) on \([-a,a]\)"),
    ) + sym(
        r"\(q(x)\): transverse distributed load on a beam",
        r"\(L,2h\): beam span and total depth",
        r"\(p(x)\): periodic surface pressure",
        r"\(P\): concentrated line load",
        r"\(r\): radial distance from a load",
        r"\(a\): half-width of contact zone",
    ) + r"""""")),

    slide("Polar coordinates and wedge problems", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <p>\[ \nabla^4\phi=0 \ \Rightarrow\ \phi(r,\theta)\ \text{with}\ r,\theta,\ln r,\ \theta\ln r\ \text{modes}. \]</p>
    <ul>
      <li>Lec. 11–12: annulus / hole; Lec. 13: wedge angle \(2\alpha\), corner modes.</li>
      <li>Pick modes with symmetry and finite energy.</li>
    </ul>
    """ + sym(
        r"\(r,\theta\): polar coordinates",
        r"\(\phi(r,\theta)\): Airy function in polar form",
        r"\(2\alpha\): wedge opening angle",
        r"\(\ln r,\ \theta\ln r\): typical singular / logarithmic modes",
    ) + gb("11–12", "Polar Coordinates, Wedge and Notch") + r"""
  </div>
  <div>""" + img("fig8.png", "Polar annulus and wedge") + r"""</div>
</div>""")),

    slide("Green's function approach (3D)", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <p>\[ \nabla\!\cdot\!\boldsymbol{\sigma}+\mathbf{f}=\mathbf{0},\quad \mathbf{u}(\mathbf{x})=\int G(\mathbf{x},\boldsymbol{\xi})\,\mathbf{f}(\boldsymbol{\xi})\,\mathrm{d}V_\xi. \]</p>
    <ul>
      <li><strong>Kelvin</strong> (Lec.&nbsp;17): point force \(\mathbf{P}\) in infinite space.</li>
      <li><strong>Image</strong> (Lec.&nbsp;16): traction-free surface via mirror force.</li>
    </ul>
    """ + sym(
        r"\(G(\mathbf{x},\boldsymbol{\xi})\): Green's function (displacement kernel)",
        r"\(\mathbf{x},\boldsymbol{\xi}\): field / source points",
        r"\(\mathrm{d}V_\xi\): volume element at \(\boldsymbol{\xi}\)",
        r"\(\mathbf{P}\): concentrated point force",
        r"\(\mathbf{f}\): body-force density",
    ) + gb("16–17", "Half Space, Kelvin Solution") + r"""
  </div>
  <div>""" + fig_row(
        fig_cell("fig9a.png", "Kelvin solution", r"Kelvin: \(\mathbf{P}\) at origin"),
        fig_cell("fig9b.png", "Half-space image", r"Image below traction-free surface"),
    ) + r"""</div>
</div>""")),

    slide("Dislocations and defect fields", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <ul>
      <li>Volterra <em>cut</em>; Burgers vector \(\mathbf{b}\) across slip plane.</li>
      <li>Far field: remote \(\boldsymbol{\sigma}^{\infty}\); Peach–Köhler force on dislocation.</li>
      <li>Singular core + image / boundary correction; many dislocations \(\Rightarrow\) \(\varepsilon^{p}\).</li>
    </ul>
    """ + sym(
        r"\(\mathbf{b}\): Burgers vector (slip discontinuity)",
        r"\(\boldsymbol{\sigma}^{\infty}\): remote uniform stress state",
        r"\(\varepsilon^{p}\): plastic strain from accumulated slip",
    ) + gb("notes", "Dislocations (extended notes)") + r"""
  </div>
  <div>""" + img("fig10.png", "Dislocation schematic") + r"""</div>
</div>""")),

    slide("From elasticity to plasticity", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <ul>
      <li><strong>Elastic:</strong> load removal \(\Rightarrow\) strain returns to zero.</li>
      <li><strong>Plastic:</strong> permanent strain remains after unloading.</li>
      <li>Additive split (small strain): \[ \varepsilon_{ij}=\varepsilon_{ij}^{e}+\varepsilon_{ij}^{p}. \]</li>
      <li>Elastic part: \(\sigma_{ij} = C_{ijkl} \varepsilon^{e}_{kl}\).</li>
      <li>Plastic part: governed by a yield condition + flow rule.</li>
    </ul>
    """ + sym(
        r"\(\varepsilon_{ij}^{e},\varepsilon_{ij}^{p}\): elastic / plastic strain parts",
        r"\(C_{ijkl}\): elastic stiffness (Hooke's law on \(\varepsilon^{e}\))",
    ) + gb("3", "Hooke's Law") + r""", """ + gb("13", "Fund. Eqs. of Plasticity") + r"""
  </div>
  <div>""" + img("fig_elas_plas.png", "Elastic-plastic loading") + r"""</div>
</div>""")),

    slide("Yield criteria: von Mises and Tresca", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <p><strong>Principal stresses</strong> \(\sigma_1,\sigma_2,\sigma_3\): normal stresses on planes with no shear (\(\tau=0\)); eigenvalues of \(\sigma_{ij}\). Ordering: \(\sigma_1\ge\sigma_2\ge\sigma_3\).</p>
    <p>Deviatoric stress \(s_{ij}=\sigma_{ij}-\tfrac{1}{3}\sigma_{kk}\delta_{ij}\); \(J_2=\tfrac{1}{2}s_{ij}s_{ij}\), \(\sigma_{\mathrm{eq}}=\sqrt{3J_2}\).</p>
    <p><strong>von Mises:</strong> \(f=J_2-k^2\le 0\), \(k=\sigma_{Y}/\sqrt{3}\).</p>
    <p><strong>Tresca:</strong> \(\max_{i,j}|\sigma_i-\sigma_j| = 2k\).</p>
    """ + sym(
        r"\(\sigma_1,\sigma_2,\sigma_3\): principal stresses (eigenvalues of \(\sigma_{ij}\))",
        r"\(\sigma_{kk}\): mean / hydrostatic stress (\(\sigma_1+\sigma_2+\sigma_3\))",
        r"\(s_{ij}\): deviatoric stress",
        r"\(J_2\): second invariant of deviator",
        r"\(\sigma_{\mathrm{eq}}\): von Mises equivalent stress",
        r"\(f\): yield function (\(f\le 0\) admissible)",
        r"\(k,\sigma_Y\): yield strength in shear / tension",
    ) + gb("13–14", "Yield surface / graphical") + r"""
  </div>
  <div>""" + img("fig_yield_surf.png", "Yield surfaces") + r"""</div>
</div>""")),

    slide("J₂ associated flow rule", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <p>\[ \dot{\varepsilon}_{ij}^{p}=\dot{\lambda}\,\frac{\partial f}{\partial\sigma_{ij}}=\dot{\lambda}\, s_{ij},\qquad \dot{\varepsilon}_{kk}^{p}=0. \]</p>
    <p>Elastic predictor \(\boldsymbol{\sigma}^{\mathrm{tr}}\); if \(f^{\mathrm{tr}} > 0\), <em>return</em> radially to \(f=0\).</p>
    """ + sym(
        r"\(\dot{\varepsilon}_{ij}^{p}\): plastic strain rate",
        r"\(\dot{\lambda}\): plastic multiplier (consistency parameter)",
        r"\(\boldsymbol{\sigma}^{\mathrm{tr}},f^{\mathrm{tr}}\): elastic trial stress / yield function",
        r"\(s_{ij}\): stress deviator (flow direction for \(J_2\) plasticity)",
    ) + gb("13–15", "Flow rule, tension &amp; shear") + r"""
  </div>
  <div>""" + fig_row(
        fig_cell("fig11a.png", "Return mapping flowchart",
                 r"Trial \(f^{\mathrm{tr}}\): accept elastic or correct"),
        fig_cell("fig11b.png", "Radial return",
                 r"\(\boldsymbol{\sigma}^{\mathrm{tr}}\rightarrow\) yield surface \(f=0\)"),
    ) + r"""</div>
</div>""")),

    slide("Fracture: LEFM and energy release", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <ul>
      <li>Center crack \(2a\); remote \(\sigma^{\infty}\); tip field \(\sim r^{-1/2}\).</li>
      <li>\(K_{I}=\sigma^{\infty}\sqrt{\pi a}\) (infinite plate); fracture when \(K_{I}=K_{Ic}\).</li>
      <li>\(\mathcal{G}=\partial U/\partial a\); \(J\)-integral; fatigue (Part III).</li>
    </ul>
    """ + sym(
        r"\(2a\): crack length",
        r"\(\sigma^{\infty}\): remote applied normal stress",
        r"\(r\): distance from crack tip",
        r"\(K_I\): mode-I stress intensity factor",
        r"\(K_{Ic}\): fracture toughness (critical \(K_I\))",
        r"\(\mathcal{G}\): energy release rate",
        r"\(J\): path-independent \(J\)-integral",
        r"\(U\): total potential / strain energy",
    ) + gb("22–26", "Slit crack, LEFM, fatigue") + r"""
  </div>
  <div>""" + img("fig12.png", "Center crack") + r"""</div>
</div>""")),

    slide("Standard workflow", assemble(r"""
<div class="cols cols-top">
  <div class="slide-content">
    <ol>
      <li><strong>Model:</strong> geometry, BCs, 2D vs. 3D.</li>
      <li><strong>Method:</strong> Airy \(\phi\) or Green / images.</li>
      <li><strong>Solve:</strong> separated variables, Fourier, multipoles.</li>
      <li><strong>Check:</strong> equilibrium, BCs, finite energy.</li>
      <li><strong>Extract:</strong> \(\sigma\), contact pressure, \(U\), forces.</li>
    </ol>
  </div>
  <div>""" + img("fig_soln_proc.png", "Problem-solving workflow") + r"""</div>
</div>
""" + sym(
        r"BCs: boundary conditions (\(S_u,S_t\))",
        r"\(\phi\): Airy stress function (2D)",
        r"\(G\): Green's function (3D)",
        r"\(\sigma\): stress tensor",
        r"\(U\): strain / potential energy",
    ) + r"""
<div class="example-block"><strong>Benchmark mindset:</strong> Keep an analytic case as a reference when switching to numerics.</div>
""")),

    slide("Lecture map", assemble(r"""
<div class="slide-content cols-33 lecture-map">
  <div>
    <h4 class="textsc">Part I. Elasticity</h4>
    <ol>
      <li>Introduction</li><li>Tensors</li><li>Hooke's Law</li><li>Fundamental Equations</li>
      <li>2D Elasticity</li><li>Rectangular Beam</li><li>Fourier Series and Transform</li>
      <li>Fourier Solution</li><li>Half Space</li><li>Contact</li><li>Polar Coordinates</li><li>Wedge and Notch</li>
    </ol>
  </div>
  <div>
    <h4 class="textsc">Part II. Plasticity</h4>
    <ul style="list-style:none;margin-left:0;">
      <li>13. Fundamental Equations of Plasticity</li>
      <li>14. Graphical Representations</li>
      <li>15. Tension and Shear</li>
      <li>16. Plastic Bending</li>
      <li>18. Hardening Law</li>
      <li>20. Crystal Plasticity</li>
    </ul>
  </div>
  <div>
    <h4 class="textsc">Part III. Fracture</h4>
    <ul style="list-style:none;margin-left:0;">
      <li>22. Slit-like Crack</li>
      <li>23. Energy Release Rate</li>
      <li>24. Linear Elastic Fracture Mechanics</li>
      <li>25. Elastic Plastic Fracture Mechanics</li>
      <li>26. Fatigue</li>
    </ul>
    <p style="margin-top:0.5em;"><a href="{ELASTICITY_NOTES}">consolidated study notes</a></p>
  </div>
</div>""")),

    slide("Takeaways", r"""
<div class="slide-content">
<ol class="meta-text">
  <li><strong>Elasticity:</strong> kinematics + Hooke + equilibrium + BCs; 2D Airy \(\phi\), 3D Green's functions.</li>
  <li><strong>Plasticity:</strong> \(\boldsymbol{\varepsilon} = \boldsymbol{\varepsilon}^{e} + \boldsymbol{\varepsilon}^{p}\); von Mises yield + associated \(J_2\) flow.</li>
  <li><strong>Fracture:</strong> \(K_{I}\), \(\mathcal{G}\), and \(J\) link elastic fields to crack growth and fatigue.</li>
  <li>Matlab and analytic benchmarks support each part.</li>
</ol>
""" + sym(
    r"\(\phi\): Airy function",
    r"\(\boldsymbol{\varepsilon}^{e,p}\): elastic / plastic strain",
    r"\(J_2\): second deviatoric invariant",
    r"\(K_I,\mathcal{G},J\): fracture parameters",
) + r"""
<div class="flow-row" style="margin-top:0.75em;">
  <div class="fbox">Elasticity<br>\(\sigma,\ \mathbf{u}\)</div><span class="arrow">→</span>
  <div class="gbox">Plasticity<br>\(\varepsilon^{p},\ f=0\)</div><span class="arrow">→</span>
  <div class="kbox">Fracture<br>\(K_{I},\ J\)</div>
</div>
</div>
"""),

    slide("References", assemble(r"""
<div class="slide-content">
<ul class="meta-text">
  <li>W. Cai, <em>ME 340 Elasticity and Inelasticity</em> (lecture notes);
    <a href="{ME340_CAI_NOTES}">Course notes</a>.</li>
  <li>J. R. Barber, <em>Elasticity</em>, 3rd ed., Springer (2010).</li>
  <li>T. L. Anderson, <em>Fracture Mechanics</em>, 3rd ed., Taylor &amp; Francis (2005).</li>
  <li>Printable intro slides: <a href="{INTRO_PDF}">ME340_Intro.pdf</a>.</li>
</ul>
<p class="meta-text" style="text-align:center;margin-top:1.5em;"><strong>Thank you.</strong></p>
</div>
""")),
]


HTML_HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ME 340: Mechanics: Elasticity and Inelasticity</title>
  <meta name="description" content="Course map for Stanford ME 340: elasticity, plasticity, and fracture mechanics.">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/white.css" id="theme">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <link rel="stylesheet" href="css/me340.css">
</head>
<body>
<div class="reveal">
  <div class="slides">
"""

HTML_TAIL = """
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
<script>
  const mathRenderOptions = {
    delimiters: [
      {left: '\\\\[', right: '\\\\]', display: true},
      {left: '\\\\(', right: '\\\\)', display: false}
    ],
    throwOnError: false,
    errorColor: '#8C1515',
    strict: 'warn',
    macros: {
      'dd': '\\\\mathrm{d}'
    }
  };

  function renderDeckMath() {
    const root = document.querySelector('.reveal .slides');
    if (!root) return;
    renderMathInElement(root, mathRenderOptions);
  }

  Reveal.initialize({
    hash: true,
    slideNumber: 'c/t',
    transition: 'fade',
    backgroundTransition: 'fade',
    width: 1280,
    height: 720,
    margin: 0.06,
    plugins: []
  }).then(() => {
    renderDeckMath();
  });
</script>
</body>
</html>
"""


def main():
    body = "\n".join(SLIDES)
    OUT.write_text(HTML_HEAD + body + HTML_TAIL, encoding="utf-8")
    print(f"Wrote {OUT} ({len(SLIDES)} slides)")


if __name__ == "__main__":
    main()
