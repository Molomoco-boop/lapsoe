"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { SearchBox } from "@/components/SearchBox";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { LiveStatus } from "@/components/LiveStatus";
import { apiGet, formatEuro } from "@/lib/api";

type SearchPayload = {
  results: {
    companies_or_beneficiaries: Array<{ id: number; descripcion: string }>;
    grant_calls_live: Array<{
      id: number;
      numeroConvocatoria?: string;
      descripcion?: string;
      nivel2?: string;
    }>;
    contracts_local: Array<{ id: number; title?: string; body?: string; folder?: string }>;
    grants_local: Array<{
      id: number;
      beneficiario?: string;
      importe?: number;
      cod?: string;
    }>;
  };
  errors?: string[];
};

function BuscarInner() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") || "").trim();
  const [results, setResults] = useState<SearchPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setResults(null);
      setError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGet<SearchPayload>(`/search?q=${encodeURIComponent(query)}`);
        if (!cancelled) setResults(data);
      } catch (e) {
        if (!cancelled) {
          setResults(null);
          setError(e instanceof Error ? e.message : "Error de búsqueda");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div className="container-obs py-12">
      <p className="eyebrow">Buscador global</p>
      <h1 className="mt-3 font-display text-4xl text-ink">Buscar</h1>
      <div className="mt-8 max-w-2xl">
        <SearchBox initial={query} large />
      </div>

      {!query && (
        <p className="mt-8 text-sm text-ink-mute">
          Prueba con una empresa, un ayuntamiento, un CIF o un código de convocatoria.
        </p>
      )}

      {query && <LiveStatus loading={loading} error={error} />}

      {results && (
        <div className="mt-10 space-y-10">
          <section>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-display text-2xl text-ink">Beneficiarios (BDNS)</h2>
              <ProvenanceBadge kind="official" />
            </div>
            {results.results.companies_or_beneficiaries.length === 0 ? (
              <p className="text-sm text-ink-mute">Sin coincidencias en /terceros.</p>
            ) : (
              <ul className="panel divide-y divide-paper-line">
                {results.results.companies_or_beneficiaries.map((b) => (
                  <li key={`${b.id}-${b.descripcion}`} className="px-5 py-4 text-sm">
                    <span className="font-medium text-ink">{b.descripcion}</span>
                    <span className="ml-3 font-mono text-xs text-ink-mute">id {b.id}</span>
                    <div className="mt-2">
                      <Link
                        className="text-psoe-red"
                        href={`/subvenciones/?beneficiario=${encodeURIComponent(b.descripcion)}`}
                      >
                        Ver concesiones
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center gap-3">
              <h2 className="font-display text-2xl text-ink">Convocatorias (BDNS)</h2>
              <ProvenanceBadge kind="official" />
            </div>
            {results.results.grant_calls_live.length === 0 ? (
              <p className="text-sm text-ink-mute">Sin convocatorias en esta búsqueda.</p>
            ) : (
              <ul className="panel divide-y divide-paper-line">
                {results.results.grant_calls_live.map((c) => (
                  <li key={c.id} className="px-5 py-4 text-sm">
                    <p className="font-medium text-ink">{c.descripcion || c.numeroConvocatoria}</p>
                    <p className="mt-1 text-xs text-ink-mute">
                      {c.numeroConvocatoria} · {c.nivel2}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {(results.results.grants_local?.length || 0) > 0 && (
            <section>
              <h2 className="mb-3 font-display text-2xl text-ink">Muestra local</h2>
              <ul className="panel divide-y divide-paper-line">
                {results.results.grants_local.map((g) => (
                  <li key={g.id} className="px-5 py-4 text-sm">
                    {g.beneficiario} · {formatEuro(g.importe)}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense fallback={<div className="container-obs py-12 text-sm text-ink-mute">Cargando…</div>}>
      <BuscarInner />
    </Suspense>
  );
}
