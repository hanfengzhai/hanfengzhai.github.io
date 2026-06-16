# ME 340 — HTML intro slides

Web version of `ME340_Intro.pdf` (Reveal.js + KaTeX), styled with the Stanford palette from the Beamer deck.

## View on the site

- Slides: `/file/teaching/intros/me340/`
- PDF: `/file/teaching/intros/ME340_Intro.pdf`

Linked from the homepage and the teaching notes page.

## View locally

```bash
cd file/teaching/intros/me340
python3 -m http.server 8080
```

Open `http://localhost:8080/` in a browser.

## Regenerate

After editing slide content in `build.py`:

```bash
python3 build.py
```

Commit both `build.py` and `index.html` so deploy does not require running the script.

## Navigation

- Arrow keys / space: next/previous slide
- `Esc`: slide overview
- `#/2` URL hash jumps to slide 2 (shareable deep links)
