#!/usr/bin/env python3
"""
Generate a 3D polycrystal-like volume mesh with Voronoi grain IDs.

Each hex cell is assigned to the nearest random grain seed (Voronoi labeling).
The output VTU/VTK file carries a cell field ``grain_id`` for coloring in
ParaView or OVITO with a seismic colormap.

This is a labeled volume mesh for visualization, not an atomistic lattice or
an explicit grain-boundary surface mesh. For equiaxed polycrystals with exact
GB surfaces, consider Neper (``neper -T``) as a follow-up.

ParaView
--------
1. File -> Open polycrystal.vtu
2. Apply -> Color by ``grain_id``
3. Edit colormap -> Seismic

OVITO
-----
1. File -> Load polycrystal.vtu (or .vtk)
2. Add Color coding modifier -> property ``grain_id``
3. Choose a seismic-like palette in the viewport
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pyvista as pv


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a 3D Voronoi-labeled polycrystal mesh for ParaView/OVITO."
    )
    parser.add_argument("--grains", type=int, default=80, help="Number of grains (default: 80)")
    parser.add_argument("--nx", type=int, default=64, help="Cells in x (default: 64)")
    parser.add_argument("--ny", type=int, default=64, help="Cells in y (default: 64)")
    parser.add_argument("--nz", type=int, default=64, help="Cells in z (default: 64)")
    parser.add_argument("--seed", type=int, default=0, help="RNG seed for grain seeds (default: 0)")
    parser.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parent / "polycrystal.vtu",
        help="Output mesh path (default: tmp/polycrystal.vtu)",
    )
    parser.add_argument(
        "--format",
        choices=("vtu", "vtk", "both"),
        default="vtu",
        help="Output format (default: vtu)",
    )
    parser.add_argument(
        "--preview",
        action="store_true",
        help="Save a seismic-colored preview PNG next to the mesh output",
    )
    return parser.parse_args()


def build_polycrystal(n_grains: int, nx: int, ny: int, nz: int, seed: int) -> pv.UnstructuredGrid:
    if n_grains < 1:
        raise ValueError("--grains must be >= 1")
    for name, n in ("nx", nx), ("ny", ny), ("nz", nz):
        if n < 1:
            raise ValueError(f"--{name} must be >= 1")

    rng = np.random.default_rng(seed)
    seeds = rng.random((n_grains, 3))

    grid = pv.ImageData(
        dimensions=(nx + 1, ny + 1, nz + 1),
        spacing=(1.0 / nx, 1.0 / ny, 1.0 / nz),
        origin=(0.0, 0.0, 0.0),
    )
    mesh = grid.cast_to_unstructured_grid()
    centers = mesh.cell_centers().points

    # Voronoi labeling: each cell belongs to the nearest grain seed.
    distances = np.linalg.norm(centers[:, None, :] - seeds[None, :, :], axis=2)
    grain_ids = np.argmin(distances, axis=1).astype(np.int32)

    mesh.cell_data["grain_id"] = grain_ids
    if n_grains > 1:
        mesh.cell_data["grain_id_norm"] = grain_ids.astype(np.float64) / (n_grains - 1)
    else:
        mesh.cell_data["grain_id_norm"] = np.zeros(mesh.n_cells, dtype=np.float64)

    return mesh


def export_mesh(mesh: pv.UnstructuredGrid, out_path: Path, fmt: str) -> list[Path]:
    out_path = out_path.resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []

    if fmt in ("vtu", "both"):
        vtu_path = out_path if out_path.suffix.lower() == ".vtu" else out_path.with_suffix(".vtu")
        mesh.save(vtu_path)
        written.append(vtu_path)

    if fmt in ("vtk", "both"):
        vtk_path = out_path if out_path.suffix.lower() == ".vtk" else out_path.with_suffix(".vtk")
        mesh.save(vtk_path)
        written.append(vtk_path)

    return written


def save_preview(mesh: pv.UnstructuredGrid, preview_path: Path) -> Path:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    preview_path = preview_path.resolve()
    preview_path.parent.mkdir(parents=True, exist_ok=True)

    mid_z = 0.5 * (mesh.bounds[4] + mesh.bounds[5])
    slice_mesh = mesh.slice(normal="z", origin=(0.5, 0.5, mid_z))
    grain_ids = slice_mesh.cell_data["grain_id"]
    centers = slice_mesh.cell_centers().points[:, :2]
    n_grains = int(grain_ids.max()) + 1 if grain_ids.size else 1
    cmap = plt.colormaps["seismic"].resampled(max(n_grains, 2))

    fig, ax = plt.subplots(figsize=(8, 8))
    ax.scatter(
        centers[:, 0],
        centers[:, 1],
        c=grain_ids,
        cmap=cmap,
        s=6,
        marker="s",
        linewidths=0,
    )
    ax.set_title("Mid-plane slice colored by grain_id (seismic)")
    ax.set_xlabel("x")
    ax.set_ylabel("y")
    ax.set_aspect("equal")
    ax.set_xlim(0.0, 1.0)
    ax.set_ylim(0.0, 1.0)
    fig.savefig(preview_path, dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)

    return preview_path


def print_instructions(paths: list[Path], preview: Path | None) -> None:
    print("\nGenerated files:")
    for path in paths:
        print(f"  - {path}")
    if preview is not None:
        print(f"  - {preview}")

    print("\nParaView:")
    print("  1. File -> Open the .vtu file")
    print("  2. Apply -> Color by 'grain_id'")
    print("  3. Edit colormap -> Seismic")

    print("\nOVITO:")
    print("  1. File -> Load the .vtu or .vtk file")
    print("  2. Add Color coding modifier -> property 'grain_id'")
    print("  3. Choose a seismic-like palette in the viewport")


def main() -> None:
    args = parse_args()
    mesh = build_polycrystal(args.grains, args.nx, args.ny, args.nz, args.seed)
    paths = export_mesh(mesh, args.out, args.format)

    preview_path = None
    if args.preview:
        base = paths[0] if paths else args.out
        preview_path = base.with_name(base.stem + "_preview.png")
        save_preview(mesh, preview_path)

    print(
        f"Polycrystal mesh: {mesh.n_cells} cells, {mesh.n_points} points, "
        f"{args.grains} grains, resolution {args.nx}x{args.ny}x{args.nz}"
    )
    print_instructions(paths, preview_path)


if __name__ == "__main__":
    main()
