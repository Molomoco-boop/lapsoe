"""Smoke ingestion — capped samples only. Never full history."""

from __future__ import annotations

import json
from datetime import date, datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.connectors.bdns import BdnsClient, parse_beneficiario
from app.connectors.placsp import PlacspClient
from app.models import Contract, GrantAward, GrantCall, InHouseOrder, Source, SyncRun


def _parse_dt(value: str | None) -> datetime | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    try:
        return date.fromisoformat(value[:10])
    except ValueError:
        return None


async def smoke_ingest_bdns(db: Session, *, page_size: int = 50) -> dict[str, Any]:
    run = SyncRun(source_id="bdns_concesiones", mode="smoke", status="running")
    db.add(run)
    db.commit()
    db.refresh(run)

    client = BdnsClient()
    try:
        conv = await client.search_convocatorias(page=0, page_size=page_size)
        conc = await client.search_concesiones(page=0, page_size=page_size)
        inserted_c = updated_c = 0
        for item in conv.get("content") or []:
            cid = item["id"]
            row = db.get(GrantCall, cid)
            payload = {
                "numero_convocatoria": item.get("numeroConvocatoria"),
                "descripcion": item.get("descripcion"),
                "fecha_recepcion": _parse_date(item.get("fechaRecepcion")),
                "mrr": item.get("mrr"),
                "nivel1": item.get("nivel1"),
                "nivel2": item.get("nivel2"),
                "nivel3": item.get("nivel3"),
                "codigo_invente": item.get("codigoInvente"),
                "raw_json": json.dumps(item, ensure_ascii=False),
            }
            if row is None:
                db.add(GrantCall(id=cid, **payload))
                inserted_c += 1
            else:
                for k, v in payload.items():
                    setattr(row, k, v)
                updated_c += 1

        inserted_a = updated_a = 0
        for item in conc.get("content") or []:
            aid = item["id"]
            parsed = parse_beneficiario(item.get("beneficiario"))
            # Do not store reconstructed personal identifiers
            payload = {
                "cod_concesion": item.get("codConcesion"),
                "fecha_concesion": _parse_date(item.get("fechaConcesion")),
                "fecha_alta": _parse_date(item.get("fechaAlta")),
                "beneficiario_raw": item.get("beneficiario"),
                "beneficiario_nif": parsed["nif"] if parsed["nif_is_public"] else None,
                "beneficiario_name": parsed["name"],
                "nif_is_public": bool(parsed["nif_is_public"]),
                "instrumento": item.get("instrumento"),
                "importe": item.get("importe"),
                "ayuda_equivalente": item.get("ayudaEquivalente"),
                "url_br": item.get("urlBR"),
                "numero_convocatoria": item.get("numeroConvocatoria"),
                "id_convocatoria": item.get("idConvocatoria"),
                "convocatoria": item.get("convocatoria"),
                "nivel1": item.get("nivel1"),
                "nivel2": item.get("nivel2"),
                "nivel3": item.get("nivel3"),
                "codigo_invente": item.get("codigoInvente"),
                "id_persona": item.get("idPersona"),
                "raw_json": json.dumps(item, ensure_ascii=False),
            }
            row = db.get(GrantAward, aid)
            if row is None:
                db.add(GrantAward(id=aid, **payload))
                inserted_a += 1
            else:
                for k, v in payload.items():
                    setattr(row, k, v)
                updated_a += 1

        received = len(conv.get("content") or []) + len(conc.get("content") or [])
        run.received = received
        run.inserted = inserted_c + inserted_a
        run.updated = updated_c + updated_a
        run.status = "ok"
        run.finished_at = datetime.utcnow()
        run.detail = json.dumps(
            {
                "convocatorias_page_total": conv.get("totalElements"),
                "concesiones_page_total": conc.get("totalElements"),
                "note": "Smoke: solo primera página de cada endpoint",
            },
            ensure_ascii=False,
        )
        for sid in ("bdns_convocatorias", "bdns_concesiones"):
            src = db.get(Source, sid)
            if src:
                src.last_success_at = datetime.utcnow()
                src.last_attempt_at = datetime.utcnow()
                src.last_error = None
        db.commit()
        return {
            "run_id": run.id,
            "status": "ok",
            "received": run.received,
            "inserted": run.inserted,
            "updated": run.updated,
            "api_totals": {
                "convocatorias": conv.get("totalElements"),
                "concesiones": conc.get("totalElements"),
            },
        }
    except Exception as exc:  # noqa: BLE001
        run.status = "error"
        run.errors = 1
        run.finished_at = datetime.utcnow()
        run.detail = str(exc)
        src = db.get(Source, "bdns_concesiones")
        if src:
            src.last_attempt_at = datetime.utcnow()
            src.last_error = str(exc)
        db.commit()
        raise
    finally:
        await client.aclose()


def smoke_ingest_placsp(db: Session, *, limit: int = 40) -> dict[str, Any]:
    run = SyncRun(source_id="placsp_aggregated", mode="smoke", status="running")
    db.add(run)
    db.commit()
    db.refresh(run)

    client = PlacspClient()
    try:
        agg = client.smoke_aggregated(limit=limit)
        emp = client.smoke_emp(limit=limit)
        inserted = updated = 0

        for item in agg["entries"]:
            existing = db.execute(
                select(Contract).where(Contract.source_entry_id == item["source_entry_id"])
            ).scalar_one_or_none()
            payload = {
                "source_id": "placsp_aggregated",
                "contract_folder_id": item.get("contract_folder_id"),
                "title": item.get("title"),
                "summary": item.get("summary"),
                "status_code": item.get("status_code"),
                "contracting_body_name": item.get("contracting_body_name"),
                "contracting_body_id": item.get("contracting_body_id"),
                "amount": item.get("amount"),
                "nuts_code": item.get("nuts_code"),
                "updated_at_source": _parse_dt(item.get("updated_at_source")),
                "source_url": item.get("source_url"),
                "raw_xml": item.get("raw_xml"),
            }
            if existing is None:
                db.add(Contract(source_entry_id=item["source_entry_id"], **payload))
                inserted += 1
            else:
                for k, v in payload.items():
                    setattr(existing, k, v)
                updated += 1

        for item in emp["entries"]:
            existing = db.execute(
                select(InHouseOrder).where(InHouseOrder.source_entry_id == item["source_entry_id"])
            ).scalar_one_or_none()
            payload = {
                "source_id": "placsp_emp",
                "contract_folder_id": item.get("contract_folder_id"),
                "title": item.get("title"),
                "summary": item.get("summary"),
                "ordering_body_name": item.get("contracting_body_name"),
                "ordering_body_id": item.get("contracting_body_id"),
                "recipient_name": item.get("recipient_name"),
                "recipient_nif": item.get("recipient_nif"),
                "amount": item.get("amount"),
                "updated_at_source": _parse_dt(item.get("updated_at_source")),
                "source_url": item.get("source_url"),
                "raw_xml": item.get("raw_xml"),
            }
            if existing is None:
                db.add(InHouseOrder(source_entry_id=item["source_entry_id"], **payload))
                inserted += 1
            else:
                for k, v in payload.items():
                    setattr(existing, k, v)
                updated += 1

        received = len(agg["entries"]) + len(emp["entries"])
        run.received = received
        run.inserted = inserted
        run.updated = updated
        run.status = "ok"
        run.finished_at = datetime.utcnow()
        run.checkpoint = agg["meta"].get("next_href")
        run.detail = json.dumps(
            {
                "aggregated_feed_updated": agg["meta"].get("feed_updated"),
                "emp_feed_updated": emp["meta"].get("feed_updated"),
                "note": f"Smoke: máx. {limit} entradas por feed, sin seguir rel=next",
            },
            ensure_ascii=False,
        )
        for sid, meta in (("placsp_aggregated", agg["meta"]), ("placsp_emp", emp["meta"])):
            src = db.get(Source, sid)
            if src:
                src.last_success_at = datetime.utcnow()
                src.last_attempt_at = datetime.utcnow()
                src.last_error = None
        db.commit()
        return {
            "run_id": run.id,
            "status": "ok",
            "received": received,
            "inserted": inserted,
            "updated": updated,
            "feed_meta": {"aggregated": agg["meta"], "emp": emp["meta"]},
        }
    except Exception as exc:  # noqa: BLE001
        run.status = "error"
        run.errors = 1
        run.finished_at = datetime.utcnow()
        run.detail = str(exc)
        src = db.get(Source, "placsp_aggregated")
        if src:
            src.last_attempt_at = datetime.utcnow()
            src.last_error = str(exc)
        db.commit()
        raise


def local_stats(db: Session) -> dict[str, Any]:
    def count(model) -> int:  # type: ignore[no-untyped-def]
        return db.scalar(select(func.count()).select_from(model)) or 0

    contract_sum = db.scalar(select(func.sum(Contract.amount)))
    award_sum = db.scalar(select(func.sum(GrantAward.importe)))
    return {
        "contracts_local": count(Contract),
        "in_house_orders_local": count(InHouseOrder),
        "grant_calls_local": count(GrantCall),
        "grant_awards_local": count(GrantAward),
        "contracts_amount_sum_local": contract_sum,
        "grant_awards_amount_sum_local": award_sum,
        "note": "Totales locales de muestras ingestadas. No representan el universo nacional.",
        "data_kind": "calculated_from_local_sample",
    }