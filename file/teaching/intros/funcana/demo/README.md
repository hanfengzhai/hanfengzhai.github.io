# 2D heat demo: FEM vs PROM

Same parametric heat problem on $(0,1)^2$ — formulation, derivation, then full FEniCS vs goal-oriented PROM (Zahm et al., primal–dual RB).

## Run in order

**All at once** (needs `fenics_env` for phase 3):

```bash
python run_all.py
```

**Or step by step:**

| Phase | Script | What it does |
|-------|--------|--------------|
| 1 — Formulation | `generate_schematic.py` | Strong-form PDE, BCs, source, QoI disk, $\kappa(x,\xi)$ |
| 2 — Derivation | `DeriveFormulation.py` | Weak form $\to$ $Au=b$ $\to$ affine $A(\xi)$ $\to$ PROM |
| 3 — Demo | `Heat2D_FEniCS.py` | Full FEM + convergence + field |
| 3 — Demo | `Heat2D_PROM.py` | Primal–dual PROM (depends on FEM constants) |
| 3 — Demo | `CompareResults.py` | Speedup + comparison plots |

Phase 1–2 need only Python + matplotlib. Phase 3 needs FEniCS (`fenics_env`).

## Output/

| File | Phase |
|------|-------|
| `heat2d_schematic.png` | 1 |
| `derivation.png` | 2 |
| `fenics_results.npz`, `fenics_convergence.png`, `fenics_field.png` | 3 |
| `prom_results.npz` | 3 |
| `compare_results.png` | 3 |

Parameter $\xi$ scales conductivity: $\kappa(x,\xi)=1+\xi\beta(x)$ on $\Omega=(0,1)^2$.
