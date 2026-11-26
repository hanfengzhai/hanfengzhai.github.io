# ME 340: Interactive Intro Slides

Interactive HTML slide deck for Stanford ME 340 (Mechanics: Elasticity and Inelasticity), built with KaTeX and zero-build vanilla HTML, CSS, and JavaScript.

## View on the site

- Slides: `/file/teaching/intros/me340/`
- Printable PDF: `/file/teaching/intros/ME340_Intro.pdf`
- Study notes: `/file/teaching/notes/elasticity_notes.pdf`

## Structure

- `index.html`: Slide viewport, top and bottom bars, symbol drawer, overview grid, and shortcuts modal.
- `css/tokens.css`, `css/layout.css`, `css/components.css`: Design tokens (dark charcoal and light archival paper themes), responsive layouts, and print styles.
- `js/engine/deck-engine.js`: Slide navigation, URL hash routing (`#1`..`#23` and legacy `#/0`..`#/22`), KaTeX rendering, symbol glossary, and lab lifecycle.
- `js/data/deck-data.js`: All 23 slides, 23-lecture map, symbol glossary, and references.
- `js/labs/elasticity-labs.js` and `js/labs/inelastic-labs.js`: 20 interactive HTML5 Canvas physics labs covering elasticity, plasticity, and fracture mechanics.

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
