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
<div class="flow-row" style="margin-top:0.5em;">
  <div class="flow-stack">
    <div class="fbox">\\(-\\nabla\\!\\cdot\\!(\\kappa\\nabla u)=f\\)</div>
    <span class="arrow">→</span>
    <div class="fbox">\\(a(u,v)=\\ell(v)\\)</div>
    <span class="arrow">→</span>
    <div class="fbox">\\(Au=b\\)</div>
    <span class="arrow">→</span>
    <div class="gbox">\\(s=Lu\\)</div>
  </div>
  <div class="kbox" style="align-self:center;margin-left:0.75em;">ROM</div>
</div>"""


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
        ("\\exists!", "\\exists\\,"),
        ("\\R^", "\\mathbb{R}^"),
    ):
        out = out.replace(old, new)
    out = re.sub(r"\\adj\{([^}]+)\}", r"\1^{*}", out)
    out = re.sub(r"\\norm\{([^}]+)\}", r"\\left\\Vert \1 \\right\\Vert", out)
    out = re.sub(r"\\inner\{([^}]+)\}", r"\\langle \1 \\rangle", out)
    return out


def fig(path, alt=""):
    return (
        f'<div class="diagram-wrap">'
        f'<img class="slide-fig" src="{path}" alt="{alt}" loading="lazy">'
        f"</div>"
    )


def gb(part, topic):
    return f'<span class="gb-badge"><span class="textsc">GB&nbsp;{part}</span> [{topic}]</span>'


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
    <p class="title-slide-meta">Zahm–Billaud-Friess–Nouy (2017) • 2D heat example</p>
    <div class="title-slide-logo"><img src="{STANFORD_LOGO}" alt="Stanford University" loading="lazy"></div>
    <p class="author"><strong>Hanfeng Zhai</strong></p>
    <p class="institute">Department of Mechanical Engineering, Stanford University</p>
    <p class="date">June 2026</p>
  </div>
</section>"""


SLIDES = [
    title_slide(),

    slide("Motivation", S("""
<div class="cols cols-top">
  <div>
    <ul>
      <li>Physics: a heat source moves across the part; material or load varies with \\(\\xi\\).</li>
      <li>What we want: one number \\(s(\\xi)\\) at the probe — not the full temperature field.</li>
      <li>Challenge: each new \\(\\xi\\) means a new expensive simulation \\(\\Rightarrow\\) build a fast surrogate for \\(s(\\xi)\\).</li>
    </ul>
  </div>
  <div>""", fig(f"{FIGURES}/AI_metal3D.png", "Metal AM application"), "</div>\n</div>")),

    slide("Outline", """
<div class="toc-list">
  <div><h4>Problem Formulation</h4></div>
  <div><h4>Variational Derivation</h4></div>
  <div><h4>Goal-Oriented Projection-Based Model Order Reduction</h4></div>
  <div><h4>Functional Analysis and inf–sup Stability</h4></div>
  <div><h4>Petrov–Galerkin Projection</h4></div>
  <div><h4>Primal–Dual Estimators</h4></div>
  <div><h4>Certified Error Bounds and Greedy Enrichment</h4></div>
  <div><h4>Numerical Demonstration</h4></div>
  <div><h4>Summary and Takeaways</h4></div>
</div>
<p style="font-size:0.75em;margin-top:1em;">Use ← → keys, swipe, or scroll to navigate.</p>
"""),

    slide("2D steady heat on \\(\\Omega=(0,1)^2\\)", S("""
<div class="cols cols-top">
  <div>
    \\[ -\\nabla\\!\\cdot\\!\\big(\\kappa\\,\\nabla u\\big)=f,\\quad
       u=0\\ \\text{on }\\Gamma_D,\\quad
       \\kappa\\,\\partial_n u=g\\ \\text{on }\\Gamma_N . \\]
    \\[ s=\\frac{1}{|\\omega|}\\int_\\omega u=Lu . \\]
    <ul>
      <li>\\(u\\): temperature; \\(\\kappa\\): conductivity; \\(f\\): source; \\(g\\): boundary flux.</li>
      <li>\\(\\xi\\): parameter in \\(\\kappa(x,\\xi)\\) (not a spatial coordinate).</li>
      <li>\\(s\\): disk average at probe \\(\\omega\\) (bounded on \\(H^1\\); point value is not).</li>
    </ul>
    """, gb_row(gb("Part~7, §5.1", "continuous elliptic"), gb("Part~4, Def.~1.68", "bounded L")), """
  </div>
  <div>""", fig(f"{DEMO}/heat2d_schematic.png", "Heat 2D schematic"), "</div>\n</div>")),

    slide("Weak form", S("""
\\[ \\int_\\Omega \\kappa\\,\\nabla u\\!\\cdot\\!\\nabla v\\,\\dd x
    = \\int_\\Omega f\\,v\\,\\dd x + \\int_{\\Gamma_N} g\\,v\\,\\dd s
    \\qquad \\forall v\\in \\calS . \\]
\\[ a(u,v)=\\ell(v). \\]
<ul>
  <li>\\(v\\): test function; integration by parts moves derivatives onto \\(v\\).</li>
  <li>\\(\\calS=\\calV=H^1_{0,\\Gamma_D}\\): \\(v=0\\) on \\(\\Gamma_D\\); Neumann data \\(g\\) enters \\(\\ell(v)\\).</li>
</ul>
""", gb_row(gb("Part~7, §5.1", "IBP → bilinear form"), gb("Part~6, (3.1)", "variational (3.1)")))),

    slide("Well-posedness", S("""
\\[ \\norm{u}_{L^2}\\le C_P\\,\\norm{\\nabla u}_{L^2},\\qquad
    a(u,u)\\ge \\alpha\\,\\norm{u}_{H^1}^2,\\qquad
    \\exists!\\,u\\in \\calS:\\ a(u,v)=\\ell(v)\\ \\forall v\\in \\calV . \\]
<ul>
  <li>Continuity of \\(a\\) and \\(\\ell\\); Poincaré \\(\\Rightarrow\\) coercivity; Lax–Milgram \\(\\Rightarrow\\) unique stable \\(u\\).</li>
</ul>
""", gb_row(gb("Part~7, Lem.~5.4", "Poincaré"), gb("Part~7, §5.4", "strong coercivity"), gb("Part~6, Cor.~3.10", "Lax–Milgram")))),

    slide("Operator form", S("""
\\[ \\inner{Au,v}=a(u,v),\\quad \\inner{b,v}=\\ell(v),\\qquad Au=b . \\]
<ul>
  <li>\\(\\inner{\\cdot,\\cdot}\\): duality pairing; \\(A:\\calS\\to \\calV'\\), \\(b\\in \\calV'\\).</li>
  <li>\\(u\\in\\calS\\) trial; \\(v\\in\\calV\\) test; later \\(\\Sh\\subset\\calS\\), \\(\\Vh\\subset\\calV\\) with \\(u_h\\in\\Sh\\), \\(v_h\\in\\Vh\\).</li>
  <li>Output \\(s=Lu\\) (demo scalar; Zahm et al. vector \\(Z=\\R^l\\) in supplementary slides).</li>
</ul>
""", gb_row(gb("Part~6, (3.1)", "Au=b"), gb("Part~4, Def.~1.68", "bounded A"), gb("Part~4, Def.~1.73", "dual calV'"), gb("Part~3, Def.~1.48", "Hilbert")))),

    slide("Parameter \\(\\xi\\)", S("""
\\[ A(\\xi)\\,u(\\xi)=b(\\xi),\\qquad s(\\xi)=L(\\xi)\\,u(\\xi),\\qquad \\xi\\in\\Xi . \\]
<ul>
  <li>\\(\\xi\\): scenario knob (conductivity in demo; BC/load in general) — not a spatial coordinate.</li>
  <li>Many queries: design / UQ need thousands of \\(\\xi\\); full FEM each time is too slow.</li>
  <li>ROM: <strong>offline</strong> snapshots at \\(\\xi_i\\); <strong>online</strong> cheap \\(s(\\xi)\\) per query.</li>
</ul>
""", gb_row(gb("Part~6, (3.1)", "variational form"), gb("Part~4, Def.~1.68", "bounded parametric maps")))),

    slide("Parametric output problem", S("""
\\[ A(\\xi)\\,u(\\xi)=b(\\xi),\\qquad s(\\xi)=L(\\xi)\\,u(\\xi),\\qquad \\xi\\in\\Xi . \\]
<ul>
  <li>\\(s(\\xi)\\): output of interest (sensor), not the full field \\(u\\).</li>
  <li><strong>Offline:</strong> build \\(\\Sh,\\Vh,\\WQ\\); <strong>online:</strong> \\(s(\\xi)\\) per query.</li>
</ul>
""", ROM_FLOW, gb_row(gb("Part~6, (3.1)", "variational form"), gb("Part~4, Def.~1.68", "bounded L")))),

    slide("Adjoints \\(A^*\\), \\(L^*\\) and dual operator \\(Q\\)", S("""
\\[ \\langle Au,v \\rangle=\\langle u,A^{*}v \\rangle\\ \\forall u\\in \\calS,\\ v\\in \\calV . \\]
\\[ \\adj{A}Q=\\adj{L},\\qquad Q\\in\\Lc(Z',\\calV),\\qquad s=Lu=\\adj{Q}b . \\]
<ul>
  <li>\\(\\adj{A}\\): test loads → trial space; \\(\\adj{L}\\): output component / sensor weight in \\(Z'\\).</li>
  <li>\\(Q\\): influence function in \\(\\calV\\) — response to unit output loading (probe ⇒ heat on \\(\\omega\\)).</li>
  <li>Exact \\(u\\) or exact \\(Q\\) recovers \\(s\\); ROM approximates both.</li>
</ul>
""", gb_row(gb("Part~4, Thm.~1.82", "Riesz"), gb("Part~7, Def.~5.7", "adjoint A*"), gb("Part~6, Thm.~3.9", "well-posed dual")))),

    slide("What Zahm et al. add", S("""
<ul>
  <li><strong>Goal-oriented:</strong> reduced spaces target \\(s=Lu\\), not only the field \\(u\\).</li>
  <li><strong>Petrov–Galerkin:</strong> \\(\\Sh\\neq\\Vh\\) plus dual space \\(\\WQ\\) (three reduced spaces).</li>
  <li><strong>Vector output:</strong> \\(s\\in Z\\) with operator dual \\(Q\\in\\Lc(Z',\\calV)\\) (not only scalar QoI).</li>
  <li><strong>Certified bounds:</strong> computable \\(\\Delta(\\xi)\\) from primal and dual residuals.</li>
  <li><strong>Greedy enrichment:</strong> sample at \\(\\arg\\max_\\xi\\Delta(\\xi)\\).</li>
  <li>Three estimators (pg → pd → sp): definitions and ladder in supplementary slides.</li>
</ul>
""", gb_row(gb("Part~6, §3.3", "Ritz–Galerkin"), gb("Part~6, §3.4", "discrete PG"), gb("Part~6, Thm.~3.9", "BNB"), gb("Part~3, Exo.~1.42", "Cauchy–Schwarz")))),

    slide("inf–sup stability", S("""
\\[ \\alpha\\norm{u}_{\\calS}\\le \\norm{Au}_{\\calV'}\\le \\beta\\norm{u}_{\\calS}, \\]
\\[ \\alpha=\\inf_{u\\neq 0}\\sup_{v\\neq 0}\\frac{\\inner{Au,v}}{\\norm{u}_{\\calS}\\norm{v}_{\\calV}},\\quad
    \\beta=\\sup_{u}\\sup_{v}\\frac{\\inner{Au,v}}{\\norm{u}_{\\calS}\\norm{v}_{\\calV}}. \\]
<ul>
  <li>\\(\\alpha&gt;0\\): stability (BNB / inf–sup); small residual \\(\\Rightarrow\\) small error.</li>
  <li>Allows \\(\\calS\\neq\\calV\\) (Petrov–Galerkin); heat with \\(\\calS=\\calV\\) is the Lax–Milgram case.</li>
</ul>
""", gb_row(gb("Part~6, Thm.~3.9", "BNB"), gb("Part~6, Cor.~3.10", "Lax–Milgram")))),

    slide("Petrov–Galerkin projection", S("""
\\[ \\inner{Au_h-b,\\,v_h}=0\\qquad \\forall v_h\\in\\Vh,\\qquad u_h\\in\\Sh\\subset \\calS . \\]
\\[ \\norm{u-u_h}_{\\calS} \\le \\frac{1}{\\sqrt{1-\\delta_{\\Sh,\\Vh}^2}}\\;\\min_{u_h\\in\\Sh}\\norm{u-u_h}_{\\calS} . \\]
<ul>
  <li>Residual \\(Au_h-b\\) orthogonal to \\(\\Vh\\); \\(u_h\\in\\Sh\\), \\(v_h\\in\\Vh\\) (\\(\\Sh\\neq\\Vh\\) in general).</li>
  <li>\\(\\delta_{\\Sh,\\Vh}&lt;1\\) measures test-space quality (Prop.~2.1).</li>
</ul>
""", gb_row(gb("Part~6, §3.4", "discrete PG, eq.~(3.9)"), gb("Part~6, (3.10)", "discrete inf–sup m_h"), gb("Part~6, Lem.~3.11", "Céa"), gb("Part~6, §3.3", "Ritz–Galerkin")))),

    slide("Output error bound (Prop.~2.1, Eq.~9)", S("""
\\[ \\norm{s-Lu_h}_Z\\le
    \\delta^L_{\\Vh}\\cdot
    \\frac{1}{\\sqrt{1-\\delta_{\\Sh,\\Vh}^2}}\\cdot
    \\min_{u_h\\in\\Sh}\\norm{u-u_h}_{\\calS} . \\]
<ul>
  <li>Compliant case (\\(\\calS=\\calV\\), \\(\\Vh=\\Sh\\), \\(Lu=\\inner{b,u}\\)): \\(|s-Lu_h|\\le\\norm{u-u_h}_{\\calS}^2\\).</li>
</ul>
""", gb_row(gb("Part~6, Lem.~3.11", "Céa quasi-opt."), gb("Part~3, Exo.~1.42", "Cauchy–Schwarz"), gb("Part~7, §5.2", "Ritz–Galerkin")))),

    slide("Two jobs of \\(\\calV_h\\)", S("""
\\[ \\norm{s-Lu_h}_Z\\le
    \\underbrace{\\delta^L_{\\Vh}}_{\\text{(c) dual range}}
    \\underbrace{\\tfrac{1}{\\sqrt{1-\\delta_{\\Sh,\\Vh}^2}}}_{\\text{(b) PG quality}}
    \\underbrace{\\min_{u_h\\in\\Sh}\\norm{u-u_h}_{\\calS}}_{\\text{(a) trial}} . \\]
<ul>
  <li>\\(\\Vh\\) tests the projection <strong>and</strong> approximates \\(\\mathrm{range}(\\adj{A}L^*)\\).</li>
  <li>Demo uses shared snapshot space; Zahm et al. allow \\(\\Vh\\neq\\Sh\\).</li>
</ul>
""", gb_row(gb("Part~6, §3.4", "discrete test spaces"), gb("Part~6, Thm.~3.9", "inf-sup stability")))),

    slide("Dual problem", S("""
\\[ \\adj{A}Q=\\adj{L},\\qquad s=Lu=\\adj{Q}Au=\\adj{Q}b . \\]
<ul>
  <li>\\(Q\\): dual / influence function — which test directions matter for \\(s\\)?</li>
  <li>For probe average: \\(Q\\) is the response to a unit load on \\(\\omega\\).</li>
  <li>Either exact \\(u\\) or exact \\(Q\\) recovers \\(s\\); ROM approximates both.</li>
</ul>
""", gb_row(gb("Part~4, Thm.~1.82", "Riesz"), gb("Part~7, Def.~5.7", "adjoint A*"), gb("Part~6, Thm.~3.9", "well-posedness")))),

    slide("Primal–dual estimate", S("""
\\[ \\tilde s = Lu_h + \\adj{Q_h}\\,(b-Au_h), \\]
\\[ \\norm{s-\\tilde s}_Z\\le \\norm{u-u_h}_{\\calS}\\;\\norm{\\adj{L}-\\adj{A}Q_h}_{Z'\\to \\calS'} . \\]
<ul>
  <li>\\(\\tilde s\\): field estimate + correction from primal residual \\(b-Au_h\\).</li>
  <li>Three reduced spaces: trial \\(\\Sh\\), test \\(\\Vh\\), dual \\(\\WQ\\).</li>
  <li>Zahm et al. also give a saddle-point estimator (Prop.~2.10) — supplementary slides.</li>
</ul>
""", gb_row(gb("Part~3, Exo.~1.42", "C–S on pairing"), gb("Part~4, Thm.~1.82", "Riesz"), gb("Part~7, Def.~5.7", "adjoint"), gb("Part~3, Def.~1.51", "orthogonal projection")))),

    slide("Certified bound", S("""
\\[ \\norm{s(\\xi)-\\tilde s(\\xi)}_Z\\le
    \\frac{\\norm{A(\\xi)u_h-b(\\xi)}_{\\calS_0'}\\;\\norm{\\adj{L}(\\xi)-\\adj{A}(\\xi)Q_h(\\xi)}_{Z'\\to \\calS_0'}}{\\alpha(\\xi)}
    =:\\Delta(\\xi). \\]
<ul>
  <li>\\(\\Delta(\\xi)\\): computable upper bound (primal residual × dual residual / \\(\\alpha\\)).</li>
  <li>Certified: true error \\(\\le\\Delta\\); effectivity \\(\\Delta/\\norm{s-\\tilde s}\\ge 1\\).</li>
</ul>
""", gb_row(gb("Part~6, (3.5)", "inf-sup const. m"), gb("Part~6, Thm.~3.9", "BNB stability"), gb("Part~3, Exo.~1.42", "residual product")))),

    slide("Greedy enrichment", S("""
\\[ \\xi^\\star\\in\\arg\\max_{\\xi\\in\\Xi}\\Delta(\\xi),\\qquad
    \\Sh\\leftarrow \\Sh+\\mathrm{span}\\,u(\\xi^\\star),\\quad
    \\WQ\\leftarrow \\WQ+\\mathrm{range}\\,Q(\\xi^\\star) . \\]
<ul>
  <li>Sample where the bound is largest; solve full \\(u,Q\\) at \\(\\xi^\\star\\); enrich bases.</li>
  <li>Repeat until \\(\\max_\\xi\\Delta(\\xi)\\) is below tolerance.</li>
</ul>
<p style="font-size:0.78em;margin-top:0.5em;">Alternate / simultaneous enrichment (Alg.~1–2);
\\(\\Vh\\) from preconditioner \\(P_m(\\xi)\\approx A(\\xi)^{-1}\\) (Eq.~44).</p>
""", gb_row(gb("Part~4, Thm.~1.83", "weak compactness"), gb("Part~6, Thm.~3.9", "certified alpha")))),

    slide("FEM field at \\(\\xi=1\\)", S("""
<div class="cols cols-top">
  <div>
    <ul>
      <li>Full FEM; QoI \\(s=\\bar u_\\omega\\) read from the field.</li>
      <li>PROM predicts \\(s(\\xi)\\) for many \\(\\xi\\) at reduced cost.</li>
    </ul>
  </div>
  <div>""", fig(f"{DEMO}/fenics_field.png", "FEM temperature field"), "</div>\n</div>")),

    slide("PROM vs FEM: online speedup", S("""
<div class="cols cols-wide-right cols-top">
  <div>
    <ul>
      <li>80 parametric queries, \\(\\xi\\in[0.5,2]\\).</li>
      <li>PROM: primal–dual, \\(R=10\\) snapshots.</li>
      <li>\\(\\sim\\)250–370× faster per online query; QoI error \\(\\sim10^{-13}\\).</li>
    </ul>
  </div>
  <div>""", fig(f"{DEMO}/compare_results.png", "PROM vs FEM comparison"), "</div>\n</div>")),

    slide("Demo scope", S("""
<div class="cols cols-top">
  <div>""", fig(f"{DEMO}/fenics_convergence.png", "FEM mesh convergence"), """</div>
  <div>
    <ul>
      <li><strong>Implemented:</strong> parametric \\(A(\\xi)\\) (affine in demo), primal–dual online \\(s_{\\mathrm{pd}}\\).</li>
      <li><strong>Zahm et al. add:</strong> separate \\(\\Vh\\), saddle point, greedy \\(\\Delta(\\xi)\\) — not in demo.</li>
      <li>Left: FEM mesh convergence (\\(h^2\\) QoI rate).</li>
    </ul>
  </div>
</div>""")),

    slide("Takeaways", S("""
<ol>
  <li>Field \\(u\\) is a means; vector output \\(s=Lu\\) + certified \\(\\Delta(\\xi)\\) is the goal.</li>
  <li>Weak form → \\(Au=b\\); inf–sup gives stability and certified bounds.</li>
  <li>Primal–dual estimate + certified \\(\\Delta(\\xi)\\); demo uses pd only (saddle point: supplementary).</li>
  <li>Demo: primal–dual step only; full FEM vs PROM — large online speedup.</li>
</ol>
""", gb_row(gb("Part~6, §3.3", "Galerkin"), gb("Part~6, §3.4", "PG"), gb("Part~6, Thm.~3.9", "BNB"), gb("Part~3, Exo.~1.42", "C–S"), gb("Part~4, Thm.~1.82", "Riesz")))),

    slide("Reference", """
<p>O.&nbsp;Zahm, M.&nbsp;Billaud-Friess, A.&nbsp;Nouy,
<em>SIAM J. Sci. Comput.</em> <strong>39</strong>(4), A1647–A1674 (2017).</p>
<p style="text-align:center;margin-top:2em;font-size:1.15em;"><strong>Thank you.</strong></p>
<p style="text-align:center;font-size:0.9em;">Special thanks to José Hasbani &amp; Obed Camacho for discussions.</p>
""", center=True),
]

HTML_HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Goal-Oriented PROM — Functional Analysis</title>
  <meta name="description" content="Goal-oriented projection-based model order reduction (Zahm et al. 2017) via 2D steady heat.">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/theme/white.css" id="theme">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
  <link rel="stylesheet" href="css/me340.css">
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
    margin: 0.06,
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
