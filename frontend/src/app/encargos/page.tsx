"use client";

import { useEffect, useMemo, useState } from "react";
import { PagePunch } from "@/components/PagePunch";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { LiveStatus } from "@/components/LiveStatus";
import { apiGet, formatEuro, formatNumber } from "@/lib/api";

type Entry = {
  title?: string;
  contracting_body_name?: string;
  recipient_name?: string;
  recipient_nif?: string;
  amount?: number | null;
  contract_folder_id?: string;
  source_url?: string;
};

export default function EncargosPage() {
  const [live, setLive] = useState<{
    entries: Entry[];
    meta?: { feed_updated?: string };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<{ entries: Entry[]; meta?: { feed_updated?: string } }>(
          "/placsp/encargos/live?limit=50",
        );
        if (!cancelled) {
          setLive(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
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
  const sum = ranked.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div>
      <PagePunch
        kicker="Encargos · medios propios"
        title="Encargos que duelen a la vista"
        lead="Quién encarga a quién y por cuánto, según el feed oficial EMP vía Worker."
        shocks={[
          {
            eyebrow: "Mayor importe visible",
            value: top ? formatEuro(top.amount) : loading ? "…" : "N/D",
            title: top?.recipient_name || top?.contracting_body_name || "Sin importe parseado",
            note: top?.title?.slice(0, 90) || "Feed sindicacion_1383",
            href: "#lista",
          },
          {
            eyebrow: "Suma de esta página",
            value: loading ? "…" : formatEuro(sum),
            title: `${formatNumber(ranked.length)} encargos con importe`,
            note: live?.meta?.feed_updated ? `Feed ${live.meta.feed_updated}` : "Atom EMP",
            href: "#lista",
          },
          {
            eyebrow: "Entradas en feed",
            value: formatNumber(live?.entries?.length || 0),
            title: "cargadas ahora",
            note: "Muestra limitada del feed diario",
            href: "#lista",
          },
        ]}
      />

      <div id="lista" className="container-obs py-8">
        <div className="mb-4 flex items-center gap-3">
          <h2 className="font-display text-3xl tracking-wide">Feed EMP</h2>
          <ProvenanceBadge kind="official" />
        </div>
        <LiveStatus loading={loading} error={error} />
        <div className="space-y-3">
          {ranked.slice(0, 20).map((row, idx) => (
            <article key={row.contract_folder_id || idx} className="panel p-5">
              <p className="font-display text-2xl text-psoe-red">{formatEuro(row.amount)}</p>
              <p className="mt-1 font-bold text-ink">
                {row.recipient_name || row.contracting_body_name || "N/D"}
              </p>
              <p className="mt-1 text-sm text-ink-mute">{row.title}</p>
              {row.source_url && (
                <a
                  className="btn-primary mt-3 inline-flex !py-1 text-xs"
                  href={row.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Fuente
                </a>
              )}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
