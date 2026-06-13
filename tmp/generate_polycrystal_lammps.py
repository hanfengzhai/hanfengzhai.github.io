#!/usr/bin/env python3
"""
Build a multi-grain FCC polycrystal snapshot and write a LAMMPS data file.

Each grain has a random crystallographic orientation and a Voronoi region
defined by seed points in the simulation box. Atoms are placed on an FCC
lattice in each grain frame, then filtered to the box and their owning grain.

No MD simulation is run. The output is an initial configuration suitable for
OVITO, ParaView (via OVITO export), or LAMMPS ``read_data``.

OVITO
-----
1. File -> Load -> LAMMPS Data -> polycrystal_lammps.data
2. In the import dialog choose atom style **molecular**
   (columns: id mol type x y z — not ``full``, which expects charge)
3. Add Color coding modifier -> property ``Molecule Identifier`` (grain / mol ID)
4. Choose a seismic-like palette

LAMMPS (optional validation only)
-----------------------------------
    read_data polycrystal.data
    write_data polycrystal_checked.data
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np


FCC_BASIS = np.array(
    [
        [0.0, 0.0, 0.0],
        [0.0, 0.5, 0.5],
        [0.5, 0.0, 0.5],
        [0.5, 0.5, 0.0],
    ],
    dtype=np.float64,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate a LAMMPS data file for a polycrystal MD snapshot."
    )
    parser.add_argument("--grains", type=int, default=80, help="Number of grains (default: 80)")
    parser.add_argument(
        "--box-size",
        type=float,
        default=200.0,
        help="Cubic box edge length in Angstrom (default: 200)",
    )
    parser.add_argument(
        "--lattice-a",
        type=float,
        default=4.05,
        help="FCC lattice constant in Angstrom (default: 4.05, Al-like)",
    )
    parser.add_argument(
        "--atom-mass",
        type=float,
        default=26.98,
        help="Atomic mass for atom type 1 (default: 26.98)",
    )
    parser.add_argument("--seed", type=int, default=0, help="RNG seed (default: 0)")
    parser.add_argument(
        "--out",
        type=Path,
        default=Path(__file__).resolve().parent / "polycrystal_lammps.data",
        help="Output LAMMPS data path (default: tmp/polycrystal_lammps.data)",
    )
    parser.add_argument(
        "--preview",
        action="store_true",
        help="Save an xy mid-plane preview PNG colored by grain (mol ID)",
    )
    return parser.parse_args()


def random_rotation_matrices(n: int, rng: np.random.Generator) -> np.ndarray:
    """Uniform random SO(3) rotations via normalized quaternions."""
    q = rng.normal(size=(n, 4))
    q /= np.linalg.norm(q, axis=1, keepdims=True)
    w, x, y, z = q[:, 0], q[:, 1], q[:, 2], q[:, 3]
    return np.stack(
        [
            np.stack([1 - 2 * (y * y + z * z), 2 * (x * y - w * z), 2 * (x * z + w * y)], axis=1),
            np.stack([2 * (x * y + w * z), 1 - 2 * (x * x + z * z), 2 * (y * z - w * x)], axis=1),
            np.stack([2 * (x * z - w * y), 2 * (y * z + w * x), 1 - 2 * (x * x + y * y)], axis=1),
        ],
        axis=1,
    )


def build_fcc_lattice(a: float, half_extent: float) -> np.ndarray:
    """FCC sites in a cube [-half_extent, half_extent]^3."""
    n_cells = int(np.ceil(2.0 * half_extent / a)) + 2
    origin = -half_extent - a
    sites: list[np.ndarray] = []
    for i in range(n_cells):
        for j in range(n_cells):
            for k in range(n_cells):
                cell_origin = origin + a * np.array([i, j, k], dtype=np.float64)
                sites.append(cell_origin + FCC_BASIS * a)
    return np.vstack(sites)


def assign_grains(positions: np.ndarray, seeds: np.ndarray) -> np.ndarray:
    distances = np.linalg.norm(positions[:, None, :] - seeds[None, :, :], axis=2)
    return np.argmin(distances, axis=1)


def build_polycrystal_atoms(
    n_grains: int,
    box_size: float,
    lattice_a: float,
    seed: int,
) -> tuple[np.ndarray, np.ndarray]:
    if n_grains < 1:
        raise ValueError("--grains must be >= 1")
    if box_size <= 0 or lattice_a <= 0:
        raise ValueError("--box-size and --lattice-a must be positive")

    rng = np.random.default_rng(seed)
    seeds = rng.random((n_grains, 3)) * box_size
    rotations = random_rotation_matrices(n_grains, rng)

    local_lattice = build_fcc_lattice(lattice_a, half_extent=0.75 * box_size)

    positions: list[np.ndarray] = []
    grain_ids: list[np.ndarray] = []

    for grain in range(n_grains):
        rotated = local_lattice @ rotations[grain].T + seeds[grain]
        in_box = np.all((rotated >= 0.0) & (rotated <= box_size), axis=1)
        rotated = rotated[in_box]
        owner = assign_grains(rotated, seeds)
        owned = owner == grain
        if not np.any(owned):
            continue
        positions.append(rotated[owned])
        grain_ids.append(np.full(owned.sum(), grain + 1, dtype=np.int32))

    if not positions:
        raise RuntimeError("No atoms generated; reduce grains or increase box-size.")

    return np.vstack(positions), np.concatenate(grain_ids)


def write_lammps_data(
    path: Path,
    positions: np.ndarray,
    grain_ids: np.ndarray,
    box_size: float,
    atom_mass: float,
) -> None:
    path = path.resolve()
    path.parent.mkdir(parents=True, exist_ok=True)

    n_atoms = positions.shape[0]
    n_types = 1
    n_grains = int(grain_ids.max())

    lines = [
        "LAMMPS data file: FCC polycrystal snapshot",
        "",
        f"{n_atoms} atoms",
        f"{n_types} atom types",
        "",
        f"0.0 {box_size:.8f} xlo xhi",
        f"0.0 {box_size:.8f} ylo yhi",
        f"0.0 {box_size:.8f} zlo zhi",
        "",
        "Masses",
        "",
        f"1 {atom_mass:.6f}",
        "",
        "Atoms # molecular",
        "",
    ]

    for atom_id, (xyz, mol) in enumerate(zip(positions, grain_ids), start=1):
        lines.append(f"{atom_id} {mol} 1 {xyz[0]:.8f} {xyz[1]:.8f} {xyz[2]:.8f}")

    path.write_text("\n".join(lines) + "\n")

    print(f"Wrote {path}")
    print(f"  Atoms: {n_atoms}")
    print(f"  Grains (mol IDs): {n_grains}")


def save_preview(positions: np.ndarray, grain_ids: np.ndarray, box_size: float, path: Path) -> Path:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    path = path.resolve()
    path.parent.mkdir(parents=True, exist_ok=True)

    z_mid = 0.5 * box_size
    tol = 0.6 * (box_size / 64.0)
    mask = np.abs(positions[:, 2] - z_mid) <= tol
    xy = positions[mask, :2]
    grains = grain_ids[mask]
    n_grains = int(grains.max()) if grains.size else 1
    cmap = plt.colormaps["seismic"].resampled(max(n_grains, 2))

    fig, ax = plt.subplots(figsize=(8, 8))
    ax.scatter(xy[:, 0], xy[:, 1], c=grains, cmap=cmap, s=1, marker=".", linewidths=0)
    ax.set_title("Mid-plane xy slice colored by grain (mol ID)")
    ax.set_xlabel("x (Angstrom)")
    ax.set_ylabel("y (Angstrom)")
    ax.set_aspect("equal")
    ax.set_xlim(0.0, box_size)
    ax.set_ylim(0.0, box_size)
    fig.savefig(path, dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    return path


def print_instructions(out_path: Path, preview: Path | None) -> None:
    print("\nVisualization:")
    print("  OVITO: File -> Load -> LAMMPS Data ->", out_path.name)
    print("         Atom style: molecular  (id mol type x y z)")
    print("         Color coding -> Molecule Identifier -> seismic palette")
    if preview is not None:
        print("  Preview PNG:", preview)


def main() -> None:
    args = parse_args()
    positions, grain_ids = build_polycrystal_atoms(
        args.grains, args.box_size, args.lattice_a, args.seed
    )
    write_lammps_data(args.out, positions, grain_ids, args.box_size, args.atom_mass)

    preview_path = None
    if args.preview:
        preview_path = args.out.with_name(args.out.stem + "_preview.png")
        save_preview(positions, grain_ids, args.box_size, preview_path)

    print(
        f"Polycrystal snapshot: {positions.shape[0]} atoms, "
        f"{args.grains} grains, box {args.box_size} A, a={args.lattice_a} A"
    )
    print_instructions(args.out, preview_path)


if __name__ == "__main__":
    main()
