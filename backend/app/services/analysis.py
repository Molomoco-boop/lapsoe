"""Descriptive investigation indicators — never legal conclusions."""

from __future__ import annotations

from collections import defaultdict
from typing import Any

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.models import Contract, GrantAward, InHouseOrder


def _pct(part: int, whole: int) -> float | None:
    if whole <= 0:
        return None
    return round(100.0 * part / whole, 2)


def build_investigations(db: Session) -> dict[str, Any]:
    contracts = db.execute(select(Contract)).scalars().all()
    awards = db.execute(select(GrantAward)).scalars().all()
    orders = db.execute(select(InHouseOrder)).scalars().all()

    # Top contracting bodies by amount (local sample)
    by_body: dict[str, dict[str, float | int]] = defaultdict(lambda: {"amount": 0.0, "count": 0})
    for c in contracts:
        key = c.contracting_body_name or "No disponible"
        by_body[key]["amount"] = float(by_body[key]["amount"]) + float(c.amount or 0)
        by_body[key]["count"] = int(by_body[key]["count"]) + 1
    top_bodies = sorted(
        (
            {
                "name": k,
                "amount": v["amount"],
                "operations": v["count"],
                "data_kind": "calculated_from_local_sample",
            }
            for k, v in by_body.items()
        ),
        key=lambda x: x["amount"],
        reverse=True,
    )[:15]

    # Top grant beneficiaries with public NIF only
    by_ben: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"amount": 0.0, "count": 0, "nif": None, "name": None}
    )
    for a in awards:
        if not a.nif_is_public or not a.beneficiario_nif:
            continue
        key = a.beneficiario_nif
        by_ben[key]["amount"] = float(by_ben[key]["amount"]) + float(a.importe or 0)
        by_ben[key]["count"] = int(by_ben[key]["count"]) + 1
        by_ben[key]["nif"] = a.beneficiario_nif
        by_ben[key]["name"] = a.beneficiario_name
    top_beneficiaries = sorted(
        (
            {
                "nif": v["nif"],
                "name": v["name"],
                "amount": v["amount"],
                "operations": v["count"],
                "data_kind": "calculated_from_local_sample",
            }
            for v in by_ben.values()
        ),
        key=lambda x: x["amount"],
        reverse=True,
    )[:15]

    # Concentration: share of top 3 bodies
    total_amount = sum(float(c.amount or 0) for c in contracts)
    top3_amount = sum(float(x["amount"]) for x in top_bodies[:3])
    concentration = {
        "title": "Concentración de importes en los 3 órganos con mayor volumen (muestra local)",
        "what": "Porcentaje del importe adjudicado/publicado en la muestra local que concentran los tres órganos principales.",
        "data_used": "Tabla contracts (PLACSP smoke/local)",
        "period": "Registros presentes en la base local en el momento del cálculo",
        "value_pct": _pct(int(top3_amount), int(total_amount)) if total_amount else None,
        "top3": top_bodies[:3],
        "why_interesting": "Una concentración elevada puede merecer revisión periodística del patrón de adjudicación.",
        "limitations": "Muestra local incompleta; no implica irregularidad ni ilegalidad; importes pueden ser estimados/parciales del feed Atom.",
        "documents": "Entradas Atom PLACSP almacenadas localmente (source_entry_id / source_url).",
        "data_kind": "calculated_from_local_sample",
    }

    # Recurring amounts
    amount_freq: dict[float, int] = defaultdict(int)
    for c in contracts:
        if c.amount is not None:
            amount_freq[round(float(c.amount), 2)] += 1
    recurring = sorted(
        ({"amount": a, "count": n} for a, n in amount_freq.items() if n >= 2),
        key=lambda x: x["count"],
        reverse=True,
    )[:10]

    # Companies with both contracts (via body text) and grants — NIF cross when possible
    grant_nifs = {a.beneficiario_nif for a in awards if a.nif_is_public and a.beneficiario_nif}
    order_nifs = {o.recipient_nif for o in orders if o.recipient_nif}
    cross = sorted(grant_nifs & order_nifs)

    # Territorial distribution of grant awards in sample
    by_terr: dict[str, dict[str, float | int]] = defaultdict(lambda: {"amount": 0.0, "count": 0})
    for a in awards:
        t = a.nivel2 or "No disponible"
        by_terr[t]["amount"] = float(by_terr[t]["amount"]) + float(a.importe or 0)
        by_terr[t]["count"] = int(by_terr[t]["count"]) + 1
    territorial = sorted(
        (
            {"territory": k, "amount": v["amount"], "operations": v["count"]}
            for k, v in by_terr.items()
        ),
        key=lambda x: x["amount"],
        reverse=True,
    )

    # In-house recipients
    by_rec: dict[str, dict[str, Any]] = defaultdict(lambda: {"amount": 0.0, "count": 0, "nif": None})
    for o in orders:
        key = o.recipient_name or o.recipient_nif or "No disponible"
        by_rec[key]["amount"] = float(by_rec[key]["amount"]) + float(o.amount or 0)
        by_rec[key]["count"] = int(by_rec[key]["count"]) + 1
        by_rec[key]["nif"] = o.recipient_nif
        by_rec[key]["name"] = o.recipient_name
    top_recipients = sorted(
        (
            {
                "name": v["name"],
                "nif": v["nif"],
                "amount": v["amount"],
                "operations": v["count"],
            }
            for v in by_rec.values()
        ),
        key=lambda x: x["amount"],
        reverse=True,
    )[:15]

    alerts = [
        {
            "id": "concentration-bodies",
            "severity": "medium" if (concentration["value_pct"] or 0) >= 50 else "low",
            **concentration,
        },
        {
            "id": "recurring-amounts",
            "severity": "low",
            "title": "Importes recurrentes en contratos de la muestra",
            "what": "Importes que se repiten dos o más veces en la muestra local.",
            "data_used": "contracts.amount",
            "period": "Muestra local",
            "items": recurring,
            "why_interesting": "Puede indicar lotes similares, plantillas o patrones de precios.",
            "limitations": "Sin contexto del expediente no se puede inferir irregularidad; el feed puede truncar o redondear importes.",
            "documents": "Fichas locales de contrato y enlaces Atom source_url.",
            "data_kind": "calculated_from_local_sample",
        },
        {
            "id": "cross-grant-emp",
            "severity": "info",
            "title": "NIF presentes a la vez en subvenciones y encargos (muestra)",
            "what": "Identificadores fiscales públicos que aparecen en GrantAward y InHouseOrder locales.",
            "data_used": "grant_awards.beneficiario_nif ∩ in_house_orders.recipient_nif",
            "period": "Muestra local",
            "nifs": cross,
            "why_interesting": "Útil para investigar entidades que operan en varios instrumentos públicos.",
            "limitations": "Cobertura incompleta; no implica conflicto ni ilegalidad; EMP y subvenciones son regímenes distintos.",
            "documents": "Registros locales con NIF público y fuentes oficiales enlazadas.",
            "data_kind": "calculated_from_local_sample",
        },
    ]

    return {
        "disclaimer": (
            "Indicadores descriptivos sobre la muestra local y metadatos oficiales. "
            "Una anomalía estadística no implica corrupción, delito ni ilegalidad."
        ),
        "sample_sizes": {
            "contracts": len(contracts),
            "grant_awards": len(awards),
            "in_house_orders": len(orders),
        },
        "top_contracting_bodies": top_bodies,
        "top_grant_beneficiaries": top_beneficiaries,
        "top_in_house_recipients": top_recipients,
        "territorial_grants": territorial,
        "alerts": alerts,
        "data_kind": "calculated_from_local_sample",
    }


def company_timeline(db: Session, nif: str) -> dict[str, Any]:
    nif_u = nif.upper()
    awards = db.execute(
        select(GrantAward)
        .where(GrantAward.beneficiario_nif == nif_u)
        .order_by(desc(GrantAward.fecha_concesion))
    ).scalars().all()
    orders = db.execute(
        select(InHouseOrder)
        .where(InHouseOrder.recipient_nif == nif_u)
        .order_by(desc(InHouseOrder.id))
    ).scalars().all()

    by_year: dict[str, float] = defaultdict(float)
    for a in awards:
        if a.fecha_concesion:
            by_year[str(a.fecha_concesion.year)] += float(a.importe or 0)

    return {
        "nif": nif_u,
        "grant_awards_local": [
            {
                "id": a.id,
                "date": a.fecha_concesion.isoformat() if a.fecha_concesion else None,
                "amount": a.importe,
                "call": a.convocatoria,
                "body": a.nivel3,
            }
            for a in awards
        ],
        "in_house_orders_local": [
            {
                "id": o.id,
                "title": o.title,
                "amount": o.amount,
                "ordering_body": o.ordering_body_name,
            }
            for o in orders
        ],
        "annual_grant_amounts": [
            {"year": y, "amount": by_year[y]} for y in sorted(by_year.keys())
        ],
        "data_kind": "local_sample",
        "match_method": "exact_nif",
    }