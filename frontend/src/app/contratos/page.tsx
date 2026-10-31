"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PagePunch } from "@/components/PagePunch";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { LiveStatus } from "@/components/LiveStatus";
import { apiGet, formatEuro, formatNumber } from "@/lib/api";

type LiveContract = {
  source_entry_id?: string;
  contract_folder_id?: string;
  title?: string;
  contracting_body_name?: string;
  amount?: number | null;
  status_code?: string;
  source_url?: string;
};

export default function ContratosPage() {
  const [live, setLive] = useState<{
    entries: LiveContract[];
    meta?: { feed_updated?: string };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await apiGet<{ entries: LiveContract[]; meta?: { feed_updated?: string } }>(
          "/placsp/contracts/live?limit=40",
        );
        if (!cancelled) {
          setLive(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error PLACSP");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ranked = useMemo(
    () =>
      [...(live?.entries || [])]
        .filter((e) => (e.amount || 0) > 0)
        .sort((a, b) => (b.amount || 0) - (a.amount || 0)),
    [live],
  );
  const top = ranked[0];
  const top3sum = ranked.slice(0, 3).reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div>
      <PagePunch
        kicker="Contratos · PLACSP en vivo"
        title="Quién se lleva los contratos"
        lead="Importes del último feed Atom oficial. En GitHub Pages los datos se piden al Worker en el navegador."
        shocks={[
          {
            eyebrow: "Top del feed · oficial",
            value: top ? formatEuro(top.amount) : loading ? "…" : "N/D",
            title: top?.contracting_body_name || "Sin importe en resumen",
            note: top?.title?.slice(0, 90) || "Feed agregado sin menores de CCAA propias",
            href: "#live",
          },
          {
            eyebrow: "Top 3 del feed",
            value: loading ? "…" : formatEuro(top3sum),
            title: "suma de los tres mayores importes visibles",
            note: "Calculado sobre esta página del Atom — no es el histórico nacional",
            href: "#live",
          },
          {
            eyebrow: "Entradas",
            value: formatNumber(live?.entries?.length ?? 0),
            title: "en esta muestra del feed",
            note: live?.meta?.feed_updated ? `Actualizado ${live.meta.feed_updated}` : "vía Worker",
            href: "#live",
          },
        ]}
        ctaHref="/investigaciones"
        ctaLabel="Ver concentraciones"
      />

      <div className="container-obs py-8">
        <div id="live" className="mt-4">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-display text-3xl tracking-wide text-ink">Ranking del feed</h2>
            <ProvenanceBadge kind="official" />
          </div>
          <LiveStatus loading={loading} error={error} />
          {live && (
            <div className="space-y-3">
              {ranked.slice(0, 12).map((row, idx) => (
                <article
                  key={row.source_entry_id || idx}
                  className="panel flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-display text-2xl text-psoe-red">{formatEuro(row.amount)}</p>
                    <p className="mt-1 font-bold text-ink">{row.contracting_body_name || "Órgano N/D"}</p>
                    <p className="mt-1 truncate text-sm text-ink-mute">{row.title}</p>
                    <p className="mt-1 font-mono text-xs text-ink-mute">{row.contract_folder_id}</p>
                  </div>
                  {row.source_url && (
                    <a
                      href={row.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary shrink-0 !py-2 text-xs"
                    >
                      Fuente
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
          <p className="mt-8 text-sm text-ink-mute">
            Las fichas locales (`/contratos/id`) no se pregeneran en Pages. Usa el enlace a la fuente
            oficial.{" "}
            <Link className="text-psoe-red" href="/metodologia/">
              Metodología
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
