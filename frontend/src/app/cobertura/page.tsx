"use client";

import { SpainCoverageMap } from "@/components/SpainCoverageMap";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { COVERAGE_TERRITORIES } from "@/lib/coverage";

const SOURCES = [
  { id: "placsp_aggregated", name: "PLACSP — Plataformas agregadas", status: "verified" },
  { id: "placsp_emp", name: "PLACSP — Encargos medios propios", status: "verified" },
  { id: "bdns_concesiones", name: "BDNS — Concesiones", status: "verified" },
  { id: "bdns_convocatorias", name: "BDNS — Convocatorias", status: "verified" },
  { id: "airef_prtr", name: "AIReF — PRTR", status: "deferred" },
];

export default function CoberturaPage() {
  const coverage = COVERAGE_TERRITORIES.map((t) => ({ ...t }));
  const priority = coverage
    .filter((c) => c.own_platform)
    .map((c) => ({ code: c.code, name: c.name, platform: "propia", status: "planned" }));

  return (
    <div className="container-obs py-12">
      <p className="eyebrow">Qué está cubierto de verdad</p>
      <h1 className="mt-3 font-display text-4xl text-ink">Cobertura</h1>
      <p className="mt-4 max-w-2xl text-ink-mute">
        No ocultamos huecos: feeds con certificado, contratos menores de CCAA con plataforma propia e
        histórico no ingestado se declaran aquí.
      </p>

      <div className="mt-10">
        <SpainCoverageMap territories={coverage} />
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-ink">Estado de fuentes</h2>
        <div className="mt-4 grid gap-3">
          {SOURCES.map((s) => (
            <div key={s.id} className="panel flex flex-wrap items-center justify-between gap-3 p-4">
              <p className="font-medium text-ink">{s.name}</p>
              <span className="text-[11px] uppercase text-ink-mute">{s.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="font-display text-2xl text-ink">Conectores autonómicos</h2>
          <ProvenanceBadge kind="planned" />
        </div>
        <p className="mb-4 text-sm text-ink-mute">
          Planificados; sin ingesta automática en Worker.
        </p>
        <ul className="panel divide-y divide-paper-line">
          {priority.map((p) => (
            <li key={p.code} className="flex justify-between px-5 py-3 text-sm">
              <span>{p.name}</span>
              <span className="text-ink-mute">{p.status}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
