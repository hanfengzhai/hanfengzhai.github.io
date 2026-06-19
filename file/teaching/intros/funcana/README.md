# Functional Analysis — PROM HTML slides

Web version of the Beamer deck on goal-oriented projection-based model order reduction (Reveal.js + KaTeX).

## View on the site

- Slides: `/file/teaching/intros/funcana/`
- Beamer source: `Writings.git/Notes/FunctionalAnalysis/slides.tex`

Linked from the [teaching notes](/note.html) page.

## View locally

```bash
cd file/teaching/intros/funcana
python3 -m http.server 8080
```

Open `http://localhost:8080/`.

## Regenerate

```bash
python3 build.py
```

Commit both `build.py` and `index.html` so deploy does not require running the script.
