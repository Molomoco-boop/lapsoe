function apiBase(): string {
  const pub = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
  if (typeof window === "undefined") {
    // Build/SSR local: FastAPI. En Pages estático no hay SSR de datos.
    if (pub.startsWith("http")) return pub;
    return (process.env.API_UPSTREAM || "http://127.0.0.1:8000").replace(/\/$/, "") + "/api";
  }
  // Navegador: Worker en prod, /api en local (rewrite Next) o URL absoluta
  if (pub) return pub;
  return "/api";
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${apiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const url = `${apiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text || res.statusText);
  }
  return res.json() as Promise<T>;
}

/** Portada: primero fichero estático en Pages; si falla, Worker/API. */
export async function loadHighlightsFileOrApi<T>(): Promise<T | null> {
  try {
    const r = await fetch("/highlights.json", { cache: "no-store" });
    if (r.ok) return (await r.json()) as T;
  } catch {
    /* continue */
  }
  try {
    return await apiGet<T>("/highlights");
  } catch {
    return null;
  }
}

export function formatEuro(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "No disponible";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "No disponible";
  return new Intl.NumberFormat("es-ES").format(value);
}

export type OverviewResponse = {
  local: {
    contracts_local: number;
    in_house_orders_local: number;
    grant_calls_local: number;
    grant_awards_local: number;
    contracts_amount_sum_local: number | null;
    grant_awards_amount_sum_local: number | null;
    note: string;
    data_kind: string;
  };
  live: {
    bdns: {
      convocatorias_total?: number;
      concesiones_total?: number;
      probe_at?: string;
      provenance?: string;
    } | null;
    placsp: {
      feed_updated?: string;
      entries_in_latest_page?: number;
      has_next_page?: boolean;
      probe_at?: string;
      provenance?: string;
    } | null;
  };
  sources: Array<{
    id: string;
    name: string;
    status: string;
    last_success_at: string | null;
  }>;
  errors: string[];
  disclaimer: string;
};
