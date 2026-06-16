#!/usr/bin/env python3
"""Generate Reveal.js HTML deck for the ME 340 course intro (teaching/intros/me340/)."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "index.html"

ME340_CATALOG = "https://explorecourses.stanford.edu/search?view=catalog&filter-coursestatus-Active=on&q=ME340"
CAI_ME340 = "https://micro.stanford.edu/~caiwei/me340/"
ELASTICITY_NOTES = "/file/teaching/notes/elasticity_notes.pdf"
INTRO_PDF = "/file/teaching/intros/ME340_Intro.pdf"

# Shared SVG diagrams (simplified but faithful to the Beamer TikZ schematics)
CONTINUUM_POTATO = """
<svg class="diagram" viewBox="0 0 340 130" width="340" height="130" aria-hidden="true">
  <path d="M20,55 C35,25 75,15 115,35 C145,50 165,70 150,95 C130,115 85,120 45,95 C20,75 10,65 20,55 Z"
        fill="rgba(140,21,21,0.10)" stroke="#8C1515" stroke-width="2"/>
  <circle cx="55" cy="58" r="2.5" fill="#4D4F53"/>
  <circle cx="85" cy="48" r="2.5" fill="#4D4F53"/>
  <circle cx="115" cy="58" r="2.5" fill="#4D4F53"/>
  <circle cx="95" cy="78" r="2.5" fill="#4D4F53"/>
  <circle cx="65" cy="72" r="2.5" fill="#4D4F53"/>
  <text x="70" y="18" font-size="11" fill="rgba(0,0,0,0.75)">reference Ω₀</text>
  <path d="M205,50 C220,20 260,10 300,30 C330,45 350,65 335,90 C315,110 270,115 230,90 C205,70 195,60 205,50 Z"
        fill="rgba(23,94,84,0.12)" stroke="#175E54" stroke-width="2" stroke-dasharray="5 3"/>
  <line x1="255" y1="62" x2="275" y2="52" stroke="#175E54" stroke-width="2" marker-end="url(#arr)"/>
  <line x1="285" y1="58" x2="305" y2="48" stroke="#175E54" stroke-width="2" marker-end="url(#arr)"/>
  <text x="245" y="18" font-size="11" fill="rgba(0,0,0,0.75)">deformed Ω</text>
  <text x="285" y="72" font-size="11" fill="#175E54">u(x)</text>
  <line x1="165" y1="58" x2="185" y2="58" stroke="#4D4F53" stroke-width="2" marker-end="url(#arr)"/>
  <text x="160" y="50" font-size="10" fill="rgba(0,0,0,0.75)">load</text>
  <defs><marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
    <path d="M0,0 L6,3 L0,6 Z" fill="#4D4F53"/></marker></defs>
</svg>"""

THREE_PART = """
<div class="flow-row">
  <div class="fbox">Part I<br>Elasticity<br>σ, u</div><span class="arrow">→</span>
  <div class="gbox">Part II<br>Plasticity<br>εᵖ, f=0</div><span class="arrow">→</span>
  <div class="kbox">Part III<br>Fracture<br>K_I, J</div>
</div>
<div class="flow-row">
  <div class="fbox" style="min-width:11em;">Applications: contact, vessels, fatigue</div>
</div>"""

STRESS_CUBE = """
<svg class="diagram" viewBox="0 0 180 150" width="180" height="150" aria-hidden="true">
  <rect x="30" y="35" width="70" height="70" fill="rgba(140,21,21,0.08)" stroke="#8C1515" stroke-width="2"/>
  <line x1="30" y1="105" x2="55" y2="130" stroke="#4D4F53" marker-end="url(#arr)"/>
  <line x1="30" y1="35" x2="55" y2="10" stroke="#4D4F53" marker-end="url(#arr)"/>
  <text x="58" y="128" font-size="11">x₁</text><text x="58" y="14" font-size="11">x₂</text>
  <line x1="100" y1="70" x2="130" y2="70" stroke="#175E54" stroke-width="2"/>
  <text x="134" y="74" font-size="11" fill="#175E54">n</text>
  <line x1="130" y1="70" x2="130" y2="35" stroke="#8C1515" stroke-width="2.5" marker-end="url(#arrR)"/>
  <text x="136" y="38" font-size="10">t = σ·n</text>
  <defs><marker id="arrR" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
    <path d="M0,0 L6,3 L0,6 Z" fill="#8C1515"/></marker></defs>
</svg>"""

HOOKE_GRAPH = """
<svg class="diagram" viewBox="0 0 170 140" width="170" height="140" aria-hidden="true">
  <line x1="20" y1="120" x2="150" y2="120" stroke="#4D4F53" marker-end="url(#arr)"/>
  <line x1="20" y1="120" x2="20" y2="20" stroke="#4D4F53" marker-end="url(#arr)"/>
  <text x="145" y="135" font-size="11">ε</text><text x="8" y="24" font-size="11">σ</text>
  <line x1="20" y1="120" x2="130" y2="35" stroke="#8C1515" stroke-width="3"/>
  <polygon points="20,120 95,58 95,120" fill="rgba(140,21,21,0.15)"/>
  <line x1="95" y1="120" x2="95" y2="58" stroke="#4D4F53" stroke-dasharray="4 3"/>
  <text x="52" y="105" font-size="11">U</text>
  <text x="72" y="48" font-size="11">ℂ</text>
</svg>"""

BVP_BODY = """
<svg class="diagram" viewBox="0 0 190 150" width="190" height="150" aria-hidden="true">
  <path d="M25,75 C45,35 95,25 135,55 C160,70 165,95 140,115 C100,135 55,125 30,95 C15,80 15,85 25,75 Z"
        fill="rgba(140,21,21,0.10)" stroke="#8C1515" stroke-width="2"/>
  <line x1="25" y1="75" x2="25" y2="95" stroke="#4D4F53" stroke-width="3"/>
  <text x="5" y="88" font-size="10">S_u</text>
  <line x1="95" y1="35" x2="95" y2="10" stroke="#8C1515" stroke-width="2.5" marker-end="url(#arrR)"/>
  <line x1="125" y1="45" x2="155" y2="45" stroke="#8C1515" stroke-width="2.5" marker-end="url(#arrR)"/>
  <text x="88" y="8" font-size="10">t</text><text x="158" y="48" font-size="10">S_t</text>
</svg>"""

ROD = """
<svg class="diagram" viewBox="0 0 210 90" width="210" height="90" aria-hidden="true">
  <rect x="10" y="25" width="160" height="28" fill="rgba(140,21,21,0.10)" stroke="#4D4F53"/>
  <rect x="10" y="25" width="8" height="28" fill="url(#hatch)"/>
  <line x1="170" y1="39" x2="200" y2="39" stroke="#8C1515" stroke-width="2.5" marker-end="url(#arrR)"/>
  <text x="203" y="43" font-size="10">N</text>
  <text x="90" y="70" font-size="10">x</text>
  <defs><pattern id="hatch" patternUnits="userSpaceOnUse" width="4" height="4" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="4" stroke="#4D4F53" stroke-width="1.5"/></pattern></defs>
</svg>"""

YIELD = """
<svg class="diagram" viewBox="0 0 170 170" width="170" height="170" aria-hidden="true">
  <line x1="85" y1="155" x2="85" y2="15" stroke="#4D4F53" marker-end="url(#arr)"/>
  <line x1="15" y1="85" x2="155" y2="85" stroke="#4D4F53" marker-end="url(#arr)"/>
  <text x="148" y="98" font-size="10">σ₁</text><text x="88" y="22" font-size="10">σ₂</text>
  <circle cx="85" cy="85" r="55" fill="none" stroke="#8C1515" stroke-width="2.5"/>
  <polygon points="85,30 133,55 133,115 85,140 37,115 37,55" fill="none" stroke="#175E54" stroke-width="2" stroke-dasharray="5 3"/>
  <text x="118" y="48" font-size="10" fill="#8C1515">Mises</text>
  <text x="28" y="118" font-size="10" fill="#175E54">Tresca</text>
</svg>"""

CRACK = """
<svg class="diagram" viewBox="0 0 180 170" width="180" height="170" aria-hidden="true">
  <rect x="20" y="45" width="140" height="80" fill="rgba(140,21,21,0.08)" stroke="rgba(140,21,21,0.35)"/>
  <ellipse cx="90" cy="85" rx="42" ry="8" fill="none" stroke="#8C1515" stroke-width="2.5"/>
  <circle cx="48" cy="85" r="3" fill="#8C1515"/><circle cx="132" cy="85" r="3" fill="#8C1515"/>
  <line x1="48" y1="105" x2="132" y2="105" stroke="#4D4F53" marker-end="url(#arr)" marker-start="url(#arr)"/>
  <text x="82" y="118" font-size="10">2a</text>
  <line x1="90" y1="45" x2="90" y2="20" stroke="#8C1515" stroke-width="2" marker-end="url(#arrR)"/>
  <line x1="90" y1="125" x2="90" y2="150" stroke="#8C1515" stroke-width="2" marker-end="url(#arrR)"/>
  <text x="96" y="18" font-size="10">σ∞</text>
  <text x="138" y="72" font-size="10">K_I</text>
</svg>"""

ELASTIC_PLASTIC = """
<svg class="diagram" viewBox="0 0 190 150" width="190" height="150" aria-hidden="true">
  <line x1="20" y1="130" x2="170" y2="130" stroke="#4D4F53" marker-end="url(#arr)"/>
  <line x1="20" y1="130" x2="20" y2="20" stroke="#4D4F53" marker-end="url(#arr)"/>
  <text x="160" y="145" font-size="10">ε</text><text x="8" y="24" font-size="10">σ</text>
  <polyline points="20,130 70,35 160,25" fill="none" stroke="#8C1515" stroke-width="2.5"/>
  <line x1="70" y1="35" x2="95" y2="95" stroke="#175E54" stroke-width="2" stroke-dasharray="5 3"/>
  <polygon points="20,130 70,35 70,130" fill="rgba(140,21,21,0.12)"/>
  <polygon points="70,130 160,130 160,25 70,35" fill="rgba(23,94,84,0.12)"/>
  <line x1="70" y1="130" x2="70" y2="35" stroke="#4D4F53" stroke-dasharray="4 3"/>
  <text x="38" y="95" font-size="10">elastic</text>
  <text x="112" y="95" font-size="10">plastic</text>
  <text x="62" y="28" font-size="10">σ_Y</text>
</svg>"""


def gb(lec, topic):
    return f'<div class="lec-badge">Lec.&nbsp;{lec} [{topic}]</div>'


def slide(title, body, center=False, bg=None):
    cls = ' class="center-slide"' if center else ""
    bg_attr = f' data-background-color="{bg}"' if bg else ""
    title_html = f'<div class="slide-title">{title}</div>' if title else ""
    return f'<section{cls}{bg_attr}>{title_html}{body}</section>'


SLIDES = [
    slide("", f"""
<h1>Mechanics: Elasticity and Inelasticity</h1>
<p class="title-slide-meta">A brief intro • <a href="{ME340_CATALOG}">ME 340</a> • <a href="{INTRO_PDF}">PDF</a></p>
<p class="author"><strong>Hanfeng Zhai</strong></p>
<p class="institute">Department of Mechanical Engineering, Stanford University</p>
<p class="date">Spring 2026</p>
""", center=True, bg="#8C1515"),

    slide("Course at a glance", f"""
<div class="cols">
  <div>
    <ul>
      <li><a href="{ME340_CATALOG}">ME 340</a> (Wei Cai): elasticity, plasticity, fracture.</li>
      <li><strong>I</strong>—2D φ, 3D G, contact; <strong>II</strong>—yield, flow, hardening; <strong>III</strong>—LEFM, J, fatigue.</li>
      <li>Analytic + Matlab.</li>
      <li>Barber (2010); Anderson (2005).</li>
      <li><a href="{CAI_ME340}">Notes</a> • <a href="{ELASTICITY_NOTES}">consolidated PDF</a>.</li>
    </ul>
  </div>
  <div>{CONTINUUM_POTATO}<div class="figcap">BVP → 2D φ / 3D G → stress, flow, fracture</div></div>
</div>"""),

    slide("Three-part course structure", f"""
{THREE_PART}
<div class="cols-33" style="margin-top:0.75em;font-size:0.72em;">
  <div><strong>I.</strong> stress, strain, equilibrium</div>
  <div><strong>II.</strong> yield, flow, hardening</div>
  <div><strong>III.</strong> crack-tip fields, energy release</div>
</div>
<p style="margin-top:0.75em;font-size:0.72em;"><em>Core idea:</em> well-posed BVP → elastic solution → plasticity if f&gt;0 → fracture if cracks grow.</p>
""", center=True),

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
<p style="font-size:0.65em;margin-top:1em;">Use ← → keys, swipe, or scroll to navigate.</p>
"""),

    slide("Continuum body: reference and deformed configurations", f"""
<div class="cols">
  <div>{CONTINUUM_POTATO.replace('width="340"', 'width="300"')}</div>
  <div>
    <ul>
      <li>Ω₀: reference configuration; Ω: deformed configuration.</li>
      <li>Material points X ↦ x = X + u(X).</li>
      <li>Small strain: ε<sub>ij</sub> = ½(u<sub>i,j</sub> + u<sub>j,i</sub>).</li>
      <li>The “potato” is any bounded body V — geometry is arbitrary.</li>
    </ul>
    {gb("1", "Introduction")}
  </div>
</div>"""),

    slide("Stress and strain", f"""
<div class="cols">
  <div>
    <p>\\[ \\sigma_{{ij}}=\\sigma_{{ji}},\\qquad \\varepsilon_{{ij}}=\\tfrac{{1}}{{2}}\\!\\left(\\frac{{\\partial u_i}}{{\\partial x_j}}+\\frac{{\\partial u_j}}{{\\partial x_i}}\\right). \\]</p>
    <ul>
      <li><strong>σ</strong>: Cauchy stress; <strong>ε</strong>: small strain; <strong>u</strong>: displacement.</li>
      <li>Traction on plane normal <strong>n</strong>: t<sub>i</sub> = σ<sub>ij</sub>n<sub>j</sub>.</li>
      <li>Static equilibrium: ∂σ<sub>ij</sub>/∂x<sub>j</sub> = 0 (no body force).</li>
    </ul>
    {gb("1–2", "Introduction, Tensors")}
  </div>
  <div>{STRESS_CUBE}<div class="figcap">Cauchy cube; traction t = σ·n on a cut plane</div></div>
</div>"""),

    slide("Hooke's law and elastic energy", f"""
<div class="cols">
  <div>
    <p>\\[ \\sigma_{{ij}}=C_{{ijkl}}\\,\\varepsilon_{{kl}}, \\qquad U=\\tfrac{{1}}{{2}}\\int_V \\sigma_{{ij}}\\,\\varepsilon_{{ij}}\\,\\mathrm{{d}}V. \\]</p>
    <ul>
      <li>Isotropic: ε<sub>ij</sub> = (1+ν)/E σ<sub>ij</sub> − ν/E σ<sub>kk</sub> δ<sub>ij</sub>.</li>
      <li>E, ν, Lamé λ, μ; positive-definite ℂ.</li>
      <li>Stored energy = area under linear σ–ε law.</li>
    </ul>
    {gb("3", "Hooke's Law")}, {gb("4", "Fundamental Equations")}
  </div>
  <div>{HOOKE_GRAPH}<div class="figcap">shaded area = strain-energy density</div></div>
</div>"""),

    slide("Fundamental boundary-value problem", f"""
<div class="cols">
  <div>
    <p>\\[ \\boldsymbol{{\\varepsilon}}=\\tfrac{{1}}{{2}}(\\nabla\\mathbf{{u}}+\\nabla\\mathbf{{u}}^{{\\top}}),\\ \\boldsymbol{{\\sigma}}=\\mathbb{{C}}:\\boldsymbol{{\\varepsilon}},\\ \\nabla\\!\\cdot\\!\\boldsymbol{{\\sigma}}+\\mathbf{{f}}=\\mathbf{{0}}\\ \\text{{in }}V. \\]</p>
    <ul>
      <li><strong>u</strong> = <strong>u</strong>₀ on S<sub>u</sub>; σ·<strong>n</strong> = <strong>t</strong> on S<sub>t</sub>.</li>
      <li>Compatibility if ε is not from a single <strong>u</strong>.</li>
    </ul>
    {gb("4", "Fundamental Equations")}
  </div>
  <div>{BVP_BODY}<div class="figcap">body V, boundary ∂V = S<sub>u</sub> ∪ S<sub>t</sub></div></div>
</div>"""),

    slide("Elastic rod (1D building block)", f"""
<div class="cols">
  <div>
    <p>\\[ \\varepsilon=\\frac{{\\mathrm{{d}} u}}{{\\mathrm{{d}} x}},\\qquad N=EA\\,\\varepsilon,\\qquad \\frac{{\\mathrm{{d}} N}}{{\\mathrm{{d}} x}}+f=0. \\]</p>
    <ul>
      <li>Axial bar: u(x), stress σ = N/A, rigidity EA.</li>
      <li>Same pattern as 3D theory, one displacement component.</li>
      <li>Warm-up before 2D Airy and 3D Green's functions.</li>
    </ul>
    {gb("4–5", "Fund. Eqs., 2D Elasticity")}
  </div>
  <div>{ROD}<div class="figcap">fixed end + axial load ⇒ extension u(x)</div></div>
</div>"""),

    slide("2D formulations", f"""
<div class="cols">
  <div>
    <ul>
      <li><strong>Plane strain:</strong> ε₃₃ = ε₁₃ = ε₂₃ = 0 (thick body).</li>
      <li><strong>Plane stress:</strong> σ₃₃ = σ₁₃ = σ₂₃ = 0 (thin plate).</li>
      <li>Airy φ(x,y) with ∇⁴φ = 0:<br/>
        \\[ \\sigma_{{xx}}=\\phi_{{,yy}},\\ \\sigma_{{yy}}=\\phi_{{,xx}},\\ \\sigma_{{xy}}=-\\phi_{{,xy}}. \\]</li>
    </ul>
    {gb("5", "2D Elasticity")}
  </div>
  <div style="font-size:0.72em;">
    <p><strong>thin plate</strong> → plane stress</p>
    <p><strong>long prism</strong> → plane strain</p>
  </div>
</div>"""),

    slide("Classic 2D solution routes", """
<div class="cols">
  <div>
    <ul>
      <li><strong>Rectangular beam</strong> (Lec. 7): polynomial Airy + BC matching.</li>
      <li><strong>Fourier series</strong> (Lec. 8): periodic / strip loads.</li>
      <li><strong>Half space</strong> (Lec. 9): Flamant line load; σ ∼ 1/r.</li>
      <li><strong>Contact</strong> (Lec. 10): unknown contact patch and pressure.</li>
    </ul>
  </div>
  <div style="font-size:0.72em;">
    <p>half space (Lec. 9) • cantilever beam (Lec. 7)</p>
  </div>
</div>"""),

    slide("Polar coordinates and wedge problems", f"""
<div class="cols">
  <div>
    <p>\\[ \\nabla^4\\phi=0 \\ \\Rightarrow\\ \\phi(r,\\theta)\\ \\text{{with}}\\ r,\\theta,\\ln r,\\ \\theta\\ln r\\ \\text{{modes}}. \\]</p>
    <ul>
      <li>Lec. 11–12: disks, rings, holes in (r,θ).</li>
      <li>Lec. 13 wedge: corner singularities; eigenfunction exponents.</li>
      <li>Pick modes with symmetry and finite energy.</li>
    </ul>
    {gb("11–12", "Polar Coordinates, Wedge and Notch")}
  </div>
  <div style="font-size:0.72em;">polar / annulus • wedge 2α</div>
</div>"""),

    slide("Green's function approach (3D)", f"""
<div class="cols">
  <div>
    <p>\\[ \\nabla\\!\\cdot\\!\\boldsymbol{{\\sigma}}+\\mathbf{{f}}=\\mathbf{{0}},\\quad \\mathbf{{u}}(\\mathbf{{x}})=\\int G(\\mathbf{{x}},\\boldsymbol{{\\xi}})\\,\\mathbf{{f}}(\\boldsymbol{{\\xi}})\\,\\mathrm{{d}}V_\\xi. \\]</p>
    <ul>
      <li>Kelvin solution (Lec. 17): point force in infinite space.</li>
      <li>Half-space images (Lec. 16): traction-free surface.</li>
      <li>Superpose for defects and boundaries.</li>
    </ul>
    {gb("9–10", "Half Space, Contact")}
  </div>
  <div style="font-size:0.72em;">Kelvin field + surface image</div>
</div>"""),

    slide("Dislocations and defect fields", f"""
<div class="cols">
  <div>
    <ul>
      <li>Cut the lattice; insert <strong>b</strong> (Burgers vector) across the slip plane.</li>
      <li>Stress singular at the core; far field set by <strong>b</strong> and geometry.</li>
      <li>Peach–Köhler: defect force from external σ on the dislocation.</li>
      <li>Superpose: singular field + image / boundary correction.</li>
      <li>Macroscopic plastic strain accumulates from many dislocation motions.</li>
    </ul>
    {gb("notes", "Dislocations (extended notes)")}
  </div>
  <div style="font-size:0.72em;">Volterra cut + Burgers <strong>b</strong> + far-field σ<sup>∞</sup></div>
</div>"""),

    slide("From elasticity to plasticity", f"""
<div class="cols">
  <div>
    <ul>
      <li><strong>Elastic:</strong> load removal ⇒ strain returns to zero.</li>
      <li><strong>Plastic:</strong> permanent strain remains after unloading.</li>
      <li>Additive split (small strain): \\[ \\varepsilon_{{ij}}=\\varepsilon_{{ij}}^{{e}}+\\varepsilon_{{ij}}^{{p}}. \\]</li>
      <li>Elastic part: σ<sub>ij</sub> = C<sub>ijkl</sub> ε<sup>e</sup><sub>kl</sub>.</li>
      <li>Plastic part: governed by a yield condition + flow rule.</li>
    </ul>
    {gb("3", "Hooke's Law")}, {gb("13", "Fund. Eqs. of Plasticity")}
  </div>
  <div>{ELASTIC_PLASTIC}<div class="figcap">loading past σ<sub>Y</sub> leaves permanent ε<sup>p</sup> on unload</div></div>
</div>"""),

    slide("Yield criteria: von Mises and Tresca", f"""
<div class="cols">
  <div>
    <p>Deviatoric stress s<sub>ij</sub> = σ<sub>ij</sub> − ⅓σ<sub>kk</sub>δ<sub>ij</sub>.</p>
    <p>\\[ J_2=\\tfrac{{1}}{{2}}s_{{ij}}s_{{ij}},\\qquad \\sigma_{{\\mathrm{{eq}}}}=\\sqrt{{3J_2}}. \\]</p>
    <p><strong>von Mises yield:</strong> \\[ f=J_2-k^2\\le 0,\\qquad k=\\frac{{\\sigma_Y}}{{\\sqrt{{3}}}}. \\]</p>
    <p><strong>Tresca yield:</strong> max|σ<sub>i</sub>−σ<sub>j</sub>| = 2k (alternative for metals).</p>
    <p style="font-size:0.85em;">Plastic flow is insensitive to hydrostatic stress; yielding depends on s<sub>ij</sub>.</p>
    {gb("13–14", "Yield surface / graphical")}
  </div>
  <div>{YIELD}<div class="figcap">von Mises fits polycrystals (Taylor–Quinney)</div></div>
</div>"""),

    slide("J₂ associated flow rule", f"""
<div class="cols">
  <div>
    <p>Associated (normality) flow with f = J₂ − k²:</p>
    <p>\\[ \\dot\\varepsilon_{{ij}}^{{p}}=\\dot\\lambda\\,\\frac{{\\partial f}}{{\\partial\\sigma_{{ij}}}} =\\dot\\lambda\\, s_{{ij}},\\qquad \\dot\\varepsilon_{{kk}}^{{p}}=0. \\]</p>
    <p>Consistency during plastic loading (ḟ = 0): elastic predictor, plastic corrector if f &gt; 0.</p>
    <p style="font-size:0.85em;">Dislocations are the microscopic carriers; J₂ plasticity is the continuum limit.</p>
    {gb("13–15", "Flow rule, tension &amp; shear")}
  </div>
  <div style="font-size:0.68em;">
    <div class="flow-row">
      <div class="fbox">Elastic<br>predictor<br>σ<sup>tr</sup></div><span class="arrow">→</span>
      <div class="kbox">f &gt; 0?</div>
    </div>
    <div class="flow-row">
      <div class="gbox">Return to<br>yield surface</div>
      <div class="fbox">Accept σ</div>
    </div>
  </div>
</div>"""),

    slide("Fracture: LEFM and energy release", f"""
<div class="cols">
  <div>
    <ul>
      <li>Slit-like crack: elastic field with r<sup>−1/2</sup> stress singularity at tip.</li>
      <li>Stress intensity K<sub>I</sub> characterizes tip loading; fracture when K<sub>I</sub> = K<sub>Ic</sub>.</li>
      <li>Energy release rate 𝒢 = ∂U/∂a; J-integral for nonlinear paths.</li>
      <li>Elastic–plastic zone and Dugdale–Barenblatt model; fatigue crack growth (Part III).</li>
    </ul>
    {gb("22–26", "Slit crack, LEFM, fatigue")}
  </div>
  <div>{CRACK}<div class="figcap">center crack 2a, remote tension σ<sup>∞</sup> (Mode I)</div></div>
</div>"""),

    slide("Standard workflow", """
<div class="cols cols-top">
  <div>
    <ol>
      <li><strong>Model:</strong> geometry, BCs, 2D vs. 3D.</li>
      <li><strong>Method:</strong> Airy φ or Green / images.</li>
      <li><strong>Solve:</strong> separated variables, Fourier, multipoles.</li>
      <li><strong>Check:</strong> equilibrium, BCs, finite energy.</li>
      <li><strong>Extract:</strong> σ, contact pressure, U, forces.</li>
    </ol>
  </div>
  <div>
    <div class="flow-row" style="flex-direction:column;align-items:stretch;">
      <div class="fbox">Model<br>BCs</div><span class="arrow">↓</span>
      <div class="gbox">2D φ<br>or 3D G</div><span class="arrow">↓</span>
      <div class="kbox">Analytic<br>solution</div><span class="arrow">↓</span>
      <div class="fbox">Check<br>extract</div>
    </div>
  </div>
</div>
<div class="example-block"><strong>Benchmark mindset:</strong> Keep an analytic case as a reference when switching to numerics.</div>
"""),

    slide("Lecture map (handouts)", """
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
    <p style="margin-top:0.5em;"><a href="{CAI_ME340}">Cai ME 340 notes</a>; <a href="{ELASTICITY_NOTES}">consolidated PDF</a></p>
  </div>
</div>"""),

    slide("Takeaways", """
<ol>
  <li><strong>Elasticity:</strong> kinematics + Hooke + equilibrium + BCs; 2D Airy φ, 3D Green's functions.</li>
  <li><strong>Plasticity:</strong> ε = ε<sup>e</sup> + ε<sup>p</sup>; von Mises yield + associated J₂ flow.</li>
  <li><strong>Fracture:</strong> K<sub>I</sub>, 𝒢, and J link elastic fields to crack growth and fatigue.</li>
  <li>Matlab and analytic benchmarks support each part; see <a href="{CAI_ME340}">ME 340 handouts</a>.</li>
</ol>
<div class="flow-row" style="margin-top:0.75em;">
  <div class="fbox">Elasticity<br>σ, u</div><span class="arrow">→</span>
  <div class="gbox">Plasticity<br>εᵖ, f=0</div><span class="arrow">→</span>
  <div class="kbox">Fracture<br>K_I, J</div>
</div>
"""),

    slide("References", f"""
<ul>
  <li>W. Cai, <em>ME 340 Elasticity and Inelasticity</em>:
    <a href="{CAI_ME340}">course page</a>;
    <a href="{ELASTICITY_NOTES}">consolidated PDF</a>.</li>
  <li>J. R. Barber, <em>Elasticity</em>, 3rd ed., Springer (2010).</li>
  <li>T. L. Anderson, <em>Fracture Mechanics</em>, 3rd ed., Taylor &amp; Francis (2005).</li>
  <li>Printable intro slides: <a href="{INTRO_PDF}">ME340_Intro.pdf</a>.</li>
</ul>
<p style="text-align:center;margin-top:2em;font-size:1.2em;"><strong>Thank you.</strong></p>
"""),
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
