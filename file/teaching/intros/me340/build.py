#!/usr/bin/env python3
"""Generate Reveal.js HTML deck for the ME 340 course intro (teaching/intros/me340/)."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "index.html"

ME340_CATALOG = "https://explorecourses.stanford.edu/search?view=catalog&filter-coursestatus-Active=on&q=ME340"
ELASTICITY_NOTES = "/file/teaching/notes/elasticity_notes.pdf"
INTRO_PDF = "/file/teaching/intros/ME340_Intro.pdf"

# Figure captions (module-level to avoid backslashes inside f-string expressions)
CAP_FIG1 = r"material point \(\mathbf{X}\) maps to \(\mathbf{x}=\mathbf{X}+\mathbf{u}(\mathbf{X})\)"
CAP_FIG2 = r"traction \(\mathbf{t}=\boldsymbol{\sigma}\cdot\mathbf{n}\) on a cut plane"
CAP_FIG3 = r"linear \(\sigma\)–\(\varepsilon\) law; shaded area = strain-energy density \(u\)"
CAP_FIG4 = r"body \(V\); displacement BC on \(S_u\), traction BC on \(S_t\)"
CAP_FIG5 = r"fixed end + axial load \(N\) \(\Rightarrow\) extension \(u(x)\)"
CAP_FIG8 = r"polar annulus / hole and wedge notch with angle \(2\alpha\)"
CAP_FIG9 = r"Kelvin point force \(P\) + image below traction-free surface"
CAP_FIG10 = r"Volterra cut, Burgers vector \(\mathbf{b}\), far-field \(\boldsymbol{\sigma}^\infty\)"
CAP_ELAS_PLAS = r"load past \(\sigma_Y\), unload elastically \(\rightarrow\) permanent \(\varepsilon^p\)"
CAP_YIELD = r"von Mises circle vs. Tresca hexagon in \(\sigma_1\)–\(\sigma_2\) plane"
CAP_FIG11 = r"elastic predictor \(\boldsymbol{\sigma}^{\mathrm{tr}}\); return to yield surface if \(f>0\)"
CAP_FIG12 = r"center crack \(2a\) in remote tension \(\sigma^\infty\) (Mode I)"


def img(name, alt="", caption=""):
    cap = f'<div class="figcap">{caption}</div>' if caption else ""
    return (
        f'<div class="diagram-wrap">'
        f'<img class="slide-fig" src="figs/{name}" alt="{alt}" loading="lazy">'
        f'{cap}</div>'
    )


def gb(lec, topic):
    return f'<div class="lec-badge">Lec.&nbsp;{lec} [{topic}]</div>'


def assemble(body):
    return (
        body.replace("{ME340_CATALOG}", ME340_CATALOG)
        .replace("{ELASTICITY_NOTES}", ELASTICITY_NOTES)
        .replace("{INTRO_PDF}", INTRO_PDF)
    )


def slide(title, body, center=False, bg=None):
    cls = ' class="center-slide"' if center else ""
    bg_attr = f' data-background-color="{bg}"' if bg else ""
    title_html = f'<div class="slide-title">{title}</div>' if title else ""
    return f'<section{cls}{bg_attr}>{title_html}{body}</section>'


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
    slide("", assemble(r"""
<h1>Mechanics: Elasticity and Inelasticity</h1>
<p class="title-slide-meta">A brief intro • <a href="{ME340_CATALOG}">ME 340</a> • <a href="{INTRO_PDF}">PDF</a></p>
<p class="author"><strong>Hanfeng Zhai</strong></p>
<p class="institute">Department of Mechanical Engineering, Stanford University</p>
<p class="date">Spring 2026</p>
"""), center=True, bg="#8C1515"),

    slide("Course at a glance", assemble(r"""
<div class="cols">
  <div class="slide-content">
    <ul>
      <li><a href="{ME340_CATALOG}">ME 340</a> (Wei Cai): elasticity, plasticity, fracture.</li>
      <li><strong>I</strong>—2D \(\phi\), 3D \(G\), contact; <strong>II</strong>—yield, flow, hardening; <strong>III</strong>—LEFM, \(J\), fatigue.</li>
      <li>Analytic + Matlab.</li>
      <li>Barber (2010); Anderson (2005).</li>
      <li><a href="{ELASTICITY_NOTES}">consolidated study notes</a>.</li>
    </ul>
  </div>
  <div>""" + img("fig1.png", "Reference and deformed configurations") + r"""</div>
</div>""")),

    slide("Three-part course structure", assemble(r"""
""" + THREE_PART + r"""
<div class="cols-33 meta-text" style="margin-top:0.55em;">
  <div><strong>I.</strong> stress, strain, equilibrium</div>
  <div><strong>II.</strong> yield, flow, hardening</div>
  <div><strong>III.</strong> crack-tip fields, energy release</div>
</div>
<p class="meta-text" style="margin-top:0.55em;"><em>Core idea:</em> well-posed BVP \(\rightarrow\) elastic solution \(\rightarrow\) plasticity if \(f&gt;0\) \(\rightarrow\) fracture if cracks grow.</p>
"""), center=True),

    slide("Outline", """
<div class="toc-list">
  <div><h4>Foundations</h4></div>
  <div><h4>One-dimensional and rod problems</h4></div>
  <div><h4>Two-dimensional elasticity</h4></div>
  <div><h4>Three-dimensional elasticity</h4></div>
  <div><h4>Plasticity</h4></div>
  <div><h4>Fracture mechanics</h4></div>
  <div><h4>Problem-solving workflow</h4></div>
</div>
<p class="meta-text" style="margin-top:0.75em;">Use ← → keys, swipe, or scroll to navigate.</p>
"""),

    slide("Continuum body: reference and deformed configurations", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <ul>
      <li>\(\Omega_0\): reference configuration; \(\Omega\): deformed configuration.</li>
      <li>Material points \(\mathbf{X} \mapsto \mathbf{x} = \mathbf{X} + \mathbf{u}(\mathbf{X})\).</li>
      <li>Small strain: \(\varepsilon_{ij} = \tfrac{1}{2}(u_{i,j} + u_{j,i})\).</li>
      <li>The “potato” is any bounded body \(V\) — geometry is arbitrary.</li>
    </ul>
    """ + gb("1", "Introduction") + r"""
  </div>
  <div>""" + img("fig1.png", "Reference and deformed configurations", CAP_FIG1) + r"""</div>
</div>""")),

    slide("Stress and strain", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <p>\[ \sigma_{ij}=\sigma_{ji},\qquad \varepsilon_{ij}=\tfrac{1}{2}\!\left(\frac{\partial u_i}{\partial x_j}+\frac{\partial u_j}{\partial x_i}\right). \]</p>
    <ul>
      <li>\(\boldsymbol{\sigma}\): Cauchy stress; \(\boldsymbol{\varepsilon}\): small strain; \(\mathbf{u}\): displacement.</li>
      <li>Traction on plane normal \(\mathbf{n}\): \(t_i = \sigma_{ij} n_j\).</li>
      <li>Static equilibrium: \(\partial\sigma_{ij}/\partial x_j = 0\) (no body force).</li>
    </ul>
    """ + gb("1–2", "Introduction, Tensors") + r"""
  </div>
  <div>""" + img("fig2.png", "Cauchy stress and traction", CAP_FIG2) + r"""</div>
</div>""")),

    slide("Hooke's law and elastic energy", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <p>\[ \sigma_{ij}=C_{ijkl}\,\varepsilon_{kl}, \qquad U=\tfrac{1}{2}\int_V \sigma_{ij}\,\varepsilon_{ij}\,\mathrm{d}V. \]</p>
    <ul>
      <li>Isotropic: \(\varepsilon_{ij} = \tfrac{1+\nu}{E}\sigma_{ij} - \tfrac{\nu}{E}\sigma_{kk}\delta_{ij}\).</li>
      <li>\(E\), \(\nu\), Lamé \(\lambda\), \(\mu\); positive-definite \(\mathbb{C}\).</li>
      <li>1D: shaded area = strain-energy density \(u = \tfrac{1}{2}\sigma\varepsilon\).</li>
    </ul>
    """ + gb("3", "Hooke's Law") + r""", """ + gb("4", "Fundamental Equations") + r"""
  </div>
  <div>""" + img("fig3.png", "Hooke's law graph", CAP_FIG3) + r"""</div>
</div>""")),

    slide("Fundamental boundary-value problem", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <p>\[ \boldsymbol{\varepsilon}=\tfrac{1}{2}(\nabla\mathbf{u}+\nabla\mathbf{u}^{\top}),\ \boldsymbol{\sigma}=\mathbb{C}:\boldsymbol{\varepsilon},\ \nabla\!\cdot\!\boldsymbol{\sigma}+\mathbf{f}=\mathbf{0}\ \text{in }V. \]</p>
    <ul>
      <li>\(\mathbf{u} = \mathbf{u}_0\) on \(S_u\); \(\boldsymbol{\sigma}\cdot\mathbf{n} = \mathbf{t}\) on \(S_t\).</li>
      <li>Compatibility if \(\boldsymbol{\varepsilon}\) is not from a single \(\mathbf{u}\).</li>
    </ul>
    """ + gb("4", "Fundamental Equations") + r"""
  </div>
  <div>""" + img("fig4.png", "Boundary value problem", CAP_FIG4) + r"""</div>
</div>""")),

    slide("Elastic rod (1D building block)", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <p>\[ \varepsilon=\frac{\mathrm{d} u}{\mathrm{d} x},\qquad N=EA\,\varepsilon,\qquad \frac{\mathrm{d} N}{\mathrm{d} x}+f=0. \]</p>
    <ul>
      <li>Axial bar: \(u(x)\), stress \(\sigma = N/A\), rigidity \(EA\).</li>
      <li>Same pattern as 3D theory, one displacement component.</li>
      <li>Warm-up before 2D Airy and 3D Green's functions.</li>
    </ul>
    """ + gb("4–5", "Fund. Eqs., 2D Elasticity") + r"""
  </div>
  <div>""" + img("fig5.png", "Elastic rod", CAP_FIG5) + r"""</div>
</div>""")),

    slide("2D formulations", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <ul>
      <li><strong>Plane strain:</strong> \(\varepsilon_{33} = \varepsilon_{13} = \varepsilon_{23} = 0\) (thick body).</li>
      <li><strong>Plane stress:</strong> \(\sigma_{33} = \sigma_{13} = \sigma_{23} = 0\) (thin plate).</li>
      <li>Airy \(\phi(x,y)\) with \(\nabla^4\phi = 0\):<br/>
        \[ \sigma_{xx}=\phi_{,yy},\ \sigma_{yy}=\phi_{,xx},\ \sigma_{xy}=-\phi_{,xy}. \]</li>
    </ul>
    """ + gb("5", "2D Elasticity") + r"""
  </div>
  <div>""" + img("fig6.png", "Plane stress and plane strain") + r"""</div>
</div>""")),

    slide("Classic 2D solution routes", assemble(r"""
<div class="slide-content">
  <ul>
    <li><strong>Rectangular beam</strong> (Lec. 7): polynomial Airy + BC matching.</li>
    <li><strong>Fourier series</strong> (Lec. 8): periodic / strip loads.</li>
    <li><strong>Half space</strong> (Lec. 9): Flamant line load; \(\sigma \sim 1/r\).</li>
    <li><strong>Contact</strong> (Lec. 10): unknown contact patch and pressure.</li>
  </ul>
</div>
<div class="fig-full">""" + img("fig7.png", "Classic 2D solution routes") + r"""</div>""")),

    slide("Polar coordinates and wedge problems", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <p>\[ \nabla^4\phi=0 \ \Rightarrow\ \phi(r,\theta)\ \text{with}\ r,\theta,\ln r,\ \theta\ln r\ \text{modes}. \]</p>
    <ul>
      <li>Lec. 11–12: disks, rings, holes in \((r,\theta)\).</li>
      <li>Lec. 13 wedge: corner singularities; eigenfunction exponents.</li>
      <li>Pick modes with symmetry and finite energy.</li>
    </ul>
    """ + gb("11–12", "Polar Coordinates, Wedge and Notch") + r"""
  </div>
  <div>""" + img("fig8.png", "Polar annulus and wedge", CAP_FIG8) + r"""</div>
</div>""")),

    slide("Green's function approach (3D)", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <p>\[ \nabla\!\cdot\!\boldsymbol{\sigma}+\mathbf{f}=\mathbf{0},\quad \mathbf{u}(\mathbf{x})=\int G(\mathbf{x},\boldsymbol{\xi})\,\mathbf{f}(\boldsymbol{\xi})\,\mathrm{d}V_\xi. \]</p>
    <ul>
      <li>Kelvin solution (Lec. 17): point force in infinite space.</li>
      <li>Half-space images (Lec. 16): traction-free surface.</li>
      <li>Superpose for defects and boundaries.</li>
    </ul>
    """ + gb("16–17", "Half Space, Kelvin Solution") + r"""
  </div>
  <div>""" + img("fig9.png", "Kelvin solution and half-space image", CAP_FIG9) + r"""</div>
</div>""")),

    slide("Dislocations and defect fields", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <ul>
      <li>Cut the lattice; insert Burgers vector \(\mathbf{b}\) across the slip plane.</li>
      <li>Stress singular at the core; far field set by \(\mathbf{b}\) and geometry.</li>
      <li>Peach–Köhler: defect force from external \(\boldsymbol{\sigma}^\infty\) on the dislocation.</li>
      <li>Superpose: singular field + image / boundary correction.</li>
      <li>Macroscopic plastic strain accumulates from many dislocation motions.</li>
    </ul>
    {gb("notes", "Dislocations (extended notes)")}
  </div>
  <div>""" + img("fig10.png", "Dislocation schematic", CAP_FIG10) + r"""</div>
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
    """ + gb("3", "Hooke's Law") + r""", """ + gb("13", "Fund. Eqs. of Plasticity") + r"""
  </div>
  <div>""" + img("fig_elas_plas.png", "Elastic-plastic loading", CAP_ELAS_PLAS) + r"""</div>
</div>""")),

    slide("Yield criteria: von Mises and Tresca", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <p>Deviatoric stress \(s_{ij} = \sigma_{ij} - \tfrac{1}{3}\sigma_{kk}\delta_{ij}\).</p>
    <p>\[ J_2=\tfrac{1}{2}s_{ij}s_{ij},\qquad \sigma_{\mathrm{eq}=\sqrt{3J_2}. \]</p>
    <p><strong>von Mises yield:</strong> \[ f=J_2-k^2\le 0,\qquad k=\frac{\sigma_Y}{\sqrt{3}. \]</p>
    <p><strong>Tresca yield:</strong> \(\max|\sigma_i-\sigma_j| = 2k\) (alternative for metals).</p>
    <p>Plastic flow is insensitive to hydrostatic stress; yielding depends on \(s_{ij}\).</p>
    """ + gb("13–14", "Yield surface / graphical") + r"""
  </div>
  <div>""" + img("fig_yield_surf.png", "Yield surfaces", CAP_YIELD) + r"""</div>
</div>""")),

    slide("J₂ associated flow rule", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <p>Associated (normality) flow with \(f = J_2 - k^2\):</p>
    <p>\[ \dot\varepsilon_{ij}^{p}=\dot\lambda\,\frac{\partial f}{\partial\sigma_{ij} =\dot\lambda\, s_{ij},\qquad \dot\varepsilon_{kk}^{p}=0. \]</p>
    <p>Consistency during plastic loading (\(\dot f = 0\)): elastic predictor, plastic corrector if \(f &gt; 0\).</p>
    <p>Dislocations are the microscopic carriers; \(J_2\) plasticity is the continuum limit.</p>
    """ + gb("13–15", "Flow rule, tension &amp; shear") + r"""
  </div>
  <div>""" + img("fig11.png", "Radial return mapping", CAP_FIG11) + r"""</div>
</div>""")),

    slide("Fracture: LEFM and energy release", assemble(r"""
<div class="cols cols-text-wide">
  <div class="slide-content">
    <ul>
      <li>Slit-like crack: elastic field with \(r^{-1/2}\) stress singularity at tip.</li>
      <li>Stress intensity \(K_I\) characterizes tip loading; fracture when \(K_I = K_{Ic}\).</li>
      <li>Energy release rate \(\mathcal{G} = \partial U/\partial a\); \(J\)-integral for nonlinear paths.</li>
      <li>Elastic–plastic zone and Dugdale–Barenblatt model; fatigue crack growth (Part III).</li>
    </ul>
    """ + gb("22–26", "Slit crack, LEFM, fatigue") + r"""
  </div>
  <div>""" + img("fig12.png", "Center crack", CAP_FIG12) + r"""</div>
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
<div class="example-block"><strong>Benchmark mindset:</strong> Keep an analytic case as a reference when switching to numerics.</div>
""")),

    slide("Lecture map", assemble(r"""
<div class="cols-33 lecture-map">
  <div>
    <h4>Part I. Elasticity</h4>
    <ol>
      <li>Introduction</li><li>Tensors</li><li>Hooke's Law</li><li>Fundamental Equations</li>
      <li>2D Elasticity</li><li>Rectangular Beam</li><li>Fourier Series and Transform</li>
      <li>Fourier Solution</li><li>Half Space</li><li>Contact</li><li>Polar Coordinates</li><li>Wedge and Notch</li>
    </ol>
  </div>
  <div>
    <h4>Part II. Plasticity</h4>
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
    <h4>Part III. Fracture</h4>
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
<ol class="meta-text">
  <li><strong>Elasticity:</strong> kinematics + Hooke + equilibrium + BCs; 2D Airy \(\phi\), 3D Green's functions.</li>
  <li><strong>Plasticity:</strong> \(\boldsymbol{\varepsilon} = \boldsymbol{\varepsilon}^{e} + \boldsymbol{\varepsilon}^{p}\); von Mises yield + associated \(J_2\) flow.</li>
  <li><strong>Fracture:</strong> \(K_I\), \(\mathcal{G}\), and \(J\) link elastic fields to crack growth and fatigue.</li>
  <li>Matlab and analytic benchmarks support each part.</li>
</ol>
<div class="flow-row" style="margin-top:0.75em;">
  <div class="fbox">Elasticity<br>\(\sigma,\ \mathbf{u}\)</div><span class="arrow">→</span>
  <div class="gbox">Plasticity<br>\(\varepsilon^{p},\ f=0\)</div><span class="arrow">→</span>
  <div class="kbox">Fracture<br>\(K_{I},\ J\)</div>
</div>
"""),

    slide("References", assemble(r"""
<ul class="meta-text">
  <li>W. Cai, <em>ME 340 Elasticity and Inelasticity</em> (lecture notes);
    <a href="{ELASTICITY_NOTES}">consolidated PDF</a>.</li>
  <li>J. R. Barber, <em>Elasticity</em>, 3rd ed., Springer (2010).</li>
  <li>T. L. Anderson, <em>Fracture Mechanics</em>, 3rd ed., Taylor &amp; Francis (2005).</li>
  <li>Printable intro slides: <a href="{INTRO_PDF}">ME340_Intro.pdf</a>.</li>
</ul>
<p class="meta-text" style="text-align:center;margin-top:1.5em;"><strong>Thank you.</strong></p>
""")),
]


HTML_HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ME 340 — Mechanics: Elasticity and Inelasticity</title>
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
  Reveal.initialize({
    hash: true,
    slideNumber: 'c/t',
    transition: 'fade',
    backgroundTransition: 'fade',
    width: 1280,
    height: 720,
    margin: 0.06,
    plugins: []
  });
  renderMathInElement(document.body, {
    delimiters: [
      {left: '\\\\[', right: '\\\\]', display: true},
      {left: '\\\\(', right: '\\\\)', display: false},
      {left: '$$', right: '$$', display: true},
      {left: '$', right: '$', display: false}
    ],
    throwOnError: false
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
