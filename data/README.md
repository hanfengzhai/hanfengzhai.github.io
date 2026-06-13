# `data/` — notebook support files

Simulation outputs, plots, and scripts served for coursework notebooks (especially MSE5720 DFT homework exports).

## Layout

| Folder | Contents |
|--------|----------|
| `coursework/mse5720/` | MSE5720 DFT homework data, plots, and helper scripts |
| `coursework/mae6260/` | MAE6260 simulation outputs and notebook |
| `coursework/mdo/` | MDO MATLAB Live scripts (`.mlx`) |
| `projects/darpa/` | DARPA spot-ID text datasets |
| `projects/thermag/` | TherMaG project videos |
| `projects/arxde/` | ARXDE supplementary media |
| `archive/` | Unlinked legacy files kept for reference |

## Linking from notebooks

Use site-root paths in exported HTML, e.g. `/data/coursework/mse5720/CCO_newest.png`.

After moving files, run `python3 scripts/verify-links.py`.
