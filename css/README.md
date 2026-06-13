# `css/` — site stylesheets and UI assets

## Layout

| Path | Purpose |
|------|---------|
| `styles/` | Page and component stylesheets |
| `vendor/` | Third-party CSS (Bootstrap) |
| `fonts/` | Icon and legacy theme fonts |
| `images/site/` | Active UI images (favicon, back-to-top sprite) |
| `images/archive/` | Unreferenced legacy template images |
| `unused/` | Stylesheets not linked by any page |

## Linking

HTML pages load styles from `/css/styles/...` and Bootstrap from `/css/vendor/bootstrap.css`.

CSS `url(...)` paths are relative to the file that declares them.

Run `python3 scripts/verify-links.py` after moving files.
