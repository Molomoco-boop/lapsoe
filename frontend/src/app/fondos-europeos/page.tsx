"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { LiveStatus } from "@/components/LiveStatus";
import { apiGet, formatNumber } from "@/lib/api";

export default function FondosEuropeosPage() {
  const [mrrCalls, setMrrCalls] = useState<{
    total_elements?: number;
    content?: Array<{
      id: number;
      descripcion?: string;
      numeroConvocatoria?: string;
      nivel2?: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<NonNullable<typeof mrrCalls>>(
          "/bdns/convocatorias?page=0&page_size=15&mrr=true",
        );
        if (!cancelled) setMrrCalls(data);
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

  return (
    <div className="container-obs py-12">
      <p className="eyebrow">PRTR · Next Generation · MRR</p>
      <h1 className="mt-3 font-display text-4xl text-ink">Fondos europeos</h1>
      <p className="mt-4 max-w-2xl text-ink-mute">
        Distinguimos: <strong className="font-medium text-ink">concedido</strong> ≠ contrato ≠{" "}
        <strong className="font-medium text-ink">pagado</strong>. Convocatorias BDNS con flag MRR vía
        Worker.
      </p>

      <LiveStatus loading={loading} error={error} />

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <article className="panel p-5">
          <ProvenanceBadge kind="official" />
          <h2 className="mt-3 font-display text-xl text-ink">Concedido (BDNS)</h2>
          <p className="mt-4 font-display text-3xl">{formatNumber(mrrCalls?.total_elements)}</p>
          <p className="mt-1 text-xs text-ink-mute">universo filtrado mrr=true</p>
        </article>
        <article className="panel p-5">
          <ProvenanceBadge kind="unavailable" />
          <h2 className="mt-3 font-display text-xl text-ink">AIReF / pagos</h2>
          <p className="mt-2 text-sm text-ink-mute">Diferido: sin conector auditable aún.</p>
        </article>
        <article className="panel p-5">
          <ProvenanceBadge kind="planned" />
          <h2 className="mt-3 font-display text-xl text-ink">Seguimiento</h2>
          <Link href="/metodologia/" className="mt-4 inline-flex text-sm text-psoe-red">
            Ver límites metodológicos
          </Link>
        </article>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-ink">Convocatorias MRR (muestra)</h2>
        <ul className="panel mt-4 divide-y divide-paper-line">
          {(mrrCalls?.content || []).map((c) => (
            <li key={c.id} className="px-5 py-4 text-sm">
              <p className="font-medium text-ink">{c.descripcion || c.numeroConvocatoria}</p>
              <p className="mt-1 text-xs text-ink-mute">
                {c.numeroConvocatoria} · {c.nivel2}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
