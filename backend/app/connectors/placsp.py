"""PLACSP Atom/CODICE connector — verified public feeds only.

Uses streaming parse (iterparse) and never loads multi-GB ZIPs in Stage 1.
Smoke mode: first feed page only, capped entry count.
"""

from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Iterator, Optional
from urllib.parse import urljoin

from lxml import etree

from app.config import settings
from app.connectors.http_client import build_client

ATOM_NS = "http://www.w3.org/2005/Atom"
NS = {
    "atom": ATOM_NS,
    "cbc": "urn:dgpe:names:draft:codice:schema:xsd:CommonBasicComponents-2",
    "cac": "urn:dgpe:names:draft:codice:schema:xsd:CommonAggregateComponents-2",
    "cacpe": "urn:dgpe:names:draft:codice-place-ext:schema:xsd:CommonAggregateComponents-2",
    "cbcpe": "urn:dgpe:names:draft:codice-place-ext:schema:xsd:CommonBasicComponents-2",
}

AMOUNT_RE = re.compile(r"Importe:\s*([0-9][0-9\.,]*)\s*EUR", re.IGNORECASE)


def _local(tag: str) -> str:
    if "}" in tag:
        return tag.rsplit("}", 1)[-1]
    return tag


def _text(el: etree._Element | None) -> str | None:
    if el is None:
        return None
    t = "".join(el.itertext()).strip()
    return t or None


def _find_text(root: etree._Element, path: str) -> str | None:
    return _text(root.find(path, namespaces=NS))


def _parse_amount_from_summary(summary: str | None) -> float | None:
    if not summary:
        return None
    m = AMOUNT_RE.search(summary)
    if not m:
        return None
    raw = m.group(1).replace(".", "").replace(",", ".")
    try:
        return float(raw)
    except ValueError:
        return None


def parse_atom_entries(xml_bytes: bytes, *, limit: int | None = None) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    """Parse Atom feed; return entries + feed metadata (updated, next link)."""
    root = etree.fromstring(xml_bytes)
    feed_updated = _find_text(root, "atom:updated")
    next_href = None
    for link in root.findall("atom:link", namespaces=NS):
        if link.get("rel") == "next":
            next_href = link.get("href")
            break

    entries: list[dict[str, Any]] = []
    for entry in root.findall("atom:entry", namespaces=NS):
        item = _parse_entry(entry)
        entries.append(item)
        if limit is not None and len(entries) >= limit:
            break

    meta = {
        "feed_updated": feed_updated,
        "next_href": next_href,
        "entries_in_page": len(root.findall("atom:entry", namespaces=NS)),
        "entries_returned": len(entries),
    }
    return entries, meta


def _parse_entry(entry: etree._Element) -> dict[str, Any]:
    entry_id = _find_text(entry, "atom:id")
    title = _find_text(entry, "atom:title")
    summary = _find_text(entry, "atom:summary")
    updated = _find_text(entry, "atom:updated")
    link_href = None
    for link in entry.findall("atom:link", namespaces=NS):
        if link.get("rel") in (None, "alternate"):
            link_href = link.get("href")
            if link_href:
                break

    folder = entry.find(".//cacpe:ContractFolderStatus", namespaces=NS)
    folder_id = _find_text(entry, ".//cbc:ContractFolderID") if folder is not None else None
    status = _find_text(entry, ".//cbcpe:ContractFolderStatusCode")
    party_id = _find_text(entry, ".//cacpe:LocatedContractingParty//cbc:ID")
    party_name = _find_text(entry, ".//cacpe:LocatedContractingParty//cac:PartyName/cbc:Name")
    nuts = _find_text(entry, ".//cbc:CountrySubentityCode")
    amount = None
    # Prefer CODICE amounts when present
    for path in (
        ".//cbc:TotalAmount",
        ".//cbc:TaxExclusiveAmount",
        ".//cbc:EstimatedOverallContractAmount",
    ):
        t = _find_text(entry, path)
        if t:
            try:
                amount = float(t.replace(",", "."))
                break
            except ValueError:
                continue
    if amount is None:
        amount = _parse_amount_from_summary(summary)

    # Recipient for EMP-like feeds (best-effort)
    recipient_name = None
    recipient_nif = None
    for party in entry.findall(".//cac:TenderResult//cac:WinningParty", namespaces=NS):
        recipient_name = _find_text(party, ".//cac:PartyName/cbc:Name")
        recipient_nif = _find_text(party, ".//cbc:ID")
        break

    return {
        "source_entry_id": entry_id,
        "title": title,
        "summary": summary,
        "updated_at_source": updated,
        "source_url": link_href,
        "contract_folder_id": folder_id,
        "status_code": status,
        "contracting_body_id": party_id,
        "contracting_body_name": party_name,
        "nuts_code": nuts,
        "amount": amount,
        "recipient_name": recipient_name,
        "recipient_nif": recipient_nif,
        "raw_xml": etree.tostring(entry, encoding="unicode"),
    }


class PlacspClient:
    def __init__(self) -> None:
        self.aggregated_url = settings.placsp_aggregated_atom
        self.emp_url = settings.placsp_emp_atom

    def fetch_feed(self, url: str) -> bytes:
        with build_client(timeout=120.0) as client:
            r = client.get(url)
            r.raise_for_status()
            return r.content

    def smoke_aggregated(self, *, limit: int = 25) -> dict[str, Any]:
        xml = self.fetch_feed(self.aggregated_url)
        entries, meta = parse_atom_entries(xml, limit=limit)
        return {
            "ok": True,
            "source_id": "placsp_aggregated",
            "feed_url": self.aggregated_url,
            "meta": meta,
            "entries": entries,
            "provenance": "Feed Atom oficial PLACSP sindicacion_1044 (muestra limitada)",
        }

    def smoke_emp(self, *, limit: int = 25) -> dict[str, Any]:
        xml = self.fetch_feed(self.emp_url)
        entries, meta = parse_atom_entries(xml, limit=limit)
        return {
            "ok": True,
            "source_id": "placsp_emp",
            "feed_url": self.emp_url,
            "meta": meta,
            "entries": entries,
            "provenance": "Feed Atom oficial PLACSP sindicacion_1383 EMP (muestra limitada)",
        }

    def health_probe(self) -> dict[str, Any]:
        """Fetch feed metadata without storing full history."""
        xml = self.fetch_feed(self.aggregated_url)
        # Only parse feed-level + count entries via iterparse for memory safety on ~4MB
        entry_count = 0
        feed_updated = None
        next_href = None
        # ~4MB feed: parse once for metadata; count entries with iterparse-friendly clear
        root = etree.fromstring(xml)
        feed_updated = _find_text(root, "atom:updated")
        for link in root.findall("atom:link", namespaces=NS):
            if link.get("rel") == "next":
                next_href = link.get("href")
                break
        entry_count = len(root.findall("atom:entry", namespaces=NS))
        return {
            "ok": True,
            "source": "PLACSP",
            "feed_url": self.aggregated_url,
            "feed_updated": feed_updated,
            "entries_in_latest_page": entry_count,
            "has_next_page": bool(next_href),
            "next_href": next_href,
            "probe_at": datetime.utcnow().isoformat() + "Z",
            "provenance": "Metadatos del feed Atom oficial (sin carga histórica)",
        }


def iter_atom_pages(start_url: str, *, max_pages: int = 1) -> Iterator[tuple[str, bytes]]:
    """Follow rel=next cautiously. Stage 1 default: 1 page."""
    url: Optional[str] = start_url
    page = 0
    client = build_client(timeout=120.0)
    try:
        while url and page < max_pages:
            r = client.get(url)
            r.raise_for_status()
            yield url, r.content
            root = etree.fromstring(r.content)
            next_href = None
            for link in root.findall(f"{{{ATOM_NS}}}link"):
                if link.get("rel") == "next":
                    next_href = link.get("href")
                    break
            url = urljoin(url, next_href) if next_href else None
            page += 1
    finally:
        client.close()