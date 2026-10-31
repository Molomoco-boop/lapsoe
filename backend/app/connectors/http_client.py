from __future__ import annotations

import httpx

from app.config import settings


def build_client(timeout: float | None = None) -> httpx.Client:
    return httpx.Client(
        timeout=timeout or settings.http_timeout_seconds,
        headers={"User-Agent": settings.user_agent, "Accept": "*/*"},
        follow_redirects=True,
    )


async def build_async_client(timeout: float | None = None) -> httpx.AsyncClient:
    return httpx.AsyncClient(
        timeout=timeout or settings.http_timeout_seconds,
        headers={"User-Agent": settings.user_agent, "Accept": "*/*"},
        follow_redirects=True,
    )