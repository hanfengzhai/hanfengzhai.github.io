import os, sys, subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
PY = sys.executable
PHASES = [
    ("1 formulation", ["generate_schematic.py"]),
    ("2 derivation", ["DeriveFormulation.py"]),
    ("3 demo", ["Heat2D_FEniCS.py", "Heat2D_PROM.py", "CompareResults.py"]),
]


def run(script):
    path = os.path.join(ROOT, script)
    print(f"\n>>> {script}")
    subprocess.run([PY, path], cwd=ROOT, check=True)


if __name__ == "__main__":
    for label, scripts in PHASES:
        print(f"=== {label} ===")
        for s in scripts:
            run(s)
