from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.models import CoverageTerritory, Source

SOURCES = [
    {
        "id": "placsp_aggregated",
        "name": "PLACSP — Plataformas agregadas (sin menores)",
        "kind": "atom",
        "base_url": settings.placsp_aggregated_atom,
        "coverage_notes": "7 CCAA con plataforma propia agregadas; sin contratos menores de esas CCAA.",
        "status": "verified",
    },
    {
        "id": "placsp_emp",
        "name": "PLACSP — Encargos a medios propios",
        "kind": "atom",
        "base_url": settings.placsp_emp_atom,
        "coverage_notes": "Desde julio 2021. Feed público sindicacion_1383.",
        "status": "verified",
    },
    {
        "id": "placsp_direct",
        "name": "PLACSP — Licitaciones perfiles (directo)",
        "kind": "atom",
        "base_url": "https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/",
        "coverage_notes": "Requiere certificado según auditoría. No integrado.",
        "status": "blocked",
    },
    {
        "id": "bdns_convocatorias",
        "name": "BDNS — Convocatorias",
        "kind": "rest",
        "base_url": f"{settings.bdns_api_base}/convocatorias/busqueda",
        "coverage_notes": "API pública paginada. page 0-indexed.",
        "status": "verified",
    },
    {
        "id": "bdns_concesiones",
        "name": "BDNS — Concesiones",
        "kind": "rest",
        "base_url": f"{settings.bdns_api_base}/concesiones/busqueda",
        "coverage_notes": "~31M registros. Solo ingesta incremental/paginada.",
        "status": "verified",
    },
    {
        "id": "airef_prtr",
        "name": "AIReF — Observatorio PRTR",
        "kind": "file",
        "base_url": "https://www.airef.es/es/datalab/herramientas-interactivas-de-la-airef/observatorio-del-prtr/",
        "coverage_notes": "CSV/Parquet trimestral. Procesar solo en servidor. Stub en ETAPA 1.",
        "status": "deferred",
    },
]

TERRITORIES = [
    ("ES-CT", "Cataluña", False, True, True, "high"),
    ("ES-AN", "Andalucía", False, True, True, "high"),
    ("ES-MD", "Comunidad de Madrid", False, True, True, "medium"),
    ("ES-VC", "Comunidad Valenciana", False, True, True, "high"),
    ("ES-PV", "País Vasco", False, True, True, "high"),
    ("ES-GA", "Galicia", False, True, True, "medium"),
    ("ES-NC", "Navarra", False, True, True, "high"),
    ("ES-CL", "Castilla y León", True, False, False, "high"),
    ("ES-AR", "Aragón", True, False, False, "high"),
    ("ES-CM", "Castilla-La Mancha", True, False, False, "medium"),
    ("ES-CN", "Canarias", True, False, False, "medium"),
    ("ES-IB", "Illes Balears", True, False, False, "medium"),
    ("ES-MC", "Murcia", True, False, False, "medium"),
    ("ES-EX", "Extremadura", True, False, False, "medium"),
    ("ES-AS", "Asturias", True, False, False, "medium"),
    ("ES-CB", "Cantabria", True, False, False, "medium"),
    ("ES-RI", "La Rioja", True, False, False, "medium"),
    ("ES-CE", "Ceuta", True, False, False, "low"),
    ("ES-ML", "Melilla", True, False, False, "low"),
]


def seed_reference_data(db: Session) -> None:
    for s in SOURCES:
        existing = db.get(Source, s["id"])
        if existing is None:
            db.add(Source(**s))
        else:
            for k, v in s.items():
                if k != "id":
                    setattr(existing, k, v)

    for code, name, direct, agg, own, level in TERRITORIES:
        row = db.execute(select(CoverageTerritory).where(CoverageTerritory.code == code)).scalar_one_or_none()
        notes = None
        if own:
            notes = "Plataforma propia: contratos menores y detalle granular pueden no estar en PLACSP agregado."
        if row is None:
            db.add(
                CoverageTerritory(
                    code=code,
                    name=name,
                    placsp_direct=direct,
                    placsp_aggregated=agg,
                    own_platform=own,
                    bdns_covered=True,
                    notes=notes,
                    level=level,
                )
            )
        else:
            row.name = name
            row.placsp_direct = direct
            row.placsp_aggregated = agg
            row.own_platform = own
            row.level = level
            row.notes = notes
    db.commit()