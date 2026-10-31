"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart } from "@/components/BarChart";
import { PagePunch } from "@/components/PagePunch";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { LiveStatus } from "@/components/LiveStatus";
import { apiGet, formatEuro, formatNumber } from "@/lib/api";
import baked from "../../../public/highlights.json";

type Investigations = {
  disclaimer: string;
  sample_sizes: { contracts: number; grant_awards: number; in_house_orders: number };
  top_contracting_bodies: Array<{ name: string; amount: number; operations: number }>;
  top_grant_beneficiaries: Array<{
    nif: string;
    name: string;
    amount: number;
    operations: number;
  }>;
  territorial_grants: Array<{ territory: string; amount: number; operations: number }>;
  alerts: Array<{
    id: string;
    title: string;
    what?: string;
    data_used?: string;
    period?: string;
    why_interesting?: string;
    limitations?: string;
    documents?: string;
    value_pct?: number | null;
  }>;
  top_grants_live_window?: Array<{
    importe?: number | null;
    beneficiario?: string;
    territorio?: string;
  }>;
  top_contracts_feed?: Array<{
    importe?: number | null;
    organo?: string;
    title?: string;
  }>;
};

function fromHighlights(): Investigations {
  const hl = baked as unknown as {
    local_analysis_summary?: Investigations | null;
    top_grants?: Investigations["top_grants_live_window"];
    top_contracts?: Investigations["top_contracts_feed"];
    disclaimer?: string;
  };
  const s = hl.local_analysis_summary || undefined;
  return {
    disclaimer:
      hl.disclaimer ||
      "Alertas descriptivas de caché/highlights. En Worker no hay SQLite completo.",
    sample_sizes: s?.sample_sizes || { contracts: 0, grant_awards: 0, in_house_orders: 0 },
    top_contracting_bodies: s?.top_contracting_bodies || [],
    top_grant_beneficiaries: s?.top_grant_beneficiaries || [],
    territorial_grants: s?.territorial_grants || [],
    alerts: s?.alerts || [],
    top_grants_live_window: hl.top_grants || [],
    top_contracts_feed: hl.top_contracts || [],
  };
}

export default function InvestigacionesPage() {
  const [data, setData] = useState<Investigations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const remote = await apiGet<Investigations>("/analysis/investigations");
        if (!cancelled) setData(remote);
      } catch (e) {
        if (!cancelled) {
          setData(fromHighlights());
          setError(e instanceof Error ? e.message : null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const view = data || fromHighlights();
  const top = view.top_contracting_bodies?.[0];
  const conc = view.alerts?.find((a) => a.id === "concentration-bodies");
  const topBen = view.top_grant_beneficiaries?.[0];
  const feedTop = view.top_contracts_feed?.[0];
  const grantTop = view.top_grants_live_window?.[0];

  return (
    <div>
      <PagePunch
        kicker="Lo gordo · alertas descriptivas"
        title="Las cifras que te paran el scroll"
        lead="Patrones de la caché de portada y del Worker. No son condenas."
        shocks={[
          {
            eyebrow: "Órgano top (muestra)",
            value: top ? formatEuro(top.amount) : feedTop ? formatEuro(feedTop.importe) : "N/D",
            title: top?.name || feedTop?.organo || "Sin muestra local",
            note: top
              ? `${top.operations} operaciones en muestra`
              : feedTop?.title?.slice(0, 80) || "Caché / feed",
            href: "/contratos/",
          },
          {
            eyebrow: "Concentración",
            value: conc?.value_pct != null ? `${conc.value_pct}%` : "N/D",
            title: "del importe en solo 3 órganos",
            note: "Calculado · no implica irregularidad",
            href: "#alertas",
          },
          {
            eyebrow: "Ayuda / beneficiario",
            value: topBen
              ? formatEuro(topBen.amount)
              : grantTop
                ? formatEuro(grantTop.importe)
                : "N/D",
            title: topBen?.name || grantTop?.beneficiario || "Sin NIF en muestra",
            note: topBen ? `NIF ${topBen.nif}` : grantTop?.territorio || "—",
            href: topBen ? `/empresas/${topBen.nif}/` : "/subvenciones/",
          },
        ]}
      />

      <div className="container-obs py-10">
        <LiveStatus loading={loading} error={error && !data ? error : null} />
        <p className="mb-8 text-sm text-ink-mute">{view.disclaimer}</p>

        {view.top_contracting_bodies.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="font-display text-3xl">Órganos · muestra</h2>
              <ProvenanceBadge kind="sample" />
            </div>
            <BarChart
              items={view.top_contracting_bodies.slice(0, 8).map((b) => ({
                label: b.name,
                value: b.amount,
              }))}
            />
          </section>
        )}

        {view.top_contracts_feed && view.top_contracts_feed.length > 0 && (
          <section className="mb-12">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="font-display text-3xl">Top contratos (caché feed)</h2>
              <ProvenanceBadge kind="official" />
            </div>
            <div className="space-y-3">
              {view.top_contracts_feed.slice(0, 8).map((c, i) => (
                <article key={i} className="panel p-4">
                  <p className="font-display text-xl text-psoe-red">{formatEuro(c.importe)}</p>
                  <p className="font-bold">{c.organo}</p>
                  <p className="text-sm text-ink-mute">{c.title}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section id="alertas" className="mb-12">
          <h2 className="mb-4 font-display text-3xl">Alertas</h2>
          {!view.alerts.length ? (
            <p className="panel p-5 text-sm text-ink-mute">
              Sin alertas de muestra local. La portada se refresca a diario en GitHub Actions.
            </p>
          ) : (
            <div className="space-y-4">
              {view.alerts.map((a) => (
                <article key={a.id} className="panel p-5">
                  <h3 className="font-bold text-ink">{a.title}</h3>
                  {a.value_pct != null && (
                    <p className="mt-2 font-display text-3xl text-psoe-red">{a.value_pct}%</p>
                  )}
                  <p className="mt-2 text-sm">{a.why_interesting || a.what}</p>
                  {a.limitations && (
                    <p className="mt-2 text-xs text-ink-mute">Límites: {a.limitations}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <p className="text-sm text-ink-mute">
          Muestra local: {formatNumber(view.sample_sizes.contracts)} contratos ·{" "}
          {formatNumber(view.sample_sizes.grant_awards)} ayudas.{" "}
          <Link className="text-psoe-red" href="/metodologia/">
            Metodología
          </Link>
        </p>
      </div>
    </div>
  );
}
