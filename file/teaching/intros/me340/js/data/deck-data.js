(function () {
  'use strict';

  const R = String.raw;
  const ME340 = (window.ME340 = window.ME340 || {});

  ME340.DECK_DATA = {
    meta: {
      title: 'Mechanics: Elasticity and Inelasticity',
      author: 'Hanfeng Zhai',
      department: 'Department of Mechanical Engineering, Stanford University',
      term: 'Winter 2025-26',
      exploreUrl: 'https://explorecourses.stanford.edu/search?q=ME340&view=catalog&filter-coursestatus-Active=on&academicYear=20252026',
      pdfUrl: 'https://hanfengzhai.com/file/teaching/intros/ME340_Intro.pdf',
      notesUrl: 'https://hanfengzhai.com/file/teaching/notes/elasticity_notes.pdf',
      courseNotesUrl: 'https://micro.stanford.edu/~caiwei/me340/'
    },

    parts: {
      intro: { label: 'Overview', shortLabel: 'Intro' },
      'part-1': { label: 'Part I · Elasticity', shortLabel: 'Part I · Elasticity' },
      'part-2': { label: 'Part II · Plasticity', shortLabel: 'Part II · Plasticity' },
      'part-3': { label: 'Part III · Fracture', shortLabel: 'Part III · Fracture' },
      synthesis: { label: 'Workflow & Synthesis', shortLabel: 'Synthesis' }
    },

    slides: [
      // 01. Hero
      {
        id: 'hero',
        partId: 'intro',
        layout: 'hero',
        labId: 'hero-mesh',
        title: 'Mechanics: Elasticity and Inelasticity',
        plainTitle: 'Mechanics: Elasticity and Inelasticity',
        subtitle: 'An interactive course map for Stanford ME 340 covering continuum elasticity, plasticity, and fracture mechanics.',
        overviewHint: 'Title & Live Continuum',
        symbols: []
      },

      // 02. Course at a glance
      {
        id: 'glance',
        partId: 'intro',
        layout: 'bento',
        labId: 'continuum-mini',
        title: 'Course at a glance',
        plainTitle: 'Course at a glance',
        lead: 'Graduate solid mechanics at Stanford: from elastic boundary-value problems to yielding and fracture.',
        overviewHint: 'Course Scope & Study Guide',
        contentHtml: R`
          <article class="bento-card">
            <div class="bento-card-kicker">Course</div>
            <h3 class="bento-card-title">Stanford ME 340</h3>
            <p class="bento-card-body">Taught by Prof. Wei Cai (<a href="https://explorecourses.stanford.edu/search?q=ME340&amp;view=catalog&amp;filter-coursestatus-Active=on&amp;academicYear=20252026" target="_blank" rel="noopener">ExploreCourses ↗</a>); covers linear elasticity, plasticity, and fracture.</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">Three Parts</div>
            <h3 class="bento-card-title">Unified Progression</h3>
            <p class="bento-card-body">I: 2D Airy $\phi$, 3D $\mathbf{G}$, contact. II: yield, $J_2$ flow, hardening. III: LEFM, $J$-integral, fatigue.</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">Methods &amp; Texts</div>
            <h3 class="bento-card-title">Theory &amp; MATLAB</h3>
            <p class="bento-card-body">Analytic derivations pair with MATLAB solvers; texts: Barber (2010) and Anderson (2005).</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">Study Guide</div>
            <h3 class="bento-card-title">Notes &amp; Study PDF</h3>
            <p class="bento-card-body">Read the <a href="https://hanfengzhai.com/file/teaching/notes/elasticity_notes.pdf" target="_blank" rel="noopener">Study Notes PDF ↗</a> alongside Prof. Wei Cai's <a href="https://micro.stanford.edu/~caiwei/me340/" target="_blank" rel="noopener">lecture notes ↗</a>.</p>
          </article>
        `,
        symbols: [
          { sym: R`$\phi$`, short: 'Airy stress function', desc: R`Airy stress function in 2D elasticity satisfying $\nabla^4\phi = 0$ when $\mathbf{f} = \mathbf{0}$.` },
          { sym: R`$\mathbf{G}$`, short: "3D Green's tensor", desc: R`3D elastic Green's tensor mapping a unit point force to displacement.` },
          { sym: 'LEFM', short: 'Linear elastic fracture', desc: 'Linear elastic fracture mechanics governing sharp cracks under small-scale yielding.' },
          { sym: R`$J$`, short: 'J-integral', desc: 'Path-independent contour integral measuring crack-tip energy release.' }
        ]
      },

      // 03. Three-part course structure
      {
        id: 'structure',
        partId: 'intro',
        layout: 'flow',
        labId: 'course-pipeline',
        title: 'Three-part course structure',
        plainTitle: 'Three-part course structure',
        lead: R`Every problem flows from a well-posed elastic BVP to plasticity ($f^{\mathrm{tr}} \gt 0$) and fracture ($K_I \ge K_{Ic}$).`,
        overviewHint: 'Elasticity → Plasticity → Fracture',
        contentHtml: R`
          <div class="mini-stat-grid">
            <div class="mini-stat part-part-1">
              <strong class="mini-stat-val">I. Elasticity</strong>
              <span class="mini-stat-label">$\boldsymbol{\sigma}, \boldsymbol{\varepsilon}$, equilibrium, 2D Airy $\phi$, 3D Green's $\mathbf{G}$.</span>
            </div>
            <div class="mini-stat part-part-2">
              <strong class="mini-stat-val">II. Plasticity</strong>
              <span class="mini-stat-label">Yield surface $f$, plastic strain $\varepsilon^p$, $J_2$ flow, hardening.</span>
            </div>
            <div class="mini-stat part-part-3">
              <strong class="mini-stat-val">III. Fracture</strong>
              <span class="mini-stat-label">Crack-tip $K_I$, energy release $\mathcal{G}$, $J$-integral, fatigue.</span>
            </div>
          </div>
          <div class="callout-card is-apps-strip">
            <span class="callout-label">Applications</span><span>contact · pressure vessels · notched parts · fatigue</span>
          </div>
        `,
        symbols: [
          { sym: R`$\boldsymbol{\sigma}, \boldsymbol{\varepsilon}$`, short: 'Stress & strain', desc: 'Symmetric Cauchy stress tensor and infinitesimal strain tensor in linear elasticity.' },
          { sym: R`$\varepsilon^p$`, short: 'Plastic strain', desc: 'Permanent irreversible strain retained after unloading past yield.' },
          { sym: R`$f$`, short: 'Yield function', desc: R`Scalar yield criterion separating elastic interior ($f \lt 0$) from yield surface ($f = 0$); trial $f^{\mathrm{tr}} \gt 0$ triggers plastic flow.` },
          { sym: R`$K_I$`, short: 'Mode-I SIF', desc: 'Mode-I stress intensity factor governing opening-mode crack-tip stress amplitude.' },
          { sym: R`$\mathcal{G}$`, short: 'Energy release rate', desc: R`Rate of total potential energy release per unit new crack area, $\mathcal{G} = -\partial\Pi/\partial A$.` },
          { sym: R`$J$`, short: 'J-integral', desc: 'Path-independent contour integral for elastic and elastic-plastic fracture energy release.' }
        ]
      },

      // 04. Course outline
      {
        id: 'outline',
        partId: 'intro',
        layout: 'index',
        labId: null,
        title: 'Course outline',
        plainTitle: 'Outline',
        lead: 'Eight core modules across elasticity, plasticity, fracture, and problem-solving workflow.',
        overviewHint: '8 Course Modules',
        outlineItems: [
          {
            partId: 'part-1',
            partTag: 'Part I',
            title: 'Tensors and Einstein notation',
            summary: R`Index rules, $\delta_{ij}$, $\varepsilon_{ijk}$, comma derivatives, bold-indicial form.`,
            targetId: 'tensors'
          },
          {
            partId: 'part-1',
            partTag: 'Part I',
            title: 'Foundations',
            summary: R`Motion map, stress $\boldsymbol{\sigma}$, strain $\boldsymbol{\varepsilon}$, Hooke's law, energy $w$, 3D BVP.`,
            targetId: 'continuum'
          },
          {
            partId: 'part-1',
            partTag: 'Part I',
            title: 'One-dimensional and rod problems',
            summary: R`Axial strain $\varepsilon = \mathrm{d}u/\mathrm{d}x$, rigidity $EA$, 1D BVP template.`,
            targetId: 'rod'
          },
          {
            partId: 'part-1',
            partTag: 'Part I',
            title: 'Two-dimensional elasticity',
            summary: R`Plane stress & strain, Airy $\phi$, beams, Fourier, contact, wedges.`,
            targetId: 'formulations-2d'
          },
          {
            partId: 'part-1',
            partTag: 'Part I',
            title: 'Three-dimensional elasticity',
            summary: R`Kelvin Green's tensor $\mathbf{G}$, Mindlin images, dislocation fields.`,
            targetId: 'greens-3d'
          },
          {
            partId: 'part-2',
            partTag: 'Part II',
            title: 'Plasticity',
            summary: R`Strain split $\varepsilon^e + \varepsilon^p$, von Mises & Tresca yield, $J_2$ radial return.`,
            targetId: 'elas-to-plas'
          },
          {
            partId: 'part-3',
            partTag: 'Part III',
            title: 'Fracture mechanics',
            summary: R`Slit-crack $r^{-1/2}$ field, $K_I$, energy release $\mathcal{G}$, $J$-integral, fatigue.`,
            targetId: 'fracture-lefm'
          },
          {
            partId: 'synthesis',
            partTag: 'Synthesis',
            title: 'Problem-solving workflow',
            summary: 'Five-step modeling workflow, 23-lecture map, takeaways, and references.',
            targetId: 'workflow'
          }
        ],
        symbols: []
      },

      // 05. Tensors and Einstein notation
      {
        id: 'tensors',
        partId: 'part-1',
        layout: 'split',
        labId: 'tensor-playground',
        title: 'Tensors and Einstein notation',
        plainTitle: 'Tensors and Einstein notation',
        lectureBadges: ['Lec. 2 · Tensors'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">Einstein Summation &amp; Contraction</div>
            <div>$$\begin{aligned} a_i b_i &= a_1 b_1 + a_2 b_2 + a_3 b_3 \\ \sigma_{ii} &= \sigma_{11} + \sigma_{22} + \sigma_{33} \end{aligned}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Tensor ranks &amp; form:</strong> rank 0 scalars ($E, \nu, \rho$), rank 1 vectors ($\mathbf{a} \leftrightarrow a_i$), rank 2 tensors ($\mathbf{T} \leftrightarrow T_{ij}$, $\boldsymbol{\sigma} \leftrightarrow \sigma_{ij}$).</li>
            <li><strong>Summation rule:</strong> indices repeated twice sum over $1, 2, 3$; unmatched free indices span each component.</li>
            <li><strong>Comma derivatives:</strong> $u_{i,j} = \partial u_i / \partial x_j$ gives the gradient; $\sigma_{ij,j} = \partial \sigma_{ij} / \partial x_j$ gives divergence.</li>
            <li><strong>Isotropic tensors:</strong> Kronecker $\delta_{ij}$ acts as identity; Levi-Civita $\varepsilon_{ijk}$ encodes cross products and curl.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$i, j, k$`, short: 'Coordinate indices', desc: R`Cartesian coordinate indices ranging over $1, 2, 3$ (or $x, y, z$).` },
          { sym: R`$a_i, b_i$`, short: 'Vector components', desc: R`Cartesian components of first-order vectors whose inner product is $a_i b_i$.` },
          { sym: R`$\sigma_{ii}$`, short: 'Tensor trace', desc: R`Contraction $\sigma_{11} + \sigma_{22} + \sigma_{33}$ summing the diagonal components.` },
          { sym: R`$\delta_{ij}$`, short: 'Kronecker delta', desc: R`Identity component equal to $1$ when $i = j$ and $0$ when $i \neq j$.` },
          { sym: R`$\varepsilon_{ijk}$`, short: 'Levi-Civita symbol', desc: R`Three-index alternating permutation tensor ($+1$ even, $-1$ odd, $0$ repeated); distinct from 2-index strain $\varepsilon_{ij}$.` },
          { sym: R`$T_{ij}$`, short: '2nd-order tensor', desc: R`Cartesian matrix components of a second-order tensor $\mathbf{T}$.` }
        ]
      },

      // 06. Continuum body: reference & deformed states
      {
        id: 'continuum',
        partId: 'part-1',
        layout: 'split',
        labId: 'continuum-map',
        title: 'Continuum body: reference &amp; deformed states',
        plainTitle: 'Continuum body: reference and deformed configurations',
        lectureBadges: ['Lec. 1 · Introduction'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">Motion Map &amp; Small-Strain Tensor</div>
            <div>$$\begin{aligned} \mathbf{x} &= \mathbf{X} + \mathbf{u}(\mathbf{X}) \\ \varepsilon_{ij} &= \frac{1}{2}\left(u_{i,j} + u_{j,i}\right) \end{aligned}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Configuration map:</strong> loads deform reference body $\Omega_0$ into $\Omega$, mapping each particle $\mathbf{X}$ to $\mathbf{x} = \mathbf{X} + \mathbf{u}(\mathbf{X})$.</li>
            <li><strong>Infinitesimal strain:</strong> under small gradients (<span class="nowrap">$|\nabla\mathbf{u}| \ll 1$</span>), symmetric $\varepsilon_{ij}$ measures local stretch and shear distortion.</li>
            <li><strong>Domain partition:</strong> any bounded continuum occupies volume $V$ with boundary $\partial V = S_u \cup S_t$.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\Omega_0, \Omega$`, short: 'Ref. & deformed body', desc: R`Reference (undeformed) configuration $\Omega_0$ and loaded deformed configuration $\Omega$.` },
          { sym: R`$\mathbf{X}, \mathbf{x}$`, short: 'Material & spatial coords', desc: R`Reference material coordinate $\mathbf{X} \in \Omega_0$ and deformed coordinate $\mathbf{x} \in \Omega$.` },
          { sym: R`$\mathbf{u}$`, short: 'Displacement vector', desc: R`Displacement field $\mathbf{u}(\mathbf{X}) = \mathbf{x} - \mathbf{X}$ linking both configurations.` },
          { sym: R`$\varepsilon_{ij}$`, short: 'Small strain tensor', desc: R`Symmetric infinitesimal strain tensor $\frac{1}{2}(u_{i,j} + u_{j,i})$ valid for $|\nabla\mathbf{u}| \ll 1$.` },
          { sym: R`$V, \partial V$`, short: 'Volume & boundary', desc: R`Interior continuum domain $V$ bounded by closed surface $\partial V$.` },
          { sym: R`$S_u, S_t$`, short: 'Boundary split', desc: R`Prescribed-displacement surface $S_u$ and prescribed-traction surface $S_t$ ($\partial V = S_u \cup S_t$).` }
        ]
      },

      // 07. Stress and strain
      {
        id: 'stress-strain',
        partId: 'part-1',
        layout: 'split',
        labId: 'stress-traction',
        title: 'Stress and strain',
        plainTitle: 'Stress and strain',
        lectureBadges: ['Lec. 1–2 · Introduction, Tensors'],
        contentHtml: R`
          <div class="eq-stack">
            <div class="eq-stack-group">
              <div class="eq-card-label">Stress Symmetry &amp; Strain Kinematics</div>
              <div>$$\sigma_{ij} = \sigma_{ji}, \quad \varepsilon_{ij} = \frac{1}{2}\left(\frac{\partial u_i}{\partial x_j} + \frac{\partial u_j}{\partial x_i}\right)$$</div>
            </div>
            <div class="eq-stack-group">
              <div class="eq-card-label">Cauchy Traction &amp; Static Equilibrium</div>
              <div>$$t_i = \sigma_{ij} n_j, \quad \frac{\partial \sigma_{ij}}{\partial x_j} + f_i = 0$$</div>
            </div>
          </div>
          <ul class="point-list">
            <li><strong>Cauchy stress $\boldsymbol{\sigma}$:</strong> internal force per area; angular momentum balance enforces symmetry (<span class="nowrap">$\sigma_{ij} = \sigma_{ji}$</span>).</li>
            <li><strong>Traction law:</strong> on any cut plane with outward normal $\mathbf{n}$, surface traction is $\mathbf{t} = \boldsymbol{\sigma}\cdot\mathbf{n}$.</li>
            <li><strong>Principal frame:</strong> rotating the cut plane aligns $\mathbf{t} \parallel \mathbf{n}$ on orthogonal shear-free planes <span class="nowrap">($\tau = 0$)</span>.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\sigma_{ij}$`, short: 'Cauchy stress', desc: R`Symmetric Cauchy stress component acting on plane $j$ in coordinate direction $i$.` },
          { sym: R`$\varepsilon_{ij}$`, short: 'Strain tensor', desc: R`Infinitesimal strain encoding normal stretch (diagonal) and angular shear (off-diagonal).` },
          { sym: R`$u_i$`, short: 'Displacement components', desc: R`Cartesian components of the displacement vector $\mathbf{u}$.` },
          { sym: R`$\mathbf{t}, t_i$`, short: 'Traction vector', desc: R`Force per unit area on a plane with normal $\mathbf{n}$, given by $t_i = \sigma_{ij} n_j$.` },
          { sym: R`$n_j$`, short: 'Unit normal', desc: R`Components of the outward unit normal vector $\mathbf{n}$ on a cut surface.` },
          { sym: R`$f_i$`, short: 'Body force density', desc: R`External volumetric force density ($\mathrm{N/m^3}$) entering equilibrium $\sigma_{ij,j} + f_i = 0$.` }
        ]
      },

      // 08. Hooke's law and elastic energy
      {
        id: 'hooke',
        partId: 'part-1',
        layout: 'split',
        labId: 'hooke-energy',
        title: "Hooke's law and elastic energy",
        plainTitle: "Hooke's law and elastic energy",
        lectureBadges: ["Lec. 3 · Hooke's Law", 'Lec. 4 · Fundamental Equations'],
        contentHtml: R`
          <div class="eq-stack">
            <div class="eq-stack-group">
              <div class="eq-card-label">Hooke's Law, Isotropic Compliance &amp; Energy</div>
              <div>$$\begin{aligned} \sigma_{ij} &= C_{ijkl}\varepsilon_{kl} \\ \varepsilon_{ij} &= \frac{1+\nu}{E}\sigma_{ij} - \frac{\nu}{E}\sigma_{kk}\delta_{ij} \\ w &= \frac{1}{2}\sigma_{ij}\varepsilon_{ij}, \quad U = \int_V w\,\mathrm{d}V \end{aligned}$$</div>
            </div>
          </div>
          <ul class="point-list">
            <li><strong>Isotropic symmetry:</strong> isotropy reduces the 81 components of $C_{ijkl}$ to two constants, $E$ and $\nu$ (or Lamé $\lambda, \mu$).</li>
            <li><strong>Positive definiteness:</strong> positive-definite $C_{ijkl}$ ensures $w \gt 0$ for every nonzero strain state.</li>
            <li><strong>1D elastic limit:</strong> under uniaxial stress $\sigma = E\varepsilon$, the area under the $\sigma$–$\varepsilon$ curve equals stored energy $w = \frac{1}{2}\sigma^*\varepsilon^*$.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$C_{ijkl}$`, short: 'Stiffness tensor', desc: R`Fourth-order positive-definite elastic stiffness tensor in $\sigma_{ij} = C_{ijkl}\varepsilon_{kl}$.` },
          { sym: R`$E$`, short: "Young's modulus", desc: 'Isotropic axial modulus setting the slope of the uniaxial stress-strain curve.' },
          { sym: R`$\nu$`, short: "Poisson's ratio", desc: 'Negative ratio of lateral contraction to axial extension under uniaxial tension.' },
          { sym: R`$w$`, short: 'Strain-energy density', desc: R`Elastic energy per unit volume, $w = \frac{1}{2}\sigma_{ij}\varepsilon_{ij}$ (1D: $w = \frac{1}{2}\sigma\varepsilon$).` },
          { sym: R`$U$`, short: 'Total strain energy', desc: R`Volume integral of elastic energy density, $U = \int_V w\,\mathrm{d}V$.` },
          { sym: R`$\sigma_{kk}$`, short: 'Stress trace', desc: R`Sum of normal stresses $\sigma_{11}+\sigma_{22}+\sigma_{33}$ governing volumetric dilation.` }
        ]
      },

      // 09. Fundamental boundary-value problem
      {
        id: 'bvp',
        partId: 'part-1',
        layout: 'split',
        labId: 'bvp-domain',
        title: 'Fundamental boundary-value problem',
        plainTitle: 'Fundamental boundary-value problem',
        lectureBadges: ['Lec. 4 · Fundamental Equations'],
        contentHtml: R`
          <div class="eq-stack">
            <div class="eq-stack-group">
              <div class="eq-card-label">Field Equations in $V$</div>
              <div>$$\begin{aligned} \boldsymbol{\varepsilon} &= \frac{1}{2}\left(\nabla\mathbf{u} + \nabla\mathbf{u}^\top\right), \quad \boldsymbol{\sigma} = \mathbb{C} : \boldsymbol{\varepsilon} \\ \nabla \cdot \boldsymbol{\sigma} + \mathbf{f} &= \mathbf{0} \end{aligned}$$</div>
            </div>
            <div class="eq-stack-group">
              <div class="eq-card-label">BCs on $\partial V = S_u \cup S_t,\; S_u \cap S_t = \emptyset$</div>
              <div>$$\mathbf{u} = \mathbf{u}_0 \text{ on } S_u, \quad \boldsymbol{\sigma} \cdot \mathbf{n} = \mathbf{t} \text{ on } S_t$$</div>
            </div>
          </div>
          <ul class="point-list">
            <li><strong>Closure:</strong> 15 scalar equations (6 kinematics, 6 Hooke, 3 equilibrium) solve for 15 fields (<span class="nowrap">$u_i, \varepsilon_{ij}, \sigma_{ij}$</span>).</li>
            <li><strong>Compatibility &amp; uniqueness:</strong> posited strains require compatibility; positive-definite $\mathbb{C}$ with well-posed BCs ensures uniqueness.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\mathbb{C}$`, short: 'Stiffness operator', desc: R`Fourth-order elasticity tensor written in direct operator form ($\boldsymbol{\sigma} = \mathbb{C}:\boldsymbol{\varepsilon}$).` },
          { sym: R`$\mathbf{f}$`, short: 'Body force density', desc: R`External force per unit volume ($\mathrm{N/m^3}$) distributed throughout interior domain $V$.` },
          { sym: R`$\mathbf{u}_0$`, short: 'Boundary displacement', desc: R`Prescribed displacement field imposed on Dirichlet boundary $S_u$.` },
          { sym: R`$\mathbf{t}$`, short: 'Boundary traction', desc: R`Prescribed surface traction vector applied on Neumann boundary $S_t$.` },
          { sym: R`$\mathbf{n}$`, short: 'Outward normal', desc: R`Outward unit normal vector on boundary $\partial V$.` },
          { sym: R`$\nabla$`, short: 'Spatial operator', desc: R`Gradient operator on $\mathbf{u}$ and divergence operator on $\boldsymbol{\sigma}$.` }
        ]
      },

      // 10. Elastic rod (1D building block)
      {
        id: 'rod',
        partId: 'part-1',
        layout: 'split',
        labId: 'elastic-rod',
        title: 'Elastic rod (1D building block)',
        plainTitle: 'Elastic rod (1D building block)',
        lectureBadges: ['Lec. 4 · Fundamental Equations (1D Model)'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">1D Kinematics, Hooke's Law &amp; Equilibrium</div>
            <div>$$\begin{aligned} \varepsilon &= \frac{\mathrm{d}u}{\mathrm{d}x}, \quad N = EA\varepsilon \\ \frac{\mathrm{d}N}{\mathrm{d}x} + f(x) &= 0 \end{aligned}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Deformed length:</strong> a rod of length $L_0$ and area $A$ stretches to deformed length $L = L_0 + u(L_0)$.</li>
            <li><strong>Boundary conditions:</strong> fixed at $x = 0$ (<span class="nowrap">$u(0) = 0$</span>), tip force $N(L_0) = P$, and distributed load $f(x)$.</li>
            <li><strong>1D BVP template:</strong> rigidity $EA$ and wall reaction $N_0 = P + f_0 L_0$ mirror the 3D BVP structure.</li>
          </ul>
          <details class="mono-disclosure">
            <summary>Closed-form uniform-load solution</summary>
            <div class="mono-disclosure-body">
              <div>$$\begin{aligned} N(x) &= P + f_0(L_0 - x) \\ u(x) &= \frac{(P + f_0 L_0)x - \frac{1}{2}f_0 x^2}{EA} \end{aligned}$$</div>
            </div>
          </details>
        `,
        symbols: [
          { sym: R`$\varepsilon$`, short: 'Axial strain', desc: R`1D normal axial strain $\varepsilon(x) = \mathrm{d}u/\mathrm{d}x$.` },
          { sym: R`$u(x)$`, short: 'Axial displacement', desc: R`Longitudinal displacement of cross-section $x$ along the rod (distinct from strain-energy density $w$).` },
          { sym: R`$N, P$`, short: 'Internal & end force', desc: R`Internal axial resultant $N(x) = EA\varepsilon$ and applied tip load $P = N(L_0)$.` },
          { sym: R`$EA$`, short: 'Axial rigidity', desc: R`Product of Young's modulus $E$ and cross-sectional area $A$.` },
          { sym: R`$f(x)$`, short: 'Axial line load', desc: R`Distributed axial force per unit length ($\mathrm{N/m}$) along the rod axis.` },
          { sym: R`$L_0, A$`, short: 'Length & area', desc: R`Initial undeformed length $L_0$ and cross-sectional area $A$.` }
        ]
      },

      // 11. 2D formulations
      {
        id: 'formulations-2d',
        partId: 'part-1',
        layout: 'compare',
        labId: 'plane-2d-toggle',
        title: '2D formulations',
        plainTitle: '2D formulations',
        lectureBadges: ['Lec. 5 · 2D Elasticity'],
        bannerHtml: R`
          <div class="airy-banner-card">
            <span class="eq-card-label">Airy Stress Function $\phi(x, y)$ ($\mathbf{f} = \mathbf{0}$)</span>
            <div class="airy-eq-tokens">
              <span class="eq-token">$\nabla^4\phi = 0,$</span>
              <span class="eq-token">$\sigma_{xx} = \phi_{,yy},$</span>
              <span class="eq-token">$\sigma_{yy} = \phi_{,xx},$</span>
              <span class="eq-token">$\sigma_{xy} = -\phi_{,xy}$</span>
            </div>
          </div>
        `,
        contentHtml: R`
          <div class="compare-cols">
            <article class="compare-card is-stress">
              <div class="compare-head-row">
                <h3>Plane Stress</h3>
                <span class="eq-card-label">Thin Plate ($t \ll L$, $z = x_3$)</span>
              </div>
              <p class="compare-card-assumption">$\sigma_{zz} = \sigma_{xz} = \sigma_{yz} = 0$</p>
              <div>$$\begin{aligned} \varepsilon_{xx} &= \frac{1}{E}\left(\sigma_{xx} - \nu\sigma_{yy}\right) \\ \varepsilon_{yy} &= \frac{1}{E}\left(\sigma_{yy} - \nu\sigma_{xx}\right) \\ \varepsilon_{xy} &= \frac{1+\nu}{E}\sigma_{xy} \end{aligned}$$</div>
            </article>
            <article class="compare-card is-strain">
              <div class="compare-head-row">
                <h3>Plane Strain</h3>
                <span class="eq-card-label">Long Prism (in $z = x_3$)</span>
              </div>
              <p class="compare-card-assumption">$\varepsilon_{zz} = \varepsilon_{xz} = \varepsilon_{yz} = 0,\; \sigma_{zz} = \nu(\sigma_{xx}+\sigma_{yy})$</p>
              <div>$$\begin{aligned} \sigma_{xx} &= \lambda(\varepsilon_{xx} + \varepsilon_{yy}) + 2\mu\varepsilon_{xx} \\ \sigma_{yy} &= \lambda(\varepsilon_{xx} + \varepsilon_{yy}) + 2\mu\varepsilon_{yy} \\ \sigma_{xy} &= 2\mu\varepsilon_{xy} \end{aligned}$$</div>
              <div class="compare-lame-row airy-eq-tokens">
                <span class="eq-token">$\lambda = E\nu/[(1+\nu)(1-2\nu)],$</span>
                <span class="eq-token">$\mu = E/[2(1+\nu)]$</span>
              </div>
            </article>
          </div>
        `,
        symbols: [
          { sym: R`$\phi$`, short: 'Airy stress function', desc: R`Scalar 2D biharmonic potential ($\nabla^4\phi = 0$ for $\mathbf{f}=\mathbf{0}$) satisfying equilibrium identically.` },
          { sym: R`$\lambda, \mu$`, short: 'Lamé constants', desc: R`First Lamé parameter $\lambda = E\nu/[(1+\nu)(1-2\nu)]$ and shear modulus $\mu = E/[2(1+\nu)]$.` },
          { sym: R`$E, \nu$`, short: 'Elastic moduli', desc: R`Young's modulus $E$ and Poisson's ratio $\nu$ for isotropic plane elasticity.` },
          { sym: R`$t, L$`, short: 'Thickness & length', desc: R`Out-of-plane thickness $t$ and in-plane span $L$ ($t \ll L$ defines plane stress).` }
        ]
      },

      // 12. Classic 2D solution routes
      {
        id: 'routes-2d',
        partId: 'part-1',
        layout: 'lab-wide',
        labId: 'airy-gallery',
        title: 'Classic 2D solution routes',
        plainTitle: 'Classic 2D solution routes',
        lead: R`Four recurring routes for solving $\nabla^4\phi = 0$ across rectangular, periodic, half-space, and contact geometries.`,
        lectureBadges: ['Lec. 6–10 · Beam, Fourier, Half Space, Contact'],
        contentHtml: '',
        symbols: [
          { sym: R`$q(x)$`, short: 'Beam load', desc: 'Distributed transverse load applied on a rectangular beam (Lec. 6).' },
          { sym: R`$L, 2h$`, short: 'Span & beam depth', desc: R`Characteristic beam span or Fourier period $L$ and full rectangular beam height $2h$.` },
          { sym: R`$p(x)$`, short: 'Surface pressure', desc: R`Periodic loading $p(x+L)=p(x)$ (Lec. 7–8) or contact pressure on $[-a, a]$ (Lec. 10).` },
          { sym: R`$P$`, short: 'Line force', desc: 'Concentrated 2D line force acting on a half-space boundary (Lec. 9).' },
          { sym: R`$r$`, short: 'Radial distance', desc: R`Distance from the line load in the Flamant half-space solution ($\sigma \sim 1/r$).` },
          { sym: R`$a$`, short: 'Contact half-width', desc: R`Half-width of the loaded contact interval $[-a, a]$ between elastic bodies (Lec. 10).` }
        ]
      },

      // 13. Polar coordinates and wedge problems
      {
        id: 'polar-wedge',
        partId: 'part-1',
        layout: 'split',
        labId: 'polar-hole-wedge',
        title: 'Polar coordinates and wedge problems',
        plainTitle: 'Polar coordinates and wedge problems',
        lectureBadges: ['Lec. 11–12 · Polar Coordinates, Wedge & Notch'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">Michell Polar Biharmonic Expansion</div>
            <div>$$\begin{aligned} \nabla^4\phi(r, \theta) &= 0 \\ \phi &\sim r^n,\; \ln r,\; r^2\ln r,\; \theta,\; r\theta\sin\theta \end{aligned}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Kirsch hole (Lec. 11):</strong> tension $\sigma^\infty$ peaks at $\sigma_{\theta\theta} = 3\sigma^\infty$ ($\theta = \pm\pi/2$) and $-\sigma^\infty$ ($\theta = 0, \pi$).</li>
            <li><strong>Wedge corners (Lec. 12):</strong> wedge angle $2\alpha$ admits modes $r^{\lambda+1}$ (<span class="nowrap">$\sigma \sim r^{\lambda-1}$</span>), singular for $2\alpha \gt \pi$.</li>
            <li><strong>Mode filtering:</strong> symmetry, traction BCs, and finite strain energy select admissible Michell terms.</li>
          </ul>
          <details class="mono-disclosure">
            <summary>Williams root equation</summary>
            <div class="mono-disclosure-body">
              <div>$$\sin(2\alpha\lambda) + \lambda\sin(2\alpha) = 0$$</div>
              <p>Real singular roots $\lambda \in [0.5, 1)$ for $2\alpha \in (\pi, 2\pi]$ converge to the slit-crack limit $\lambda = \frac{1}{2}$ at $2\alpha = 2\pi$.</p>
            </div>
          </details>
        `,
        symbols: [
          { sym: R`$r, \theta$`, short: 'Polar coordinates', desc: R`Radial distance $r$ and polar angle $\theta$ centered on a hole, annulus, or wedge tip.` },
          { sym: R`$\phi(r, \theta)$`, short: 'Polar Airy potential', desc: R`Biharmonic Airy stress function written in polar coordinates.` },
          { sym: R`$2\alpha$`, short: 'Solid wedge angle', desc: R`Included solid angle of a 2D elastic wedge or notch ($2\alpha \gt \pi$ yields corner stress singularities; $2\alpha \to 2\pi$ is a slit crack).` },
          { sym: R`$\ln r, r\theta\sin\theta$`, short: 'Michell special modes', desc: R`Axisymmetric logarithmic modes ($\ln r, r^2\ln r$) and single-valued 2D point-force modes ($r\theta\sin\theta, r\theta\cos\theta$).` },
          { sym: R`$\lambda$`, short: 'Williams eigenvalue', desc: R`Corner stress exponent solving $\sin(2\alpha\lambda) + \lambda\sin(2\alpha) = 0$ (distinct from Lamé $\lambda$).` }
        ]
      },

      // 14. Green's function approach (3D)
      {
        id: 'greens-3d',
        partId: 'part-1',
        layout: 'split',
        labId: 'kelvin-image',
        title: "Green's function approach (3D)",
        plainTitle: "Green's function approach (3D)",
        lectureBadges: ["Extended Notes · 3D Green's Functions & Images"],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">3D Equilibrium &amp; Green's Superposition</div>
            <div>$$\begin{aligned} \nabla \cdot \boldsymbol{\sigma} + \mathbf{f} &= \mathbf{0} \\ \mathbf{u}(\mathbf{x}) &= \int_V \mathbf{G}(\mathbf{x}, \mathbf{x}')\,\mathbf{f}(\mathbf{x}')\,\mathrm{d}V' \end{aligned}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Kelvin solution:</strong> point force $\mathbf{P}$ in infinite 3D space gives $u \sim 1/r$ and $\sigma \sim 1/r^2$.</li>
            <li><strong>Mindlin images:</strong> mirror forces and force doublets across $z = 0$ cancel free-surface tractions.</li>
            <li><strong>Superposition:</strong> convolving $\mathbf{G}(\mathbf{x}, \mathbf{x}')$ with body forces $\mathbf{f}$ or defect dipoles builds general 3D fields.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\mathbf{G}(\mathbf{x}, \mathbf{x}')$`, short: "3D Green's tensor", desc: R`Second-order displacement kernel at field point $\mathbf{x}$ due to a unit point force at source $\mathbf{x}'$.` },
          { sym: R`$\mathbf{x}, \mathbf{x}'$`, short: 'Field & source points', desc: R`Observation coordinate $\mathbf{x}$ and integration source coordinate $\mathbf{x}'$.` },
          { sym: R`$\mathrm{d}V'$`, short: 'Source volume element', desc: R`Infinitesimal integration volume centered at source point $\mathbf{x}'$.` },
          { sym: R`$\mathbf{P}$`, short: 'Point force', desc: 'Concentrated 3D force driving the fundamental Kelvin solution.' },
          { sym: R`$\mathbf{f}$`, short: 'Body force density', desc: R`Distributed volumetric force field integrated against $\mathbf{G}(\mathbf{x}, \mathbf{x}')$.` }
        ]
      },

      // 15. Dislocations and defect fields
      {
        id: 'dislocations',
        partId: 'part-1',
        layout: 'split',
        labId: 'dislocation-glide',
        title: 'Dislocations and defect fields',
        plainTitle: 'Dislocations and defect fields',
        lectureBadges: ['Extended Notes · Dislocations', 'Bridge to Lec. 20 · Crystal Plasticity'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">Peach–Köhler Force &amp; Edge Shear Field</div>
            <div>$$\begin{aligned} \mathbf{f}_{\mathrm{PK}} &= (\boldsymbol{\sigma}^\infty \cdot \mathbf{b}) \times \boldsymbol{\xi} \\ \sigma_{xy} &= \frac{\mu b}{2\pi(1-\nu)}\,\frac{x(x^2 - y^2)}{(x^2 + y^2)^2} \end{aligned}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Volterra cut &amp; Burgers vector $\mathbf{b}$:</strong> slipping faces across a plane by $\mathbf{b}$ creates a line defect with $1/r$ stress.</li>
            <li><strong>Peach–Köhler force:</strong> remote stress $\boldsymbol{\sigma}^\infty$ exerts force per length $\mathbf{f}_{\mathrm{PK}}$ on tangent $\boldsymbol{\xi}$, driving glide.</li>
            <li><strong>Bridge to plasticity:</strong> core fields pair with surface images; collective glide produces plastic strain $\varepsilon^p$.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\mathbf{b}$`, short: 'Burgers vector', desc: 'Displacement jump across the Volterra slip cut setting dislocation magnitude and direction.' },
          { sym: R`$\boldsymbol{\xi}$`, short: 'Line tangent vector', desc: 'Unit tangent vector giving the sense along the dislocation line.' },
          { sym: R`$\mathbf{f}_{\mathrm{PK}}$`, short: 'Peach–Köhler force', desc: R`Configurational force per unit dislocation length ($\mathrm{N/m}$), $\mathbf{f}_{\mathrm{PK}} = (\boldsymbol{\sigma}^\infty\cdot\mathbf{b})\times\boldsymbol{\xi}$.` },
          { sym: R`$\boldsymbol{\sigma}^\infty$`, short: 'Remote stress', desc: 'Uniform far-field stress tensor driving dislocation glide.' },
          { sym: R`$\mu, \nu$`, short: 'Shear modulus & Poisson', desc: R`Isotropic elastic constants scaling the dislocation stress prefactor $\mu b/[2\pi(1-\nu)]$.` },
          { sym: R`$\varepsilon^p$`, short: 'Plastic strain', desc: 'Macroscopic permanent strain accumulated from collective dislocation glide.' }
        ]
      },

      // 16. From elasticity to plasticity
      {
        id: 'elas-to-plas',
        partId: 'part-2',
        layout: 'split',
        labId: 'elas-plas-cycle',
        title: 'From elasticity to plasticity',
        plainTitle: 'From elasticity to plasticity',
        lectureBadges: ["Lec. 3 · Hooke's Law", 'Lec. 13 · Fund. Eqs. of Plasticity'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">Additive Small-Strain Split &amp; Elastic Law</div>
            <div>$$\begin{aligned} \varepsilon_{ij} &= \varepsilon_{ij}^e + \varepsilon_{ij}^p \\ \sigma_{ij} &= C_{ijkl}\varepsilon_{kl}^e \end{aligned}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Elastic unloading:</strong> loading below yield $\sigma_Y$ returns strain completely to zero along elastic slope $E$.</li>
            <li><strong>Permanent plastic strain:</strong> exceeding $\sigma_Y$ activates plastic flow; unloading recovers only $\varepsilon^e = \sigma/E$ and leaves permanent strain $\varepsilon^p$.</li>
            <li><strong>Constitutive coupling:</strong> stress depends linearly on $\varepsilon_{ij}^e$ through Hooke's law; a yield condition and flow rule evolve $\varepsilon_{ij}^p$.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\varepsilon_{ij}^e, \varepsilon_{ij}^p$`, short: 'Elastic & plastic strain', desc: R`Reversible elastic strain $\varepsilon_{ij}^e$ and permanent plastic strain $\varepsilon_{ij}^p$ summing to $\varepsilon_{ij}$.` },
          { sym: R`$C_{ijkl}$`, short: 'Elastic stiffness', desc: R`Fourth-order Hooke stiffness tensor acting exclusively on elastic strain $\varepsilon_{kl}^e$.` },
          { sym: R`$\sigma_Y$`, short: 'Yield stress', desc: 'Uniaxial tensile stress threshold where irreversible plastic deformation begins.' }
        ]
      },

      // 17. Yield criteria: von Mises and Tresca
      {
        id: 'yield-criteria',
        partId: 'part-2',
        layout: 'split',
        labId: 'yield-surfaces',
        title: 'Yield criteria: von Mises and Tresca',
        plainTitle: 'Yield criteria: von Mises and Tresca',
        lectureBadges: ['Lec. 13–14 · Yield Surface / Graphical'],
        contentHtml: R`
          <div class="eq-stack">
            <div class="eq-stack-group">
              <div class="eq-card-label">Deviatoric &amp; Equivalent Stress</div>
              <div>$$\begin{aligned} s_{ij} &= \sigma_{ij} - \frac{1}{3}\sigma_{kk}\delta_{ij} \\ J_2 &= \frac{1}{2}s_{ij}s_{ij}, \quad \sigma_{\mathrm{eq}} = \sqrt{3J_2} \end{aligned}$$</div>
            </div>
            <div class="eq-stack-group">
              <div class="eq-card-label">von Mises ($k = \sigma_Y / \sqrt{3}$) &amp; Tresca Yield</div>
              <div>$$\begin{aligned} f(\boldsymbol{\sigma}) &= J_2 - k^2 \le 0 \\ \max_{i,j}\left|\sigma_i - \sigma_j\right| &\le \sigma_Y \end{aligned}$$</div>
            </div>
          </div>
          <ul class="point-list">
            <li><strong>Principal stresses:</strong> eigenvalues $\sigma_1 \ge \sigma_2 \ge \sigma_3$ act on orthogonal shear-free planes <span class="nowrap">($\tau = 0$)</span>.</li>
            <li><strong>$\pi$-plane geometry:</strong> metal yielding ignores hydrostatic stress $\sigma_{kk}/3$; von Mises circumscribes the Tresca hexagon.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\sigma_1, \sigma_2, \sigma_3$`, short: 'Principal stresses', desc: R`Ordered eigenvalues ($\sigma_1 \ge \sigma_2 \ge \sigma_3$) of $\sigma_{ij}$ on shear-free planes ($\tau = 0$).` },
          { sym: R`$\sigma_{kk}$`, short: 'Hydrostatic trace', desc: R`Trace $\sigma_1 + \sigma_2 + \sigma_3$ removed to isolate distortion-driving shear stress.` },
          { sym: R`$s_{ij}$`, short: 'Deviatoric stress', desc: R`Trace-free deviatoric stress tensor $s_{ij} = \sigma_{ij} - \frac{1}{3}\sigma_{kk}\delta_{ij}$.` },
          { sym: R`$J_2$`, short: '2nd deviatoric invariant', desc: R`Quadratic shear invariant $J_2 = \frac{1}{2}s_{ij}s_{ij}$ governing von Mises yield.` },
          { sym: R`$\sigma_{\mathrm{eq}}$`, short: 'von Mises stress', desc: R`Equivalent uniaxial stress $\sigma_{\mathrm{eq}} = \sqrt{3J_2}$ compared against $\sigma_Y$.` },
          { sym: R`$f$`, short: 'Yield function', desc: R`Admissibility scalar defining the elastic interior ($f \lt 0$) and yield boundary ($f = 0$).` },
          { sym: R`$k, \sigma_Y$`, short: 'Shear & tensile yield', desc: R`Uniaxial yield strength $\sigma_Y$; shear yield limit is $k = \sigma_Y/\sqrt{3}$ (von Mises) or $\sigma_Y/2$ (Tresca).` }
        ]
      },

      // 18. J2 associated flow rule
      {
        id: 'j2-flow',
        partId: 'part-2',
        layout: 'split',
        labId: 'radial-return',
        title: R`$J_2$ associated flow rule`,
        plainTitle: 'J2 associated flow rule',
        lectureBadges: ['Lec. 13–15 · Flow Rule, Tension & Shear'],
        contentHtml: R`
          <div class="eq-stack">
            <div class="eq-stack-group">
              <div class="eq-card-label">Normality Flow &amp; Plastic Incompressibility</div>
              <div>$$\dot{\varepsilon}_{ij}^p = \dot{\lambda}\frac{\partial f}{\partial \sigma_{ij}} = \dot{\lambda}\,s_{ij}, \quad \dot{\varepsilon}_{kk}^p = 0$$</div>
            </div>
            <div class="eq-stack-group">
              <div class="eq-card-label">KKT Consistency &amp; Elastic Predictor</div>
              <div>$$\begin{aligned} \dot{\lambda} &\ge 0,\quad f \le 0,\quad \dot{\lambda}f = 0 \\ f^{\mathrm{tr}} &= J_2(\boldsymbol{\sigma}^{\mathrm{tr}}) - k^2 \end{aligned}$$</div>
            </div>
          </div>
          <ul class="point-list">
            <li><strong>Elastic predictor:</strong> freeze plastic strain to compute trial stress $\boldsymbol{\sigma}^{\mathrm{tr}}$; accept directly when $f^{\mathrm{tr}} \le 0$.</li>
            <li><strong>Radial return corrector:</strong> when $f^{\mathrm{tr}} \gt 0$, project $\mathbf{s}^{\mathrm{tr}}$ radially onto $f = 0$ ($\dot{f} = 0$ during flow).</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\dot{\varepsilon}_{ij}^p$`, short: 'Plastic strain rate', desc: R`Rate of plastic deformation normal to the yield surface, satisfying $\dot{\varepsilon}_{kk}^p = 0$.` },
          { sym: R`$\dot{\lambda}$`, short: 'Plastic multiplier', desc: R`Non-negative consistency multiplier ($\dot{\lambda} \ge 0$, $\dot{\lambda}f = 0$); distinct from Lamé $\lambda$.` },
          { sym: R`$\boldsymbol{\sigma}^{\mathrm{tr}}, f^{\mathrm{tr}}$`, short: 'Trial stress & yield', desc: R`Elastic predictor stress $\boldsymbol{\sigma}^{\mathrm{tr}}$ and trial yield value $f^{\mathrm{tr}}$ before return mapping.` },
          { sym: R`$s_{ij}$`, short: 'Deviatoric flow vector', desc: R`Deviatoric stress giving the exact outward normal direction $\partial f/\partial \sigma_{ij}$.` }
        ]
      },

      // 19. Fracture: LEFM and energy release
      {
        id: 'fracture-lefm',
        partId: 'part-3',
        layout: 'split',
        labId: 'fracture-lefm',
        title: 'Fracture: LEFM and energy release',
        plainTitle: 'Fracture: LEFM and energy release',
        lectureBadges: ['Lec. 22–26 · Slit Crack, LEFM, Fatigue'],
        contentHtml: R`
          <div class="eq-stack">
            <div class="eq-stack-group">
              <div class="eq-card-label">Stress Intensity, Tip Field &amp; Energy Release</div>
              <div>$$\begin{aligned} K_I &= \sigma^\infty\sqrt{\pi a} \\ \sigma_{ij} &\sim \frac{K_I}{\sqrt{2\pi r}}\,f_{ij}(\theta) \\ \mathcal{G} &= -\frac{\partial \Pi}{\partial A} = \frac{K_I^2}{E'} \end{aligned}$$</div>
              <div class="eq-note">$E' = E$ (plane stress), $E/(1-\nu^2)$ (plane strain)</div>
            </div>
          </div>
          <ul class="point-list">
            <li><strong>Center slit crack:</strong> a crack of length $2a$ under remote tension $\sigma^\infty$ induces a universal $r^{-1/2}$ field modulated by $f_{ij}(\theta)$.</li>
            <li><strong>LEFM criterion:</strong> unstable crack growth triggers when Mode-I intensity reaches fracture toughness, $K_I = K_{Ic}$.</li>
            <li><strong>Beyond LEFM:</strong> $\mathcal{G}$ generalizes to the $J$-integral (EPFM) and cyclic fatigue.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$2a, A$`, short: 'Crack length & area', desc: R`Full span $2a$ of a center slit crack (half-length $a$) and total crack surface area $A$.` },
          { sym: R`$\sigma^\infty$`, short: 'Remote tension', desc: 'Uniform far-field tensile stress perpendicular to the crack plane.' },
          { sym: R`$r, f_{ij}(\theta)$`, short: 'Tip distance & angle', desc: R`Radial tip distance $r$ and dimensionless angular stress distribution $f_{ij}(\theta)$.` },
          { sym: R`$K_I, K_{Ic}$`, short: 'SIF & toughness', desc: R`Mode-I stress intensity factor ($K_I = \sigma^\infty\sqrt{\pi a}$) and critical fracture toughness $K_{Ic}$.` },
          { sym: R`$\mathcal{G}, \Pi$`, short: 'Energy release & potential', desc: R`Energy release rate $\mathcal{G} = -\partial\Pi/\partial A$ from total potential energy $\Pi = U - W_{\mathrm{ext}}$.` },
          { sym: R`$E'$`, short: 'Effective modulus', desc: R`Equals $E$ in plane stress and $E/(1-\nu^2)$ in plane strain inside Irwin's relation $\mathcal{G} = K_I^2/E'$.` },
          { sym: R`$J$`, short: 'J-integral', desc: 'Path-independent contour integral characterizing LEFM and elastic-plastic fracture (EPFM).' }
        ]
      },

      // 20. Standard workflow
      {
        id: 'workflow',
        partId: 'synthesis',
        layout: 'split',
        labId: 'workflow-stepper',
        title: 'Standard workflow',
        plainTitle: 'Standard workflow',
        lectureBadges: ['Problem-Solving Strategy'],
        contentHtml: R`
          <ol class="point-list is-numbered">
            <li><strong>Model:</strong> define geometry, boundary conditions (<span class="nowrap">$S_u, S_t$</span>), and 2D or 3D idealization.</li>
            <li><strong>Method:</strong> pick Airy $\phi$ in 2D or Green's tensor $\mathbf{G}$ and images in 3D.</li>
            <li><strong>Solve:</strong> apply separated variables, Fourier transforms, or multipole expansions.</li>
            <li><strong>Check:</strong> verify equilibrium, boundary conditions, and finite corner strain energy.</li>
            <li><strong>Extract:</strong> compute stress $\boldsymbol{\sigma}$, contact pressure, stored energy $U$, and resultants.</li>
          </ol>
          <div class="callout-card">
            <span class="callout-label">Benchmark mindset</span>Keep a closed-form analytic reference when switching to numerical solvers.
          </div>
        `,
        symbols: [
          { sym: R`$\text{BCs}$`, short: 'Boundary conditions', desc: R`Prescribed displacements on $S_u$ and tractions on $S_t$ defining a well-posed BVP.` },
          { sym: R`$\phi$`, short: 'Airy function', desc: R`2D biharmonic potential solving equilibrium identically for plane problems.` },
          { sym: R`$\mathbf{G}$`, short: "Green's tensor", desc: '3D point-force fundamental kernel for integral superposition and Mindlin image methods.' },
          { sym: R`$\boldsymbol{\sigma}$`, short: 'Stress field', desc: 'Extracted spatial stress distribution for yield, contact, and failure checks.' },
          { sym: R`$U$`, short: 'Stored energy', desc: 'Total elastic strain energy extracted for verification and fracture energy release.' }
        ]
      },

      // 21. Lecture map
      {
        id: 'lecture-map',
        partId: 'synthesis',
        layout: 'atlas',
        labId: null,
        title: 'Lecture map',
        plainTitle: 'Lecture map',
        lead: 'Navigate all three parts of ME 340 and jump straight to the matching interactive slide.',
        overviewHint: 'Interactive Syllabus Atlas',
        symbols: []
      },

      // 22. Takeaways
      {
        id: 'takeaways',
        partId: 'synthesis',
        layout: 'bento',
        labId: 'takeaways-bridge',
        title: 'Takeaways',
        plainTitle: 'Takeaways',
        lead: 'Four core themes connecting analytical mechanics, inelasticity, fracture, and numerical validation.',
        overviewHint: 'Four Core Themes',
        contentHtml: R`
          <article class="bento-card">
            <div class="bento-card-kicker">01 · Elasticity</div>
            <h3 class="bento-card-title">Complete BVP Toolkit</h3>
            <p class="bento-card-body">Kinematics, Hooke, equilibrium, and BCs close the problem; Airy $\phi$ and Green's $\mathbf{G}$ solve it.</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">02 · Plasticity</div>
            <h3 class="bento-card-title">Yield &amp; Associated Flow</h3>
            <p class="bento-card-body">Strain split $\boldsymbol{\varepsilon} = \boldsymbol{\varepsilon}^e + \boldsymbol{\varepsilon}^p$ pairs von Mises yield with the $J_2$ flow rule.</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">03 · Fracture</div>
            <h3 class="bento-card-title">Crack Growth &amp; Fatigue</h3>
            <p class="bento-card-body">$K_I$, $\mathcal{G}$, and the $J$-integral connect tip fields to brittle fracture, EPFM, and fatigue.</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">04 · Benchmarks</div>
            <h3 class="bento-card-title">Analytic Verification</h3>
            <p class="bento-card-body">MATLAB solvers paired with closed-form benchmarks validate predictions across all three parts.</p>
          </article>
        `,
        symbols: [
          { sym: R`$\phi$`, short: '2D Airy function', desc: R`Biharmonic potential unifying 2D beams, Fourier loading, half-space, contact, and polar wedges.` },
          { sym: R`$\boldsymbol{\varepsilon}^{e,p}$`, short: 'Elastic & plastic strain', desc: R`Additive strain split $\boldsymbol{\varepsilon} = \boldsymbol{\varepsilon}^e + \boldsymbol{\varepsilon}^p$ separating reversible and permanent deformation.` },
          { sym: R`$J_2$`, short: 'Deviatoric invariant', desc: R`Second deviatoric stress invariant governing von Mises yield and associated plastic flow.` },
          { sym: R`$K_I, \mathcal{G}, J$`, short: 'Fracture parameters', desc: 'Stress intensity factor, energy release rate, and path-independent contour integral.' }
        ]
      },

      // 23. References & resources
      {
        id: 'references',
        partId: 'synthesis',
        layout: 'closing',
        labId: null,
        title: 'References &amp; resources',
        plainTitle: 'References',
        lead: 'Primary course notes, foundational textbooks, and companion study materials.',
        overviewHint: 'Books & Course Links',
        symbols: []
      }
    ],

    lectureMap: [
      {
        partId: 'part-1',
        kicker: 'Part I',
        title: 'Elasticity',
        lectures: [
          { num: 1, title: 'Introduction', targetId: 'continuum' },
          { num: 2, title: 'Tensors', targetId: 'tensors' },
          { num: 3, title: "Hooke's Law", targetId: 'hooke' },
          { num: 4, title: 'Fundamental Equations', targetId: 'bvp' },
          { num: 5, title: '2D Elasticity', targetId: 'formulations-2d' },
          { num: 6, title: 'Rectangular Beam', targetId: 'routes-2d' },
          { num: 7, title: 'Fourier Series and Transform', targetId: 'routes-2d' },
          { num: 8, title: 'Fourier Solution', targetId: 'routes-2d' },
          { num: 9, title: 'Half Space', targetId: 'routes-2d' },
          { num: 10, title: 'Contact', targetId: 'routes-2d' },
          { num: 11, title: 'Polar Coordinates', targetId: 'polar-wedge' },
          { num: 12, title: 'Wedge and Notch', targetId: 'polar-wedge' }
        ]
      },
      {
        partId: 'part-2',
        kicker: 'Part II',
        title: 'Plasticity',
        lectures: [
          { num: 13, title: 'Fundamental Equations of Plasticity', targetId: 'elas-to-plas' },
          { num: 14, title: 'Graphical Representations', targetId: 'yield-criteria' },
          { num: 15, title: 'Tension and Shear', targetId: 'j2-flow' },
          { num: 16, title: 'Plastic Bending', targetId: 'elas-to-plas' },
          { num: 18, title: 'Hardening Law', targetId: 'elas-to-plas' },
          { num: 20, title: 'Crystal Plasticity', targetId: 'dislocations' }
        ]
      },
      {
        partId: 'part-3',
        kicker: 'Part III',
        title: 'Fracture',
        lectures: [
          { num: 22, title: 'Slit-like Crack', targetId: 'fracture-lefm' },
          { num: 23, title: 'Energy Release Rate', targetId: 'fracture-lefm' },
          { num: 24, title: 'Linear Elastic Fracture Mechanics', targetId: 'fracture-lefm' },
          { num: 25, title: 'Elastic Plastic Fracture Mechanics', targetId: 'fracture-lefm' },
          { num: 26, title: 'Fatigue', targetId: 'fracture-lefm' }
        ]
      }
    ],

    allSymbols: [
      // Part I · Elasticity
      { sym: R`$i, j, k$`, desc: R`Cartesian coordinate indices ranging over $1, 2, 3$ (or $x, y, z$).`, part: 'Part I · Elasticity' },
      { sym: R`$a_i, b_i$`, desc: R`Cartesian components of first-order vectors whose inner product is $a_i b_i$.`, part: 'Part I · Elasticity' },
      { sym: R`$\delta_{ij}$`, desc: R`Kronecker delta identity tensor ($1$ when $i = j$, $0$ when $i \neq j$).`, part: 'Part I · Elasticity' },
      { sym: R`$\varepsilon_{ijk}$`, desc: R`Three-index Levi-Civita permutation tensor ($+1$ even, $-1$ odd, $0$ repeated); distinct from 2-index strain $\varepsilon_{ij}$.`, part: 'Part I · Elasticity' },
      { sym: R`$T_{ij}$`, desc: R`Cartesian matrix components of a general second-order tensor $\mathbf{T}$.`, part: 'Part I · Elasticity' },
      { sym: R`$\Omega_0, \Omega$`, desc: R`Reference (undeformed) configuration $\Omega_0$ and deformed configuration $\Omega$.`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbf{X}, \mathbf{x}$`, desc: R`Material coordinate $\mathbf{X} \in \Omega_0$ and spatial coordinate $\mathbf{x} = \mathbf{X} + \mathbf{u}(\mathbf{X}) \in \Omega$.`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbf{u}, u(x)$`, desc: R`Displacement vector field (3D) or 1D axial displacement $u(x)$; distinct from strain-energy density $w$.`, part: 'Part I · Elasticity' },
      { sym: R`$\boldsymbol{\varepsilon}, \varepsilon_{ij}$`, desc: R`Symmetric infinitesimal strain tensor $\frac{1}{2}(u_{i,j} + u_{j,i})$ valid for $|\nabla\mathbf{u}| \ll 1$.`, part: 'Part I · Elasticity' },
      { sym: R`$V, \partial V$`, desc: R`Continuum interior domain $V$ and its enclosing boundary surface $\partial V$.`, part: 'Part I · Elasticity' },
      { sym: R`$S_u, S_t$`, desc: R`Prescribed-displacement boundary $S_u$ and prescribed-traction boundary $S_t$ ($\partial V = S_u \cup S_t$, $S_u \cap S_t = \emptyset$).`, part: 'Part I · Elasticity' },
      { sym: R`$\boldsymbol{\sigma}, \sigma_{ij}$`, desc: R`Symmetric second-order Cauchy stress tensor ($\sigma_{ij} = \sigma_{ji}$).`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbf{t}, t_i$`, desc: R`Surface traction vector $\mathbf{t} = \boldsymbol{\sigma}\cdot\mathbf{n}$ ($t_i = \sigma_{ij}n_j$).`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbf{n}, n_j$`, desc: R`Outward unit normal vector to a surface element or cut plane.`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbb{C}, C_{ijkl}$`, desc: R`Fourth-order positive-definite stiffness tensor in Hooke's law ($\sigma_{ij} = C_{ijkl}\varepsilon_{kl}$).`, part: 'Part I · Elasticity' },
      { sym: R`$E$`, desc: R`Isotropic Young's modulus governing uniaxial axial stiffness.`, part: 'Part I · Elasticity' },
      { sym: R`$\nu$`, desc: R`Isotropic Poisson's ratio measuring transverse contraction under axial tension.`, part: 'Part I · Elasticity' },
      { sym: R`$\lambda, \mu$`, desc: R`Isotropic Lamé constants: $\lambda = E\nu/[(1+\nu)(1-2\nu)]$ and shear modulus $\mu = E/[2(1+\nu)]$; distinct from plastic multiplier $\dot{\lambda}$ and Williams eigenvalue $\lambda$.`, part: 'Part I · Elasticity' },
      { sym: R`$w$`, desc: R`Elastic strain-energy density per unit volume, $w = \frac{1}{2}\sigma_{ij}\varepsilon_{ij}$ (1D: $\frac{1}{2}\sigma\varepsilon$).`, part: 'Part I · Elasticity' },
      { sym: R`$U$`, desc: R`Total elastic strain energy integrated over the body, $U = \int_V w\,\mathrm{d}V$.`, part: 'Part I · Elasticity' },
      { sym: R`$\sigma_{kk}, \sigma_{ii}$`, desc: R`First stress invariant (trace $\sigma_{11}+\sigma_{22}+\sigma_{33}$) controlling volumetric dilation.`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbf{f}, f(x)$`, desc: R`External 3D body force density ($\mathrm{N/m^3}$) or 1D axial line load ($\mathrm{N/m}$); distinct from scalar yield function $f(\boldsymbol{\sigma})$.`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbf{u}_0$`, desc: R`Prescribed displacement boundary field imposed on $S_u$.`, part: 'Part I · Elasticity' },
      { sym: R`$\nabla$`, desc: R`Spatial differential operator forming displacement gradients and stress divergence.`, part: 'Part I · Elasticity' },
      { sym: R`$N, EA$`, desc: R`Internal axial resultant force $N(x) = EA\varepsilon$ and axial rigidity $EA$ of a 1D rod.`, part: 'Part I · Elasticity' },
      { sym: R`$L_0, A$`, desc: R`Reference rod length $L_0$ and cross-sectional area $A$.`, part: 'Part I · Elasticity' },
      { sym: R`$\phi, \phi(r, \theta)$`, desc: R`2D Airy stress function solving the biharmonic equation $\nabla^4\phi = 0$ when $\mathbf{f} = \mathbf{0}$.`, part: 'Part I · Elasticity' },
      { sym: R`$t, L, 2h$`, desc: R`Plate thickness $t$ ($t \ll L$ for plane stress), span or period $L$, and beam height $2h$.`, part: 'Part I · Elasticity' },
      { sym: R`$q(x), p(x)$`, desc: R`Beam distributed load $q(x)$ (Lec. 6), periodic traction $p(x+L)=p(x)$ (Lec. 7–8), or contact pressure on $[-a, a]$ (Lec. 10).`, part: 'Part I · Elasticity' },
      { sym: R`$P, \mathbf{P}$`, desc: R`Applied rod tip load $P$ (1D), Flamant line load $P$ (2D), or Kelvin point force $\mathbf{P}$ (3D).`, part: 'Part I · Elasticity' },
      { sym: R`$r, \theta$`, desc: R`Polar coordinates centered on a point load, circular hole, wedge apex, or crack tip.`, part: 'Part I · Elasticity' },
      { sym: R`$a$`, desc: R`Contact half-width on $[-a, a]$ (2D contact) or half-crack length (center crack $2a$).`, part: 'Part I · Elasticity' },
      { sym: R`$2\alpha$`, desc: R`Included solid angle of a 2D elastic wedge or notch ($2\alpha \gt \pi$ yields singular corner stress).`, part: 'Part I · Elasticity' },
      { sym: R`$\ln r, r\theta\sin\theta$`, desc: R`Michell logarithmic and 2D line-load biharmonic modes in polar coordinates.`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbf{G}(\mathbf{x}, \mathbf{x}')$`, desc: R`Second-order 3D elastic Green's tensor mapping a unit point force at source $\mathbf{x}'$ to displacement at $\mathbf{x}$.`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbf{x}', \mathrm{d}V'$`, desc: R`Source integration coordinate $\mathbf{x}'$ and volume element $\mathrm{d}V'$ in 3D Green's superposition.`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbf{b}, \boldsymbol{\xi}$`, desc: R`Dislocation Burgers vector $\mathbf{b}$ and unit dislocation line tangent vector $\boldsymbol{\xi}$.`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbf{f}_{\mathrm{PK}}$`, desc: R`Peach–Köhler configurational force per unit length ($\mathrm{N/m}$), $\mathbf{f}_{\mathrm{PK}} = (\boldsymbol{\sigma}^\infty\cdot\mathbf{b})\times\boldsymbol{\xi}$.`, part: 'Part I · Elasticity' },
      { sym: R`$\boldsymbol{\sigma}^\infty, \sigma^\infty$`, desc: R`Applied uniform far-field stress driving dislocation glide or crack opening.`, part: 'Part I · Elasticity' },

      // Part II · Plasticity
      { sym: R`$\varepsilon_{ij}^e, \varepsilon_{ij}^p$`, desc: R`Additive reversible elastic strain and permanent plastic strain ($\varepsilon_{ij} = \varepsilon_{ij}^e + \varepsilon_{ij}^p$).`, part: 'Part II · Plasticity' },
      { sym: R`$\sigma_1, \sigma_2, \sigma_3$`, desc: R`Ordered principal stresses ($\sigma_1 \ge \sigma_2 \ge \sigma_3$) acting on shear-free planes ($\tau = 0$).`, part: 'Part II · Plasticity' },
      { sym: R`$s_{ij}$`, desc: R`Trace-free deviatoric stress tensor $s_{ij} = \sigma_{ij} - \frac{1}{3}\sigma_{kk}\delta_{ij}$.`, part: 'Part II · Plasticity' },
      { sym: R`$J_2$`, desc: R`Second invariant of deviatoric stress, $J_2 = \frac{1}{2}s_{ij}s_{ij}$.`, part: 'Part II · Plasticity' },
      { sym: R`$\sigma_{\mathrm{eq}}$`, desc: R`von Mises equivalent stress $\sigma_{\mathrm{eq}} = \sqrt{3J_2}$.`, part: 'Part II · Plasticity' },
      { sym: R`$f(\boldsymbol{\sigma})$`, desc: R`Scalar yield function separating elastic interior ($f \lt 0$) from yield surface ($f = 0$); distinct from body force $\mathbf{f}$.`, part: 'Part II · Plasticity' },
      { sym: R`$k, \sigma_Y$`, desc: R`Uniaxial tensile yield stress $\sigma_Y$; shear yield limit is $k = \sigma_Y/\sqrt{3}$ (von Mises) or $\sigma_Y/2$ (Tresca).`, part: 'Part II · Plasticity' },
      { sym: R`$\dot{\varepsilon}_{ij}^p$`, desc: R`Plastic strain rate tensor obeying plastic incompressibility ($\dot{\varepsilon}_{kk}^p = 0$).`, part: 'Part II · Plasticity' },
      { sym: R`$\dot{\lambda}$`, desc: R`Non-negative KKT plastic consistency multiplier ($\dot{\lambda} \ge 0$, $\dot{\lambda}f = 0$).`, part: 'Part II · Plasticity' },
      { sym: R`$\boldsymbol{\sigma}^{\mathrm{tr}}, f^{\mathrm{tr}}$`, desc: R`Elastic predictor trial stress and trial yield evaluation before radial return mapping.`, part: 'Part II · Plasticity' },

      // Part III · Fracture
      { sym: R`$2a, A$`, desc: R`Total length $2a$ of a center slit crack and total crack surface area $A$.`, part: 'Part III · Fracture' },
      { sym: R`$f_{ij}(\theta)$`, desc: R`Dimensionless crack-tip angular stress distribution multiplying $K_I/\sqrt{2\pi r}$.`, part: 'Part III · Fracture' },
      { sym: R`$K_I, K_{Ic}$`, desc: R`Mode-I stress intensity factor ($K_I = \sigma^\infty\sqrt{\pi a}$) and critical fracture toughness $K_{Ic}$.`, part: 'Part III · Fracture' },
      { sym: R`$\mathcal{G}, \Pi$`, desc: R`Energy release rate $\mathcal{G} = -\partial\Pi/\partial A$ from total potential energy $\Pi = U - W_{\mathrm{ext}}$.`, part: 'Part III · Fracture' },
      { sym: R`$E'$`, desc: R`Effective elastic modulus in Irwin's relation $\mathcal{G} = K_I^2/E'$ ($E$ plane stress; $E/(1-\nu^2)$ plane strain).`, part: 'Part III · Fracture' },
      { sym: R`$J$`, desc: R`Path-independent contour integral governing crack-tip energy release in LEFM and EPFM.`, part: 'Part III · Fracture' },
      { sym: 'LEFM, EPFM', desc: R`Linear elastic fracture mechanics (small-scale yielding) and elastic-plastic fracture mechanics.`, part: 'Part III · Fracture' },

      // Workflow & Synthesis
      { sym: R`$\text{BCs}$`, desc: R`Boundary conditions (displacements on $S_u$ and tractions on $S_t$) closing a boundary-value problem.`, part: 'Workflow & Synthesis' }
    ],

    references: [
      {
        kind: 'Course Lecture Notes',
        title: 'ME 340: Elasticity and Inelasticity',
        citation: 'W. Cai, Stanford University lecture notes.',
        url: 'https://micro.stanford.edu/~caiwei/me340/',
        linkLabel: 'Open Course Notes'
      },
      {
        kind: 'Primary Textbook · Elasticity',
        title: 'Elasticity (3rd ed.)',
        citation: 'J. R. Barber, Springer (2010).',
        url: null
      },
      {
        kind: 'Primary Textbook · Fracture',
        title: 'Fracture Mechanics (3rd ed.)',
        citation: 'T. L. Anderson, Taylor & Francis (2005).',
        url: null
      },
      {
        kind: 'Companion Materials',
        title: 'Consolidated ME 340 Elasticity & Inelasticity Notes',
        citation: 'Hanfeng Zhai, Stanford ME 340 study companion.',
        url: 'https://hanfengzhai.com/file/teaching/notes/elasticity_notes.pdf',
        linkLabel: 'Open Study Notes PDF'
      },
      {
        kind: 'Printable Deck',
        title: 'ME 340 Intro Slides (PDF)',
        citation: 'Archival printable version of this course overview.',
        url: 'https://hanfengzhai.com/file/teaching/intros/ME340_Intro.pdf',
        linkLabel: 'Download Intro PDF'
      }
    ]
  };
})();
