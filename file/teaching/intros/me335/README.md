# ME 335A: Interactive Intro Slides

Interactive HTML slide deck for Stanford ME 335A (Finite Element Analysis, cross-listed CME 335), built with KaTeX and zero-build vanilla HTML, CSS, and JavaScript.

## View on the site

- Slides: `/file/teaching/intros/me335/`
- Printable PDF: `/file/teaching/intros/ME335_Intro.pdf`
- Lecture notes: `/file/teaching/notes/FEA_notes.pdf`
- Problem sessions: `/file/teaching/notes/ProbSess_FEA.pdf`
- Short FEA review: `/file/teaching/fea/FEARev.pdf`

## Structure

- `index.html`: Slide viewport, top and bottom bars, symbol drawer, overview grid, and shortcuts modal.
- `css/tokens.css`, `css/layout.css`, `css/components.css`: Design tokens (dark charcoal and light archival paper themes), responsive layouts, and print styles.
- `js/engine/deck-engine.js`: Slide navigation, URL hash routing (`#1`..`#23` and legacy `#/0`..`#/22`), KaTeX rendering, symbol glossary, and lab lifecycle.
- `js/data/deck-data.js`: All 23 slides, 14-item problem session and resource atlas, symbol glossary, and references.
- `js/labs/foundations-labs.js` and `js/labs/advanced-labs.js`: 20 interactive HTML5 Canvas numerical labs covering variational formulations, 1D and 2D assembly, quadrature, elasticity, constraints, and error theory.

## View locally

Open `index.html` directly in any modern browser, or serve the folder over HTTP.

## Controls

- `←` / `→` / `Space`: Previous and next slide
- `S`: Open symbol glossary drawer
- `G` or `O`: Open 23-slide overview grid
- `T`: Switch dark studio and light paper themes
- `A`: Toggle autoplay
- `F`: Toggle fullscreen
- `?`: Show keyboard shortcuts
