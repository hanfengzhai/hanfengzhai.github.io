# `file/` — downloadable documents

Organized site assets linked from HTML pages (papers, teaching, posters, etc.).

## Layout

| Folder | Contents |
|--------|----------|
| `publications/` | Journal/conference paper PDFs |
| `ref/` | BibTeX citation HTML stubs (one per paper) |
| `teaching/fea/` | ME335A finite element analysis problem sessions |
| `teaching/elasticity/` | ME340 elasticity & inelasticity problem sessions |
| `teaching/notes/` | Course study notes and topic PDFs |
| `teaching/intros/` | Short course intro slides (e.g. ME340 HTML + PDF) |
| `posters/` | Talk and poster PDFs/PNGs |
| `career/` | CV, thesis, research statement, awards |
| `coursework/` | Homework sets grouped by course |
| `projects/` | Undergraduate project reports (e.g. TherMaG) |
| `archive/` | Unlinked legacy files kept for reference |

## Naming

- **Publications:** `{author}_{venue}_{year}.pdf` (keep existing names when linked)
- **Teaching:** keep session filenames (`ProbSess1.pdf`, etc.)
- **New files:** place in the folder above; run `python3 scripts/verify-links.py` after updating HTML links
