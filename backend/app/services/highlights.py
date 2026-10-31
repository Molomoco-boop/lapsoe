"""Precomputed homepage highlights.

Architecture:
- Portada: lee JSON cacheado (rápido, impactante).
- Búsqueda / listados: siguen yendo en vivo a BDNS / PLACSP.
- Si el PC está apagado, DuckDNS no sirve la web (solo DNS).
"""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from app.config import DATA_DIR, settings
from app.connectors.bdns import BdnsClient, parse_beneficiario
from app.connectors.placsp import PlacspClient
from app.services.analysis import build_investigations
from app.services.ingest_smoke import local_stats

CACHE_PATH = DATA_DIR / "cache" / "highlights.json"


def _euro(n: float | int | None) -> float | None:
    if n is None:
        return None
    try:
        return float(n)
    except (TypeError, ValueError):
        return None


async def build_highlights(db: Session | None = None) -> dict[str, Any]:
    """Descarga lo más impactante y lo materializa en caché."""
    errors: list[str] = []
    bdns_totals: dict[str, Any] = {}
    top_grants: list[dict[str, Any]] = []
    top_contracts: list[dict[str, Any]] = []
    top_encargos: list[dict[str, Any]] = []
    placsp_meta: dict[str, Any] = {}

    client = BdnsClient()
    try:
        try:
            probe = await client.health_probe()
            bdns_totals = {
                "convocatorias_total": probe.get("convocatorias_total"),
                "concesiones_total": probe.get("concesiones_total"),
                "provenance": probe.get("provenance"),
                "data_kind": "official",
            }
        except Exception as exc:  # noqa: BLE001
            errors.append(f"bdns_totals: {exc}")

        # Ventana reciente de concesiones → ranking por importe
        try:
            hasta = date.today()
            desde = hasta - timedelta(days=3)
            raw = await client.search_concesiones(
                page=0,
                page_size=100,
                fecha_desde=desde,
                fecha_hasta=hasta,
                order="fechaConcesion",
                direccion="desc",
            )
            rows = []
            for item in raw.get("content") or []:
                parsed = parse_beneficiario(item.get("beneficiario"))
                rows.append(
                    {
                        "id": item.get("id"),
                        "cod": item.get("codConcesion"),
                        "fecha": item.get("fechaConcesion"),
                        "importe": _euro(item.get("importe")),
                        "beneficiario": parsed.get("name"),
                        "nif": parsed.get("nif") if parsed.get("nif_is_public") else None,
                        "nif_is_public": bool(parsed.get("nif_is_public")),
                        "convocatoria": item.get("convocatoria"),
                        "organo": item.get("nivel3"),
                        "territorio": item.get("nivel2"),
                        "url_br": item.get("urlBR"),
                        "data_kind": "official",
                        "window": f"{desde.isoformat()} → {hasta.isoformat()}",
                    }
                )
            top_grants = sorted(rows, key=lambda r: r.get("importe") or 0, reverse=True)[:15]
        except Exception as exc:  # noqa: BLE001
            errors.append(f"bdns_grants: {exc}")
    finally:
        await client.aclose()

    try:
        placsp = PlacspClient()
        agg = placsp.smoke_aggregated(limit=80)
        placsp_meta = {
            "feed_updated": (agg.get("meta") or {}).get("feed_updated"),
            "entries_sampled": len(agg.get("entries") or []),
            "provenance": agg.get("provenance"),
            "data_kind": "official_sample",
        }
        contracts = []
        for e in agg.get("entries") or []:
            contracts.append(
                {
                    "folder": e.get("contract_folder_id"),
                    "title": e.get("title"),
                    "organo": e.get("contracting_body_name"),
                    "importe": _euro(e.get("amount")),
                    "status": e.get("status_code"),
                    "source_url": e.get("source_url"),
                    "data_kind": "official_sample",
                }
            )
        top_contracts = sorted(contracts, key=lambda r: r.get("importe") or 0, reverse=True)[:15]

        emp = placsp.smoke_emp(limit=60)
        encargos = []
        for e in emp.get("entries") or []:
            encargos.append(
                {
                    "folder": e.get("contract_folder_id"),
                    "title": e.get("title"),
                    "organo": e.get("contracting_body_name"),
                    "receptor": e.get("recipient_name"),
                    "nif": e.get("recipient_nif"),
                    "importe": _euro(e.get("amount")),
                    "source_url": e.get("source_url"),
                    "data_kind": "official_sample",
                }
            )
        top_encargos = sorted(encargos, key=lambda r: r.get("importe") or 0, reverse=True)[:10]
    except Exception as exc:  # noqa: BLE001
        errors.append(f"placsp: {exc}")

    local_analysis = None
    local = None
    if db is not None:
        try:
            local = local_stats(db)
            local_analysis = build_investigations(db)
        except Exception as exc:  # noqa: BLE001
            errors.append(f"local_analysis: {exc}")

    # Tarjetas de portada (impactantes + trazables)
    shocks: list[dict[str, Any]] = []
    if bdns_totals.get("concesiones_total") is not None:
        shocks.append(
            {
                "id": "bdns-universe",
                "eyebrow": "Universo BDNS · oficial",
                "value_num": bdns_totals["concesiones_total"],
                "value_kind": "number",
                "title": "concesiones de ayudas registradas",
                "note": "Metadato oficial totalElements (no inventado)",
                "href": "/subvenciones",
                "data_kind": "official",
            }
        )
    if top_grants:
        g = top_grants[0]
        shocks.append(
            {
                "id": "top-grant-window",
                "eyebrow": "Ayuda más alta · últimos días",
                "value_num": g.get("importe"),
                "value_kind": "euro",
                "title": g.get("beneficiario") or "Beneficiario",
                "note": f"{g.get('territorio') or ''} · {g.get('fecha') or ''} · concedido ≠ pagado",
                "href": f"/subvenciones/{g.get('id')}" if g.get("id") else "/subvenciones",
                "data_kind": "official",
            }
        )
    if top_contracts:
        c = top_contracts[0]
        shocks.append(
            {
                "id": "top-contract-feed",
                "eyebrow": "Contrato top · feed PLACSP",
                "value_num": c.get("importe"),
                "value_kind": "euro",
                "title": c.get("organo") or "Órgano",
                "note": (c.get("title") or "")[:120],
                "href": "/contratos",
                "data_kind": "official_sample",
            }
        )

    conc = None
    if local_analysis:
        for a in local_analysis.get("alerts") or []:
            if a.get("id") == "concentration-bodies":
                conc = a
                break
        if conc and conc.get("value_pct") is not None and len(shocks) < 3:
            shocks.append(
                {
                    "id": "concentration",
                    "eyebrow": "Concentración · calculado",
                    "value_num": conc.get("value_pct"),
                    "value_kind": "percent",
                    "title": "del importe local en solo 3 órganos",
                    "note": "Pista de investigación. No implica ilegalidad.",
                    "href": "/investigaciones",
                    "data_kind": "calculated_from_local_sample",
                }
            )

    payload = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "architecture": {
            "homepage": "cached_highlights",
            "search_and_browse": "live_official_apis",
            "hosting_note": (
                "DuckDNS solo apunta el dominio a tu IP. Si apagas el PC, "
                "Caddy/Next/API se caen y la web deja de responder."
            ),
        },
        "bdns_totals": bdns_totals,
        "placsp_meta": placsp_meta,
        "shocks": shocks[:3],
        "top_grants": top_grants,
        "top_contracts": top_contracts,
        "top_encargos": top_encargos,
        "local": local,
        "local_analysis_summary": {
            "sample_sizes": (local_analysis or {}).get("sample_sizes"),
            "top_contracting_bodies": ((local_analysis or {}).get("top_contracting_bodies") or [])[:5],
            "top_grant_beneficiaries": ((local_analysis or {}).get("top_grant_beneficiaries") or [])[:5],
            "alerts": [
                {
                    "id": a.get("id"),
                    "title": a.get("title"),
                    "value_pct": a.get("value_pct"),
                    "why_interesting": a.get("why_interesting"),
                    "limitations": a.get("limitations"),
                }
                for a in ((local_analysis or {}).get("alerts") or [])
            ],
        }
        if local_analysis
        else None,
        "errors": errors,
        "disclaimer": (
            "Portada cacheada a partir de fuentes oficiales en el momento de la generación. "
            "Búsquedas y listados consultan las APIs en vivo. Concesión ≠ pago."
        ),
        "site": settings.app_name,
    }
    return payload


def save_highlights(payload: dict[str, Any]) -> Path:
    CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
    CACHE_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return CACHE_PATH


def load_highlights() -> dict[str, Any] | None:
    if not CACHE_PATH.exists():
        return None
    try:
        return json.loads(CACHE_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


async def refresh_highlights(db: Session | None = None) -> dict[str, Any]:
    payload = await build_highlights(db)
    save_highlights(payload)
    return payload
