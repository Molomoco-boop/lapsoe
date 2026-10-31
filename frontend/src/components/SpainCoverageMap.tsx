"use client";

type Territory = {
  code: string;
  name: string;
  placsp_direct: boolean;
  placsp_aggregated: boolean;
  own_platform: boolean;
  bdns_covered: boolean;
  level: string;
  notes?: string | null;
};

/** Simplified coverage map — shows source coverage, not spending amounts. */
export function SpainCoverageMap({ territories }: { territories: Territory[] }) {
  const byName = Object.fromEntries(territories.map((t) => [t.name, t]));

  const cells: Array<{ key: string; label: string; match?: string }> = [
    { key: "GA", label: "GAL", match: "Galicia" },
    { key: "AS", label: "AST", match: "Asturias" },
    { key: "CB", label: "CANT", match: "Cantabria" },
    { key: "PV", label: "EUS", match: "País Vasco" },
    { key: "NC", label: "NAV", match: "Navarra" },
    { key: "RI", label: "RIO", match: "La Rioja" },
    { key: "AR", label: "ARA", match: "Aragón" },
    { key: "CT", label: "CAT", match: "Cataluña" },
    { key: "CL", label: "CyL", match: "Castilla y León" },
    { key: "MD", label: "MAD", match: "Comunidad de Madrid" },
    { key: "CM", label: "CLM", match: "Castilla-La Mancha" },
    { key: "VC", label: "VAL", match: "Comunidad Valenciana" },
    { key: "EX", label: "EXT", match: "Extremadura" },
    { key: "AN", label: "AND", match: "Andalucía" },
    { key: "MC", label: "MUR", match: "Murcia" },
    { key: "IB", label: "BAL", match: "Illes Balears" },
    { key: "CN", label: "CAN", match: "Canarias" },
    { key: "CE", label: "CEU", match: "Ceuta" },
    { key: "ML", label: "MEL", match: "Melilla" },
  ];

  function tone(t?: Territory) {
    if (!t) return "bg-slate-100 text-slate-400";
    if (t.own_platform) return "bg-signal text-white";
    if (t.placsp_direct) return "bg-signal-bright/80 text-white";
    return "bg-signal-wash text-signal";
  }

  return (
    <div className="panel p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Cobertura territorial</p>
          <h2 className="mt-2 font-display text-2xl text-ink">
            Qué territorios están cubiertos por nuestras fuentes
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ink-mute">
            Este mapa indica cobertura de publicación, no volumen de gasto. Los
            importes solo aparecen cuando hay datos ingestados o metadatos
            oficiales.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-ink-mute">
          <span className="inline-flex items-center gap-2">
            <i className="h-3 w-3 rounded-sm bg-signal" /> Plataforma propia + agregado
          </span>
          <span className="inline-flex items-center gap-2">
            <i className="h-3 w-3 rounded-sm bg-signal-bright/80" /> PLACSP directo
          </span>
          <span className="inline-flex items-center gap-2">
            <i className="h-3 w-3 rounded-sm bg-signal-wash ring-1 ring-signal/30" />{" "}
            BDNS (todas)
          </span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {cells.map((c) => {
          const t = c.match ? byName[c.match] : undefined;
          return (
            <div
              key={c.key}
              title={
                t
                  ? `${t.name} · nivel ${t.level}${t.notes ? ` · ${t.notes}` : ""}`
                  : c.label
              }
              className={`flex min-h-[4.5rem] flex-col justify-between rounded-xl p-3 transition ${tone(t)}`}
            >
              <span className="text-[11px] font-medium tracking-wide opacity-90">
                {c.label}
              </span>
              <span className="text-[10px] leading-tight opacity-80">
                {t?.own_platform
                  ? "Propia"
                  : t?.placsp_direct
                    ? "PLACSP"
                    : t
                      ? "BDNS"
                      : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}