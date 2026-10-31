"""BDNS connector — only verified endpoints and filter parameters.

Verified 2026-10-31:
- page is 0-indexed
- pageSize works at least up to 1000 (we cap lower for live proxy)
- fechaDesde/fechaHasta require DD/MM/YYYY
- beneficiario requires internal id from /terceros?busqueda=
- numeroConvocatoria, descripcion filter correctly
- mrr filters convocatorias; not reliable on concesiones
"""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any, Optional

import httpx

from app.config import settings
from app.connectors.http_client import build_async_client

NIF_PUBLIC_RE = re.compile(r"^([A-Z]\d{7}\d|[A-Z]\d{8}|\d{8}[A-Z])\s+(.+)$", re.IGNORECASE)
NIF_ANON_RE = re.compile(r"^\*{3}.+\*{2}\s+(.+)$")


def to_bdns_date(value: date | datetime | str) -> str:
    if isinstance(value, datetime):
        value = value.date()
    if isinstance(value, date):
        return value.strftime("%d/%m/%Y")
    # accept already DD/MM/YYYY
    if re.match(r"^\d{2}/\d{2}/\d{4}$", value):
        return value
    # accept ISO
    if re.match(r"^\d{4}-\d{2}-\d{2}$", value):
        y, m, d = value.split("-")
        return f"{d}/{m}/{y}"
    raise ValueError(f"Unsupported date format for BDNS: {value}")


def parse_beneficiario(raw: str | None) -> dict[str, Any]:
    if not raw:
        return {
            "raw": None,
            "nif": None,
            "name": None,
            "nif_is_public": False,
            "is_anonymized_person": False,
        }
    m = NIF_PUBLIC_RE.match(raw.strip())
    if m:
        return {
            "raw": raw,
            "nif": m.group(1).upper(),
            "name": m.group(2).strip(),
            "nif_is_public": True,
            "is_anonymized_person": False,
        }
    m = NIF_ANON_RE.match(raw.strip())
    if m:
        return {
            "raw": raw,
            "nif": None,
            "name": m.group(1).strip(),
            "nif_is_public": False,
            "is_anonymized_person": True,
        }
    return {
        "raw": raw,
        "nif": None,
        "name": raw.strip(),
        "nif_is_public": False,
        "is_anonymized_person": False,
    }


class BdnsClient:
    def __init__(self, client: httpx.AsyncClient | None = None):
        self._client = client
        self.base = settings.bdns_api_base.rstrip("/")

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = await build_async_client()
        return self._client

    async def aclose(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    async def _get(self, path: str, params: dict[str, Any]) -> dict[str, Any]:
        client = await self._get_client()
        # drop None values
        clean = {k: v for k, v in params.items() if v is not None and v != ""}
        r = await client.get(f"{self.base}/{path.lstrip('/')}", params=clean)
        r.raise_for_status()
        return r.json()

    async def search_convocatorias(
        self,
        *,
        page: int = 0,
        page_size: int = 50,
        fecha_desde: str | date | None = None,
        fecha_hasta: str | date | None = None,
        descripcion: str | None = None,
        numero_convocatoria: str | None = None,
        mrr: bool | None = None,
        order: str | None = None,
        direccion: str | None = None,
    ) -> dict[str, Any]:
        page_size = min(page_size, settings.bdns_max_page_size)
        params: dict[str, Any] = {"page": page, "pageSize": page_size}
        if fecha_desde and fecha_hasta:
            params["fechaDesde"] = to_bdns_date(fecha_desde)
            params["fechaHasta"] = to_bdns_date(fecha_hasta)
        if descripcion:
            params["descripcion"] = descripcion
        if numero_convocatoria:
            params["numeroConvocatoria"] = numero_convocatoria
        if mrr is not None:
            params["mrr"] = str(mrr).lower()
        if order:
            params["order"] = order
        if direccion:
            params["direccion"] = direccion
        return await self._get("convocatorias/busqueda", params)

    async def search_concesiones(
        self,
        *,
        page: int = 0,
        page_size: int = 50,
        fecha_desde: str | date | None = None,
        fecha_hasta: str | date | None = None,
        fecha_reg_inicio: str | date | None = None,
        fecha_reg_fin: str | date | None = None,
        descripcion: str | None = None,
        numero_convocatoria: str | None = None,
        cod_concesion: str | None = None,
        beneficiario_id: int | None = None,
        order: str | None = "fechaConcesion",
        direccion: str | None = "desc",
    ) -> dict[str, Any]:
        page_size = min(page_size, settings.bdns_max_page_size)
        params: dict[str, Any] = {"page": page, "pageSize": page_size}
        if fecha_desde and fecha_hasta:
            params["fechaDesde"] = to_bdns_date(fecha_desde)
            params["fechaHasta"] = to_bdns_date(fecha_hasta)
        if fecha_reg_inicio and fecha_reg_fin:
            params["fechaRegInicio"] = to_bdns_date(fecha_reg_inicio)
            params["fechaRegFin"] = to_bdns_date(fecha_reg_fin)
        if descripcion:
            params["descripcion"] = descripcion
        if numero_convocatoria:
            params["numeroConvocatoria"] = numero_convocatoria
        if cod_concesion:
            params["codConcesion"] = cod_concesion
        if beneficiario_id is not None:
            params["beneficiario"] = beneficiario_id
        if order:
            params["order"] = order
        if direccion:
            params["direccion"] = direccion
        return await self._get("concesiones/busqueda", params)

    async def search_terceros(self, query: str) -> dict[str, Any]:
        return await self._get("terceros", {"busqueda": query})

    async def health_probe(self) -> dict[str, Any]:
        """Lightweight metadata-only probe — pageSize=1."""
        conv = await self.search_convocatorias(page=0, page_size=1)
        conc = await self.search_concesiones(page=0, page_size=1)
        return {
            "ok": True,
            "source": "BDNS",
            "base_url": self.base,
            "convocatorias_total": conv.get("totalElements"),
            "concesiones_total": conc.get("totalElements"),
            "probe_at": datetime.utcnow().isoformat() + "Z",
            "provenance": "metadato oficial de la API BDNS (totalElements)",
            "sample_convocatoria_id": (conv.get("content") or [{}])[0].get("id"),
            "sample_concesion_id": (conc.get("content") or [{}])[0].get("id"),
        }