"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { PagePunch } from "@/components/PagePunch";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { LiveStatus } from "@/components/LiveStatus";
import { apiGet, formatEuro, formatNumber } from "@/lib/api";

type Award = {
  id: number;
  fechaConcesion?: string;
  importe?: number;
  convocatoria?: string;
  nivel2?: string;
  nivel3?: string;
  urlBR?: string;
  beneficiario_parsed?: {
    name?: string;
    nif?: string | null;
    nif_is_public?: boolean;
  };
};

function defaultWindow() {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 1);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { desde: fmt(from), hasta: fmt(today) };
}

export default function SubvencionesPage() {
  const [q, setQ] = useState("");
  const [beneficiario, setBeneficiario] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overviewTotal, setOverviewTotal] = useState<number | null>(null);
  const [data, setData] = useState<{
    content: Award[];
    total_elements?: number;
  } | null>(null);

  const load = useCallback(async (filters: { q: string; beneficiario: string }) => {
    setLoading(true);
    setError(null);
    const qs = new URLSearchParams();
    qs.set("page", "0");
    qs.set("page_size", "30");
    if (filters.q) qs.set("descripcion", filters.q);
    if (filters.beneficiario) qs.set("beneficiario_q", filters.beneficiario);
    if (!filters.q && !filters.beneficiario) {
      const w = defaultWindow();
      qs.set("fecha_desde", w.desde);
      qs.set("fecha_hasta", w.hasta);
    }
    try {
      const [ov, conc] = await Promise.all([
        apiGet<{ live: { bdns: { concesiones_total?: number } | null } }>("/stats/overview").catch(
          () => null,
        ),
        apiGet<{ content: Award[]; total_elements?: number }>(`/bdns/concesiones?${qs}`),
      ]);
      setOverviewTotal(ov?.live.bdns?.concesiones_total ?? null);
      setData(conc);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error BDNS");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load({ q: "", beneficiario: "" });
  }, [load]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void load({ q: q.trim(), beneficiario: beneficiario.trim() });
  }

  const ranked = useMemo(
    () => [...(data?.content || [])].sort((a, b) => (b.importe || 0) - (a.importe || 0)),
    [data],
  );
  const top = ranked[0];
  const sumPage = ranked.reduce((s, r) => s + (r.importe || 0), 0);

  return (
    <div>
      <PagePunch
        kicker="Subvenciones · BDNS"
        title="Ayudas que llaman la atención"
        lead="Importes altos de la ventana reciente vía Worker. Concedido ≠ cobrado."
        shocks={[
          {
            eyebrow: "Universo BDNS",
            value: formatNumber(overviewTotal),
            title: "concesiones registradas",
            note: "Metadato oficial totalElements",
            href: "#lista",
          },
          {
            eyebrow: "Más gorda de esta página",
            value: top ? formatEuro(top.importe) : loading ? "…" : "N/D",
            title: top?.beneficiario_parsed?.name || "Sin resultados",
            note: top?.convocatoria?.slice(0, 80) || "Ajusta filtros si quieres",
            href: "#lista",
          },
          {
            eyebrow: "Suma de esta página",
            value: loading ? "…" : formatEuro(sumPage),
            title: `${formatNumber(ranked.length)} filas visibles`,
            note: "Ordenado por importe en el cliente",
            href: "#lista",
          },
        ]}
      />

      <div className="container-obs py-8">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <input
            className="input-obs sm:min-w-[200px]"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Descripción / texto"
          />
          <input
            className="input-obs sm:min-w-[200px]"
            value={beneficiario}
            onChange={(e) => setBeneficiario(e.target.value)}
            placeholder="Beneficiario (nombre o CIF)"
          />
          <button className="btn-primary" type="submit">
            Buscar en vivo
          </button>
        </form>

        <div id="lista" className="mt-10">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="font-display text-3xl tracking-wide">Concesiones</h2>
            <ProvenanceBadge kind="official" />
          </div>
          <LiveStatus loading={loading} error={error} />
          {!loading && !ranked.length && !error && (
            <p className="panel p-5 text-sm text-ink-mute">Sin resultados en esta ventana.</p>
          )}
          <div className="space-y-3">
            {ranked.map((row) => (
              <article key={row.id} className="panel p-5">
                <p className="font-display text-2xl text-psoe-red">{formatEuro(row.importe)}</p>
                <p className="mt-1 font-bold text-ink">
                  {row.beneficiario_parsed?.name || "Beneficiario N/D"}
                </p>
                <p className="mt-1 text-sm text-ink-mute">{row.convocatoria}</p>
                <p className="mt-1 text-xs text-ink-mute">
                  {row.fechaConcesion} · {row.nivel3 || row.nivel2 || ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {row.beneficiario_parsed?.nif && row.beneficiario_parsed.nif_is_public && (
                    <Link
                      className="btn-secondary !py-1 text-xs"
                      href={`/empresas/${row.beneficiario_parsed.nif}/`}
                    >
                      Ficha CIF
                    </Link>
                  )}
                  {row.urlBR && (
                    <a
                      className="btn-primary !py-1 text-xs"
                      href={row.urlBR}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Boletín
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
