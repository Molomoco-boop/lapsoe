#!/usr/bin/env python3
"""Genera frontend/public/highlights.json en GitHub Actions (sin FastAPI/SQLite)."""

from __future__ import annotations

import json
import re
import xml.etree.ElementTree as ET
from datetime import date, datetime, timedelta
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend" / "public" / "highlights.json"
BDNS = "https://www.infosubvenciones.es/bdnstrans/api"
PLACSP_AGG = (
    "https://contrataciondelsectorpublico.gob.es/sindicacion/"
    "sindicacion_1044/PlataformasAgregadasSinMenores.atom"
)
UA = "LapsoeMachinery-CI/0.1 (+github-actions)"


def get_json(url: str) -> dict:
    req = Request(url, headers={"User-Agent": UA, "Accept": "application/json"})
    with urlopen(req, timeout=90) as r:
        return json.loads(r.read().decode("utf-8", errors="replace"))


def get_bytes(url: str) -> bytes:
    req = Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urlopen(req, timeout=120) as r:
        return r.read()


def to_bdns(d: date) -> str:
    return d.strftime("%d/%m/%Y")


def parse_ben(raw: str | None) -> dict:
    if not raw:
        return {"name": None, "nif": None, "nif_is_public": False}
    m = re.match(r"^([A-Za-z]\d{7}\d|[A-Za-z]\d{8}|\d{8}[A-Za-z])\s+(.+)$", raw.strip())
    if m:
        return {"name": m.group(2).strip(), "nif": m.group(1).upper(), "nif_is_public": True}
    m = re.match(r"^\*{3}.+\*{2}\s+(.+)$", raw.strip())
    if m:
        return {"name": m.group(1).strip(), "nif": None, "nif_is_public": False}
    return {"name": raw.strip(), "nif": None, "nif_is_public": False}


def parse_atom(xml_bytes: bytes, limit: int = 80) -> tuple[list[dict], dict]:
    root = ET.fromstring(xml_bytes)
    ns = {
        "atom": "http://www.w3.org/2005/Atom",
        "cbc": "urn:dgpe:names:draft:codice:schema:xsd:CommonBasicComponents-2",
        "cac": "urn:dgpe:names:draft:codice:schema:xsd:CommonAggregateComponents-2",
    }
    updated = root.findtext("atom:updated", default=None, namespaces=ns)
    entries = []
    for entry in root.findall("atom:entry", ns)[:limit]:
        title = entry.findtext("atom:title", default="", namespaces=ns)
        summary = entry.findtext("atom:summary", default="", namespaces=ns) or ""
        folder = entry.findtext(".//cbc:ContractFolderID", default=None, namespaces=ns)
        body = entry.findtext(".//cac:PartyName/cbc:Name", default=None, namespaces=ns)
        amount = None
        for tag in ("TotalAmount", "TaxExclusiveAmount", "EstimatedOverallContractAmount"):
            t = entry.findtext(f".//cbc:{tag}", default=None, namespaces=ns)
            if t:
                try:
                    amount = float(t.replace(",", "."))
                    break
                except ValueError:
                    pass
        if amount is None:
            m = re.search(r"Importe:\s*([0-9][0-9.,]*)\s*EUR", summary, re.I)
            if m:
                amount = float(m.group(1).replace(".", "").replace(",", "."))
        link = None
        for lk in entry.findall("atom:link", ns):
            if lk.get("rel") in (None, "alternate"):
                link = lk.get("href")
                if link:
                    break
        entries.append(
            {
                "folder": folder,
                "title": title,
                "organo": body,
                "importe": amount,
                "source_url": link,
                "data_kind": "official_sample",
            }
        )
    return entries, {"feed_updated": updated, "entries_sampled": len(entries)}


def main() -> None:
    errors: list[str] = []
    bdns_totals: dict = {}
    top_grants: list = []
    top_contracts: list = []

    try:
        conv = get_json(f"{BDNS}/convocatorias/busqueda?page=0&pageSize=1")
        conc = get_json(f"{BDNS}/concesiones/busqueda?page=0&pageSize=1")
        bdns_totals = {
            "convocatorias_total": conv.get("totalElements"),
            "concesiones_total": conc.get("totalElements"),
            "provenance": "BDNS API totalElements",
            "data_kind": "official",
        }
    except Exception as exc:  # noqa: BLE001
        errors.append(f"bdns_totals: {exc}")

    try:
        hasta = date.today()
        desde = hasta - timedelta(days=3)
        q = urlencode(
            {
                "page": 0,
                "pageSize": 100,
                "fechaDesde": to_bdns(desde),
                "fechaHasta": to_bdns(hasta),
                "order": "fechaConcesion",
                "direccion": "desc",
            }
        )
        data = get_json(f"{BDNS}/concesiones/busqueda?{q}")
        rows = []
        for item in data.get("content") or []:
            p = parse_ben(item.get("beneficiario"))
            rows.append(
                {
                    "id": item.get("id"),
                    "fecha": item.get("fechaConcesion"),
                    "importe": item.get("importe"),
                    "beneficiario": p["name"],
                    "nif": p["nif"] if p["nif_is_public"] else None,
                    "convocatoria": item.get("convocatoria"),
                    "territorio": item.get("nivel2"),
                    "organo": item.get("nivel3"),
                    "data_kind": "official",
                    "window": f"{desde.isoformat()} → {hasta.isoformat()}",
                }
            )
        top_grants = sorted(rows, key=lambda r: r.get("importe") or 0, reverse=True)[:15]
    except Exception as exc:  # noqa: BLE001
        errors.append(f"bdns_grants: {exc}")

    placsp_meta: dict = {}
    try:
        xml = get_bytes(PLACSP_AGG)
        entries, placsp_meta = parse_atom(xml, 80)
        top_contracts = sorted(entries, key=lambda r: r.get("importe") or 0, reverse=True)[:15]
        placsp_meta["provenance"] = "PLACSP Atom sindicacion_1044"
        placsp_meta["data_kind"] = "official_sample"
    except Exception as exc:  # noqa: BLE001
        errors.append(f"placsp: {exc}")

    shocks = []
    if bdns_totals.get("concesiones_total") is not None:
        shocks.append(
            {
                "id": "bdns-universe",
                "eyebrow": "Universo BDNS · oficial",
                "value_num": bdns_totals["concesiones_total"],
                "value_kind": "number",
                "title": "concesiones de ayudas registradas",
                "note": "Metadato oficial totalElements",
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

    payload = {
        "generated_at": datetime.utcnow().isoformat() + "Z",
        "generated_by": "github-actions",
        "architecture": {
            "homepage": "cached_highlights_on_github",
            "search_and_browse": "live_via_cloudflare_worker",
            "hosting_note": "PC apagado OK: Pages + Worker + caché en GitHub.",
        },
        "bdns_totals": bdns_totals,
        "placsp_meta": placsp_meta,
        "shocks": shocks[:3],
        "top_grants": top_grants,
        "top_contracts": top_contracts,
        "top_encargos": [],
        "local": None,
        "local_analysis_summary": None,
        "errors": errors,
        "disclaimer": (
            "Portada cacheada en GitHub. Navegación/búsqueda en vivo vía Cloudflare Worker. "
            "Concesión ≠ pago."
        ),
        "site": "Lapsoe Machinery",
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {OUT} shocks={len(shocks)} grants={len(top_grants)} contracts={len(top_contracts)} errors={errors}")


if __name__ == "__main__":
    main()
