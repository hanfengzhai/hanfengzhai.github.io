# `assets/` — static media

## Layout

| Path | Contents |
|------|----------|
| `img/site/` | Avatar, favicon-related images |
| `img/research/` | Research overview schematic and multiscale figures |
| `img/publications/` | Paper schematics on the homepage |
| `img/code/` | Code project schematics |
| `img/news/` | News section photos on the homepage |
| `img/gallery/simulations/` | Animated simulation GIFs |
| `img/gallery/people/` | Photos with collaborators/professors |
| `img/gallery/art/` | Art and figure drawings |
| `img/gallery/enamel/` | Enamel-related gallery images |
| `img/gallery/misc/` | Other gallery images |
| `media/` | Video (`.mov`, `.m4v`) and large PDFs |
| `fonts/` | Web fonts (Latin Modern, TeX Gyre Pagella) |
| `js/` | Client-side libraries (e.g. DPlayer) |

## Adding assets

1. Put images under the themed `img/` subfolder above.
2. Put video/large PDFs in `media/`.
3. Reference with absolute paths (`/assets/img/...`) in HTML.
4. Run `python3 scripts/verify-links.py` to confirm links resolve.
