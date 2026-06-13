#!/usr/bin/env python3
"""Audit /file/ and /assets/ references and generate path-map.json."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCAN_EXT = {".html", ".css", ".js", ".json", ".xml", ".md"}
REF_PATTERN = re.compile(
    r'''(?:href|src)\s*=\s*["']((?:/(?:file|assets)/[^"'#?]+))''',
    re.IGNORECASE,
)

PUBLICATION_NAMES = {
    "AkhondzadehZhai_2026_JMPS.pdf",
    "Jian_2026_IJP.pdf",
    "wang_dd_2023.pdf",
    "zhai_2023_jmbbm.pdf",
    "zhai_acsbio_2023.pdf",
    "zhai_aipadv_2021.pdf",
    "zhai_aplmat_2024.pdf",
    "zhai_compmech_2025.pdf",
    "zhai_math_2022.pdf",
    "zhai_sensors_2022.pdf",
    "zhaiyeo_2023_graphene_mechanics.pdf",
    "graphene_manuscript-compressed.pdf",
    "MicroBubblePINN.pdf",
    "PhysNet.pdf",
    "Biofilm_review.pdf",
    "naca_ml.pdf",
    "ml1.pdf",
    "ml2.pdf",
    "ml3.pdf",
    "plasti_composite.pdf",
    "dentin_crack.pdf",
    "fem_project.pdf",
    "structral_biom.pdf",
    "thermal_elastic_chip.pdf",
    "CompMethMechProb.pdf",
    "Contact_Model_Note.pdf",
    "Elasticity_Qual.pdf",
    "hz_academic_tree.pdf",
    "chip.pdf",
}

POSTER_NAMES = {
    "dislocation2025.pdf",
    "dislocation2025.png",
    "CompFest2025.pdf",
    "MRS2026.pdf",
    "SGRS_2023.pdf",
    "Hanfeng_SGRS.pdf",
    "HZ_Antifouling_Apr26.pdf",
    "SHU_UGAF.pdf",
    "shell_junevisit_2024.pdf",
    "cornell_mae_visit_2023_poster_hanfeng.pdf",
    "cornell_mae_visit_2023_poster_hanfeng.png",
    "biofilm_poster.pdf",
    "biofilm_poster_ELMI-compressed.pdf",
    "biofilm_poster_ELMI.png",
    "Poster_CornellMSE_Symposium-compressed.pdf",
    "Poster_CornellMSE_Symposium.png",
    "Poster_MIT_MoML-compressed.pdf",
    "Poster_MIT_MoML.png",
    "Poster_MIT_MoML_MA.pdf",
    "Poster_MIT_MoML_MA.png",
    "Poster_biofilm_MAE_Cornell.pdf",
    "POSTER_SHU.pdf",
    "Graphene_Presentation_J2Lab_Sep16_compressed.pdf",
    "poster_img.001.png",
    "IJAM_accept.png",
    "aipadv_feature.png",
    "moml.png",
}

CAREER_NAMES = {
    "Resume_HZ.pdf",
    "ResearchStatement_HanfengZhai.pdf",
    "thesis.pdf",
    "thesis_defense.pdf",
    "shortthesis.pdf",
    "HZ_BS_Thesis_Preprint.pdf",
    "MS-Defense.pdf",
    "OutstandingGraduateofShanghai.pdf",
    "OutstandingSpeaker_Debate.pdf",
    "OutstandingStudent_BOC.pdf",
    "OutstandingStudent_SHU.pdf",
    "FirstPlace_SHUBodyBuilding.pdf",
    "SecondClass_UGAF.pdf",
    "WWS_HanfengZhai.pdf",
    "Sem_GuoLab_0420.pdf",
    "J2Lab_Feb16.pdf",
    "ME370_Hanfeng_Part.pdf",
    "ME370_ProjectBackground.pdf",
    "ProjectPlan.pdf",
    "2022 SGRS Abstract Book.pdf",
}

INTRO_NAMES = {"ME340_Intro.pdf"}

TEACHING_NOTE_NAMES = {
    "AtomModel_note.pdf",
    "CFD_note.pdf",
    "FEA_notes.pdf",
    "EngThermodynamics.pdf",
    "InverseProblems_note.pdf",
    "LargeScaleML_note.pdf",
    "MDO_notes.pdf",
    "MathModeling.pdf",
    "NonlinFEA_note.pdf",
    "defects_notes.pdf",
    "elasticity_notes.pdf",
    "MAE6110_SolidMechanics.pdf",
    "MAE6110_SolidMechanics_BW.pdf",
    "ME300A_LinAlg.pdf",
    "ME300B_PDE.pdf",
    "ME346A_CourseSummary.pdf",
    "ME412_CourseSummary.pdf",
    "ME412_FinalPresentation.pdf",
    "JanusParticle_CAS.pdf",
    "review_WeinanE.pdf",
    "StatMechNotes.pdf",
    "StatMechRev.pdf",
    "MAE7750_FEA.pdf",
    "ProbSess_FEA.pdf",
}

PROJECT_PREFIXES = ("TherMaG_",)

ARCHIVE_NAMES = {
    "history.txt",
    "equib.1000000.data",
    "BAs.tar.gz",
    "NonlinearValve.mdl",
    "Si.pbe-rrkj.UPF",
    "simple_scf.in",
    "hanfeng_research_intro.mp4",
    "validation.jpg",
    "finalFront.gif",
    "wolfram_boston_meeting.jpeg",
    "WWS23_HanfengZhai.htm",
    "JanusParticle_CAS (2).pdf",
    "compress_SHU.pdf",
    "guitar_SHU.pdf",
    "guitar_curve.pdf",
    "CEE6736_FinalReport.pdf",
    "lmp.1_Set-LiTFSI-H2O.in",
    "lmp.2_minimize.in",
    "lmp.3_run-LiTFSI-H2O.in",
}

ASSET_SITE = {"avatar.png", "icon.jpg"}
ASSET_RESEARCH = {
    "research.png",
    "micro_md_w_box.png",
    "meso_ddd_w_box.png",
    "macro_polycrystal.png",
    "research_main.png",
    "research1.jpeg",
    "research2.jpeg",
    "research3.jpeg",
    "research_theme1.png",
    "research_theme2.png",
    "research_theme3.png",
    "research_thrust_biotech.png",
    "research_thrust_energy.png",
    "research_thrust_manufacturing.png",
}
ASSET_PUBLICATIONS = {
    "linklen_schematic.png",
    "gnn_fem_compmech.jpeg",
    "FIGURE_MatOpt.png",
    "AI_BO_biofilm.png",
    "\u200eschematic_bioporous.png",
    "aip_feature.png",
    "aipadv_fig1.jpeg",
    "MSR_APLMat.png",
}
ASSET_CODE = {
    "opendis-logo.png",
    "AI_DislLinks_DDD.png",
    "gnn_plasti_fem.png",
    "code_matdes.png",
    "pylamdo.jpeg",
    "bblnet.png",
    "dft.jpeg",
}
ASSET_NEWS = {
    "Dislocations2025.JPG",
    "merl_intern.jpg",
    "ELMI_research.jpeg",
    "moml_pic.JPG",
    "swanson.jpg",
    "russellwilson.jpeg",
    "wolfram_boston_meeting.jpeg",
}
ASSET_GALLERY_SIM = {
    "ddd.gif",
    "biofilm.gif",
    "flowphysics.gif",
    "graphenecrack.gif",
    "dentein.gif",
    "PoissonProcess.gif",
    "Temperature_animation_MathDT.gif",
    "singlebubble.gif",
    "multibubble.gif",
    "biofilm_porous_mat.gif",
    "T_surface_movie.gif",
    "UGAF.gif",
}
ASSET_MEDIA = {
    "graphene_crack.mov",
    "video.m4v",
    "antibiofilm_surface_design_bayesian_opt.pdf",
    "code_matdes.pdf",
    "cover_acsbio.pdf",
}


def collect_references() -> set[str]:
    refs: set[str] = set()
    for path in ROOT.rglob("*"):
        if not path.is_file() or path.suffix not in SCAN_EXT:
            continue
        if ".git" in path.parts or "node_modules" in path.parts:
            continue
        text = path.read_text(errors="ignore")
        for match in REF_PATTERN.finditer(text):
            refs.add(match.group(1).split("#")[0].split("?")[0])
    return refs


def file_dest(rel: str) -> str | None:
    p = Path(rel)
    name = p.name

    if rel.startswith("file/ref/"):
        return None
    if rel.startswith("file/FEA_Teach/"):
        return "file/teaching/fea/" + p.name
    if rel.startswith("file/Elasticity_Teach/"):
        return "file/teaching/elasticity/" + p.name
    if rel.startswith("file/note/"):
        sub = str(Path(rel).relative_to("file/note"))
        return f"file/teaching/notes/{sub}"
    if rel.startswith("file/cs2024/"):
        return "file/coursework/cs2024/" + p.name

    if not rel.startswith("file/") or "/" in rel[5:] and not rel.startswith("file/cs2024/"):
        if rel.count("/") > 2:
            return None

    if name in INTRO_NAMES:
        return f"file/teaching/intros/{name}"
    if name in TEACHING_NOTE_NAMES:
        return f"file/teaching/notes/{name}"
    if name in PUBLICATION_NAMES or (
        name.endswith(".pdf") and name.startswith(("zhai_", "wang_"))
    ):
        return f"file/publications/{name}"
    if name in POSTER_NAMES or "poster" in name.lower() or "Poster" in name:
        return f"file/posters/{name}"
    if name in CAREER_NAMES:
        return f"file/career/{name}"
    if name.startswith(PROJECT_PREFIXES):
        return f"file/projects/{name}"
    if name.startswith("HW") and "SolidMech" in name:
        return f"file/coursework/solid-mechanics/{name}"
    if name.startswith("HW") and "MDO" in name:
        return f"file/coursework/mdo/{name}"
    if "MSE5720" in name:
        return f"file/coursework/mse5720/{name}"
    if name.startswith("CEE6736"):
        return f"file/coursework/cee6736/{name}"
    if name.startswith("MAE7750_HW"):
        return f"file/coursework/mae7750/{name}"
    if name in ARCHIVE_NAMES:
        return f"file/archive/{name}"

    if rel.startswith("file/") and rel.count("/") == 1:
        return f"file/archive/{name}"
    return None


def asset_dest(rel: str) -> str | None:
    if not rel.startswith("/assets/img/"):
        if rel.startswith("/assets/media/"):
            return None
        return None
    name = Path(rel).name
    if name in ASSET_SITE:
        return f"/assets/img/site/{name}"
    if name in ASSET_RESEARCH:
        return f"/assets/img/research/{name}"
    if name in ASSET_PUBLICATIONS:
        return f"/assets/img/publications/{name}"
    if name in ASSET_CODE:
        return f"/assets/img/code/{name}"
    if name in ASSET_NEWS:
        return f"/assets/img/news/{name}"
    if name in ASSET_GALLERY_SIM:
        return f"/assets/img/gallery/simulations/{name}"
    if name.startswith("prof_") or name == "profs_yeo_warner.jpg":
        return f"/assets/img/gallery/people/{name}"
    if name.startswith(("art", "afb")) or name in {"art_marcus_aurelius.jpg", "art_von_mises.jpg"}:
        return f"/assets/img/gallery/art/{name}"
    if "enamel" in name.lower():
        return f"/assets/img/gallery/enamel/{name}"
    if name in ASSET_MEDIA or name.endswith((".mov", ".m4v")) or (
        name.endswith(".pdf") and name in ASSET_MEDIA
    ):
        return f"/assets/media/{name}"
    if name.endswith(".pdf") and name in {
        "antibiofilm_surface_design_bayesian_opt.pdf",
        "code_matdes.pdf",
        "cover_acsbio.pdf",
    }:
        return f"/assets/media/{name}"

    if rel.startswith("/assets/img/"):
        return f"/assets/img/gallery/misc/{name}"
    return None


def build_path_map() -> dict[str, str]:
    mapping: dict[str, str] = {}

    for path in sorted(ROOT.joinpath("file").rglob("*")):
        if not path.is_file():
            continue
        rel = str(path.relative_to(ROOT)).replace("\\", "/")
        old_url = "/" + rel
        dest = file_dest(rel)
        if dest and dest != rel:
            mapping[old_url] = "/" + dest

    for path in sorted(ROOT.joinpath("assets", "img").rglob("*")):
        if not path.is_file():
            continue
        rel = str(path.relative_to(ROOT)).replace("\\", "/")
        old_url = "/" + rel
        dest = asset_dest(old_url)
        if dest:
            new_rel = dest.lstrip("/")
            if new_rel != rel:
                mapping[old_url] = dest

    return mapping


def main() -> None:
    refs = collect_references()
    mapping = build_path_map()

    missing_refs = sorted(r for r in refs if not (ROOT / r.lstrip("/")).exists())
    unmapped_refs = sorted(r for r in refs if r in mapping)

    report = {
        "reference_count": len(refs),
        "references": sorted(refs),
        "missing_on_disk": missing_refs,
        "path_map_count": len(mapping),
        "path_map": mapping,
    }

    out = ROOT / "scripts" / "path-map.json"
    out.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")

    print(f"References: {len(refs)}")
    print(f"Missing on disk: {len(missing_refs)}")
    print(f"Path mappings: {len(mapping)}")
    print(f"Wrote {out}")


if __name__ == "__main__":
    main()
