(function () {
  'use strict';

  const R = String.raw;
  const ME335 = (window.ME335 = window.ME335 || {});

  ME335.DECK_DATA = {
    meta: {
      title: 'Finite Element Analysis',
      author: 'Hanfeng Zhai',
      department: 'Department of Mechanical Engineering, Stanford University',
      term: 'Winter 2025',
      exploreUrl: 'https://explorecourses.stanford.edu/search?view=catalog&filter-coursestatus-Active=on&q=ME335A',
      webSlidesUrl: 'https://hanfengzhai.com/file/teaching/intros/me335/',
      pdfUrl: 'https://hanfengzhai.com/file/teaching/intros/ME335_Intro.pdf',
      notesUrl: 'https://hanfengzhai.com/file/teaching/notes/FEA_notes.pdf',
      probSessAllUrl: 'https://hanfengzhai.com/file/teaching/notes/ProbSess_FEA.pdf',
      summaryPdfUrl: 'https://hanfengzhai.com/file/teaching/fea/FEARev.pdf',
      nonlinNotesUrl: 'https://hanfengzhai.com/file/teaching/notes/NonlinFEA_note.pdf',
      firedrakeUrl: 'https://hanfengzhai.com/file/teaching/fea/Firedrake_tutorial.pdf',
      fenicsUrl: 'https://hanfengzhai.com/file/teaching/fea/FEniCS_tutorial.pdf',
      siteHomeUrl: 'https://hanfengzhai.com/'
    },

    parts: {
      intro: { label: 'Overview', shortLabel: 'Intro' },
      'part-1': { label: 'Part I · Variational & 1D', shortLabel: 'Part I · Variational' },
      'part-2': { label: 'Part II · 2D/3D & Solvers', shortLabel: 'Part II · Elements' },
      'part-3': { label: 'Part III · Math Theory', shortLabel: 'Part III · Theory' },
      synthesis: { label: 'Workflow & Synthesis', shortLabel: 'Synthesis' }
    },

    slides: [
      // 01. Hero
      {
        id: 'hero',
        partId: 'intro',
        layout: 'hero',
        labId: 'hero-fem-mesh',
        title: 'Finite Element Analysis',
        plainTitle: 'Finite Element Analysis',
        subtitle: 'An interactive course map for Stanford ME 335A covering variational formulations, element assembly, constraints, and error theory.',
        overviewHint: 'Title & Live FEM Mesh',
        symbols: []
      },

      // 02. Course at a glance
      {
        id: 'glance',
        partId: 'intro',
        layout: 'bento',
        labId: 'domain-dimensions',
        title: 'Course at a glance',
        plainTitle: 'Course at a glance',
        lead: 'ME 335A (Prof. Adrian J. Lew, cross-listed CME 335) develops primal finite element methods from weak forms to implementation and convergence proofs.',
        overviewHint: 'Course Scope & Study Guide',
        contentHtml: R`
          <article class="bento-card">
            <div class="bento-card-kicker">Scope</div>
            <h3 class="bento-card-title">Stanford ME 335A</h3>
            <p class="bento-card-body">Graduate primal FEM taught by Prof. Adrian J. Lew (<a href="https://explorecourses.stanford.edu/search?view=catalog&amp;filter-coursestatus-Active=on&amp;q=ME335A" target="_blank" rel="noopener">ExploreCourses ↗</a>). Covers linear elliptic BVPs in 1D, 2D, and 3D for solids, heat transfer, and fluids.</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">Three Parts</div>
            <h3 class="bento-card-title">Theory to Code</h3>
            <p class="bento-card-body">Part I: weighted residuals, weak forms, 1D <code>LG</code> assembly, and Hermite beams. Part II: 2D/3D isoparametric elements, quadrature, elasticity, and constraints. Part III: Sobolev norms, Céa's lemma, and convergence.</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">Methods &amp; Texts</div>
            <h3 class="bento-card-title">MATLAB &amp; UFL</h3>
            <p class="bento-card-body">Hands-on MATLAB assembly (<code>LG</code>/<code>IEN</code>/<code>ID</code>) pairs with Firedrake and FEniCS. Core textbook: Hughes, <em>The Finite Element Method</em> (Dover, 2000/2003).</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">Personal Notes</div>
            <h3 class="bento-card-title">Sessions &amp; Reviews</h3>
            <p class="bento-card-body">Linked directly to Hanfeng Zhai's ME 335A <a href="https://hanfengzhai.com/file/teaching/notes/FEA_notes.pdf" target="_blank" rel="noopener">lecture notes ↗</a>, Winter 2025 <a href="https://hanfengzhai.com/file/teaching/notes/ProbSess_FEA.pdf" target="_blank" rel="noopener">Problem Sessions 1-9 ↗</a>, and <a href="https://hanfengzhai.com/file/teaching/fea/FEARev.pdf" target="_blank" rel="noopener">short FEA review ↗</a>.</p>
          </article>
        `,
        symbols: [
          { sym: R`$\Omega, \Omega_e$`, short: 'Domain & element', desc: R`Continuous physical domain $\Omega$ partitioned into non-overlapping finite elements $\Omega_e$ (or $K_e$).` },
          { sym: R`$\Gamma_D, \Gamma_N$`, short: 'Boundary partition', desc: R`Disjoint Dirichlet ($\Gamma_D$, or $\Gamma_g$) and Neumann ($\Gamma_N$, or $\Gamma_h$) subsets of $\partial\Omega$.` },
          { sym: R`$a(u,v)$`, short: 'Bilinear form', desc: R`Energy bilinear form in the weak formulation $a(u,v) = \ell(v)$ (trial $u$, test $v$).` },
          { sym: R`$\mathrm{LG}(a,e)$`, short: 'Connectivity map', desc: R`Local-to-global DOF table mapping local shape function $a$ on element $e$ to global DOF $A$.` }
        ]
      },

      // 03. Three-part course structure
      {
        id: 'structure',
        partId: 'intro',
        layout: 'flow',
        labId: 'fem-pipeline',
        title: 'Three-part course structure',
        plainTitle: 'Three-part course structure',
        lead: 'Every primal finite element solver follows one pipeline from differential equation to verified discrete solution.',
        overviewHint: 'Variational → Elements → Theory',
        contentHtml: R`
          <div class="callout-card">
            <p><strong>Core ladder:</strong> strong BVP $\to$ weak form $a(u,v) = \ell(v)$ $\to$ Galerkin assembly $\mathbf{K}\mathbf{U} = \mathbf{F}$ $\to$ error bound via Céa's lemma and $\mathcal{O}(h^p)$ convergence.</p>
          </div>
          <div class="mini-stat-grid">
            <div class="mini-stat part-part-1">
              <strong class="mini-stat-val">I. Variational &amp; 1D</strong>
              <span class="mini-stat-label">Strong-to-weak form, $\mathcal{S}$ and $\mathcal{V}$, hat and Hermite bases $N_a$, and <code>LG</code> scatter assembly.</span>
            </div>
            <div class="mini-stat part-part-2">
              <strong class="mini-stat-val">II. 2D/3D &amp; Solvers</strong>
              <span class="mini-stat-label">Isoparametric maps, Gauss quadrature, $P_1$ heat fin, elasticity $\mathbf{B}^\top\mathbb{C}\mathbf{B}$, constraints, and UFL.</span>
            </div>
            <div class="mini-stat part-part-3">
              <strong class="mini-stat-val">III. Math Theory</strong>
              <span class="mini-stat-label">Sobolev norms $L^2$ and $H^1$, coercivity $\alpha$, Céa's lemma, Aubin-Nitsche duality, and singularities.</span>
            </div>
          </div>
        `,
        symbols: [
          { sym: R`$\mathcal{S}, \mathcal{V}$`, short: 'Trial & test spaces', desc: R`Affine trial space $\mathcal{S}$ satisfying $u|_{\Gamma_D}=u_D$ and linear test space $\mathcal{V}$ with $v|_{\Gamma_D}=0$.` },
          { sym: R`$\mathbf{K}\mathbf{U}=\mathbf{F}$`, short: 'Discrete system', desc: R`Assembled global linear system solved for nodal degrees of freedom $\mathbf{U}$.` },
          { sym: R`$\alpha, M$`, short: 'Coercivity & continuity', desc: R`Coercivity lower bound $\alpha \gt 0$ and continuity upper bound $M$ governing Lax-Milgram well-posedness.` },
          { sym: R`$\mathcal{O}(h^p)$`, short: 'Convergence rate', desc: R`Asymptotic error decay with mesh size $h$ ($p=k$ in $H^1$, $p=k+1$ in $L^2$ for smooth $u$).` }
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
        lead: 'Eight core modules across variational foundations, 2D/3D implementation, mathematical error theory, and problem-solving workflow.',
        overviewHint: '8 Course Modules',
        outlineItems: [
          {
            partId: 'part-1',
            partTag: 'Part I',
            title: 'Variational formulations',
            summary: R`Weighted residuals, weak form $a(u,v)=\ell(v)$, essential vs. natural BCs, and calculus of variations.`,
            targetId: 'strong-to-weak'
          },
          {
            partId: 'part-1',
            partTag: 'Part I',
            title: '1D Galerkin and LG assembly',
            summary: R`Hat basis $N_a$, advection-diffusion boundary layers, <code>LG(a,e)</code> scatter, and $C^1$ Hermite beams.`,
            targetId: 'galerkin-1d'
          },
          {
            partId: 'part-2',
            partTag: 'Part II',
            title: 'Elements and quadrature',
            summary: R`$P_1/P_2/Q_4$ families, isoparametric Jacobian $\mathbf{J}$, Gauss-Legendre $2Q-1$ exactness, and hourglassing.`,
            targetId: 'element-families'
          },
          {
            partId: 'part-2',
            partTag: 'Part II',
            title: '2D assembly and heat transfer',
            summary: R`Counter-clockwise <code>LV</code>/<code>LG</code>, reduced <code>LG^e</code>, and the 4-triangle heterogeneous fin capstone (PS9).`,
            targetId: 'assembly-2d-p1'
          },
          {
            partId: 'part-2',
            partTag: 'Part II',
            title: 'Elasticity and locking',
            summary: R`Virtual work, strain matrix $\mathbf{B}$, $\mathbf{k}^e=\int \mathbf{B}^\top\mathbf{D}\mathbf{B}\,\mathrm{d}\Omega$, and volumetric locking remedies.`,
            targetId: 'elasticity-locking'
          },
          {
            partId: 'part-2',
            partTag: 'Part II',
            title: 'Constraints and FEM software',
            summary: R`Dirichlet lifting, penalty vs. Lagrange multipliers, Nitsche, MATLAB <code>LG</code>, Firedrake, and FEniCS.`,
            targetId: 'constraints-solvers'
          },
          {
            partId: 'part-3',
            partTag: 'Part III',
            title: 'Sobolev theory and convergence',
            summary: R`$L^2$ and $H^1$ norms, coercivity $\alpha$, affine Céa's lemma $(1+M/\alpha)$, and $h$/$p$ rates.`,
            targetId: 'sobolev-norms'
          },
          {
            partId: 'synthesis',
            partTag: 'Synthesis',
            title: 'Workflow and session map',
            summary: '7-step FEA procedure, clickable Problem Sessions 1-9 atlas, ME 335B/C bridge, and references.',
            targetId: 'workflow'
          }
        ],
        symbols: []
      },

      // 05. Strong form, residuals, and weak form
      {
        id: 'strong-to-weak',
        partId: 'part-1',
        layout: 'split',
        labId: 'weighted-residuals',
        title: 'Strong form, residuals, and weak form',
        plainTitle: 'Strong form, residuals, and weak form',
        lectureBadges: ['FEARev §2 · PS1 · Variational Form'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">1D &amp; Multi-D Strong Form</div>
            <div>$$-(k u')' + b u' + c u = f \quad \text{in } \Omega, \qquad -\Delta u = f \text{ in } \Omega$$</div>
          </div>
          <div class="eq-card is-accent">
            <div class="eq-card-label">Weighted Residual &amp; Weak Form</div>
            <div>$$\begin{aligned} \int_\Omega R_\Omega v\,\mathrm{d}\Omega &= 0 \;\Longrightarrow\; a(u,v) = \ell(v) \quad \forall v \in \mathcal{V} \\ a(u,v) &= \int_\Omega \nabla u \cdot \nabla v\,\mathrm{d}\Omega, \qquad \ell(v) = \int_\Omega f v\,\mathrm{d}\Omega + \int_{\Gamma_N} t_N v\,\mathrm{d}s \end{aligned}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Domain residual:</strong> an approximate trial $\hat{u}$ leaves $R_\Omega = \mathcal{L}\hat{u} - f \neq 0$; weighted residuals force projections against test functions $v$ to vanish.</li>
            <li><strong>Integration by parts:</strong> shifts one derivative from $u$ onto $v$, relaxing regularity from $C^2$ to $H^1$ and incorporating Neumann flux $t_N$ naturally.</li>
            <li><strong>Higher-order BVP (PS1 Ex. 1.10):</strong> for $u'''=f$ with $u(a)=1, u'(b)=2, u''(a)=3$, one integration by parts yields $-\int_a^b u'' v'\,\mathrm{d}x = \int_a^b f v\,\mathrm{d}x + 3v(a)$ with $v(b)=0$.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$R_\Omega$`, short: 'Strong residual', desc: R`Pointwise PDE residual $R_\Omega = \mathcal{L}\hat{u} - f$ left by an approximate trial function $\hat{u}$.` },
          { sym: R`$u, v$`, short: 'Trial & test fields', desc: R`Unknown trial solution $u \in \mathcal{S}$ and arbitrary admissible weighting function $v \in \mathcal{V}$.` },
          { sym: R`$a(u,v)$`, short: 'Bilinear form', desc: R`Linear operator in both arguments encoding internal diffusion, advection, or stiffness energy.` },
          { sym: R`$\ell(v)$`, short: 'Linear functional', desc: R`Load functional combining body source $f$ and natural boundary flux $t_N$ (also written $L(v)$).` },
          { sym: R`$t_N$`, short: 'Neumann flux', desc: R`Prescribed boundary flux $k\nabla u\cdot\mathbf{n} = t_N$ on $\Gamma_N$ (also written $h$ on $\Gamma_h$).` }
        ]
      },

      // 06. Function spaces and calculus of variations
      {
        id: 'spaces-variations',
        partId: 'part-1',
        layout: 'split',
        labId: 'spaces-nitsche',
        title: 'Function spaces and calculus of variations',
        plainTitle: 'Function spaces and calculus of variations',
        lectureBadges: ['PS2 · Vector Spaces, Euler-Lagrange, Ex. 2.20'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">Affine Trial Space &amp; Linear Test Space</div>
            <div>$$\mathcal{S} = \{u \in H^1(\Omega) \mid u|_{\Gamma_D} = u_D\}, \qquad \mathcal{V} = \{v \in H^1(\Omega) \mid v|_{\Gamma_D} = 0\}$$</div>
          </div>
          <div class="eq-card is-accent">
            <div class="eq-card-label">First Variation &amp; Nitsche Weak Dirichlet (Ex. 2.20)</div>
            <div>$$\begin{aligned} \delta P &= \int_0^1 v\!\left(\frac{\partial F}{\partial u} - \frac{\mathrm{d}}{\mathrm{d}x}\frac{\partial F}{\partial u'}\right)\mathrm{d}x = 0 \\ \int_0^L u'v'\,\mathrm{d}x &+ u'(0)v(0) + u(0)v'(0) + \mu u(0)v(0) = \ell_{\mathrm{N}}(v) \end{aligned}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Affine vs. vector space:</strong> non-zero Dirichlet data makes $\mathcal{S} = \bar{u} + \mathcal{V}$ an affine translate (no zero vector), while $\mathcal{V}$ satisfies all 10 vector space axioms.</li>
            <li><strong>Test, basis, and shape functions:</strong> test functions $v$ probe PDE error, basis functions span $\mathcal{V}_h$, and shape functions $N_a$ interpolate nodal DOFs (in Galerkin FEM they coincide).</li>
            <li><strong>Weak-to-strong reversal (Ex. 2.20):</strong> integrating by parts cancels $u'(0)v(0)$ and recovers $u''+f=0$, $u'(L)=d_L$, and $u(0)=g_0$ consistently for unconstrained $v$.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\mathcal{S}, \bar{u}$`, short: 'Affine space & lift', desc: R`Affine trial set $\mathcal{S} = \bar{u} + \mathcal{V}$ shifted from linear subspace $\mathcal{V}$ by a lifting function $\bar{u}$.` },
          { sym: R`$\mathcal{V}, \mathcal{V}_h$`, short: 'Test subspace', desc: R`Linear vector space of homogeneous test functions ($v|_{\Gamma_D} = 0$) and its finite-dimensional subspace $\mathcal{V}_h$.` },
          { sym: R`$\delta P$`, short: 'First variation', desc: R`Directional Gateaux derivative $\left.\frac{\mathrm{d}}{\mathrm{d}\epsilon}P(u+\epsilon v)\right|_{\epsilon=0} = 0$ yielding Euler-Lagrange equations.` },
          { sym: R`$\mu$`, short: 'Nitsche parameter', desc: R`Boundary stabilization constant in Nitsche's symmetric weak Dirichlet formulation (must exceed trace inverse threshold).` },
          { sym: R`$g_0, d_L$`, short: 'Ex. 2.20 boundary data', desc: R`Prescribed Dirichlet value $u(0)=g_0$ and right-end Neumann slope $u'(L)=d_L$ in PS2 Ex. 2.20.` }
        ]
      },

      // 07. 1D Galerkin and advection-diffusion
      {
        id: 'galerkin-1d',
        partId: 'part-1',
        layout: 'split',
        labId: 'advection-diffusion-1d',
        title: '1D Galerkin and advection-diffusion',
        plainTitle: '1D Galerkin and advection-diffusion',
        lectureBadges: ['PS3 · Hat Basis & Non-Symmetric Stiffness'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">1D Advection-Diffusion BVP &amp; Exact Layer</div>
            <div>$$-D u'' + \mu u' = f, \qquad u(x) = \frac{1}{\mu}\!\left(x - \frac{1 - e^{(\mu/D)x}}{1 - e^{\mu/D}}\right)$$</div>
          </div>
          <div class="eq-card is-accent">
            <div class="eq-card-label">Non-Symmetric Galerkin System ($N = 3$)</div>
            <div>$$\begin{aligned} K_{ab} &= a(N_b, N_a) = D\!\int_0^1 N_b' N_a'\,\mathrm{d}x + \mu\!\int_0^1 N_b' N_a\,\mathrm{d}x \neq K_{ba} \\ \mathbf{K} &= \begin{bmatrix} 2D/\Delta x & \mu/2 - D/\Delta x \\ -\mu/2 - D/\Delta x & 2D/\Delta x \end{bmatrix}, \qquad \mathrm{Pe}_h = \frac{\mu \Delta x}{2D} \end{aligned}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Piecewise linear hat basis:</strong> each $N_a(x)$ equals $1$ at node $x_a$, $0$ at all other nodes, and vanishes outside $[x_{a-1}, x_{a+1}]$, producing a tridiagonal sparse matrix.</li>
            <li><strong>Trial-first indexing:</strong> $K_{ab} = a(N_b, N_a)$ places trial $N_b$ first and test $N_a$ second; advection breaks symmetry while $\det(\mathbf{K}) = 3D^2/\Delta x^2 + \mu^2/4 \gt 0$ preserves invertibility.</li>
            <li><strong>Element Péclet threshold:</strong> when $\mathrm{Pe}_h = \mu\Delta x/(2D) \gt 1$, off-diagonal entry $K_{12}$ flips sign and standard Galerkin develops node-to-node oscillations (cured by refinement or SUPG).</li>
          </ul>
        `,
        symbols: [
          { sym: R`$N_a(x)$`, short: 'Hat shape function', desc: R`Global piecewise-linear $C^0$ basis function satisfying $N_a(x_b) = \delta_{ab}$ with local support $[x_{a-1}, x_{a+1}]$.` },
          { sym: R`$D, \mu$`, short: 'Diffusion & advection', desc: R`Diffusivity $D \gt 0$ and convective velocity $\mu$ in 1D advection-diffusion (PS3).` },
          { sym: R`$K_{ab}$`, short: 'Stiffness entry', desc: R`Global matrix entry $K_{ab} = a(N_b, N_a)$ with trial function $N_b$ in the first slot and test $N_a$ in the second.` },
          { sym: R`$\mathrm{Pe}_h$`, short: 'Element Péclet number', desc: R`Dimensionless mesh convection ratio $\mathrm{Pe}_h = \mu\Delta x / (2D)$; $\mathrm{Pe}_h \gt 1$ triggers Galerkin oscillations.` },
          { sym: R`$\text{SUPG}$`, short: 'Upwind stabilization', desc: R`Streamline-Upwind Petrov-Galerkin method adding consistent streamline diffusion to suppress oscillations.` }
        ]
      },

      // 08. Local-to-global map (LG) and assembly
      {
        id: 'lg-assembly',
        partId: 'part-1',
        layout: 'split',
        labId: 'lg-assembly-lab',
        title: 'Local-to-global map (LG) and assembly',
        plainTitle: 'Local-to-global map (LG) and assembly',
        lectureBadges: ['PS4 · LG(a,e), Ex. 3.11 P2 & Scatter'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">Global Basis Stitching &amp; Scatter Assembly</div>
            <div>$$N_A = \sum_{\{(a,e)\,\mid\, \mathrm{LG}(a,e) = A\}} N_a^e, \qquad K_{\mathrm{LG}(a,e),\,\mathrm{LG}(b,e)} \mathrel{+}= K_{ab}^e$$</div>
          </div>
          <div class="eq-card is-accent">
            <div class="eq-card-label">Matrix Scatter &amp; Dirichlet Lifting</div>
            <div>$$\mathbf{K} = \sum_{e=1}^{n_{\mathrm{el}}} \mathbf{L}_e^\top \mathbf{k}^e \mathbf{L}_e, \qquad a(v_h, T_h) = \ell(v_h) - a(v_h, T_h^g)$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Connectivity table <code>LG(a, e)</code>:</strong> row $a$ indexes local element shape functions, column $e$ indexes elements, and entry $\mathrm{LG}(a,e)$ gives the global DOF number.</li>
            <li><strong>Overlapping broken sum:</strong> local $2\times 2$ ($P_1$) or $3\times 3$ ($P_2$, Ex. 3.11) element matrices $\mathbf{k}^e$ scatter into overlapping blocks along the diagonal of sparse $\mathbf{K}$.</li>
            <li><strong>Dirichlet lift $T_h^g$:</strong> splitting $T_h^{\mathrm{total}} = T_h + T_h^g$ moves known boundary contributions $-a(v_h, T_h^g)$ to the right-hand side on non-uniform meshes (PS4: $\{-1, -0.5, 0.5, 1\}$).</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\mathrm{LG}(a,e)$`, short: 'Local-to-global map', desc: R`Connectivity array returning the global DOF number $A$ of local shape function $a$ on element $e$.` },
          { sym: R`$N_a^e, N_A$`, short: 'Local & global basis', desc: R`Element-restricted shape function $N_a^e$ stitched across shared nodes into global basis $N_A$.` },
          { sym: R`$\mathbf{k}^e, \mathbf{L}_e$`, short: 'Element matrix & gather', desc: R`Local element stiffness $\mathbf{k}^e$ and boolean gather/scatter operator $\mathbf{L}_e$ assembling $\mathbf{K}$.` },
          { sym: R`$T_h^g$`, short: 'Discrete Dirichlet lift', desc: R`Known discrete boundary function matching prescribed nodal values on $\Gamma_D$.` }
        ]
      },

      // 09. C1 Hermite elements and beams
      {
        id: 'hermite-beam',
        partId: 'part-1',
        layout: 'split',
        labId: 'hermite-beam-lab',
        title: R`$C^1$ Hermite elements and beams`,
        plainTitle: 'C1 Hermite elements and beams',
        lectureBadges: ['PS5 · Eqns. 4.29, Ex. 4.8 & Euler-Bernoulli'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">4th-Order Euler-Bernoulli Beam Weak Form</div>
            <div>$$(EI u_{,xx})_{,xx} = f \;\Longrightarrow\; \int_0^1 u_h''\, EI\, v_h''\,\mathrm{d}x = \int_0^1 f v_h\,\mathrm{d}x$$</div>
          </div>
          <div class="eq-card is-accent">
            <div class="eq-card-label">Cubic Hermite Basis ($\xi \in [0,1]$) &amp; Element Stiffness</div>
            <div>$$\begin{aligned} N_1^e &= (1-\xi)^2(1+2\xi), \qquad N_2^e = l_e\xi(\xi-1)^2 \\ \mathbf{k}^e &= \frac{EI}{l_e^3}\begin{bmatrix} 12 & 6l_e & -12 & 6l_e \\ 6l_e & 4l_e^2 & -6l_e & 2l_e^2 \\ -12 & -6l_e & 12 & -6l_e \\ 6l_e & 2l_e^2 & -6l_e & 4l_e^2 \end{bmatrix}, \quad \mathbf{f}^e = f\begin{bmatrix} l_e/2 \\ l_e^2/12 \\ l_e/2 \\ -l_e^2/12 \end{bmatrix} \end{aligned}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>$C^1$ continuity requirement:</strong> fourth-order bending places second derivatives $u''v''$ in $a(u,v)$, requiring continuous displacement $u$ and slope $u'$ across every node ($u_h \in H^2$).</li>
            <li><strong>Two DOFs per node:</strong> each node stores $(u_A, \theta_A = u'_A)$; cubic Hermite functions $N_1^e,\dots,N_4^e$ satisfy Kronecker delta on values and slopes simultaneously.</li>
            <li><strong>Clamped 4-element beam (PS5):</strong> 10 total DOFs reduce by eliminating $\{1,2,9,10\}$ at $x=0,1$ to an SPD $6\times 6$ system recovering the exact quartic deflection $u(x) = \frac{f}{24EI}x^2(1-x)^2$.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$EI$`, short: 'Flexural rigidity', desc: R`Product of Young's modulus $E$ and cross-sectional moment of inertia $I$ resisting bending.` },
          { sym: R`$u_A, \theta_A$`, short: 'Deflection & slope', desc: R`Two Hermite DOFs at each beam node: transverse displacement $u_A$ and rotation $\theta_A = u'(x_A)$.` },
          { sym: R`$N_1^e..N_4^e$`, short: 'Cubic Hermite basis', desc: R`Four local cubic polynomials on $\xi \in [0,1]$ interpolating nodal values and slopes ($C^1$ continuous).` },
          { sym: R`$H^2(\Omega)$`, short: '2nd-order Sobolev space', desc: R`Function space with square-integrable second weak derivatives required for fourth-order bending.` }
        ]
      },

      // 10. Essential vs. natural boundary conditions
      {
        id: 'bcs-essential-natural',
        partId: 'part-1',
        layout: 'compare',
        labId: 'bc-methods-compare',
        title: 'Essential vs. natural boundary conditions',
        plainTitle: 'Essential vs. natural boundary conditions',
        lectureBadges: ['PS1-PS2 · CompMechBook §1 · Dirichlet Enforcement'],
        contentHtml: R`
          <div class="airy-banner-card">
            <span class="eq-card-label">Boundary Partition on $\partial\Omega = \Gamma_D \cup \Gamma_N$ (Hughes / PS6-9: $\Gamma_g \cup \Gamma_h$)</span>
            <div class="airy-eq-tokens">
              <span class="eq-token">$\Gamma_D \cap \Gamma_N = \emptyset,$</span>
              <span class="eq-token">$u = u_D \text{ on } \Gamma_D,$</span>
              <span class="eq-token">$k\nabla u\cdot\mathbf{n} = t_N \text{ on } \Gamma_N$</span>
            </div>
          </div>
          <div class="compare-cols">
            <article class="compare-card is-stress">
              <div class="eq-card-label">Dirichlet on $\Gamma_D$ ($\Gamma_g$)</div>
              <h3>Essential Boundary Conditions</h3>
              <p>Constrains the primary field $u$ (and slope $u'$ for $H^2$ beams). Built directly into $\mathcal{S}$ via lifting/elimination, or enforced weakly with penalty $\beta$, Nitsche $\mu$, or Lagrange multipliers.</p>
            </article>
            <article class="compare-card is-strain">
              <div class="eq-card-label">Neumann &amp; Robin on $\Gamma_N$ ($\Gamma_h$)</div>
              <h3>Natural Boundary Conditions</h3>
              <p>Constrains boundary flux $k\partial_n u = t_N$ (or Robin $k\partial_n u + \gamma u = \alpha$). Emerges automatically from integration by parts into $\ell(v)$ (and adds $\int_{\Gamma_R}\gamma uv\,\mathrm{d}s$ to $a(u,v)$ for Robin).</p>
            </article>
          </div>
        `,
        symbols: [
          { sym: R`$\Gamma_D, \Gamma_g$`, short: 'Dirichlet boundary', desc: R`Essential boundary subset where primary field $u = u_D$ (or $g$) is prescribed.` },
          { sym: R`$\Gamma_N, \Gamma_h$`, short: 'Neumann boundary', desc: R`Natural boundary subset where normal flux $k\nabla u\cdot\mathbf{n} = t_N$ (or $h$) enters $\ell(v)$.` },
          { sym: R`$\beta$`, short: 'Penalty weight', desc: R`Large diagonal weight $\beta \gg 1$ enforcing $u(0)\approx g_0$ with $\mathcal{O}(\beta^{-1})$ error and $\mathcal{O}(\beta)$ conditioning.` },
          { sym: R`$\lambda$`, short: 'Lagrange multiplier', desc: R`Extra unknown enforcing $\mathbf{C}\mathbf{U}=\mathbf{g}$ exactly via an indefinite saddle-point system; equals reaction flux.` }
        ]
      },

      // 11. Standard elements and isoparametric maps
      {
        id: 'element-families',
        partId: 'part-2',
        layout: 'lab-wide',
        labId: 'isoparametric-gallery',
        title: 'Standard elements and isoparametric maps',
        plainTitle: 'Standard elements and isoparametric maps',
        lead: R`One reference element $\hat{\Omega}$ maps to every physical cell $\Omega_e$ using the same shape functions for geometry and field: $\mathbf{x}(\boldsymbol{\xi}) = \sum_a \mathbf{X}_a N_a(\boldsymbol{\xi})$, $\nabla_{\mathbf{x}} N_a = \mathbf{J}^{-\top}\nabla_{\boldsymbol{\xi}} N_a$, $\mathrm{d}\Omega = |\det\mathbf{J}|\,\mathrm{d}\boldsymbol{\xi}$.`,
        lectureBadges: ['Hughes Ch. 3 · CompMechBook §3 · P1/P2/Q4'],
        contentHtml: '',
        symbols: [
          { sym: R`$\hat{\Omega}, \boldsymbol{\xi}$`, short: 'Reference element', desc: R`Parent reference cell ($\xi,\eta \in [-1,1]$ or unit triangle) where standard shape functions $N_a(\boldsymbol{\xi})$ are defined.` },
          { sym: R`$\mathbf{J}$`, short: 'Jacobian matrix', desc: R`Geometric mapping Jacobian $J_{ij} = \partial x_i / \partial \xi_j$ transforming parent gradients and area elements.` },
          { sym: R`$\det\mathbf{J}$`, short: 'Mapping determinant', desc: R`Local area or volume stretch factor; must stay strictly positive ($\det\mathbf{J} \gt 0$) to avoid element inversion.` },
          { sym: R`$P_1, P_2, Q_4$`, short: 'Element families', desc: R`Linear triangle ($P_1$, 3 nodes), quadratic triangle ($P_2$, 6 nodes), and bilinear quad ($Q_4$, 4 nodes).` }
        ]
      },

      // 12. Gauss-Legendre quadrature and integration
      {
        id: 'gauss-quadrature',
        partId: 'part-2',
        layout: 'split',
        labId: 'gauss-quadrature-lab',
        title: 'Gauss-Legendre quadrature and integration',
        plainTitle: 'Gauss-Legendre quadrature and integration',
        lectureBadges: ['Hughes Ch. 3-4 · CompMechBook §3 · Reduced Integration'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">1D &amp; Tensor-Product Quadrature Rule</div>
            <div>$$\int_{-1}^{1} g(\xi)\,\mathrm{d}\xi \approx \sum_{q=1}^{Q} w_q\, g(\xi_q), \qquad \text{exact for } \deg(g) \le 2Q - 1$$</div>
          </div>
          <div class="eq-card is-accent">
            <div class="eq-card-label">Isoparametric Element Stiffness Assembly</div>
            <div>$$k_{ab}^e \approx \sum_{q=1}^{Q_{\mathrm{tot}}} w_q\, \bigl(\nabla_{\mathbf{x}} N_b(\boldsymbol{\xi}_q)\cdot k\nabla_{\mathbf{x}} N_a(\boldsymbol{\xi}_q)\bigr)\,\bigl|\det \mathbf{J}(\boldsymbol{\xi}_q)\bigr|$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Optimal polynomial exactness:</strong> $Q$ Gauss-Legendre points integrate degree $2Q-1$ polynomials exactly using $2Q$ free parameters (nodes $\xi_q$ and weights $w_q$).</li>
            <li><strong>Standard rules:</strong> $P_1$ triangles have constant gradients (1-point centroid rule is exact); $Q_4$ bilinear quads need $2\times 2$ Gauss points for full stiffness rank.</li>
            <li><strong>Under-integration and hourglassing:</strong> 1-point reduced integration on $Q_4$ leaves two spurious zero-energy hourglass modes with $\nabla u_h(0,0) = \mathbf{0}$, creating checkerboard instability unless stabilized.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\xi_q, w_q$`, short: 'Gauss nodes & weights', desc: R`Quadrature sample locations $\xi_q \in (-1,1)$ and positive weights $w_q$ on the reference domain.` },
          { sym: R`$Q, 2Q-1$`, short: 'Exactness order', desc: R`Number of 1D Gauss points $Q$ integrating polynomials up to degree $2Q-1$ exactly.` },
          { sym: R`$\nabla_{\mathbf{x}} N_a$`, short: 'Physical gradient', desc: R`Spatial shape-function gradient $\mathbf{J}^{-\top}\nabla_{\boldsymbol{\xi}}N_a$ evaluated at each quadrature point.` }
        ]
      },

      // 13. 2D assembly with P1 triangles
      {
        id: 'assembly-2d-p1',
        partId: 'part-2',
        layout: 'split',
        labId: 'assembly-2d-lab',
        title: '2D assembly with P1 triangles',
        plainTitle: '2D assembly with P1 triangles',
        lectureBadges: ['PS6 · 2D Advection-Diffusion · LG & Reduced LGe'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">2D Advection-Diffusion Weak Form (Einstein Notation)</div>
            <div>$$k T_{,ii} + v_i T_{,i} = f \;\Longrightarrow\; a(T,w) = \int_\Omega \bigl(k T_{,i} w_{,i} - v_i T_{,i} w\bigr)\,\mathrm{d}\Omega$$</div>
          </div>
          <div class="eq-card is-accent">
            <div class="eq-card-label">PS6 6-Node 4-Triangle Connectivity &amp; Lift</div>
            <div>$$\begin{aligned} \mathrm{LG} &= \begin{bmatrix} 1 & 2 & 4 & 4 \\ 3 & 3 & 3 & 5 \\ 2 & 4 & 5 & 6 \end{bmatrix}, \quad \mathrm{LG}^e = \begin{bmatrix} 0 & 0 & 2 & 2 \\ 1 & 1 & 1 & 0 \\ 0 & 2 & 0 & 0 \end{bmatrix} \\ \ell_a^e &= \ell(N_a^e) - \sum_b K_{ab}^e g_b^e \end{aligned}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Counter-clockwise orientation (<code>LV</code>):</strong> numbering local vertices $(1,2,3)$ anti-clockwise guarantees positive signed triangle area $A \gt 0$ and valid $P_1$ linear gradients $\nabla N_a^e = \mathrm{const}$.</li>
            <li><strong>Full <code>LG</code> vs. reduced <code>LG^e</code>:</strong> setting Dirichlet vertices $\{1,2,5,6\}$ to <code>0</code> maps free interior nodes $\{3,4\} \mapsto \{1,2\}$, shrinking global solve size directly during element assembly.</li>
            <li><strong>Sparsity from mesh topology:</strong> entry $K_{AB}$ is non-zero only if nodes $A$ and $B$ share a triangle edge, enabling compact CSR storage for millions of DOFs.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\mathrm{LV}$`, short: 'Local-to-vertex map', desc: R`Counter-clockwise vertex ordering per triangle ensuring positive signed area $A \gt 0$.` },
          { sym: R`$\mathrm{LG}^e$`, short: 'Reduced connectivity', desc: R`Free-DOF connectivity table mapping Dirichlet nodes to 0 and interior unknowns to $\{1,\dots,n_{\mathrm{free}}\}$.` },
          { sym: R`$T_{,i}, v_i$`, short: 'Gradient & velocity', desc: R`Spatial temperature gradient $\partial T/\partial x_i$ and 2D advection velocity components $v_i$.` },
          { sym: R`$g_b^e$`, short: 'Element Dirichlet data', desc: R`Prescribed boundary temperatures at element nodes lifted into the element RHS $\ell_a^e$.` }
        ]
      },

      // 14. Capstone: 2D heterogeneous heat transfer
      {
        id: 'heat-fin-2d',
        partId: 'part-2',
        layout: 'split',
        labId: 'heat-fin-solver',
        title: 'Capstone: 2D heterogeneous heat transfer',
        plainTitle: 'Capstone: 2D heterogeneous heat transfer',
        lectureBadges: ['PS9 Final Review · 4-Triangle Fin · P1 & P2'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">Heterogeneous Conduction &amp; Closed-Form P1 Basis</div>
            <div>$$\begin{aligned} -\nabla\cdot\bigl(k^e\nabla T\bigr) &= 0, \qquad k^e \in \{14, 27, 45, 27\} \\ N_1^e &= \frac{-(X_2^3 - X_2^2)(x_1 - X_1^2) + (X_1^3 - X_1^2)(x_2 - X_2^2)}{2A} \end{aligned}$$</div>
          </div>
          <div class="eq-card is-accent">
            <div class="eq-card-label">Assembled Row 5 &amp; Exact Free-Node Temperature</div>
            <div>$$\begin{aligned} 100(-3A) + 50(-72A - 3A) + 78A\,u_5 &= 0 \\ \Longrightarrow\; u_5 = \frac{675}{13} &\approx 51.923^\circ\mathrm{C} \end{aligned}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>4 congruent $P_1$ triangles:</strong> 6 nodes with $T=100^\circ\mathrm{C}$ on $\Gamma_{g_1}$ ($x_1=0$), $T=50^\circ\mathrm{C}$ on $\Gamma_{g_2}$, insulated bottom $\Gamma_h$ ($x_2=0$), leaving Node 5 at $(3,0)$ as the sole free DOF.</li>
            <li><strong>Row-sum verification:</strong> partition of unity $\sum_b N_b \equiv 1$ implies $\sum_B K_{5B} = 0$ ($-3A - 72A + 78A - 3A = 0$), catching hand-assembly sign mistakes instantly.</li>
            <li><strong>Post-processing and $P_2$ upgrade:</strong> evaluate $T_h(\bar{\mathbf{x}}^e)$ at centroids and constant heat flux $\mathbf{q}^e = -k^e\nabla T_h$; upgrading to quadratic $P_2$ adds 9 mid-edge nodes (15 total, 6 free DOFs).</li>
          </ul>
        `,
        symbols: [
          { sym: R`$k^e$`, short: 'Element conductivity', desc: R`Piecewise-constant thermal conductivity on triangle $\Omega_e$ ($k^1=14, k^2=27, k^3=45, k^4=27$).` },
          { sym: R`$A$`, short: 'Triangle area', desc: R`Positive signed area $A = \frac{1}{2}\det[\mathbf{X}^2-\mathbf{X}^1,\;\mathbf{X}^3-\mathbf{X}^1]$ of each $P_1$ triangle.` },
          { sym: R`$u_5$`, short: 'Free nodal temperature', desc: R`Unknown temperature at Node 5 $(3,0)$ solving $78A\,u_5 = 4050A \implies u_5 = 675/13 \approx 51.923^\circ\mathrm{C}$.` },
          { sym: R`$\mathbf{q}^e$`, short: 'Element heat flux', desc: R`Fourier heat flux vector $\mathbf{q}^e = -k^e\nabla T_h$, constant inside each $P_1$ triangle.` }
        ]
      },

      // 15. From scalar PDEs to linear elasticity
      {
        id: 'elasticity-locking',
        partId: 'part-2',
        layout: 'split',
        labId: 'elasticity-locking-lab',
        title: 'From scalar PDEs to linear elasticity',
        plainTitle: 'From scalar PDEs to linear elasticity',
        lectureBadges: ['Hughes Ch. 2 & 4 · CompMechBook §4 · Locking'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">Principle of Virtual Work (Vector Elasticity)</div>
            <div>$$\int_\Omega \boldsymbol{\varepsilon}(\mathbf{u}) : \mathbb{C} : \boldsymbol{\varepsilon}(\mathbf{v})\,\mathrm{d}\Omega = \int_\Omega \mathbf{f}\cdot\mathbf{v}\,\mathrm{d}\Omega + \int_{\Gamma_N} \mathbf{t}\cdot\mathbf{v}\,\mathrm{d}S$$</div>
          </div>
          <div class="eq-card is-accent">
            <div class="eq-card-label">Voigt Strain-Displacement Matrix &amp; Element Stiffness</div>
            <div>$$\mathbf{k}^e = \int_{\Omega_e} \mathbf{B}^\top \mathbf{D} \mathbf{B}\,\mathrm{d}\Omega, \qquad \lambda = \frac{E\nu}{(1+\nu)(1-2\nu)} \xrightarrow{\nu\to 0.5} \infty$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Identical assembly pipeline:</strong> replacing scalar gradient $\nabla N_a$ with strain matrix $\mathbf{B}_a$ and conductivity $k$ with elasticity matrix $\mathbf{D}$ turns Poisson code into 2D/3D solid mechanics ($d$ DOFs per node).</li>
            <li><strong>Volumetric locking ($\nu \to 0.5$):</strong> as $\lambda/\mu \to \infty$, full-integration $P_1$ and $Q_4$ elements impose too many incompressibility constraints ($\nabla\cdot\mathbf{u}_h = 0$), artificially freezing bending deformation.</li>
            <li><strong>Remedies and patch test:</strong> Selective Reduced Integration (SRI / $\bar{B}$ split of deviatoric and volumetric terms) or inf-sup stable Taylor-Hood $P_2$-$P_1$ mixed elements eliminate locking while passing the patch test.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\boldsymbol{\varepsilon}(\mathbf{u})$`, short: 'Infinitesimal strain', desc: R`Symmetric displacement gradient $\frac{1}{2}(\nabla\mathbf{u} + \nabla\mathbf{u}^\top)$ in linear elasticity.` },
          { sym: R`$\mathbf{B}, \mathbf{D}$`, short: 'Voigt strain & elasticity', desc: R`Strain-displacement matrix $\mathbf{B}$ mapping nodal DOFs to Voigt strain and constitutive matrix $\mathbf{D}$.` },
          { sym: R`$\nu, \lambda$`, short: 'Poisson & Lamé', desc: R`Poisson's ratio $\nu$ and Lamé parameter $\lambda$; $\lambda \to \infty$ as $\nu \to 0.5$ causes volumetric locking.` },
          { sym: R`$\text{SRI} / \bar{B}$`, short: 'Anti-locking split', desc: R`Selective Reduced Integration under-integrating only the volumetric bulk term to prevent locking.` }
        ]
      },

      // 16. Constraints and modern FEM software
      {
        id: 'constraints-solvers',
        partId: 'part-2',
        layout: 'split',
        labId: 'constraints-ufl-lab',
        title: 'Constraints and modern FEM software',
        plainTitle: 'Constraints and modern FEM software',
        lectureBadges: ['ExploreCourses · Week 7 Firedrake & FEniCS Tutorials'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">Penalty vs. Lagrange Multiplier Saddle-Point System</div>
            <div>$$(\mathbf{K} + \beta\,\mathbf{C}^\top\mathbf{C})\mathbf{U} = \mathbf{F} + \beta\,\mathbf{C}^\top\mathbf{g}, \qquad \begin{bmatrix} \mathbf{K} & \mathbf{C}^\top \\ \mathbf{C} & \mathbf{0} \end{bmatrix}\begin{bmatrix}\mathbf{U}\\ \boldsymbol{\lambda}\end{bmatrix} = \begin{bmatrix}\mathbf{F}\\ \mathbf{g}\end{bmatrix}$$</div>
          </div>
          <div class="eq-card is-accent">
            <div class="eq-card-label">High-Level UFL Variational Syntax (Firedrake / FEniCS)</div>
            <div>$$\texttt{a = k * dot(grad(u), grad(v)) * dx}, \qquad \texttt{L = f * v * dx}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Penalty vs. Lagrange multipliers:</strong> penalty preserves SPD size while trading constraint accuracy $\mathcal{O}(\beta^{-1})$ against conditioning $\kappa \sim \mathcal{O}(\beta)$; multipliers enforce $\mathbf{C}\mathbf{U}=\mathbf{g}$ exactly via an indefinite saddle-point system.</li>
            <li><strong>MATLAB to UFL:</strong> low-level MATLAB routines teach <code>LG</code>/<code>IEN</code>/<code>ID</code> assembly directly; Firedrake and FEniCS compile UFL weak forms directly to C/PETSc kernels.</li>
            <li><strong>Week 7 benchmark on $[-1,1]^2$:</strong> Firedrake ($k=1, f=1, u|_{\partial\Omega}=0 \implies u_{\max}\approx 0.295$) and FEniCS + Gmsh ($k=2\times 10^{-4}, f=0.2, u|_{\partial\Omega}=1000 \implies u(0.25,0.25)=1263.32$).</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\mathbf{C}, \mathbf{g}$`, short: 'Constraint operator', desc: R`Linear constraint matrix $\mathbf{C}$ and target vector $\mathbf{g}$ expressing multipoint or Dirichlet constraints $\mathbf{C}\mathbf{U}=\mathbf{g}$.` },
          { sym: R`$\beta, \kappa$`, short: 'Penalty & condition no.', desc: R`Penalty stiffness $\beta$ and matrix condition number $\kappa(\mathbf{K}_\beta) \sim \mathcal{O}(\beta)$.` },
          { sym: R`$\boldsymbol{\lambda}$`, short: 'Multiplier vector', desc: R`Lagrange multipliers enforcing $\mathbf{C}\mathbf{U}=\mathbf{g}$ exactly; physically represent constraint reaction forces.` },
          { sym: R`$\text{UFL}$`, short: 'Unified Form Language', desc: R`Domain-specific Python syntax in Firedrake and FEniCS expressing weak forms $a(u,v)=L(v)$ symbolically.` }
        ]
      },

      // 17. Norms and Sobolev spaces (L2, H1)
      {
        id: 'sobolev-norms',
        partId: 'part-3',
        layout: 'split',
        labId: 'sobolev-norms-lab',
        title: 'Norms and Sobolev spaces ($L^2$, $H^1$)',
        plainTitle: 'Norms and Sobolev spaces (L2, H1)',
        lectureBadges: ['PS8 · Appendix B Defs B.1-B.11'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">$L^2$ Norm and $H^1$ Norm / Seminorm</div>
            <div>$$\begin{aligned} \|v\|_{0,2} &= \left[\int_\Omega v^2\,\mathrm{d}\Omega\right]^{1/2}, \qquad |v|_{1,2} = \left[\int_\Omega |\nabla v|^2\,\mathrm{d}\Omega\right]^{1/2} \\ \|v\|_{1,2} &= \left(\|v\|_{0,2}^2 + |v|_{1,2}^2\right)^{1/2} \end{aligned}$$</div>
          </div>
          <div class="eq-card is-accent">
            <div class="eq-card-label">PS8 Membership Examples on $\Omega = [-1, 1]^2$</div>
            <div>$$x_1^2 + x_2^3 \in H^1(\Omega), \qquad \ln(1+x_1) + \ln(1+x_2) \in L^2(\Omega) \setminus H^1(\Omega)$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Why Sobolev spaces:</strong> weak forms require finite energy $\int_\Omega |\nabla v|^2\,\mathrm{d}\Omega \lt \infty$, so $H^1(\Omega)$ admits piecewise-linear hat functions with kinks while rejecting jumps.</li>
            <li><strong>Norm axioms (Defs B.1-B.2):</strong> positivity and definiteness, homogeneity $\|\alpha v\|=|\alpha|\|v\|$, and the triangle inequality define distance in function space ($H^1(\Omega) \subset L^2(\Omega)$).</li>
            <li><strong>PS8 counterexamples:</strong> the Heaviside step $H(x)$ and $\ln(1+x_1)+\ln(1+x_2)$ are square-integrable ($L^2$), yet their weak derivatives fail square-integrability ($\int_{-1}^1 (1+x_1)^{-2}\mathrm{d}x_1 = \infty$).</li>
          </ul>
        `,
        symbols: [
          { sym: R`$\|v\|_{0,2}$`, short: 'L2 norm', desc: R`Square-integrable root-mean magnitude $\left(\int_\Omega v^2\,\mathrm{d}\Omega\right)^{1/2}$ defining $L^2(\Omega)$.` },
          { sym: R`$|v|_{1,2}$`, short: 'H1 seminorm', desc: R`Gradient energy norm $\left(\int_\Omega |\nabla v|^2\,\mathrm{d}\Omega\right)^{1/2}$; vanishes on constant functions.` },
          { sym: R`$\|v\|_{1,2}$`, short: 'H1 Sobolev norm', desc: R`Full first-order Sobolev norm $\left(\|v\|_{0,2}^2 + |v|_{1,2}^2\right)^{1/2}$ defining $H^1(\Omega)$.` },
          { sym: R`$H^1(\Omega)$`, short: 'Energy function space', desc: R`Hilbert space of $L^2$ functions whose weak first derivatives also belong to $L^2(\Omega)$.` }
        ]
      },

      // 18. Coercivity, Galerkin orthogonality, and Céa's lemma
      {
        id: 'cea-coercivity',
        partId: 'part-3',
        layout: 'split',
        labId: 'cea-orthogonality-lab',
        title: "Coercivity, Galerkin orthogonality, and Céa's lemma",
        plainTitle: "Coercivity, Galerkin orthogonality, and Céa's lemma",
        lectureBadges: ['PS8 · FEA_notes p. 133 · Fundamental Theorem'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">Continuity ($M$), Coercivity ($\alpha$) &amp; Galerkin Orthogonality</div>
            <div>$$\begin{aligned} |a(u,v)| &\le M\|u\|\|v\|, \qquad a(v,v) \ge \alpha\|v\|^2 \;\; (\alpha \gt 0) \\ a(u - u_h, v_h) &= 0 \quad \forall v_h \in \mathcal{V}_h \end{aligned}$$</div>
          </div>
          <div class="eq-card is-accent">
            <div class="eq-card-label">Prof. Lew's Affine Céa's Lemma &amp; Stability Bound</div>
            <div>$$\|u - u_h\|_{H^1} \le \left(1 + \frac{M}{\alpha}\right) \min_{w_h \in \mathcal{S}_h} \|u - w_h\|_{H^1}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Well-posedness (Lax-Milgram):</strong> continuity $M$ and coercivity $\alpha \gt 0$ guarantee existence, uniqueness, and stability ($\|u_h\| \le \frac{m}{\alpha} + (1+\frac{M}{\alpha})\min_{w_h\in\mathcal{S}_h}\|w_h\|$).</li>
            <li><strong>Best approximation up to a constant:</strong> Galerkin orthogonality forces $u - u_h$ to be $a$-orthogonal to $\mathcal{V}_h$; when $a$ is symmetric, $u_h$ minimizes energy error $\|u-u_h\|_a$ exactly.</li>
            <li><strong>Non-symmetry penalty:</strong> when advection or high anisotropy pushes $M/\alpha \gg 1$, the oblique projection factor $(1 + M/\alpha)$ degrades quasi-optimality unless stabilized.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$M$`, short: 'Continuity constant', desc: R`Boundedness constant in $|a(u,v)| \le M\|u\|\|v\|$ on $H^1(\Omega)$.` },
          { sym: R`$\alpha$`, short: 'Coercivity constant', desc: R`Strict ellipticity lower bound $a(v,v) \ge \alpha\|v\|^2$ ($\alpha \gt 0$) ensuring unique solvability.` },
          { sym: R`$\|v\|_a$`, short: 'Energy norm', desc: R`Problem-induced energy norm $\sqrt{a(v,v)}$ for symmetric coercive bilinear forms.` },
          { sym: R`$1 + M/\alpha$`, short: "Céa's quasi-optimality", desc: R`Affine-space Céa's lemma multiplier bounding Galerkin error relative to best approximation in $\mathcal{S}_h$.` }
        ]
      },

      // 19. A priori convergence, duality, and singularities
      {
        id: 'convergence-rates',
        partId: 'part-3',
        layout: 'split',
        labId: 'convergence-rates-lab',
        title: 'A priori convergence, duality, and singularities',
        plainTitle: 'A priori convergence, duality, and singularities',
        lectureBadges: ['PS8 · CompMechBook §5 · Aubin-Nitsche'],
        contentHtml: R`
          <div class="eq-card">
            <div class="eq-card-label">A Priori Error Rates for $P_k$ Elements (Smooth $u$)</div>
            <div>$$\|u - u_h\|_{1,2} = \mathcal{O}(h^k), \qquad \|u - u_h\|_{0,2},\; \|u - u_h\|_{L^1} = \mathcal{O}(h^{k+1})$$</div>
          </div>
          <div class="eq-card is-accent">
            <div class="eq-card-label">Singular Regularity Limit (1D $x^\gamma$ vs. 2D Corner $r^\gamma$)</div>
            <div>$$\begin{aligned} \|u - u_h\|_{H^1} &= \mathcal{O}\bigl(h^{\min(k,\,\gamma - 1/2)}\bigr) \quad \text{in 1D } (x^\gamma) \\ \|u - u_h\|_{H^1} &= \mathcal{O}\bigl(h^{\min(k,\,\gamma)}\bigr) \quad \text{in 2D } (r^\gamma,\; \text{L-corner } \gamma = \tfrac{2}{3}) \end{aligned}$$</div>
          </div>
          <ul class="point-list">
            <li><strong>Polynomial order $k$:</strong> combining Céa's lemma with interpolation error gives $H^1$ rate $k$ (gradients) and Aubin-Nitsche duality lifts $L^2$ and $L^1$ rates to $k+1$.</li>
            <li><strong>Verification table ($-u'' = \sin(\pi x)$):</strong> halving $h$ cuts $P_1$ $H^1$ error by $2\times$ and $L^2$ error by $4\times$; $P_2$ cuts them by $4\times$ and $8\times$.</li>
            <li><strong>When assumptions fail (PS8 closing question):</strong> re-entrant corners, cracks, or discontinuous coefficients limit regularity $u \notin H^{k+1}$, capping uniform $h$-refinement unless graded or adaptive ($hp$) meshes concentrate elements at the singularity.</li>
          </ul>
        `,
        symbols: [
          { sym: R`$h, k$`, short: 'Mesh size & degree', desc: R`Characteristic element diameter $h$ and complete polynomial degree $k$ of the finite element basis.` },
          { sym: R`$\gamma$`, short: 'Singularity exponent', desc: R`Power singularity exponent: 1D $x^\gamma \in H^{\gamma+1/2-\epsilon}$ gives $H^1$ rate $\gamma - 1/2$, while 2D radial corner $r^\gamma \in H^{1+\gamma-\epsilon}$ gives $H^1$ rate $\gamma$ ($\gamma = 2/3$ for L-corner, $\gamma = 1/2$ for slit crack).` },
          { sym: R`$\|e\|_{L^1}$`, short: 'L1 error norm', desc: R`Absolute error integral $\int_\Omega |u - u_h|\,\mathrm{d}\Omega$, bounded by $|\Omega|^{1/2}\|u - u_h\|_{0,2} = \mathcal{O}(h^{k+1})$.` },
          { sym: R`$hp\text{-FEM}$`, short: 'Adaptive refinement', desc: R`Simultaneous mesh grading ($h$) toward singularities and higher polynomial order ($p$) in smooth regions.` }
        ]
      },

      // 20. Standard 7-step FEA workflow
      {
        id: 'workflow',
        partId: 'synthesis',
        layout: 'split',
        labId: 'workflow-stepper-fea',
        title: 'Standard 7-step FEA workflow',
        plainTitle: 'Standard 7-step FEA workflow',
        lectureBadges: ['FEARev §3 · Verification Mindset'],
        contentHtml: R`
          <ul class="point-list is-numbered">
            <li><strong>Strong form:</strong> state PDE on $\Omega$ with Dirichlet ($\Gamma_D$), Neumann ($\Gamma_N$), and Robin BCs.</li>
            <li><strong>Weak form:</strong> multiply by $v \in \mathcal{V}$ and integrate by parts to obtain $a(u,v) = \ell(v)$.</li>
            <li><strong>Mesh and elements:</strong> partition $\Omega$ into 1D/2D/3D elements $\Omega_e$ and build connectivity <code>LG</code>/<code>LV</code>.</li>
            <li><strong>Shape functions and quadrature:</strong> pick $P_1/P_2/Q_4$/Hermite $N_a^e$ and integrate $\mathbf{k}^e, \mathbf{f}^e$ with Gauss rules.</li>
            <li><strong>Global assembly and BCs:</strong> scatter via $K_{\mathrm{LG}(a,e),\mathrm{LG}(b,e)} \mathrel{+}= K_{ab}^e$ and impose essential BCs (lift, penalty, LM, or Nitsche).</li>
            <li><strong>Solve and post-process:</strong> solve $\mathbf{K}\mathbf{U} = \mathbf{F}$ and recover gradients, fluxes, and stresses.</li>
            <li><strong>Verify:</strong> check row sums, patch tests, and log-log $L^2$/$H^1$ convergence rates on a manufactured solution.</li>
          </ul>
          <div class="callout-card">
            <strong>Benchmark mindset:</strong> verify every new element or solver on a manufactured solution and check the $\mathcal{O}(h^{k+1})$ / $\mathcal{O}(h^k)$ slope before trusting production meshes.
          </div>
        `,
        symbols: [
          { sym: R`$\text{MMS}$`, short: 'Manufactured solution', desc: R`Method of Manufactured Solutions choosing a known smooth $u_{\mathrm{ex}}$, deriving $f = \mathcal{L}u_{\mathrm{ex}}$, and verifying exact $\mathcal{O}(h^p)$ slopes.` },
          { sym: R`$\sum_B K_{AB}=0$`, short: 'Row-sum check', desc: R`Partition-of-unity check verifying that stiffness matrix rows sum to zero for pure diffusion/elasticity.` },
          { sym: R`$\text{Patch test}$`, short: 'Consistency test', desc: R`Constant-gradient benchmark ensuring distorted meshes reproduce linear fields exactly.` }
        ]
      },

      // 21. Problem session & resource map
      {
        id: 'session-map',
        partId: 'synthesis',
        layout: 'atlas',
        labId: null,
        title: 'Problem session &amp; resource map',
        plainTitle: 'Problem session & resource map',
        lead: "Navigate Hanfeng Zhai's Stanford ME 335A problem sessions, tutorials, and notes, and jump straight to the matching interactive slide.",
        overviewHint: 'Interactive Session & PDF Atlas',
        symbols: []
      },

      // 22. Takeaways
      {
        id: 'takeaways',
        partId: 'synthesis',
        layout: 'bento',
        labId: 'takeaways-fem-bridge',
        title: 'Takeaways',
        plainTitle: 'Takeaways',
        lead: 'Four core pillars connecting variational PDEs, element implementation, error guarantees, and advanced FEA.',
        overviewHint: 'Four Core Pillars',
        contentHtml: R`
          <article class="bento-card">
            <div class="bento-card-kicker">01 · Variational</div>
            <h3 class="bento-card-title">Weak Forms Unify Physics</h3>
            <p class="bento-card-body">Integration by parts puts heat transfer, advection-diffusion, beams, and linear elasticity into one bilinear template $a(u,v) = \ell(v)$.</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">02 · Discretization</div>
            <h3 class="bento-card-title">Reference Elements &amp; LG</h3>
            <p class="bento-card-body">Isoparametric maps, Gauss quadrature, and <code>LG</code> scatter assemble sparse global systems identically across 1D, 2D, and 3D meshes.</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">03 · Theory</div>
            <h3 class="bento-card-title">Céa &amp; Convergence Proofs</h3>
            <p class="bento-card-body">Coercivity $\alpha$, Galerkin orthogonality, and Sobolev regularity predict exact $\mathcal{O}(h^k)$ and $\mathcal{O}(h^{k+1})$ verification slopes.</p>
          </article>
          <article class="bento-card">
            <div class="bento-card-kicker">04 · Extensions</div>
            <h3 class="bento-card-title">Beyond Linear Statics</h3>
            <p class="bento-card-body">The same primal engine extends directly to linear dynamics (ME 335B: $\mathbf{M}\ddot{\mathbf{U}}+\mathbf{K}\mathbf{U}=\mathbf{F}$) and nonlinear FEA (ME 335C: Newton-Raphson $\mathbf{K}_T\Delta\mathbf{U}=-\mathbf{R}$).</p>
          </article>
        `,
        symbols: [
          { sym: R`$\mathbf{M}$`, short: 'Mass matrix', desc: R`Consistent mass matrix $M_{ab} = \int_\Omega \rho N_b N_a\,\mathrm{d}\Omega$ entering linear elastodynamics (ME 335B).` },
          { sym: R`$\mathbf{K}_T, \mathbf{R}$`, short: 'Tangent & residual', desc: R`Consistent tangent stiffness $\mathbf{K}_T = \partial\mathbf{R}/\partial\mathbf{U}$ and out-of-balance residual $\mathbf{R}(\mathbf{U})$ in nonlinear FEA (ME 335C).` },
          { sym: R`$a(u,v)=\ell(v)$`, short: 'Variational core', desc: R`Unified weak-form template spanning scalar diffusion, beams, elasticity, and time-dependent PDEs.` }
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
        lead: 'Personal ME 335A notes, foundational FEA textbooks, and open variational solver frameworks.',
        overviewHint: 'Books & Course Links',
        symbols: []
      }
    ],

    lectureMap: [
      {
        partId: 'part-1',
        kicker: 'Part I',
        title: 'Variational & 1D',
        lectures: [
          {
            num: 1,
            title: 'PS 1: Variational formulations (Ex. 1.10)',
            targetId: 'strong-to-weak',
            pdfUrl: 'https://hanfengzhai.com/file/teaching/fea/ProbSess1.pdf'
          },
          {
            num: 2,
            title: 'PS 2: Vector spaces, Euler-Lagrange & Nitsche',
            targetId: 'spaces-variations',
            pdfUrl: 'https://hanfengzhai.com/file/teaching/fea/ProbSess2.pdf'
          },
          {
            num: 3,
            title: 'PS 3: 1D advection-diffusion & hat basis',
            targetId: 'galerkin-1d',
            pdfUrl: 'https://hanfengzhai.com/file/teaching/fea/ProbSess3.pdf'
          },
          {
            num: 4,
            title: 'PS 4: LG map (P1, P2 Ex. 3.11) & 1D assembly',
            targetId: 'lg-assembly',
            pdfUrl: 'https://hanfengzhai.com/file/teaching/fea/ProbSess4.pdf'
          },
          {
            num: 5,
            title: 'PS 5: C1 Hermite elements & beam bending',
            targetId: 'hermite-beam',
            pdfUrl: 'https://hanfengzhai.com/file/teaching/fea/ProbSess5.pdf'
          }
        ]
      },
      {
        partId: 'part-2',
        kicker: 'Part II',
        title: '2D/3D & Solvers',
        lectures: [
          {
            num: 6,
            title: 'PS 6: 2D P1 assembly & reduced LGe',
            targetId: 'assembly-2d-p1',
            pdfUrl: 'https://hanfengzhai.com/file/teaching/fea/ProbSess6.pdf'
          },
          {
            num: 7,
            title: 'Tutorial A: Firedrake 2D Poisson (Colab)',
            targetId: 'constraints-solvers',
            pdfUrl: 'https://hanfengzhai.com/file/teaching/fea/Firedrake_tutorial.pdf'
          },
          {
            num: 8,
            title: 'Tutorial B: FEniCS + Gmsh 2D Poisson',
            targetId: 'constraints-solvers',
            pdfUrl: 'https://hanfengzhai.com/file/teaching/fea/FEniCS_tutorial.pdf'
          },
          {
            num: 9,
            title: 'PS 9: Final review, 2D heterogeneous heat fin',
            targetId: 'heat-fin-2d',
            pdfUrl: 'https://hanfengzhai.com/file/teaching/fea/ProbSess9.pdf'
          }
        ]
      },
      {
        partId: 'part-3',
        kicker: 'Part III',
        title: 'Theory & Summaries',
        lectures: [
          {
            num: 10,
            title: "PS 8: L2/H1 norms, coercivity & Céa's lemma",
            targetId: 'sobolev-norms',
            pdfUrl: 'https://hanfengzhai.com/file/teaching/fea/ProbSess8.pdf'
          },
          {
            num: 11,
            title: 'FEARev: Short Introduction to FEA (5 pp.)',
            targetId: 'workflow',
            pdfUrl: 'https://hanfengzhai.com/file/teaching/fea/FEARev.pdf'
          },
          {
            num: 12,
            title: 'FEA_notes: Complete ME 335A Lecture Notes (133 pp.)',
            targetId: 'cea-coercivity',
            pdfUrl: 'https://hanfengzhai.com/file/teaching/notes/FEA_notes.pdf'
          },
          {
            num: 13,
            title: 'ProbSess_FEA: Compiled Sessions Omnibus (67 pp.)',
            targetId: 'glance',
            pdfUrl: 'https://hanfengzhai.com/file/teaching/notes/ProbSess_FEA.pdf'
          },
          {
            num: 14,
            title: 'NonlinFEA_note: Nonlinear FEA Extension (85 pp.)',
            targetId: 'takeaways',
            pdfUrl: 'https://hanfengzhai.com/file/teaching/notes/NonlinFEA_note.pdf'
          }
        ]
      }
    ],

    allSymbols: [
      // Overview & Part I · Variational & 1D
      { sym: R`$\Omega, \Omega_e$`, desc: R`Physical PDE domain $\Omega$ partitioned into non-overlapping finite elements $\Omega_e$ (or $K_e$).`, part: 'Part I · Variational & 1D' },
      { sym: R`$\Gamma_D, \Gamma_N$`, desc: R`Disjoint Dirichlet ($\Gamma_D$ or $\Gamma_g$) and Neumann ($\Gamma_N$ or $\Gamma_h$) boundary subsets ($\partial\Omega = \Gamma_D \cup \Gamma_N$).`, part: 'Part I · Variational & 1D' },
      { sym: R`$u_D, t_N$`, desc: R`Prescribed Dirichlet value $u|_{\Gamma_D} = u_D$ (or $g$) and prescribed Neumann flux $k\nabla u\cdot\mathbf{n}|_{\Gamma_N} = t_N$ (or $h$).`, part: 'Part I · Variational & 1D' },
      { sym: R`$R_\Omega$`, desc: R`Pointwise strong-form residual $R_\Omega = \mathcal{L}\hat{u} - f$ minimized in weighted projections.`, part: 'Part I · Variational & 1D' },
      { sym: R`$a(u,v), \ell(v)$`, desc: R`Bilinear energy form (trial $u$ first, test $v$ second) and linear load functional (also written $L(v)$).`, part: 'Part I · Variational & 1D' },
      { sym: R`$\mathcal{S}, \mathcal{V}$`, desc: R`Affine trial space $\mathcal{S} = \bar{u} + \mathcal{V}$ ($u|_{\Gamma_D} = u_D$) and linear test vector space $\mathcal{V}$ ($v|_{\Gamma_D} = 0$).`, part: 'Part I · Variational & 1D' },
      { sym: R`$\mathcal{W}_h, \mathcal{S}_h, \mathcal{V}_h$`, desc: R`Finite-dimensional discrete base, trial, and test finite element spaces on a mesh of size $h$.`, part: 'Part I · Variational & 1D' },
      { sym: R`$\delta P$`, desc: R`First variation of potential energy functional $P(u)$ yielding Euler-Lagrange equilibrium.`, part: 'Part I · Variational & 1D' },
      { sym: R`$\mu$`, desc: R`Nitsche boundary stabilization parameter (PS2 Ex. 2.20) or 1D advection velocity (PS3).`, part: 'Part I · Variational & 1D' },
      { sym: R`$N_A, N_a^e$`, desc: R`Global nodal shape function $N_A$ ($N_A(\mathbf{x}_B)=\delta_{AB}$) stitched from local element shape functions $N_a^e$.`, part: 'Part I · Variational & 1D' },
      { sym: R`$K_{ab} = a(N_b,N_a)$`, desc: R`Trial-first global stiffness matrix entry ensuring correct sign on non-symmetric advection terms.`, part: 'Part I · Variational & 1D' },
      { sym: R`$\mathbf{K}\mathbf{U}=\mathbf{F}$`, desc: R`Assembled discrete finite element matrix system solving for global nodal DOF vector $\mathbf{U}$.`, part: 'Part I · Variational & 1D' },
      { sym: R`$\mathrm{Pe}_h$`, desc: R`Element Péclet number $\mu\Delta x/(2D)$; $\mathrm{Pe}_h \gt 1$ produces spurious Galerkin oscillations.`, part: 'Part I · Variational & 1D' },
      { sym: R`$\text{SUPG}$`, desc: R`Streamline-Upwind Petrov-Galerkin consistent stabilization removing advection oscillations.`, part: 'Part I · Variational & 1D' },
      { sym: R`$\mathrm{LG}(a,e)$`, desc: R`Local-to-global DOF connectivity table mapping local basis index $a$ on element $e$ to global DOF $A$.`, part: 'Part I · Variational & 1D' },
      { sym: R`$\mathbf{k}^e, \mathbf{L}_e$`, desc: R`Local element stiffness matrix $\mathbf{k}^e$ and boolean scatter operator assembling $\mathbf{K} = \sum_e \mathbf{L}_e^\top \mathbf{k}^e \mathbf{L}_e$.`, part: 'Part I · Variational & 1D' },
      { sym: R`$T_h^g$`, desc: R`Discrete Dirichlet lifting field moving known boundary values to the right-hand side.`, part: 'Part I · Variational & 1D' },
      { sym: R`$EI, u_A, \theta_A$`, desc: R`Euler-Bernoulli beam flexural rigidity $EI$ and nodal Hermite DOFs (deflection $u_A$, slope $\theta_A = u'_A$).`, part: 'Part I · Variational & 1D' },
      { sym: R`$H^2(\Omega)$`, desc: R`Sobolev space with square-integrable second weak derivatives required by $C^1$ beam elements.`, part: 'Part I · Variational & 1D' },

      // Part II · 2D/3D & Solvers
      { sym: R`$\hat{\Omega}, \boldsymbol{\xi}$`, desc: R`Reference parent element domain and natural coordinates $\boldsymbol{\xi} = (\xi, \eta)$ for isoparametric mapping.`, part: 'Part II · 2D/3D & Solvers' },
      { sym: R`$\mathbf{J}, \det\mathbf{J}$`, desc: R`Isoparametric Jacobian $J_{ij} = \partial x_i/\partial \xi_j$ and area/volume determinant ($\det\mathbf{J} \gt 0$ required).`, part: 'Part II · 2D/3D & Solvers' },
      { sym: R`$P_1, P_2, Q_4$`, desc: R`Standard 2D Lagrange elements: linear triangle ($P_1$), quadratic triangle ($P_2$), and bilinear quad ($Q_4$).`, part: 'Part II · 2D/3D & Solvers' },
      { sym: R`$\xi_q, w_q, Q$`, desc: R`Gauss-Legendre quadrature nodes and weights integrating polynomials of degree $\le 2Q-1$ exactly.`, part: 'Part II · 2D/3D & Solvers' },
      { sym: R`$\mathrm{LV}, \mathrm{LG}^e$`, desc: R`Counter-clockwise local-to-vertex table $\mathrm{LV}$ and reduced free-DOF connectivity $\mathrm{LG}^e$ (Dirichlet entries set to 0).`, part: 'Part II · 2D/3D & Solvers' },
      { sym: R`$k^e, \mathbf{q}^e$`, desc: R`Element thermal conductivity $k^e$ and post-processed Fourier heat flux $\mathbf{q}^e = -k^e\nabla T_h$ (PS9).`, part: 'Part II · 2D/3D & Solvers' },
      { sym: R`$\boldsymbol{\varepsilon}(\mathbf{u}), \mathbb{C}$`, desc: R`Symmetric small-strain tensor $\frac{1}{2}(\nabla\mathbf{u}+\nabla\mathbf{u}^\top)$ and fourth-order linear elasticity tensor.`, part: 'Part II · 2D/3D & Solvers' },
      { sym: R`$\mathbf{B}, \mathbf{D}$`, desc: R`Voigt strain-displacement matrix $\mathbf{B}$ and constitutive matrix $\mathbf{D}$ forming $\mathbf{k}^e = \int_{\Omega_e}\mathbf{B}^\top\mathbf{D}\mathbf{B}\,\mathrm{d}\Omega$.`, part: 'Part II · 2D/3D & Solvers' },
      { sym: R`$\nu, \lambda$`, desc: R`Poisson's ratio $\nu$ and Lamé constant $\lambda = E\nu/[(1+\nu)(1-2\nu)]$; $\nu\to 0.5$ induces volumetric locking.`, part: 'Part II · 2D/3D & Solvers' },
      { sym: R`$\text{SRI} / \bar{B}$`, desc: R`Selective Reduced Integration splitting deviatoric and volumetric integrals to cure incompressible locking.`, part: 'Part II · 2D/3D & Solvers' },
      { sym: R`$\mathbf{C}, \beta, \boldsymbol{\lambda}$`, desc: R`Linear constraint matrix $\mathbf{C}\mathbf{U}=\mathbf{g}$, penalty weight $\beta$, and exact Lagrange multipliers $\boldsymbol{\lambda}$.`, part: 'Part II · 2D/3D & Solvers' },
      { sym: R`$\kappa(\mathbf{K})$`, desc: R`Matrix condition number measuring sensitivity of $\mathbf{K}\mathbf{U}=\mathbf{F}$ to roundoff and solver iterations.`, part: 'Part II · 2D/3D & Solvers' },
      { sym: R`$\text{UFL}$`, desc: R`Unified Form Language used by Firedrake and FEniCS to compile symbolic weak forms into C/PETSc kernels.`, part: 'Part II · 2D/3D & Solvers' },

      // Part III · Math Theory
      { sym: R`$\|v\|_{0,2}$`, desc: R`Square-integrable $L^2(\Omega)$ norm $\left(\int_\Omega v^2\,\mathrm{d}\Omega\right)^{1/2}$.`, part: 'Part III · Math Theory' },
      { sym: R`$|v|_{1,2}, \|v\|_{1,2}$`, desc: R`Sobolev $H^1$ seminorm $\left(\int_\Omega |\nabla v|^2\,\mathrm{d}\Omega\right)^{1/2}$ and full $H^1$ norm $\sqrt{\|v\|_{0,2}^2 + |v|_{1,2}^2}$.`, part: 'Part III · Math Theory' },
      { sym: R`$M, \alpha$`, desc: R`Bilinear continuity upper bound $M$ and coercivity lower bound $\alpha \gt 0$ in Lax-Milgram theorem.`, part: 'Part III · Math Theory' },
      { sym: R`$\|v\|_a$`, desc: R`Energy norm $\sqrt{a(v,v)}$ minimized exactly by symmetric Galerkin projection $u_h$.`, part: 'Part III · Math Theory' },
      { sym: R`$1 + M/\alpha$`, desc: R`Prof. Lew's affine Céa's lemma quasi-optimality constant bounding $\|u - u_h\|_{H^1}$.`, part: 'Part III · Math Theory' },
      { sym: R`$h, k$`, desc: R`Maximum element diameter $h$ and complete element polynomial degree $k$ setting $\mathcal{O}(h^k)$ and $\mathcal{O}(h^{k+1})$ rates.`, part: 'Part III · Math Theory' },
      { sym: R`$\gamma$`, desc: R`Power singularity exponent: 1D $x^\gamma \in H^{\gamma+1/2-\epsilon}$ gives $H^1$ rate $\min(k, \gamma - 1/2)$, while 2D radial corner $r^\gamma \in H^{1+\gamma-\epsilon}$ gives $H^1$ rate $\min(k, \gamma)$ ($\gamma = 2/3$ for L-corner, $\gamma = 1/2$ for slit crack).`, part: 'Part III · Math Theory' },

      // Workflow & Synthesis
      { sym: R`$\text{MMS}$`, desc: R`Method of Manufactured Solutions verifying solver assembly and theoretical convergence slopes.`, part: 'Workflow & Synthesis' },
      { sym: R`$\mathbf{M}$`, desc: R`Consistent mass matrix in ME 335B linear dynamics ($\mathbf{M}\ddot{\mathbf{U}} + \mathbf{K}\mathbf{U} = \mathbf{F}$).`, part: 'Workflow & Synthesis' },
      { sym: R`$\mathbf{K}_T, \mathbf{R}$`, desc: R`Tangent stiffness and residual vector in ME 335C Newton-Raphson nonlinear FEA ($\mathbf{K}_T\Delta\mathbf{U} = -\mathbf{R}$).`, part: 'Workflow & Synthesis' }
    ],

    references: [
      {
        kind: 'Primary Textbook',
        title: 'The Finite Element Method: Linear Static and Dynamic Finite Element Analysis',
        citation: 'T. J. R. Hughes, Prentice-Hall (1987) / Dover Publications (2000/2003).',
        url: null
      },
      {
        kind: 'Mathematical Theory',
        title: 'Numerical Solution of PDEs by the Finite Element Method & Mathematical Theory of FEM',
        citation: 'C. Johnson (Dover, 2009); S. C. Brenner & L. R. Scott (3rd ed., Springer, 2008); G. Strang & G. J. Fix (2nd ed., 2008).',
        url: null
      },
      {
        kind: 'Personal Lecture Notes',
        title: 'ME 335A Finite Element Analysis Notes (133 pp.)',
        citation: 'Hanfeng Zhai, Stanford ME 335A (Prof. Adrian J. Lew).',
        url: 'https://hanfengzhai.com/file/teaching/notes/FEA_notes.pdf',
        linkLabel: 'Open Lecture Notes PDF'
      },
      {
        kind: 'Problem Sessions & Summary',
        title: 'Winter 2025 Problem Sessions Omnibus & Short FEA Review',
        citation: 'Hanfeng Zhai, PS1-PS9 and Firedrake/FEniCS tutorials (67 pp.).',
        url: 'https://hanfengzhai.com/file/teaching/notes/ProbSess_FEA.pdf',
        linkLabel: 'Open Problem Sessions PDF'
      },
      {
        kind: 'Open Variational Solvers',
        title: 'Firedrake & FEniCSx (UFL Documentation)',
        citation: 'High-level Python and UFL finite element frameworks.',
        url: 'https://www.firedrakeproject.org/',
        linkLabel: 'Open Firedrake Project'
      },
      {
        kind: 'Printable Edition',
        title: 'ME 335A Intro Slides (PDF) & Short Summary',
        citation: 'Archival printable monograph matching this interactive deck.',
        url: 'https://hanfengzhai.com/file/teaching/intros/ME335_Intro.pdf',
        linkLabel: 'Download Intro PDF'
      }
    ]
  };
})();
