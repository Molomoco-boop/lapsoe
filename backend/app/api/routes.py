from __future__ import annotations

from datetime import date
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.connectors.bdns import BdnsClient, parse_beneficiario
from app.connectors.placsp import PlacspClient
from app.db import get_db
from app.models import (
    Contract,
    CoverageTerritory,
    GrantAward,
    InHouseOrder,
    Source,
    SyncRun,
)
from app.services.analysis import build_investigations, company_timeline
from app.services.highlights import load_highlights, refresh_highlights
from app.services.ingest_smoke import local_stats, smoke_ingest_bdns, smoke_ingest_placsp
from app.services.seed import seed_reference_data

router = APIRouter()


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "observatorio-api"}


@router.get("/meta/sources")
def list_sources(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    seed_reference_data(db)
    rows = db.execute(select(Source).order_by(Source.id)).scalars().all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "kind": r.kind,
            "base_url": r.base_url,
            "coverage_notes": r.coverage_notes,
            "status": r.status,
            "last_success_at": r.last_success_at.isoformat() if r.last_success_at else None,
            "last_attempt_at": r.last_attempt_at.isoformat() if r.last_attempt_at else None,
            "last_error": r.last_error,
        }
        for r in rows
    ]


@router.get("/meta/coverage")
def coverage(db: Session = Depends(get_db)) -> list[dict[str, Any]]:
    seed_reference_data(db)
    rows = db.execute(select(CoverageTerritory).order_by(CoverageTerritory.name)).scalars().all()
    return [
        {
            "code": r.code,
            "name": r.name,
            "placsp_direct": r.placsp_direct,
            "placsp_aggregated": r.placsp_aggregated,
            "own_platform": r.own_platform,
            "bdns_covered": r.bdns_covered,
            "level": r.level,
            "notes": r.notes,
        }
        for r in rows
    ]


@router.get("/meta/sync-runs")
def sync_runs(db: Session = Depends(get_db), limit: int = Query(20, ge=1, le=100)) -> list[dict[str, Any]]:
    rows = db.execute(select(SyncRun).order_by(desc(SyncRun.id)).limit(limit)).scalars().all()
    return [
        {
            "id": r.id,
            "source_id": r.source_id,
            "started_at": r.started_at.isoformat() if r.started_at else None,
            "finished_at": r.finished_at.isoformat() if r.finished_at else None,
            "mode": r.mode,
            "status": r.status,
            "received": r.received,
            "inserted": r.inserted,
            "updated": r.updated,
            "errors": r.errors,
            "detail": r.detail,
        }
        for r in rows
    ]


@router.get("/stats/overview")
async def overview(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Homepage figures: local sample counts + live official API metadata. Never invent totals."""
    seed_reference_data(db)
    local = local_stats(db)
    live_bdns: dict[str, Any] | None = None
    live_placsp: dict[str, Any] | None = None
    errors: list[str] = []

    try:
        bdns = BdnsClient()
        live_bdns = await bdns.health_probe()
        await bdns.aclose()
    except Exception as exc:  # noqa: BLE001
        errors.append(f"BDNS: {exc}")

    try:
        live_placsp = PlacspClient().health_probe()
    except Exception as exc:  # noqa: BLE001
        errors.append(f"PLACSP: {exc}")

    sources = db.execute(select(Source)).scalars().all()
    return {
        "local": local,
        "live": {
            "bdns": live_bdns,
            "placsp": live_placsp,
        },
        "sources": [
            {
                "id": s.id,
                "name": s.name,
                "status": s.status,
                "last_success_at": s.last_success_at.isoformat() if s.last_success_at else None,
            }
            for s in sources
        ],
        "errors": errors,
        "disclaimer": (
            "Las cifras 'live' son metadatos oficiales de las APIs/feeds en el momento de la consulta. "
            "Las cifras 'local' reflejan únicamente muestras ingestadas en este entorno. "
            "No hay carga histórica completa en ETAPA 1."
        ),
    }


@router.get("/highlights")
def get_highlights() -> dict[str, Any]:
    """Portada: solo caché precargada. No pega a las APIs oficiales en cada visita."""
    cached = load_highlights()
    if not cached:
        return {
            "generated_at": None,
            "shocks": [],
            "top_grants": [],
            "top_contracts": [],
            "top_encargos": [],
            "missing": True,
            "hint": "POST /api/highlights/refresh para generar la caché impactante",
            "architecture": {
                "homepage": "cached_highlights",
                "search_and_browse": "live_official_apis",
                "hosting_note": (
                    "DuckDNS solo apunta el dominio a tu IP. Si apagas el PC, la web deja de responder."
                ),
            },
        }
    return {**cached, "missing": False}


@router.post("/highlights/refresh")
async def post_highlights_refresh(db: Session = Depends(get_db)) -> dict[str, Any]:
    """Analiza fuentes oficiales, elige lo más impactante y lo guarda en disco."""
    seed_reference_data(db)
    payload = await refresh_highlights(db)
    return {
        "ok": True,
        "generated_at": payload.get("generated_at"),
        "shocks": len(payload.get("shocks") or []),
        "top_grants": len(payload.get("top_grants") or []),
        "top_contracts": len(payload.get("top_contracts") or []),
        "errors": payload.get("errors") or [],
        "path": "data/cache/highlights.json",
    }


@router.get("/bdns/convocatorias")
async def bdns_convocatorias(
    page: int = Query(0, ge=0),
    page_size: int = Query(20, ge=1, le=200),
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    descripcion: Optional[str] = None,
    numero_convocatoria: Optional[str] = None,
    mrr: Optional[bool] = None,
) -> dict[str, Any]:
    if (fecha_desde and not fecha_hasta) or (fecha_hasta and not fecha_desde):
        raise HTTPException(400, "fecha_desde y fecha_hasta deben enviarse juntas (formato BDNS DD/MM/YYYY).")
    client = BdnsClient()
    try:
        data = await client.search_convocatorias(
            page=page,
            page_size=page_size,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            descripcion=descripcion,
            numero_convocatoria=numero_convocatoria,
            mrr=mrr,
        )
        return {
            "provenance": "BDNS API /convocatorias/busqueda",
            "data_kind": "official",
            "page": data.get("number"),
            "page_size": data.get("size"),
            "total_elements": data.get("totalElements"),
            "total_pages": data.get("totalPages"),
            "content": data.get("content") or [],
            "advertencia": data.get("advertencia"),
        }
    finally:
        await client.aclose()


@router.get("/bdns/concesiones")
async def bdns_concesiones(
    page: int = Query(0, ge=0),
    page_size: int = Query(20, ge=1, le=200),
    fecha_desde: Optional[date] = None,
    fecha_hasta: Optional[date] = None,
    descripcion: Optional[str] = None,
    numero_convocatoria: Optional[str] = None,
    beneficiario_q: Optional[str] = Query(None, description="Texto para resolver id vía /terceros"),
    beneficiario_id: Optional[int] = None,
) -> dict[str, Any]:
    if (fecha_desde and not fecha_hasta) or (fecha_hasta and not fecha_desde):
        raise HTTPException(400, "fecha_desde y fecha_hasta deben enviarse juntas.")
    client = BdnsClient()
    try:
        resolved_id = beneficiario_id
        terceros_hits = None
        if beneficiario_q and not resolved_id:
            terceros = await client.search_terceros(beneficiario_q)
            terceros_hits = terceros.get("terceros") or []
            if not terceros_hits:
                return {
                    "provenance": "BDNS API",
                    "data_kind": "official",
                    "page": 0,
                    "page_size": page_size,
                    "total_elements": 0,
                    "total_pages": 0,
                    "content": [],
                    "terceros_resolution": [],
                    "note": "Sin coincidencias en /terceros para el beneficiario indicado.",
                }
            resolved_id = terceros_hits[0].get("id")

        data = await client.search_concesiones(
            page=page,
            page_size=page_size,
            fecha_desde=fecha_desde,
            fecha_hasta=fecha_hasta,
            descripcion=descripcion,
            numero_convocatoria=numero_convocatoria,
            beneficiario_id=resolved_id,
        )
        content = []
        for item in data.get("content") or []:
            parsed = parse_beneficiario(item.get("beneficiario"))
            content.append(
                {
                    **item,
                    "beneficiario_parsed": {
                        "name": parsed["name"],
                        "nif": parsed["nif"] if parsed["nif_is_public"] else None,
                        "nif_is_public": parsed["nif_is_public"],
                        "is_anonymized_person": parsed["is_anonymized_person"],
                    },
                }
            )
        return {
            "provenance": "BDNS API /concesiones/busqueda",
            "data_kind": "official",
            "page": data.get("number"),
            "page_size": data.get("size"),
            "total_elements": data.get("totalElements"),
            "total_pages": data.get("totalPages"),
            "content": content,
            "terceros_resolution": terceros_hits,
            "beneficiario_id_used": resolved_id,
            "advertencia": data.get("advertencia"),
        }
    finally:
        await client.aclose()


@router.get("/bdns/terceros")
async def bdns_terceros(q: str = Query(..., min_length=2)) -> dict[str, Any]:
    client = BdnsClient()
    try:
        data = await client.search_terceros(q)
        return {"provenance": "BDNS API /terceros", "data_kind": "official", **data}
    finally:
        await client.aclose()


@router.get("/placsp/contracts/live")
def placsp_contracts_live(limit: int = Query(25, ge=1, le=100)) -> dict[str, Any]:
    data = PlacspClient().smoke_aggregated(limit=limit)
    # Strip bulky raw_xml for list responses
    entries = [{k: v for k, v in e.items() if k != "raw_xml"} for e in data["entries"]]
    return {**data, "entries": entries, "data_kind": "official_sample"}


@router.get("/placsp/encargos/live")
def placsp_encargos_live(limit: int = Query(25, ge=1, le=100)) -> dict[str, Any]:
    data = PlacspClient().smoke_emp(limit=limit)
    entries = [{k: v for k, v in e.items() if k != "raw_xml"} for e in data["entries"]]
    return {**data, "entries": entries, "data_kind": "official_sample"}


@router.get("/contracts")
def contracts_local(
    db: Session = Depends(get_db),
    page: int = Query(0, ge=0),
    page_size: int = Query(20, ge=1, le=100),
    q: Optional[str] = None,
) -> dict[str, Any]:
    stmt = select(Contract)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            (Contract.title.ilike(like))
            | (Contract.contracting_body_name.ilike(like))
            | (Contract.contract_folder_id.ilike(like))
        )
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = db.scalar(count_stmt) or 0
    rows = db.execute(stmt.order_by(desc(Contract.id)).offset(page * page_size).limit(page_size)).scalars().all()
    return {
        "provenance": "Base de datos local (muestras smoke)",
        "data_kind": "local_sample",
        "total_elements": total,
        "page": page,
        "page_size": page_size,
        "content": [
            {
                "id": r.id,
                "contract_folder_id": r.contract_folder_id,
                "title": r.title,
                "summary": r.summary,
                "status_code": r.status_code,
                "contracting_body_name": r.contracting_body_name,
                "contracting_body_id": r.contracting_body_id,
                "amount": r.amount,
                "updated_at_source": r.updated_at_source.isoformat() if r.updated_at_source else None,
                "source_id": r.source_id,
                "source_url": r.source_url,
            }
            for r in rows
        ],
    }


@router.get("/contracts/{contract_id}")
def contract_detail(contract_id: int, db: Session = Depends(get_db)) -> dict[str, Any]:
    r = db.get(Contract, contract_id)
    if not r:
        raise HTTPException(404, "Contrato local no encontrado")
    return {
        "data_kind": "local_sample",
        "provenance": "PLACSP Atom → almacenamiento local",
        "contract": {
            "id": r.id,
            "source_entry_id": r.source_entry_id,
            "contract_folder_id": r.contract_folder_id,
            "title": r.title,
            "summary": r.summary,
            "status_code": r.status_code,
            "contracting_body_name": r.contracting_body_name,
            "contracting_body_id": r.contracting_body_id,
            "amount": r.amount,
            "currency": r.currency,
            "nuts_code": r.nuts_code,
            "updated_at_source": r.updated_at_source.isoformat() if r.updated_at_source else None,
            "extracted_at": r.extracted_at.isoformat() if r.extracted_at else None,
            "source_id": r.source_id,
            "source_url": r.source_url,
        },
    }


@router.get("/grants/awards/local")
def grants_local(
    db: Session = Depends(get_db),
    page: int = Query(0, ge=0),
    page_size: int = Query(20, ge=1, le=100),
) -> dict[str, Any]:
    total = db.scalar(select(func.count()).select_from(GrantAward)) or 0
    rows = db.execute(select(GrantAward).order_by(desc(GrantAward.id)).offset(page * page_size).limit(page_size)).scalars().all()
    return {
        "provenance": "BDNS → almacenamiento local (smoke)",
        "data_kind": "local_sample",
        "total_elements": total,
        "content": [
            {
                "id": r.id,
                "cod_concesion": r.cod_concesion,
                "fecha_concesion": r.fecha_concesion.isoformat() if r.fecha_concesion else None,
                "beneficiario_name": r.beneficiario_name,
                "beneficiario_nif": r.beneficiario_nif,
                "nif_is_public": r.nif_is_public,
                "importe": r.importe,
                "convocatoria": r.convocatoria,
                "nivel2": r.nivel2,
                "nivel3": r.nivel3,
                "url_br": r.url_br,
            }
            for r in rows
        ],
    }


@router.get("/encargos/local")
def encargos_local(db: Session = Depends(get_db), limit: int = Query(50, ge=1, le=200)) -> dict[str, Any]:
    rows = db.execute(select(InHouseOrder).order_by(desc(InHouseOrder.id)).limit(limit)).scalars().all()
    return {
        "data_kind": "local_sample",
        "provenance": "PLACSP EMP Atom → local",
        "content": [
            {
                "id": r.id,
                "title": r.title,
                "ordering_body_name": r.ordering_body_name,
                "recipient_name": r.recipient_name,
                "recipient_nif": r.recipient_nif,
                "amount": r.amount,
                "contract_folder_id": r.contract_folder_id,
                "source_url": r.source_url,
            }
            for r in rows
        ],
    }


@router.get("/search")
async def global_search(q: str = Query(..., min_length=2), db: Session = Depends(get_db)) -> dict[str, Any]:
    """Classified search across live BDNS + local samples. No fabricated hits."""
    like = f"%{q}%"
    local_contracts = db.execute(
        select(Contract).where(
            (Contract.title.ilike(like))
            | (Contract.contracting_body_name.ilike(like))
            | (Contract.contract_folder_id.ilike(like))
        ).limit(10)
    ).scalars().all()
    local_awards = db.execute(
        select(GrantAward).where(
            (GrantAward.beneficiario_name.ilike(like))
            | (GrantAward.beneficiario_nif.ilike(like))
            | (GrantAward.convocatoria.ilike(like))
            | (GrantAward.cod_concesion.ilike(like))
        ).limit(10)
    ).scalars().all()

    bdns_terceros = []
    bdns_conv = []
    errors = []
    client = BdnsClient()
    try:
        try:
            t = await client.search_terceros(q)
            bdns_terceros = t.get("terceros") or []
        except Exception as exc:  # noqa: BLE001
            errors.append(f"terceros: {exc}")
        try:
            c = await client.search_convocatorias(page=0, page_size=5, descripcion=q)
            bdns_conv = c.get("content") or []
        except Exception as exc:  # noqa: BLE001
            errors.append(f"convocatorias: {exc}")
    finally:
        await client.aclose()

    return {
        "query": q,
        "data_kind": "mixed_official_and_local",
        "results": {
            "companies_or_beneficiaries": bdns_terceros,
            "grant_calls_live": bdns_conv,
            "contracts_local": [
                {"id": r.id, "title": r.title, "body": r.contracting_body_name, "folder": r.contract_folder_id}
                for r in local_contracts
            ],
            "grants_local": [
                {"id": r.id, "beneficiario": r.beneficiario_name, "importe": r.importe, "cod": r.cod_concesion}
                for r in local_awards
            ],
        },
        "errors": errors,
    }


@router.post("/ingest/smoke")
async def run_smoke_ingest(
    include_placsp: bool = True,
    include_bdns: bool = True,
    limit: int = Query(40, ge=5, le=100),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Controlled smoke ingest. Does not follow Atom pagination or crawl BDNS history."""
    seed_reference_data(db)
    out: dict[str, Any] = {"errors": []}
    if include_placsp:
        try:
            out["placsp"] = smoke_ingest_placsp(db, limit=limit)
        except Exception as exc:  # noqa: BLE001
            out["errors"].append(f"placsp: {exc}")
            out["placsp"] = {"status": "error", "detail": str(exc)}
    if include_bdns:
        try:
            out["bdns"] = await smoke_ingest_bdns(db, page_size=min(limit, 100))
        except Exception as exc:  # noqa: BLE001
            out["errors"].append(f"bdns: {exc}")
            out["bdns"] = {"status": "error", "detail": str(exc)}
    out["local_stats"] = local_stats(db)
    return out


@router.get("/analysis/investigations")
def analysis_investigations(db: Session = Depends(get_db)) -> dict[str, Any]:
    return build_investigations(db)


@router.get("/companies/{nif}")
async def company_profile(nif: str, db: Session = Depends(get_db)) -> dict[str, Any]:
    local = company_timeline(db, nif)
    live = None
    errors: list[str] = []
    client = BdnsClient()
    try:
        try:
            terceros = await client.search_terceros(nif)
            hits = terceros.get("terceros") or []
            ben_id = hits[0]["id"] if hits else None
            conc = None
            if ben_id is not None:
                conc = await client.search_concesiones(page=0, page_size=50, beneficiario_id=ben_id)
            live = {
                "terceros": hits,
                "concesiones_total": (conc or {}).get("totalElements"),
                "concesiones": (conc or {}).get("content") or [],
                "provenance": "BDNS API",
            }
        except Exception as exc:  # noqa: BLE001
            errors.append(str(exc))
    finally:
        await client.aclose()
    return {
        "nif": nif.upper(),
        "match_method": "exact_nif",
        "local": local,
        "live_bdns": live,
        "errors": errors,
        "disclaimer": "Solo se agrupan operaciones con el mismo NIF/CIF público. No hay fusión por nombre.",
    }


@router.get("/export/contracts.csv")
def export_contracts_csv(db: Session = Depends(get_db)) -> Response:
    rows = db.execute(select(Contract).order_by(desc(Contract.id)).limit(5000)).scalars().all()
    lines = ["id;expediente;titulo;organo;importe;estado;fuente;url"]
    for r in rows:
        title = (r.title or "").replace(";", ",")
        body = (r.contracting_body_name or "").replace(";", ",")
        lines.append(
            f"{r.id};{r.contract_folder_id or ''};{title};{body};{r.amount or ''};{r.status_code or ''};{r.source_id};{r.source_url or ''}"
        )
    content = "\n".join(lines)
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=contratos_muestra_local.csv"},
    )


@router.get("/export/grants.csv")
def export_grants_csv(db: Session = Depends(get_db)) -> Response:
    rows = db.execute(select(GrantAward).order_by(desc(GrantAward.id)).limit(5000)).scalars().all()
    lines = ["id;cod;fecha;beneficiario;nif;importe;convocatoria;territorio;organo;url_br"]
    for r in rows:
        name = (r.beneficiario_name or "").replace(";", ",")
        call = (r.convocatoria or "").replace(";", ",")
        lines.append(
            f"{r.id};{r.cod_concesion or ''};{r.fecha_concesion or ''};{name};{r.beneficiario_nif or ''};{r.importe or ''};{call};{r.nivel2 or ''};{(r.nivel3 or '').replace(';', ',')};{r.url_br or ''}"
        )
    return Response(
        content="\n".join(lines),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": "attachment; filename=subvenciones_muestra_local.csv"},
    )


@router.get("/meta/autonomic-connectors")
def autonomic_connectors() -> dict[str, Any]:
    """Stage 5 stubs — independent connectors; no duplicate of PLACSP aggregated records yet."""
    priority = [
        {"code": "ES-CT", "name": "Cataluña", "platform": "PSCP / SODA", "status": "planned", "dedupe": "against placsp_aggregated"},
        {"code": "ES-AN", "name": "Andalucía", "platform": "SiREC / CKAN", "status": "planned", "dedupe": "against placsp_aggregated"},
        {"code": "ES-MD", "name": "Madrid", "platform": "Portal propio / CKAN", "status": "planned", "dedupe": "against placsp_aggregated"},
        {"code": "ES-VC", "name": "C. Valenciana", "platform": "GVA / CKAN", "status": "planned", "dedupe": "against placsp_aggregated"},
        {"code": "ES-PV", "name": "País Vasco", "platform": "KontratazioA REST", "status": "planned", "dedupe": "against placsp_aggregated"},
        {"code": "ES-GA", "name": "Galicia", "platform": "CKAN", "status": "planned", "dedupe": "against placsp_aggregated"},
        {"code": "ES-NC", "name": "Navarra", "platform": "Foral / REST", "status": "planned", "dedupe": "against placsp_aggregated"},
    ]
    return {
        "note": "Conectores independientes preparados a nivel de catálogo. No se ingestan aún para no duplicar PLACSP ni saturar el PC.",
        "priority": priority,
        "data_kind": "methodology",
    }