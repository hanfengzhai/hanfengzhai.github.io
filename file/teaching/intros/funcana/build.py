#!/usr/bin/env python3
"""Generate Reveal.js HTML deck from ../slides.tex (symlink to Notes/FunctionalAnalysis/slides.tex)."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "index.html"
FIGURES = "figures"
DEMO = "demo/Output"
STANFORD_LOGO = "/css/images/site/stanford_logo.png"

ROM_FLOW = """
<div class="pipeline-row">
  <div class="pipe-node">
    <span class="pipe-tag">Strong PDE</span>
    <span class="pipe-math">\\(-\\nabla\\!\\cdot\\!(\\kappa\\nabla u)=f\\)</span>
  </div>
  <span class="pipe-arrow">→</span>
  <div class="pipe-node">
    <span class="pipe-tag">Weak Form</span>
    <span class="pipe-math">\\(a(u,v)=\\ell(v)\\)</span>
  </div>
  <span class="pipe-arrow">→</span>
  <div class="pipe-node">
    <span class="pipe-tag">Operator</span>
    <span class="pipe-math">\\(A(\\xi)u=b\\)</span>
  </div>
  <span class="pipe-arrow">→</span>
  <div class="pipe-node is-goal">
    <span class="pipe-tag">Output QoI</span>
    <span class="pipe-math">\\(s(\\xi)=Lu\\)</span>
  </div>
  <span class="pipe-arrow">→</span>
  <div class="pipe-node is-rom">
    <span class="pipe-tag">Goal ROM</span>
    <span class="pipe-math">\\(\\Sh,\\Vh,\\WQ\\)</span>
  </div>
</div>"""


def expand_norm(s):
    """Expand \\norm{...} with balanced-brace matching (handles \\adj{...} inside)."""
    needle = r"\norm{"
    n = len(needle)
    out = []
    i = 0
    while i < len(s):
        if s.startswith(needle, i):
            j = i + n
            depth = 1
            start = j
            while j < len(s) and depth:
                if s[j] == "{":
                    depth += 1
                elif s[j] == "}":
                    depth -= 1
                if depth:
                    j += 1
            inner = s[start:j]
            out.append(r"\left\Vert " + inner + r" \right\Vert")
            i = j + 1
        else:
            out.append(s[i])
            i += 1
    return "".join(out)


def tex(s):
    """Expand Beamer-style macros to KaTeX-safe LaTeX."""
    out = s
    for old, new in (
        ("\\calS", "\\mathcal{S}"),
        ("\\calV", "\\mathcal{V}"),
        ("\\Sh", "\\mathcal{S}_h"),
        ("\\Vh", "\\mathcal{V}_h"),
        ("\\WQ", "W_k^{Q}"),
        ("\\Lc", "\\mathcal{L}"),
        ("\\R^", "\\mathbb{R}^"),
    ):
        out = out.replace(old, new)
    out = expand_norm(out)
    out = re.sub(r"\\adj\{([^}]+)\}", r"\1^{*}", out)
    out = re.sub(r"\\inner\{([^}]+)\}", r"\\langle \1 \\rangle", out)
    out = re.sub(r"\\dd\s+([a-zA-Z])", r"\\mathrm{d}\1", out)
    return out


def fig(path, alt="", cls="slide-fig"):
    return (
        f'<div class="diagram-wrap">'
        f'<img class="{cls}" src="{path}" alt="{alt}" loading="lazy">'
        f"</div>"
    )


def gb(part, topic):
    part_clean = part.replace("~", "&nbsp;")
    topic_clean = topic.replace("~", "&nbsp;")
    return f'<span class="gb-badge"><span class="textsc">GB&nbsp;{part_clean}</span> [{topic_clean}]</span>'


def gb_row(*parts):
    return f'<div class="gb-footer">{";&nbsp;".join(parts)}</div>'


def S(*parts):
    return tex("".join(parts))


def slide(title, body, center=False):
    cls_parts = ["center-slide"] if center else []
    cls = f' class="{" ".join(cls_parts)}"' if cls_parts else ""
    title_html = f'<div class="slide-title">{tex(title)}</div>' if title else ""
    return (
        f"<section{cls}>{title_html}"
        f'<div class="slide-body"><div class="slide-content">{tex(body)}</div></div>'
        f"</section>"
    )


def title_slide():
    return f"""
<section class="title-slide-section center-slide">
  <div class="title-slide-banner"><h1 class="textsc">Goal-Oriented Projection-Based Model Order Reduction</h1></div>
  <div class="title-slide-body slide-content">
    <p class="title-slide-meta">Zahm et al. (2017) &middot; 2D Steady Heat Example</p>
    <div class="title-slide-logo"><img src="{STANFORD_LOGO}" alt="Stanford University" loading="lazy"></div>
    <p class="author"><strong>Hanfeng Zhai</strong></p>
    <p class="institute">Department of Mechanical Engineering, Stanford University</p>
    <p class="date">June 2026</p>
  </div>
</section>"""


SLIDES = [
    title_slide(),

    slide("Motivation", S("""
<div class="cols cols-wide-right">
  <div>
    <ul>
      <li><strong>Physics:</strong> a heat source scans the part while material conductivity or loading varies with parameter \\(\\xi\\).</li>
      <li><strong>Goal:</strong> predict one probe quantity \\(s(\\xi)\\) accurately instead of storing the full temperature field.</li>
      <li><strong>Challenge:</strong> every new \\(\\xi\\) requires a costly FEM solve \\(\\Rightarrow\\) build a fast reduced surrogate for \\(s(\\xi)\\).</li>
    </ul>
  </div>
  <div>""", fig(f"{FIGURES}/AI_metal3D.png", "Metal AM application"), "</div>\n</div>")),

    slide("Outline", """
<div class="toc-grid">
  <div class="toc-phase">
    <div class="toc-phase-kicker">Part I &middot; Formulation</div>
    <ol start="1">
      <li>Problem Formulation</li>
      <li>Variational Derivation</li>
      <li>Goal-Oriented Projection-Based MOR</li>
    </ol>
  </div>
  <div class="toc-phase">
    <div class="toc-phase-kicker">Part II &middot; Analysis &amp; Bounds</div>
    <ol start="4">
      <li>Functional Analysis and inf–sup Stability</li>
      <li>Petrov–Galerkin Projection</li>
      <li>Primal–Dual Estimators</li>
      <li>Certified Error Bounds &amp; Greedy Enrichment</li>
    </ol>
  </div>
  <div class="toc-phase">
    <div class="toc-phase-kicker">Part III &middot; Demonstration</div>
    <ol start="8">
      <li>Numerical Demonstration</li>
      <li>Summary and Takeaways</li>
    </ol>
  </div>
</div>
<p class="nav-hint">Use ← → keys, swipe, or click the arrows to navigate.</p>
"""),

    slide("2D steady heat on \\(\\Omega=(0,1)^2\\)", S("""
<div class="cols cols-wide-left">
  <div>
    \\[ \\begin{aligned}
         -\\nabla\\!\\cdot\\!\\big(\\kappa\\,\\nabla u\\big) &= f \\quad \\text{in }\\Omega, \\\\
         u = 0 \\text{ on }\\Gamma_D, \\qquad &\\kappa\\,\\partial_n u = g \\text{ on }\\Gamma_N.
       \\end{aligned} \\]
    \\[ s = \\frac{1}{|\\omega|}\\int_\\omega u\\,\\dd x = Lu . \\]
    <ul>
      <li>\\(u\\): temperature; \\(\\kappa(x,\\xi)\\): parametric conductivity; \\(f\\): source; \\(g\\): flux.</li>
      <li>\\(\\xi\\): scalar scenario parameter (distinct from spatial coordinate \\(x\\)).</li>
      <li>\\(s\\): disk average on \\(\\omega\\) (bounded on \\(H^1\\); point evaluation is not).</li>
    </ul>
  </div>
  <div>""", fig(f"{DEMO}/heat2d_schematic.png", "Heat 2D schematic"), "</div>\n</div>\n",
  gb_row(gb("Part&nbsp;7, §5.1", "continuous elliptic"), gb("Part&nbsp;4, Def.&nbsp;1.68", "bounded \\(L\\)")))),

    slide("Weak form", S("""
\\[ \\int_\\Omega \\kappa\\,\\nabla u\\!\\cdot\\!\\nabla v\\,\\dd x
    = \\int_\\Omega f\\,v\\,\\dd x + \\int_{\\Gamma_N} g\\,v\\,\\dd s
    \\qquad \\forall v\\in \\calS . \\]
\\[ a(u,v)=\\ell(v). \\]
<ul>
  <li>\\(v\\): test function; integration by parts transfers one derivative onto \\(v\\).</li>
  <li>\\(\\calS=\\calV=H^1_{0,\\Gamma_D}\\): essential BC \\(v=0\\) on \\(\\Gamma_D\\); natural flux \\(g\\) enters \\(\\ell(v)\\).</li>
</ul>
""", gb_row(gb("Part&nbsp;7, §5.1", "IBP → bilinear form"), gb("Part&nbsp;6, (3.1)", "variational (3.1)")))),

    slide("Well-posedness", S("""
\\[ \\norm{u}_{L^2}\\le C_P\\,\\norm{\\nabla u}_{L^2}, \\qquad
    a(u,u)\\ge \\alpha\\,\\norm{u}_{H^1}^2 , \\]
\\[ \\exists!\\,u\\in \\calS:\\quad a(u,v)=\\ell(v)\\quad \\forall v\\in \\calV . \\]
<ul>
  <li>Continuity of \\(a\\) and \\(\\ell\\) with Poincaré's inequality yields coercivity \\(\\alpha &gt; 0\\).</li>
  <li>Lax–Milgram guarantees a unique, continuously stable weak solution \\(u\\in\\calS\\).</li>
</ul>
""", gb_row(gb("Part&nbsp;7, Lem.&nbsp;5.4", "Poincaré"), gb("Part&nbsp;7, §5.4", "strong coercivity"), gb("Part&nbsp;6, Cor.&nbsp;3.10", "Lax–Milgram")))),

    slide("Operator form", S("""
\\[ \\inner{Au,v}=a(u,v),\\qquad \\inner{b,v}=\\ell(v),\\qquad Au=b . \\]
<ul>
  <li>\\(\\inner{\\cdot,\\cdot}\\): duality pairing with \\(A:\\calS\\to \\calV'\\) and \\(b\\in \\calV'\\).</li>
  <li>Trial \\(u\\in\\calS\\), test \\(v\\in\\calV\\); reduced spaces \\(\\Sh\\subset\\calS\\), \\(\\Vh\\subset\\calV\\) with \\(u_h\\in\\Sh\\), \\(v_h\\in\\Vh\\).</li>
  <li>Linear output \\(s=Lu\\) (scalar in the 2D demo; vector \\(Z=\\R^l\\) in Zahm et al.).</li>
</ul>
""", gb_row(gb("Part&nbsp;6, (3.1)", "\\(Au=b\\)"), gb("Part&nbsp;4, Def.&nbsp;1.68", "bounded \\(A\\)"), gb("Part&nbsp;4, Def.&nbsp;1.73", "dual \\(\\calV'\\)"), gb("Part&nbsp;3, Def.&nbsp;1.48", "Hilbert")))),

    slide("Parameter \\(\\xi\\)", S("""
\\[ A(\\xi)\\,u(\\xi)=b(\\xi),\\qquad s(\\xi)=L(\\xi)\\,u(\\xi),\\qquad \\xi\\in\\Xi . \\]
<ul>
  <li>\\(\\xi\\): physical scenario parameter (conductivity in demo; loads or BCs in general).</li>
  <li>Many-query workflows (design, UQ, control) evaluate thousands of \\(\\xi\\); full FEM is too costly.</li>
  <li><strong>Offline–online split:</strong> invest offline snapshots at \\(\\xi_i\\) to make every online query \\(s(\\xi)\\) millisecond-fast.</li>
</ul>
""", gb_row(gb("Part&nbsp;6, (3.1)", "variational form"), gb("Part&nbsp;4, Def.&nbsp;1.68", "bounded parametric maps")))),

    slide("Parametric output problem", S("""
<ul>
  <li><strong>Target:</strong> approximate the probe map \\(\\xi \\mapsto s(\\xi) = L(\\xi)u(\\xi)\\) directly via reduced spaces \\((\\Sh, \\Vh, \\WQ)\\).</li>
  <li><strong>Offline:</strong> construct trial, test, and dual bases from snapshots. <strong>Online:</strong> solve tiny projected systems per \\(\\xi\\).</li>
</ul>
""", ROM_FLOW, "\n", gb_row(gb("Part&nbsp;6, (3.1)", "variational form"), gb("Part&nbsp;4, Def.&nbsp;1.68", "bounded \\(L\\)")))),

    slide("Adjoints \\(A^*\\), \\(L^*\\) and dual operator \\(Q\\)", S("""
\\[ \\langle Au,v \\rangle=\\langle u,A^{*}v \\rangle \\qquad \\forall u\\in \\calS,\\ v\\in \\calV . \\]
\\[ \\adj{A}Q=\\adj{L},\\qquad Q\\in\\Lc(Z',\\calV),\\qquad s=Lu=\\adj{Q}b . \\]
<ul>
  <li>\\(\\adj{A}:\\calV\\to\\calS'\\) maps test directions to trial functionals; \\(\\adj{L}:Z'\\to\\calS'\\) encodes sensor weights.</li>
  <li>\\(Q\\in\\Lc(Z',\\calV)\\): dual influence operator solving the adjoint PDE for unit output loads.</li>
  <li>Duality identity \\(s = Lu = \\adj{Q}b\\): exact \\(u\\) or exact \\(Q\\) alone recovers the output \\(s\\).</li>
</ul>
""", gb_row(gb("Part&nbsp;4, Thm.&nbsp;1.82", "Riesz"), gb("Part&nbsp;7, Def.&nbsp;5.7", "adjoint \\(A^*\\)"), gb("Part&nbsp;6, Thm.&nbsp;3.9", "well-posed dual")))),

    slide("What Zahm et al. add", S("""
<div class="cols-equal">
  <div>
    <div class="col-group-label">Reduced-Space Architecture</div>
    <ul>
      <li><strong>Goal-oriented:</strong> reduced bases target \\(s=Lu\\) rather than full-field energy alone.</li>
      <li><strong>Three spaces:</strong> Petrov–Galerkin \\(\\Sh\\neq\\Vh\\) plus dual space \\(\\WQ\\).</li>
      <li><strong>Vector output:</strong> \\(s\\in Z\\) via operator dual \\(Q\\in\\Lc(Z',\\calV)\\).</li>
    </ul>
  </div>
  <div>
    <div class="col-group-label">Certification &amp; Adaptivity</div>
    <ul>
      <li><strong>Certified bounds:</strong> computable \\(\\Delta(\\xi)\\) from primal and dual residuals.</li>
      <li><strong>Greedy enrichment:</strong> sample snapshots at \\(\\arg\\max_\\xi\\Delta(\\xi)\\).</li>
      <li><strong>Estimator ladder:</strong> Petrov–Galerkin (pg) → primal–dual (pd) → saddle-point (sp).</li>
    </ul>
  </div>
</div>
<details class="math-disclosure">
  <summary>Estimator ladder (pg → pd → sp)</summary>
  <div class="disclosure-body">
    <p><strong>Petrov–Galerkin (pg):</strong> \\(s_{\\mathrm{pg}} = Lu_h\\) directly from the projected primal state \\(u_h\\in\\Sh\\).</p>
    <p><strong>Primal–dual (pd):</strong> \\(s_{\\mathrm{pd}} = Lu_h + \\adj{Q_h}(b - Au_h)\\) corrects \\(Lu_h\\) using the residual and dual approximation \\(Q_h\\).</p>
    <p><strong>Saddle-point (sp):</strong> couples \\((\\Sh, \\Vh, \\WQ)\\) in a single variational saddle-point system (Prop.&nbsp;2.10) to achieve quadratic error reduction.</p>
  </div>
</details>
""", gb_row(gb("Part&nbsp;6, §3.3", "Ritz–Galerkin"), gb("Part&nbsp;6, §3.4", "discrete PG"), gb("Part&nbsp;6, Thm.&nbsp;3.9", "BNB"), gb("Part&nbsp;3, Exo.&nbsp;1.42", "Cauchy–Schwarz")))),

    slide("inf–sup stability", S("""
\\[ \\alpha\\norm{u}_{\\calS}\\le \\norm{Au}_{\\calV'}\\le \\beta\\norm{u}_{\\calS}, \\]
\\[ \\alpha=\\inf_{u\\neq 0}\\sup_{v\\neq 0}\\frac{\\inner{Au,v}}{\\norm{u}_{\\calS}\\norm{v}_{\\calV}},\\qquad
    \\beta=\\sup_{u\\neq 0}\\sup_{v\\neq 0}\\frac{\\inner{Au,v}}{\\norm{u}_{\\calS}\\norm{v}_{\\calV}}. \\]
<ul>
  <li>\\(\\alpha&gt;0\\) (Banach–Nečas–Babuška): links small residuals directly to small state errors.</li>
  <li>Handles general \\(\\calS\\neq\\calV\\) (Petrov–Galerkin); symmetric heat (\\(\\calS=\\calV\\)) recovers Lax–Milgram.</li>
</ul>
""", gb_row(gb("Part&nbsp;6, Thm.&nbsp;3.9", "BNB"), gb("Part&nbsp;6, Cor.&nbsp;3.10", "Lax–Milgram")))),

    slide("Petrov–Galerkin projection", S("""
\\[ \\inner{Au_h-b,\\,v_h}=0\\qquad \\forall v_h\\in\\Vh,\\qquad u_h\\in\\Sh\\subset \\calS . \\]
\\[ \\norm{u-u_h}_{\\calS} \\le \\frac{1}{\\sqrt{1-\\delta_{\\Sh,\\Vh}^2}}\\;\\min_{w_h\\in\\Sh}\\norm{u-w_h}_{\\calS} . \\]
<ul>
  <li>Residual \\(Au_h-b\\) is orthogonal to test space \\(\\Vh\\) (\\(\\Sh\\neq\\Vh\\) in general).</li>
  <li>Quasi-optimality holds whenever test-space defect \\(\\delta_{\\Sh,\\Vh}&lt;1\\) (Prop.&nbsp;2.1).</li>
</ul>
<details class="math-disclosure">
  <summary>Test-space defect \\(\\delta_{\\Sh,\\Vh}\\) and discrete inf–sup \\(m_h\\)</summary>
  <div class="disclosure-body">
    <p>\\(\\delta_{\\Sh,\\Vh}\\) measures the sine of the angle between \\(A\\Sh\\) and the Riesz lift of \\(\\Vh\\); keeping \\(\\delta_{\\Sh,\\Vh} &lt; 1\\) is equivalent to a strictly positive discrete inf–sup constant \\(m_h &gt; 0\\).</p>
  </div>
</details>
""", gb_row(gb("Part&nbsp;6, §3.4", "discrete PG, eq.&nbsp;(3.9)"), gb("Part&nbsp;6, (3.10)", "discrete inf–sup \\(m_h\\)"), gb("Part&nbsp;6, Lem.&nbsp;3.11", "Céa"), gb("Part&nbsp;6, §3.3", "Ritz–Galerkin")))),

    slide("Output error bound (Prop.&nbsp;2.1, Eq.&nbsp;9)", S("""
\\[ \\norm{s-Lu_h}_Z\\le
    \\delta^L_{\\Vh}\\cdot
    \\frac{1}{\\sqrt{1-\\delta_{\\Sh,\\Vh}^2}}\\cdot
    \\min_{w_h\\in\\Sh}\\norm{u-w_h}_{\\calS} . \\]
<ul>
  <li>Output error scales with the <strong>product</strong> of dual test error \\(\\delta^L_{\\Vh}\\) and trial best-approximation error.</li>
  <li><strong>Compliant case</strong> (\\(\\calS=\\calV\\), \\(\\Vh=\\Sh\\), \\(Lu=\\inner{b,u}\\)): quadratic accuracy \\(|s-Lu_h|\\le\\norm{u-u_h}_{\\calS}^2\\).</li>
</ul>
""", gb_row(gb("Part&nbsp;6, Lem.&nbsp;3.11", "Céa quasi-opt."), gb("Part&nbsp;3, Exo.&nbsp;1.42", "Cauchy–Schwarz"), gb("Part&nbsp;7, §5.2", "Ritz–Galerkin")))),

    slide("Two jobs of \\(\\calV_h\\)", S("""
\\[ \\norm{s-Lu_h}_Z\\le
    \\underbrace{\\delta^L_{\\Vh}}_{\\text{(c) dual range}}
    \\;\\cdot\\;
    \\underbrace{\\tfrac{1}{\\sqrt{1-\\delta_{\\Sh,\\Vh}^2}}}_{\\text{(b) PG stability}}
    \\;\\cdot\\;
    \\underbrace{\\min_{w_h\\in\\Sh}\\norm{u-w_h}_{\\calS}}_{\\text{(a) trial approx.}} . \\]
<ul>
  <li>\\(\\Vh\\) must simultaneously stabilize projection on \\(\\Sh\\) <strong>and</strong> capture \\(\\mathrm{range}(A^{-*}L^*) = \\mathrm{range}(Q)\\).</li>
  <li>The 2D heat demo uses a shared snapshot space; Zahm et al. decouple \\(\\Vh\\neq\\Sh\\) for non-symmetric problems.</li>
</ul>
""", gb_row(gb("Part&nbsp;6, §3.4", "discrete test spaces"), gb("Part&nbsp;6, Thm.&nbsp;3.9", "inf–sup stability")))),

    slide("Dual problem", S("""
\\[ \\adj{A}Q=\\adj{L},\\qquad s=Lu=\\adj{Q}Au=\\adj{Q}b . \\]
<ul>
  <li><strong>Physical meaning:</strong> for the probe average on \\(\\omega\\), \\(Q\\) is the thermal response to a unit source on \\(\\omega\\).</li>
  <li><strong>Goal sensitivity:</strong> \\(Q\\) identifies exactly which spatial modes of the residual \\(b-Au_h\\) perturb \\(s\\).</li>
  <li><strong>Reduced approximation:</strong> building a dedicated dual space \\(\\WQ\\subset\\calV\\) decouples output accuracy from \\(\\Vh\\).</li>
</ul>
""", gb_row(gb("Part&nbsp;4, Thm.&nbsp;1.82", "Riesz"), gb("Part&nbsp;7, Def.&nbsp;5.7", "adjoint \\(A^*\\)"), gb("Part&nbsp;6, Thm.&nbsp;3.9", "well-posedness")))),

    slide("Primal–dual estimate", S("""
\\[ \\tilde s = Lu_h + \\adj{Q_h}\\,(b-Au_h), \\]
\\[ \\norm{s-\\tilde s}_Z\\le \\norm{u-u_h}_{\\calS}\\;\\norm{\\adj{L}-\\adj{A}Q_h}_{Z'\\to \\calS'} . \\]
<ul>
  <li>\\(\\tilde s\\) augments the primal prediction \\(Lu_h\\) with a dual-weighted residual correction \\(\\adj{Q_h}(b-Au_h)\\).</li>
  <li>Uses three reduced spaces: trial \\(\\Sh\\), test \\(\\Vh\\), and dual \\(\\WQ\\).</li>
</ul>
<details class="math-disclosure">
  <summary>Saddle-point estimator remark (Prop.&nbsp;2.10)</summary>
  <div class="disclosure-body">
    <p>Zahm et al. (Prop.&nbsp;2.10) also formulate a saddle-point estimator \\(s_{\\mathrm{sp}}\\) solving jointly over \\((\\Sh, \\WQ)\\), avoiding separate test-space coupling while retaining product-of-errors decay.</p>
  </div>
</details>
""", gb_row(gb("Part&nbsp;3, Exo.&nbsp;1.42", "C–S on pairing"), gb("Part&nbsp;4, Thm.&nbsp;1.82", "Riesz"), gb("Part&nbsp;7, Def.&nbsp;5.7", "adjoint"), gb("Part&nbsp;3, Def.&nbsp;1.51", "orthogonal projection")))),

    slide("Certified bound", S("""
\\[ \\norm{s(\\xi)-\\tilde s(\\xi)}_Z \\le
    \\frac{\\norm{A(\\xi)u_h-b(\\xi)}_{\\calS_0'}\\;\\norm{\\adj{L}(\\xi)-\\adj{A}(\\xi)Q_h(\\xi)}_{Z'\\to \\calS_0'}}{\\alpha(\\xi)}
    =:\\Delta(\\xi). \\]
<ul>
  <li>\\(\\Delta(\\xi)\\) is computable online from primal residual \\(\\times\\) dual residual divided by lower bound \\(\\alpha(\\xi)\\).</li>
  <li><strong>Certification:</strong> true error never exceeds \\(\\Delta(\\xi)\\), so effectivity \\(\\Delta(\\xi)/\\norm{s-\\tilde s}_Z \\ge 1\\).</li>
</ul>
""", gb_row(gb("Part&nbsp;6, (3.5)", "inf–sup const. \\(m\\)"), gb("Part&nbsp;6, Thm.&nbsp;3.9", "BNB stability"), gb("Part&nbsp;3, Exo.&nbsp;1.42", "residual product")))),

    slide("Greedy enrichment", S("""
\\[ \\xi^\\star \\in \\arg\\max_{\\xi\\in\\Xi}\\Delta(\\xi), \\]
\\[ \\Sh \\leftarrow \\Sh + \\mathrm{span}\\,u(\\xi^\\star), \\qquad
    \\WQ \\leftarrow \\WQ + \\mathrm{range}\\,Q(\\xi^\\star) . \\]
<ul>
  <li>Select worst parameter \\(\\xi^\\star\\) via \\(\\Delta(\\xi)\\), compute full primal \\(u(\\xi^\\star)\\) and dual \\(Q(\\xi^\\star)\\), and enrich bases.</li>
  <li>Iterate until \\(\\max_{\\xi\\in\\Xi}\\Delta(\\xi)\\) falls below the target tolerance.</li>
</ul>
<details class="math-disclosure">
  <summary>Enrichment variants (Alg.&nbsp;1–2) &amp; test-space preconditioner (Eq.&nbsp;44)</summary>
  <div class="disclosure-body">
    <p>Zahm et al. compare alternate vs. simultaneous primal–dual enrichment (Alg.&nbsp;1–2) and construct the test space \\(\\Vh\\) from a parameter-independent preconditioner \\(P_m(\\xi) \\approx A(\\xi)^{-1}\\) (Eq.&nbsp;44).</p>
  </div>
</details>
""", gb_row(gb("Part&nbsp;4, Thm.&nbsp;1.83", "weak compactness"), gb("Part&nbsp;6, Thm.&nbsp;3.9", "certified \\(\\alpha\\)")))),

    slide("FEM field at \\(\\xi=1\\)", S("""
<div class="cols cols-wide-right">
  <div>
    <ul>
      <li>Full 2D FEniCS FEM solve at \\(\\xi = 1\\); QoI \\(s = \\bar{u}_\\omega\\) averages temperature over probe disk \\(\\omega\\).</li>
      <li>PROM predicts \\(s(\\xi)\\) across parameters \\(\\xi\\in[0.5,2]\\) without re-solving the full mesh.</li>
    </ul>
  </div>
  <div>""", fig(f"{DEMO}/fenics_field.png", "FEM temperature field"), "</div>\n</div>")),

    slide("PROM vs FEM: online speedup", S("""
<div class="metric-strip">
  <div class="metric-item">
    <span class="metric-label">Sweep</span>
    <span class="metric-value">80 queries, \\(\\xi \\in [0.5,\\,2]\\)</span>
  </div>
  <div class="metric-item">
    <span class="metric-label">Reduced Model</span>
    <span class="metric-value">Primal–dual PROM, \\(R = 10\\)</span>
  </div>
  <div class="metric-item">
    <span class="metric-label">Online Result</span>
    <span class="metric-value is-accent">\\(\\approx 222\\times\\) (14.95 → 0.07 ms) &middot; err \\(\\sim 10^{-13}\\)</span>
  </div>
</div>
""", fig(f"{DEMO}/compare_results.png", "PROM vs FEM comparison", cls="slide-fig-wide"))),

    slide("Demo scope", S("""
<div class="cols cols-wide-left">
  <div>""", fig(f"{DEMO}/fenics_convergence.png", "FEM mesh convergence"), """</div>
  <div>
    <ul>
      <li><strong>Implemented:</strong> affine parametric \\(A(\\xi)\\) and online primal–dual estimator \\(s_{\\mathrm{pd}}\\).</li>
      <li><strong>Full Zahm et al. framework:</strong> separate \\(\\Vh\\), saddle-point \\(s_{\\mathrm{sp}}\\), and greedy \\(\\Delta(\\xi)\\) enrichment.</li>
      <li><strong>Mesh check:</strong> FEM reference achieves \\(O(h^2)\\) QoI convergence on \\(\\omega\\).</li>
    </ul>
  </div>
</div>""")),

    slide("Takeaways", S("""
<ol>
  <li>State field \\(u\\) is intermediate; vector output \\(s=Lu\\) with certified bound \\(\\Delta(\\xi)\\) is the objective.</li>
  <li>Weak formulation \\(Au=b\\) and inf–sup stability \\(\\alpha &gt; 0\\) yield rigorous a posteriori bounds.</li>
  <li>Primal–dual correction multiplies primal and dual errors, driving relative QoI error to \\(\\sim 10^{-13}\\).</li>
  <li>On 80 queries of 2D steady heat, online PROM delivers \\(\\approx 222\\times\\) speedup over full FEM.</li>
</ol>
""", gb_row(gb("Part&nbsp;6, §3.3", "Galerkin"), gb("Part&nbsp;6, §3.4", "PG"), gb("Part&nbsp;6, Thm.&nbsp;3.9", "BNB"), gb("Part&nbsp;3, Exo.&nbsp;1.42", "C–S"), gb("Part&nbsp;4, Thm.&nbsp;1.82", "Riesz")))),

    slide("Reference", """
<p class="ref-citation">O.&nbsp;Zahm, M.&nbsp;Billaud-Friess, and A.&nbsp;Nouy, <em>Projection-based model order reduction methods for the estimation of vector-valued variables of interest</em>, <em>SIAM J. Sci. Comput.</em> <strong>39</strong>(4), A1647–A1674 (2017).</p>
<p class="closing-thanks">Thank you.</p>
<p class="closing-ack">Special thanks to José Hasbani &amp; Obed Camacho for discussions.</p>
""", center=True),
]

HTML_HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Goal-Oriented PROM: Functional Analysis</title>
  <meta name="description" content="Goal-oriented projection-based model order reduction (Zahm et al. 2017) via 2D steady heat.">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/white.css" id="theme">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <link rel="stylesheet" href="css/me340.css?v=2">
</head>
<body>
<div class="reveal">
  <div class="slides">
"""

HTML_TAIL = r"""
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"></script>
<script>
  const mathRenderOptions = {
    delimiters: [
      {left: '\\[', right: '\\]', display: true},
      {left: '\\(', right: '\\)', display: false}
    ],
    throwOnError: false,
    errorColor: '#8C1515',
    strict: 'ignore',
    macros: {
      'dd': '\\mathrm{d}'
    }
  };

  function renderDeckMath() {
    const root = document.querySelector('.reveal .slides');
    if (!root || typeof renderMathInElement !== 'function') return;
    renderMathInElement(root, mathRenderOptions);
  }

  Reveal.initialize({
    hash: true,
    slideNumber: 'c/t',
    transition: 'fade',
    backgroundTransition: 'fade',
    width: 1280,
    height: 720,
    margin: 0.04,
    plugins: []
  }).then(() => {
    renderDeckMath();
    Reveal.on('slidechanged', renderDeckMath);
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
