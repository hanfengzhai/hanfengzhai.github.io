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
      exploreUrl: 'https://explorecourses.stanford.edu/search?view=catalog&filter-coursestatus-Active=on&q=ME340',
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
        lead: 'ME 340 (Prof. Wei Cai) builds a unified path from continuum elasticity through plasticity to fracture.',
        overviewHint: 'Course Scope & Study Guide',
        contentHtml: R`
          <article class="bento-card">
            <div class="bento-card-kicker">Scope</div>
            <h3 class="bento-card-title">Stanford ME 340</h3>
            <p class="bento-card-body">Taught by Prof. Wei Cai (<a href="https://explorecourses.stanford.edu/search?view=catalog&amp;filter-coursestatus-Active=on&amp;q=ME340" target="_blank" rel="noopener">ExploreCourses ↗</a>). Covers continuum elasticity, plasticity, and fracture mechanics in one graduate framework.</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">Three Parts</div>
            <h3 class="bento-card-title">Unified Progression</h3>
            <p class="bento-card-body">Part I: 2D Airy $\phi$, 3D Green's functions $G$, and contact. Part II: yield, flow, and hardening. Part III: LEFM, $J$-integral, and fatigue.</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">Methods &amp; Texts</div>
            <h3 class="bento-card-title">Theory &amp; Matlab</h3>
            <p class="bento-card-body">Analytic derivations pair directly with Matlab solvers. Core textbooks are Barber, <em>Elasticity</em> (3rd ed., 2010) and Anderson, <em>Fracture Mechanics</em> (3rd ed., 2005).</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">Study Guide</div>
            <h3 class="bento-card-title">Notes &amp; Companion PDF</h3>
            <p class="bento-card-body">Access the consolidated <a href="https://hanfengzhai.com/file/teaching/notes/elasticity_notes.pdf" target="_blank" rel="noopener">study notes PDF ↗</a> alongside Prof. Wei Cai's <a href="https://micro.stanford.edu/~caiwei/me340/" target="_blank" rel="noopener">lecture notes ↗</a>.</p>
          </article>
        `,
        symbols: [
          { sym: R`$\phi$`, short: 'Airy stress function', desc: R`Airy stress function in 2D elasticity satisfying $\nabla^4\phi = 0$.` },
          { sym: R`$G$`, short: "3D Green's function", desc: R`3D elastic Green's function mapping a unit point force to displacement.` },
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
        lead: 'Every mechanics problem follows a progression from elastic equilibrium to inelastic yielding and crack growth.',
        overviewHint: 'Elasticity → Plasticity → Fracture',
        contentHtml: R`
          <div class="callout-card">
            <p><strong>Core idea:</strong> well-posed BVP $\to$ elastic solution $\to$ plasticity if $f \gt 0$ $\to$ fracture if cracks grow. <strong>Applications:</strong> contact, pressure vessels, notched parts, and fatigue.</p>
          </div>
          <div class="mini-stat-grid">
            <div class="mini-stat part-part-1">
              <strong class="mini-stat-val">I. Elasticity</strong>
              <span class="mini-stat-label">Stress $\boldsymbol{\sigma}$, strain, equilibrium, 2D Airy $\phi$, and 3D Green's functions.</span>
            </div>
            <div class="mini-stat part-part-2">
              <strong class="mini-stat-val">II. Plasticity</strong>
              <span class="mini-stat-label">Yield surface $f$, plastic strain $\varepsilon^p$, associated flow, and hardening.</span>
            </div>
            <div class="mini-stat part-part-3">
              <strong class="mini-stat-val">III. Fracture</strong>
              <span class="mini-stat-label">Crack-tip fields $K_I$, energy release rate $\mathcal{G}$, $J$-integral, and fatigue.</span>
            </div>
          </div>
        `,
        symbols: [
          { sym: R`$\boldsymbol{\sigma}$`, short: 'Cauchy stress', desc: 'Symmetric second-order Cauchy stress tensor representing internal force density.' },
          { sym: R`$\mathbf{u}$`, short: 'Displacement field', desc: 'Vector field tracking material point motion from reference to deformed state.' },
          { sym: R`$\varepsilon^p$`, short: 'Plastic strain', desc: 'Permanent irreversible strain retained after unloading past yield.' },
          { sym: R`$f$`, short: 'Yield function', desc: R`Scalar yield criterion separating elastic states ($f \le 0$) from plastic yielding ($f \gt 0$).` },
          { sym: R`$K_I$`, short: 'Mode-I SIF', desc: 'Mode-I stress intensity factor governing opening-mode crack-tip stress amplitude.' },
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
            summary: R`Index convention, $\delta_{ij}$, $\varepsilon_{ijk}$, comma derivatives, and bold-indicial equivalence.`,
            targetId: 'tensors'
          },
          {
            partId: 'part-1',
            partTag: 'Part I',
            title: 'Foundations',
            summary: R`Reference-to-deformed map, stress, strain, Hooke's law, strain energy, and the 3D BVP.`,
            targetId: 'continuum'
          },
          {
            partId: 'part-1',
            partTag: 'Part I',
            title: 'One-dimensional and rod problems',
            summary: R`Axial strain $\varepsilon = \mathrm{d}u/\mathrm{d}x$, rigidity $EA$, and 1D equilibrium as a BVP model.`,
            targetId: 'rod'
          },
          {
            partId: 'part-1',
            partTag: 'Part I',
            title: 'Two-dimensional elasticity',
            summary: R`Plane stress, plane strain, Airy $\phi$, beams, Fourier, half-space, contact, and polar wedges.`,
            targetId: 'formulations-2d'
          },
          {
            partId: 'part-1',
            partTag: 'Part I',
            title: 'Three-dimensional elasticity',
            summary: R`Kelvin point-force Green's function $G$, mirror images, and dislocation defect fields.`,
            targetId: 'greens-3d'
          },
          {
            partId: 'part-2',
            partTag: 'Part II',
            title: 'Plasticity',
            summary: R`Elastic-plastic strain split, von Mises and Tresca yield surfaces, and $J_2$ radial return flow.`,
            targetId: 'elas-to-plas'
          },
          {
            partId: 'part-3',
            partTag: 'Part III',
            title: 'Fracture mechanics',
            summary: R`Slit-crack $r^{-1/2}$ singularity, $K_I$, energy release rate $\mathcal{G}$, $J$-integral, and fatigue.`,
            targetId: 'fracture-lefm'
          },
          {
            partId: 'synthesis',
            partTag: 'Synthesis',
            title: 'Problem-solving workflow',
            summary: 'Five-step modeling workflow, interactive 23-lecture map, key takeaways, and references.',
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
            <div>$$a_i b_i = a_1 b_1 + a_2 b_2 + a_3 b_3, \qquad \sigma_{ii} = \sigma_{xx} + \sigma_{yy} + \sigma_{zz}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Tensor ranks:</strong> scalars ($E, \nu, \rho$) carry 0 indices, vectors ($\mathbf{a}, a_i$) carry 1 index, and second-order tensors ($\mathbf{T}, T_{ij}$) carry 2 indices.</li>
            <li><strong>Summation rule:</strong> any index repeated twice in a term is summed over $1, 2, 3$; unmatched free indices run over each component.</li>
            <li><strong>Comma derivatives:</strong> $u_{i,j} = \partial u_i / \partial x_j$ denotes a gradient and $\sigma_{ij,j} = \partial \sigma_{ij} / \partial x_j$ denotes divergence.</li>
            <li><strong>Isotropic tensors:</strong> Kronecker delta $\delta_{ij}$ acts as the identity and Levi-Civita $\varepsilon_{ijk}$ encodes cross products and curl.</li>
            <li><strong>Bold and indicial equivalence:</strong> direct notation and index notation express identical equations ($\boldsymbol{\sigma}, \mathbf{u} \leftrightarrow \sigma_{ij}, u_i$).</li>
          </ul>
        `,
        symbols: [
          { sym: R`$i, j, k$`, short: 'Coordinate indices', desc: R`Cartesian coordinate indices ranging over $1, 2, 3$ (or $x, y, z$).` },
          { sym: R`$\delta_{ij}$`, short: 'Kronecker delta', desc: R`Identity component equal to $1$ when $i = j$ and $0$ when $i \neq j$.` },
          { sym: R`$\varepsilon_{ijk}$`, short: 'Levi-Civita symbol', desc: R`Alternating permutation tensor ($+1$ even, $-1$ odd, $0$ repeated) for cross products.` },
          { sym: R`$T_{ij}$`, short: '2nd-order tensor', desc: R`Cartesian matrix components of a second-order tensor $\mathbf{T}$.` },
          { sym: R`$C_{ijkl}$`, short: 'Elastic stiffness', desc: R`Fourth-order stiffness tensor mapping strain $\varepsilon_{kl}$ to stress $\sigma_{ij}$.` }
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
            <div>$$\mathbf{x} = \mathbf{X} + \mathbf{u}(\mathbf{X}), \qquad \varepsilon_{ij} = \frac{1}{2}\left(u_{i,j} + u_{j,i}\right)$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Configuration change:</strong> applied loads deform the reference body $\Omega_0$ into the deformed configuration $\Omega$.</li>
            <li><strong>Material mapping:</strong> each particle moves from reference position $\mathbf{X}$ to current position $\mathbf{x} = \mathbf{X} + \mathbf{u}(\mathbf{X})$.</li>
            <li><strong>Infinitesimal strain:</strong> the symmetric part of the displacement gradient measures local elongation and shear distortion.</li>
            <li><strong>Domain partition:</strong> the continuum occupies volume $V$ with enclosing boundary $\partial V = S_u \cup S_t$.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\Omega_0, \Omega$`, short: 'Ref. & deformed body', desc: R`Reference (undeformed) configuration $\Omega_0$ and loaded deformed configuration $\Omega$.` },
          { sym: R`$\mathbf{X}, \mathbf{x}$`, short: 'Material & spatial coords', desc: R`Reference material coordinate $\mathbf{X} \in \Omega_0$ and deformed coordinate $\mathbf{x} \in \Omega$.` },
          { sym: R`$\mathbf{u}$`, short: 'Displacement vector', desc: R`Displacement field $\mathbf{u}(\mathbf{X}) = \mathbf{x} - \mathbf{X}$ linking both configurations.` },
          { sym: R`$\varepsilon_{ij}$`, short: 'Small strain tensor', desc: R`Symmetric infinitesimal strain tensor $\frac{1}{2}(u_{i,j} + u_{j,i})$.` },
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
          <div class="eq-card">
            <div class="eq-card-label">Stress Symmetry &amp; Strain Kinematics</div>
            <div>$$\sigma_{ij} = \sigma_{ji}, \qquad \varepsilon_{ij} = \frac{1}{2}\left(\frac{\partial u_i}{\partial x_j} + \frac{\partial u_j}{\partial x_i}\right)$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Cauchy stress $\boldsymbol{\sigma}$:</strong> internal force per unit area inside the body; moment balance enforces symmetry ($\sigma_{ij} = \sigma_{ji}$).</li>
            <li><strong>Cauchy traction law:</strong> on any cut plane with unit normal $\mathbf{n}$, the surface traction vector is $\mathbf{t} = \boldsymbol{\sigma}\cdot\mathbf{n}$ ($t_i = \sigma_{ij} n_j$).</li>
            <li><strong>Static equilibrium:</strong> in the absence of body forces, linear momentum balance requires zero divergence, $\partial\sigma_{ij}/\partial x_j = 0$.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\sigma_{ij}$`, short: 'Cauchy stress', desc: R`Symmetric Cauchy stress component acting on plane $j$ in coordinate direction $i$.` },
          { sym: R`$\varepsilon_{ij}$`, short: 'Strain tensor', desc: R`Infinitesimal strain encoding normal stretch (diagonal) and angular shear (off-diagonal).` },
          { sym: R`$u_i$`, short: 'Displacement components', desc: R`Cartesian components of the displacement vector $\mathbf{u}$.` },
          { sym: R`$\mathbf{t}, t_i$`, short: 'Traction vector', desc: R`Force per unit area on a plane with normal $\mathbf{n}$, given by $t_i = \sigma_{ij} n_j$.` },
          { sym: R`$n_j$`, short: 'Unit normal', desc: R`Components of the outward unit normal vector $\mathbf{n}$ on a cut surface.` }
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
          <div class="eq-card">
            <div class="eq-card-label">Linear Elasticity &amp; Strain-Energy Density</div>
            <div>$$\sigma_{ij} = C_{ijkl}\varepsilon_{kl}, \qquad \sigma = E\varepsilon \text{ (1D)}, \qquad u = \frac{1}{2}\sigma\varepsilon$$</div>
          </div>
          <div class="eq-card is-accent">
            <div class="eq-card-label">Isotropic Compliance Form</div>
            <div>$$\varepsilon_{ij} = \frac{1+\nu}{E}\sigma_{ij} - \frac{\nu}{E}\sigma_{kk}\delta_{ij}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Constitutive symmetry:</strong> isotropic linear elasticity reduces the 81 components of $C_{ijkl}$ to two measurable constants, $E$ and $\nu$.</li>
            <li><strong>Elastic stored energy:</strong> the shaded area under the 1D $\sigma$–$\varepsilon$ curve equals the strain-energy density $u = \frac{1}{2}\sigma^*\varepsilon^*$ at state $(\varepsilon^*, \sigma^*)$.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$C_{ijkl}$`, short: 'Stiffness tensor', desc: R`Fourth-order elastic stiffness tensor in $\sigma_{ij} = C_{ijkl}\varepsilon_{kl}$.` },
          { sym: R`$E$`, short: "Young's modulus", desc: 'Isotropic axial modulus setting the slope of the uniaxial stress-strain curve.' },
          { sym: R`$\nu$`, short: "Poisson's ratio", desc: 'Negative ratio of lateral contraction to axial extension under uniaxial tension.' },
          { sym: R`$u$`, short: 'Strain-energy density', desc: R`Elastic energy per unit volume, $u = \frac{1}{2}\sigma_{ij}\varepsilon_{ij}$ (1D: $u = \frac{1}{2}\sigma\varepsilon$).` },
          { sym: R`$\sigma_{kk}$`, short: 'Stress trace', desc: R`Sum of normal stresses $\sigma_{11}+\sigma_{22}+\sigma_{33}$ governing volumetric dilation.` },
          { sym: R`$\delta_{ij}$`, short: 'Kronecker delta', desc: R`Identity tensor coupling the trace $\sigma_{kk}$ strictly to normal strain components.` }
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
          <div class="eq-card">
            <div class="eq-card-label">Field Equations in $V$</div>
            <div>$$\begin{aligned} \boldsymbol{\varepsilon} &= \frac{1}{2}\left(\nabla\mathbf{u} + \nabla\mathbf{u}^\top\right), \qquad \boldsymbol{\sigma} = \mathbb{C} : \boldsymbol{\varepsilon} \\ \nabla \cdot \boldsymbol{\sigma} + \mathbf{f} &= \mathbf{0} \end{aligned}$$</div>
          </div>
          <div class="eq-card is-accent">
            <div class="eq-card-label">Boundary Conditions on $\partial V = S_u \cup S_t$</div>
            <div>$$\mathbf{u} = \mathbf{u}_0 \text{ on } S_u, \qquad \boldsymbol{\sigma} \cdot \mathbf{n} = \mathbf{t} \text{ on } S_t$$</div>
          </div>
          <div class="callout-card">
            <strong>Well-posed BVP:</strong> kinematics, constitutive law, and equilibrium in $V$, coupled with displacement and traction conditions on $\partial V$, define a unique elastic solution.
          </div>
        `,
        symbols: [
          { sym: R`$\mathbb{C}$`, short: 'Stiffness operator', desc: R`Fourth-order elasticity tensor written in direct operator form ($\boldsymbol{\sigma} = \mathbb{C}:\boldsymbol{\varepsilon}$).` },
          { sym: R`$\mathbf{f}$`, short: 'Body force density', desc: R`External force per unit volume distributed throughout interior domain $V$.` },
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
        lectureBadges: ['Lec. 4–5 · Fund. Eqs., 2D Elasticity'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">1D Kinematics, Constitutive Law &amp; Equilibrium</div>
            <div>$$\varepsilon = \frac{\mathrm{d}u}{\mathrm{d}x}, \qquad N = EA\varepsilon, \qquad \frac{\mathrm{d}N}{\mathrm{d}x} + f = 0$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Reference and deformed length:</strong> a rod of initial length $L_0$ and area $A$ stretches to deformed length $L = L_0 + u(L_0)$.</li>
            <li><strong>Boundary conditions:</strong> fixed at $x = 0$ ($u(0) = 0$) and pulled by end force $N$ at $x = L_0$, with optional axial body load $f(x)$.</li>
            <li><strong>BVP template:</strong> axial rigidity $EA$ links strain to force, preserving the exact 3D BVP structure in one dimension.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\varepsilon$`, short: 'Axial strain', desc: R`1D normal axial strain $\varepsilon(x) = \mathrm{d}u/\mathrm{d}x$.` },
          { sym: R`$u(x)$`, short: 'Axial displacement', desc: R`Longitudinal displacement of cross-section $x$ along the rod.` },
          { sym: R`$N$`, short: 'Axial force', desc: R`Internal axial resultant force $N(x) = \sigma A = EA\varepsilon$.` },
          { sym: R`$EA$`, short: 'Axial rigidity', desc: R`Product of Young's modulus $E$ and cross-sectional area $A$.` },
          { sym: R`$f$`, short: 'Distributed force', desc: 'Axial body force per unit length along the rod axis.' },
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
        contentHtml: R`
          <div class="airy-banner-card">
            <span class="eq-card-label">Airy Stress Function $\phi(x, y)$</span>
            <span>$\nabla^4\phi = 0, \quad \sigma_{xx} = \phi_{,yy}, \quad \sigma_{yy} = \phi_{,xx}, \quad \sigma_{xy} = -\phi_{,xy}$</span>
          </div>
          <div class="compare-cols">
            <article class="compare-card is-stress">
              <div class="eq-card-label">Thin Plate ($t \ll L$)</div>
              <h3>Plane Stress</h3>
              <p>$\sigma_{33} = \sigma_{13} = \sigma_{23} = 0$</p>
              <div>$$\begin{aligned} \varepsilon_{xx} &= \frac{1}{E}\left(\sigma_{xx} - \nu\sigma_{yy}\right) \\ \varepsilon_{yy} &= \frac{1}{E}\left(\sigma_{yy} - \nu\sigma_{xx}\right), \qquad \varepsilon_{xy} = \frac{1+\nu}{E}\sigma_{xy} \end{aligned}$$</div>
            </article>
            <article class="compare-card is-strain">
              <div class="eq-card-label">Long Cylinder (in $x_3$)</div>
              <h3>Plane Strain</h3>
              <p>$\varepsilon_{33} = \varepsilon_{13} = \varepsilon_{23} = 0$</p>
              <div>$$\begin{aligned} \sigma_{xx} &= \lambda(\varepsilon_{xx} + \varepsilon_{yy}) + 2\mu\varepsilon_{xx} \\ \sigma_{yy} &= \lambda(\varepsilon_{xx} + \varepsilon_{yy}) + 2\mu\varepsilon_{yy}, \qquad \sigma_{xy} = 2\mu\varepsilon_{xy} \end{aligned}$$</div>
              <p>$\lambda = \dfrac{E\nu}{(1+\nu)(1-2\nu)}, \qquad \mu = \dfrac{E}{2(1+\nu)}$</p>
            </article>
          </div>
        `,
        symbols: [
          { sym: R`$\phi$`, short: 'Airy stress function', desc: R`Scalar 2D biharmonic potential ($\nabla^4\phi = 0$) satisfying equilibrium automatically.` },
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
        lead: R`Four recurring routes for solving $\nabla^4\phi = 0$ across distinct geometries and boundary conditions.`,
        lectureBadges: ['Lec. 7–10 · Beam, Fourier, Half Space, Contact'],
        contentHtml: '',
        symbols: [
          { sym: R`$q(x)$`, short: 'Beam load', desc: 'Distributed transverse load applied on a rectangular beam (Lec. 7).' },
          { sym: R`$L, 2h$`, short: 'Span & beam depth', desc: R`Characteristic beam span or Fourier period $L$ and full rectangular beam height $2h$.` },
          { sym: R`$p(x)$`, short: 'Surface pressure', desc: R`Periodic loading $p(x+L)=p(x)$ (Lec. 8) or contact pressure on $[-a, a]$ (Lec. 10).` },
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
            <div>$$\nabla^4\phi = 0 \;\Rightarrow\; \phi(r, \theta) \text{ with } r,\; \theta,\; \ln r,\; \theta\ln r \text{ modes}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Annulus and circular hole (Lec. 11–12):</strong> polar biharmonic modes capture axisymmetric cylinders and the Kirsch stress concentration around a hole.</li>
            <li><strong>Wedge and notch corners (Lec. 13):</strong> a wedge of opening angle $2\alpha$ admits corner power modes that reveal stress amplification at sharp re-entrant angles.</li>
            <li><strong>Admissible mode selection:</strong> symmetry, traction boundary conditions, and finite strain energy isolate the physical terms in $\phi(r, \theta)$.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$r, \theta$`, short: 'Polar coordinates', desc: R`Radial distance $r$ and polar angle $\theta$ centered on a hole, annulus, or wedge tip.` },
          { sym: R`$\phi(r, \theta)$`, short: 'Polar Airy potential', desc: R`Biharmonic Airy stress function written in polar coordinates.` },
          { sym: R`$2\alpha$`, short: 'Wedge angle', desc: 'Total included opening angle of an elastic wedge or notch corner.' },
          { sym: R`$\ln r, \theta\ln r$`, short: 'Logarithmic modes', desc: 'Logarithmic Michell modes producing single-valued axisymmetric and point-force fields.' }
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
        lectureBadges: ['Lec. 16–17 · Half Space, Kelvin Solution'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">3D Equilibrium &amp; Green's Superposition</div>
            <div>$$\nabla \cdot \boldsymbol{\sigma} + \mathbf{f} = \mathbf{0}, \qquad \mathbf{u}(\mathbf{x}) = \int G(\mathbf{x}, \boldsymbol{\xi})\,\mathbf{f}(\boldsymbol{\xi})\,\mathrm{d}V_\xi$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Kelvin solution (Lec. 17):</strong> closed-form displacement and stress field produced by a concentrated point force $\mathbf{P}$ in an infinite 3D elastic space.</li>
            <li><strong>Image method (Lec. 16):</strong> placing mirror forces across a planar boundary cancels surface tractions to solve 3D half-space problems.</li>
            <li><strong>Superposition kernel:</strong> convolving $G(\mathbf{x}, \boldsymbol{\xi})$ with any body-force density $\mathbf{f}(\boldsymbol{\xi})$ constructs general 3D elastic solutions.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$G(\mathbf{x}, \boldsymbol{\xi})$`, short: "3D Green's tensor", desc: R`Elastic displacement at observation point $\mathbf{x}$ due to a unit point force at $\boldsymbol{\xi}$.` },
          { sym: R`$\mathbf{x}, \boldsymbol{\xi}$`, short: 'Field & source points', desc: R`Evaluation point $\mathbf{x}$ and integration source coordinate $\boldsymbol{\xi}$.` },
          { sym: R`$\mathrm{d}V_\xi$`, short: 'Source volume element', desc: R`Infinitesimal integration volume centered at source point $\boldsymbol{\xi}$.` },
          { sym: R`$\mathbf{P}$`, short: 'Point force', desc: 'Concentrated 3D force driving the fundamental Kelvin solution.' },
          { sym: R`$\mathbf{f}$`, short: 'Body force density', desc: R`Distributed volumetric force field integrated against $G(\mathbf{x}, \boldsymbol{\xi})$.` }
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
        lectureBadges: ['Extended Notes · Dislocations'],
        contentHtml: R`
          <ul class="point-list">
            <li><strong>Volterra cut and Burgers vector $\mathbf{b}$:</strong> shifting crystal faces across a slip plane by $\mathbf{b}$ generates a line defect with a long-range elastic stress field.</li>
            <li><strong>Peach–Köhler force:</strong> a remote uniform stress $\boldsymbol{\sigma}^\infty$ exerts a configurational force on the dislocation line that drives slip-plane glide.</li>
            <li><strong>Core, image, and plastic strain:</strong> singular core fields combine with free-surface image corrections; collective motion of many dislocations creates macroscopic plastic strain $\varepsilon^p$.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\mathbf{b}$`, short: 'Burgers vector', desc: 'Displacement jump across the Volterra slip cut setting dislocation magnitude and direction.' },
          { sym: R`$\boldsymbol{\sigma}^\infty$`, short: 'Remote stress', desc: 'Uniform far-field stress tensor generating the Peach–Köhler glide force.' },
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
            <div>$$\varepsilon_{ij} = \varepsilon_{ij}^e + \varepsilon_{ij}^p, \qquad \sigma_{ij} = C_{ijkl}\varepsilon_{kl}^e$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Elastic vs. plastic unloading:</strong> unloading below $\sigma_Y$ returns strain to zero; unloading after yielding recovers only $\varepsilon^e$ and leaves permanent strain $\varepsilon^p$.</li>
            <li><strong>Elastic response:</strong> stress depends linearly through Hooke's law solely on the reversible elastic strain $\varepsilon_{ij}^e$.</li>
            <li><strong>Inelastic evolution:</strong> once stress reaches yield, a yield criterion and plastic flow rule govern the growth of $\varepsilon_{ij}^p$.</li>
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
          <div class="eq-card">
            <div class="eq-card-label">Deviatoric Stress &amp; Equivalent Stress</div>
            <div>$$\begin{aligned} &s_{ij} = \sigma_{ij} - \frac{1}{3}\sigma_{kk}\delta_{ij} \\ &J_2 = \frac{1}{2}s_{ij}s_{ij}, \qquad \sigma_{\mathrm{eq}} = \sqrt{3J_2} \end{aligned}$$</div>
          </div>
          <div class="eq-card is-accent">
            <div class="eq-card-label">von Mises &amp; Tresca Yield Surfaces</div>
            <div>$$\begin{aligned} &f = J_2 - k^2 \le 0 \qquad \left(k = \frac{\sigma_Y}{\sqrt{3}}\right) \\ &\max_{i,j}\left|\sigma_i - \sigma_j\right| = 2k \end{aligned}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Principal stresses:</strong> eigenvalues $\sigma_1 \ge \sigma_2 \ge \sigma_3$ of $\sigma_{ij}$ act on orthogonal shear-free planes ($\tau = 0$).</li>
            <li><strong>$\pi$-plane geometry:</strong> hydrostatic pressure $\sigma_{kk}/3$ causes no metal yielding, projecting von Mises to a circle and Tresca to an inscribed hexagon.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\sigma_1, \sigma_2, \sigma_3$`, short: 'Principal stresses', desc: R`Ordered eigenvalues ($\sigma_1 \ge \sigma_2 \ge \sigma_3$) of $\sigma_{ij}$ on shear-free planes ($\tau = 0$).` },
          { sym: R`$\sigma_{kk}$`, short: 'Hydrostatic trace', desc: R`Trace $\sigma_1 + \sigma_2 + \sigma_3$ removed to isolate distortion-driving shear stress.` },
          { sym: R`$s_{ij}$`, short: 'Deviatoric stress', desc: R`Trace-free deviatoric stress tensor $s_{ij} = \sigma_{ij} - \frac{1}{3}\sigma_{kk}\delta_{ij}$.` },
          { sym: R`$J_2$`, short: '2nd deviatoric invariant', desc: R`Quadratic shear invariant $J_2 = \frac{1}{2}s_{ij}s_{ij}$ governing von Mises yield.` },
          { sym: R`$\sigma_{\mathrm{eq}}$`, short: 'von Mises stress', desc: R`Equivalent uniaxial stress $\sigma_{\mathrm{eq}} = \sqrt{3J_2}$ compared against $\sigma_Y$.` },
          { sym: R`$f$`, short: 'Yield function', desc: R`Admissibility scalar defining the elastic interior ($f \lt 0$) and yield boundary ($f = 0$).` },
          { sym: R`$k, \sigma_Y$`, short: 'Shear & tensile yield', desc: R`Shear yield limit $k = \sigma_Y/\sqrt{3}$ (von Mises) and uniaxial yield strength $\sigma_Y$.` }
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
          <div class="eq-card">
            <div class="eq-card-label">Normality Flow &amp; Plastic Incompressibility</div>
            <div>$$\dot{\varepsilon}_{ij}^p = \dot{\lambda}\frac{\partial f}{\partial \sigma_{ij}} = \dot{\lambda}s_{ij}, \qquad \dot{\varepsilon}_{kk}^p = 0$$</div>
          </div>
          <div class="callout-card">
            <strong>Elastic predictor &amp; radial return:</strong> compute the trial elastic stress $\boldsymbol{\sigma}^{\mathrm{tr}}$. If $f^{\mathrm{tr}} \le 0$, accept the elastic step. If $f^{\mathrm{tr}} \gt 0$, return radially along $s_{ij}$ back onto the yield surface $f = 0$.
          </div>
        `,
        symbols: [
          { sym: R`$\dot{\varepsilon}_{ij}^p$`, short: 'Plastic strain rate', desc: R`Rate of plastic deformation normal to the yield surface, satisfying $\dot{\varepsilon}_{kk}^p = 0$.` },
          { sym: R`$\dot{\lambda}$`, short: 'Plastic multiplier', desc: R`Non-negative scalar multiplier ($\dot{\lambda} \ge 0$) determined by the consistency condition.` },
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
          <div class="eq-card">
            <div class="eq-card-label">Stress Intensity, Energy Release &amp; Tip Asymptotics</div>
            <div>$$\begin{aligned} &K_I = \sigma^\infty\sqrt{\pi a}, \qquad \mathcal{G} = \frac{\partial U}{\partial a} \\ &\sigma_{ij} \sim \frac{K_I}{\sqrt{2\pi r}}\,f_{ij}(\theta) \end{aligned}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Center slit crack:</strong> a crack of total length $2a$ under remote tension $\sigma^\infty$ generates a universal $r^{-1/2}$ stress singularity at each tip.</li>
            <li><strong>Fracture onset:</strong> unstable crack propagation triggers when the Mode-I stress intensity reaches fracture toughness, $K_I = K_{Ic}$.</li>
            <li><strong>Energy and cyclic growth:</strong> energy release rate $\mathcal{G}$ connects local tip intensity to global potential energy $U$, generalizing to the path-independent $J$-integral and fatigue crack growth (Part III).</li>
          </ul>
        `,
        symbols: [
          { sym: R`$2a$`, short: 'Total crack length', desc: R`Full span of a center slit crack with half-crack length $a$.` },
          { sym: R`$\sigma^\infty$`, short: 'Remote tension', desc: 'Uniform far-field tensile stress perpendicular to the crack plane.' },
          { sym: R`$r$`, short: 'Tip distance', desc: R`Radial coordinate from the crack tip controlling the $r^{-1/2}$ stress singularity.` },
          { sym: R`$K_I$`, short: 'Mode-I SIF', desc: R`Mode-I stress intensity factor ($K_I = \sigma^\infty\sqrt{\pi a}$ for an infinite plate).` },
          { sym: R`$K_{Ic}$`, short: 'Fracture toughness', desc: 'Critical Mode-I stress intensity threshold for brittle fracture initiation.' },
          { sym: R`$\mathcal{G}$`, short: 'Energy release rate', desc: R`Potential energy released per unit new crack advance, $\mathcal{G} = \partial U / \partial a$.` },
          { sym: R`$J$`, short: 'J-integral', desc: 'Path-independent contour integral characterizing elastic and elastic-plastic crack tips.' },
          { sym: R`$U$`, short: 'Potential energy', desc: R`Elastic strain and potential energy whose variation with crack size $a$ gives $\mathcal{G}$.` }
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
          <ul class="point-list">
            <li><strong>1. Model:</strong> define geometry, boundary conditions ($\text{BCs}$), and choose a 2D or 3D idealization.</li>
            <li><strong>2. Method:</strong> pick an Airy stress function $\phi$ in 2D or a Green's function $G$ and images in 3D.</li>
            <li><strong>3. Solve:</strong> apply separated variables, Fourier series and transforms, or multipole expansions.</li>
            <li><strong>4. Check:</strong> confirm equilibrium, every boundary condition, and finite strain energy at corners.</li>
            <li><strong>5. Extract:</strong> compute stress $\sigma$, contact pressure, stored energy $U$, and resultant forces.</li>
          </ul>
          <div class="callout-card">
            <strong>Benchmark mindset:</strong> Keep an analytic case as a reference when switching to numerics.
          </div>
        `,
        symbols: [
          { sym: R`$\text{BCs}$`, short: 'Boundary conditions', desc: R`Prescribed displacements on $S_u$ and tractions on $S_t$ defining a well-posed BVP.` },
          { sym: R`$\phi$`, short: 'Airy function', desc: R`2D biharmonic potential solving equilibrium identically for plane problems.` },
          { sym: R`$G$`, short: "Green's function", desc: '3D point-force fundamental kernel for integral superposition and image methods.' },
          { sym: R`$\sigma$`, short: 'Stress field', desc: 'Extracted spatial stress distribution for yield, contact, and failure checks.' },
          { sym: R`$U$`, short: 'Stored energy', desc: 'Total elastic energy extracted for verification and fracture energy release.' }
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
        lead: 'Four unifying pillars connecting analytical mechanics, inelasticity, fracture, and numerical validation.',
        overviewHint: 'Four Unifying Pillars',
        contentHtml: R`
          <article class="bento-card">
            <div class="bento-card-kicker">01 · Elasticity</div>
            <h3 class="bento-card-title">Complete BVP Toolkit</h3>
            <p class="bento-card-body">Kinematics, Hooke's law, equilibrium, and BCs close the problem; 2D Airy $\phi$ and 3D Green's functions provide exact solutions.</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">02 · Plasticity</div>
            <h3 class="bento-card-title">Yield &amp; Associated Flow</h3>
            <p class="bento-card-body">Additive strain decomposition $\boldsymbol{\varepsilon} = \boldsymbol{\varepsilon}^e + \boldsymbol{\varepsilon}^p$ pairs von Mises yield with the associated $J_2$ flow rule.</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">03 · Fracture</div>
            <h3 class="bento-card-title">Crack Growth &amp; Fatigue</h3>
            <p class="bento-card-body">$K_I$, $\mathcal{G}$, and the $J$-integral link near-tip elastic fields directly to brittle fracture, EPFM, and cyclic fatigue.</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">04 · Benchmarks</div>
            <h3 class="bento-card-title">Analytic Verification</h3>
            <p class="bento-card-body">Matlab implementations paired with closed-form analytic benchmarks validate solutions across all three parts.</p>
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
      { sym: R`$\delta_{ij}$`, desc: R`Kronecker delta identity tensor ($1$ when $i = j$, $0$ when $i \neq j$).`, part: 'Part I · Elasticity' },
      { sym: R`$\varepsilon_{ijk}$`, desc: R`Levi-Civita alternating permutation tensor ($+1$ even, $-1$ odd, $0$ repeated).`, part: 'Part I · Elasticity' },
      { sym: R`$T_{ij}$`, desc: R`Cartesian matrix components of a general second-order tensor $\mathbf{T}$.`, part: 'Part I · Elasticity' },
      { sym: R`$\Omega_0, \Omega$`, desc: R`Reference (undeformed) configuration $\Omega_0$ and deformed configuration $\Omega$.`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbf{X}, \mathbf{x}$`, desc: R`Material coordinate $\mathbf{X} \in \Omega_0$ and spatial coordinate $\mathbf{x} = \mathbf{X} + \mathbf{u}(\mathbf{X}) \in \Omega$.`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbf{u}, u_i$`, desc: R`Displacement vector field tracking material point motion.`, part: 'Part I · Elasticity' },
      { sym: R`$\boldsymbol{\varepsilon}, \varepsilon_{ij}$`, desc: R`Symmetric infinitesimal strain tensor $\frac{1}{2}(u_{i,j} + u_{j,i})$.`, part: 'Part I · Elasticity' },
      { sym: R`$V, \partial V$`, desc: R`Continuum interior domain $V$ and its enclosing boundary surface $\partial V$.`, part: 'Part I · Elasticity' },
      { sym: R`$S_u, S_t$`, desc: R`Prescribed-displacement boundary $S_u$ and prescribed-traction boundary $S_t$ ($\partial V = S_u \cup S_t$).`, part: 'Part I · Elasticity' },
      { sym: R`$\boldsymbol{\sigma}, \sigma_{ij}$`, desc: R`Symmetric second-order Cauchy stress tensor ($\sigma_{ij} = \sigma_{ji}$).`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbf{t}, t_i$`, desc: R`Surface traction vector $\mathbf{t} = \boldsymbol{\sigma}\cdot\mathbf{n}$ ($t_i = \sigma_{ij}n_j$).`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbf{n}, n_j$`, desc: R`Outward unit normal vector to a surface element or cut plane.`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbb{C}, C_{ijkl}$`, desc: R`Fourth-order elastic stiffness tensor in Hooke's law ($\sigma_{ij} = C_{ijkl}\varepsilon_{kl}$).`, part: 'Part I · Elasticity' },
      { sym: R`$E$`, desc: R`Isotropic Young's modulus governing uniaxial axial stiffness.`, part: 'Part I · Elasticity' },
      { sym: R`$\nu$`, desc: R`Isotropic Poisson's ratio measuring transverse contraction under axial tension.`, part: 'Part I · Elasticity' },
      { sym: R`$\lambda, \mu$`, desc: R`Isotropic Lamé constants: $\lambda = E\nu/[(1+\nu)(1-2\nu)]$ and shear modulus $\mu = E/[2(1+\nu)]$.`, part: 'Part I · Elasticity' },
      { sym: R`$u$`, desc: R`Elastic strain-energy density $u = \frac{1}{2}\sigma_{ij}\varepsilon_{ij}$ (1D: $\frac{1}{2}\sigma\varepsilon$).`, part: 'Part I · Elasticity' },
      { sym: R`$\sigma_{kk}$`, desc: R`First stress invariant (trace $\sigma_{11}+\sigma_{22}+\sigma_{33}$) controlling volumetric dilation.`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbf{f}, f$`, desc: R`External body force density per unit volume in 3D (or per unit length in 1D rods).`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbf{u}_0$`, desc: R`Prescribed displacement boundary field imposed on $S_u$.`, part: 'Part I · Elasticity' },
      { sym: R`$\nabla$`, desc: R`Spatial differential operator forming displacement gradients and stress divergence.`, part: 'Part I · Elasticity' },
      { sym: R`$N, EA$`, desc: R`Internal axial resultant force $N = EA\varepsilon$ and axial rigidity $EA$ of a 1D rod.`, part: 'Part I · Elasticity' },
      { sym: R`$L_0, A$`, desc: R`Reference rod length $L_0$ and cross-sectional area $A$.`, part: 'Part I · Elasticity' },
      { sym: R`$\phi, \phi(r, \theta)$`, desc: R`2D Airy stress function solving the biharmonic equation $\nabla^4\phi = 0$.`, part: 'Part I · Elasticity' },
      { sym: R`$t, L, 2h$`, desc: R`Plate thickness $t$ ($t \ll L$ for plane stress), span or period $L$, and beam height $2h$.`, part: 'Part I · Elasticity' },
      { sym: R`$q(x), p(x)$`, desc: R`Beam distributed load $q(x)$, periodic surface traction $p(x+L)=p(x)$, or contact pressure on $[-a, a]$.`, part: 'Part I · Elasticity' },
      { sym: R`$P, \mathbf{P}$`, desc: R`Concentrated 2D half-space line load $P$ (Flamant) or 3D point force $\mathbf{P}$ (Kelvin).`, part: 'Part I · Elasticity' },
      { sym: R`$r, \theta$`, desc: R`Polar coordinates centered on a point load, circular hole, wedge apex, or crack tip.`, part: 'Part I · Elasticity' },
      { sym: R`$a$`, desc: R`Contact half-width on $[-a, a]$ (2D contact) or half-crack length (center crack $2a$).`, part: 'Part I · Elasticity' },
      { sym: R`$2\alpha$`, desc: R`Total opening angle of a 2D elastic wedge or notch corner.`, part: 'Part I · Elasticity' },
      { sym: R`$\ln r, \theta\ln r$`, desc: R`Logarithmic Michell biharmonic modes in polar 2D elasticity.`, part: 'Part I · Elasticity' },
      { sym: R`$G(\mathbf{x}, \boldsymbol{\xi})$`, desc: R`3D elastic Green's function mapping a unit point force at $\boldsymbol{\xi}$ to displacement at $\mathbf{x}$.`, part: 'Part I · Elasticity' },
      { sym: R`$\boldsymbol{\xi}, \mathrm{d}V_\xi$`, desc: R`Source integration coordinate $\boldsymbol{\xi}$ and volume element $\mathrm{d}V_\xi$.`, part: 'Part I · Elasticity' },
      { sym: R`$\mathbf{b}$`, desc: R`Dislocation Burgers vector defining the Volterra slip displacement discontinuity.`, part: 'Part I · Elasticity' },
      { sym: R`$\boldsymbol{\sigma}^\infty, \sigma^\infty$`, desc: R`Applied uniform far-field stress driving dislocation glide or crack opening.`, part: 'Part I · Elasticity' },

      // Part II · Plasticity
      { sym: R`$\varepsilon_{ij}^e, \varepsilon_{ij}^p$`, desc: R`Additive reversible elastic strain and permanent plastic strain ($\varepsilon_{ij} = \varepsilon_{ij}^e + \varepsilon_{ij}^p$).`, part: 'Part II · Plasticity' },
      { sym: R`$\sigma_1, \sigma_2, \sigma_3$`, desc: R`Ordered principal stresses ($\sigma_1 \ge \sigma_2 \ge \sigma_3$) acting on shear-free planes ($\tau = 0$).`, part: 'Part II · Plasticity' },
      { sym: R`$s_{ij}$`, desc: R`Trace-free deviatoric stress tensor $s_{ij} = \sigma_{ij} - \frac{1}{3}\sigma_{kk}\delta_{ij}$.`, part: 'Part II · Plasticity' },
      { sym: R`$J_2$`, desc: R`Second invariant of deviatoric stress, $J_2 = \frac{1}{2}s_{ij}s_{ij}$.`, part: 'Part II · Plasticity' },
      { sym: R`$\sigma_{\mathrm{eq}}$`, desc: R`von Mises equivalent stress $\sigma_{\mathrm{eq}} = \sqrt{3J_2}$.`, part: 'Part II · Plasticity' },
      { sym: R`$f$`, desc: R`Yield function separating admissible elastic states ($f \le 0$) from plastic yielding ($f = 0$).`, part: 'Part II · Plasticity' },
      { sym: R`$k, \sigma_Y$`, desc: R`Shear yield limit $k = \sigma_Y/\sqrt{3}$ (von Mises) and uniaxial tensile yield stress $\sigma_Y$.`, part: 'Part II · Plasticity' },
      { sym: R`$\dot{\varepsilon}_{ij}^p$`, desc: R`Plastic strain rate tensor obeying plastic incompressibility ($\dot{\varepsilon}_{kk}^p = 0$).`, part: 'Part II · Plasticity' },
      { sym: R`$\dot{\lambda}$`, desc: R`Non-negative plastic consistency multiplier scaling associated flow.`, part: 'Part II · Plasticity' },
      { sym: R`$\boldsymbol{\sigma}^{\mathrm{tr}}, f^{\mathrm{tr}}$`, desc: R`Elastic predictor trial stress and trial yield evaluation before return mapping.`, part: 'Part II · Plasticity' },

      // Part III · Fracture
      { sym: R`$2a$`, desc: R`Total length of a center slit crack in an infinite plate.`, part: 'Part III · Fracture' },
      { sym: R`$K_I, K_{Ic}$`, desc: R`Mode-I stress intensity factor ($K_I = \sigma^\infty\sqrt{\pi a}$) and critical fracture toughness $K_{Ic}$.`, part: 'Part III · Fracture' },
      { sym: R`$\mathcal{G}$`, desc: R`Elastic energy release rate per unit crack advance, $\mathcal{G} = \partial U / \partial a$.`, part: 'Part III · Fracture' },
      { sym: R`$J$`, desc: R`Path-independent contour integral governing crack-tip energy release in LEFM and EPFM.`, part: 'Part III · Fracture' },
      { sym: R`$U$`, desc: R`Total elastic strain or potential energy of a cracked solid.`, part: 'Part III · Fracture' },
      { sym: 'LEFM', desc: R`Linear elastic fracture mechanics describing sharp cracks under small-scale yielding.`, part: 'Part III · Fracture' },

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
        title: 'Consolidated Study Notes & Printable Intro',
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
