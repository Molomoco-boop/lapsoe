import Link from "next/link";
import { ShockStrip } from "@/components/ShockStrip";
import { SpainCoverageMap } from "@/components/SpainCoverageMap";
import { WasteCard, type WasteCase } from "@/components/WasteCard";
import { ComparisonBlock, type ComparisonItem } from "@/components/ComparisonBlock";
import { StatCard } from "@/components/StatCard";
import { DebtMeter } from "@/components/DebtMeter";
import { formatEuro, formatNumber } from "@/lib/api";
import { COVERAGE_TERRITORIES } from "@/lib/coverage";
import bakedHighlights from "../../public/highlights.json";

export const dynamic = "force-static";

type Highlights = {
  generated_at?: string | null;
  disclaimer?: string;
  macro_stats?: {
    deuda_publica_total?: number;
    deuda_pib_pct?: number;
    deuda_per_capita?: number;
    gasto_diario_estado?: number;
    techo_gasto_2026?: number;
    deficit_pib_pct?: number;
    ineficiencias_anuales_estimadas?: number;
    infraestructuras_abandonadas_total?: number;
    ave_mal_planificado?: number;
    publicidad_institucional_anual?: number;
    asesores_semestral?: number;
    coches_oficiales_flota?: number;
    poblacion?: number;
    sources?: Record<string, string>;
  };
  waste_cases?: WasteCase[];
  shocks?: Array<{
    id: string;
    eyebrow: string;
    value_num?: number | null;
    value_kind?: "number" | "euro" | "percent";
    title: string;
    note: string;
    href: string;
    data_kind?: string;
  }>;
  top_grants?: Array<{
    id?: number;
    importe?: number | null;
    beneficiario?: string;
    territorio?: string;
    fecha?: string;
    convocatoria?: string;
  }>;
  top_contracts?: Array<{
    importe?: number | null;
    organo?: string;
    title?: string;
    source_url?: string;
  }>;
  bdns_totals?: { concesiones_total?: number; convocatorias_total?: number };
};

function formatShockValue(kind: string | undefined, value: number | null | undefined): string {
  if (value == null) return "—";
  if (kind === "euro") return formatEuro(value);
  if (kind === "percent") return `${value}%`;
  return formatNumber(value);
}

async function loadHighlights(): Promise<Highlights | null> {
  return (bakedHighlights as unknown as Highlights) || null;
}

async function loadCoverage() {
  return COVERAGE_TERRITORIES.map((t) => ({ ...t }));
}

const COMPARISONS: ComparisonItem[] = [
  {
    icon: "✈️",
    waste: "Aeropuerto de Ciudad Real",
    wasteCost: "1.100 M€",
    couldBuy: "hospitales públicos de referencia",
    couldBuyAmount: "22 hospitales",
  },
  {
    icon: "💥",
    waste: "Almacén de gas Castor",
    wasteCost: "1.700 M€",
    couldBuy: "salarios anuales de profesores",
    couldBuyAmount: "68.000 profesores",
  },
  {
    icon: "🚄",
    waste: "AVE sin rentabilidad",
    wasteCost: "26.240 M€",
    couldBuy: "presupuestos anuales de Sanidad",
    couldBuyAmount: "5 años de Sanidad",
  },
];

export default async function HomePage() {
  const [highlights, coverage] = await Promise.all([loadHighlights(), loadCoverage()]);
  const macro = highlights?.macro_stats;
  const shocks = (highlights?.shocks || []).map((s) => ({
    eyebrow: s.eyebrow,
    value: formatShockValue(s.value_kind, s.value_num),
    title: s.title,
    note: s.note,
    href: s.href,
  }));
  const wasteCases = highlights?.waste_cases || [];
  const topGrant = highlights?.top_grants?.[0];
  const topContract = highlights?.top_contracts?.[0];

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-psoe-ink via-[#1a1a2e] to-psoe-ink text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(227,6,19,0.15),transparent_60%)]" />
        <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-psoe-red/5 blur-3xl" />
        <div className="container-obs relative py-20 sm:py-28">
          <p className="section-eyebrow text-white/50">
            Observatorio del Gasto Público · España
          </p>
          <h1 className="mt-5 max-w-4xl font-display text-5xl leading-[0.95] tracking-wide sm:text-7xl">
            Cada día, el Estado
            <br />
            <span className="text-psoe-red">gasta 592 millones €</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
            Análisis independiente del dinero público en España. Infraestructuras
            abandonadas, contratos millonarios, subvenciones y deuda récord.
            Todo documentado con fuentes oficiales.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="#despilfarro"
              className="rounded-full bg-psoe-red px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-psoe-deep"
            >
              Ver el despilfarro
            </a>
            <Link
              href="/contratos"
              className="rounded-full border-2 border-white/20 px-7 py-3.5 text-sm font-bold uppercase tracking-wide text-white transition hover:border-white/40 hover:bg-white/5"
            >
              Explorar contratos
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ SHOCK STRIP ═══ */}
      <section className="container-obs -mt-10 pb-8">
        {shocks.length > 0 ? (
          <ShockStrip items={shocks} />
        ) : (
          <div className="panel p-6 text-sm text-ink-mute">
            Cargando datos...
          </div>
        )}
        <p className="mt-4 text-xs text-ink-mute">
          {highlights?.disclaimer || "Datos de fuentes oficiales públicas."}
        </p>
      </section>

      {/* ═══ MACRO DASHBOARD ═══ */}
      <section className="border-y border-paper-line bg-white py-14">
        <div className="container-obs">
          <p className="section-eyebrow text-psoe-red">Radiografía económica</p>
          <h2 className="mt-2 section-title">España en cifras</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink-mute">
            Indicadores clave del gasto público y la situación fiscal del país,
            según datos del Banco de España, Hacienda y organismos oficiales.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Deuda pública total"
              value={formatEuro(macro?.deuda_publica_total)}
              source="Banco de España"
              period="2026"
              kind="official"
            />
            <StatCard
              label="Deuda por ciudadano"
              value={macro?.deuda_per_capita ? formatEuro(macro.deuda_per_capita) : "—"}
              source="Banco de España / INE"
              period="2026 · 47,4M hab."
              kind="calculated"
            />
            <StatCard
              label="Gasto diario del Estado"
              value={formatEuro(macro?.gasto_diario_estado)}
              source="Ministerio de Hacienda"
              period="2026 · techo de gasto"
              kind="calculated"
            />
            <StatCard
              label="Ineficiencias evitables (estimación)"
              value={formatEuro(macro?.ineficiencias_anuales_estimadas)}
              source="Instituto de Estudios Económicos"
              period="Estimación anual"
              kind="calculated"
            />
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="metric-card">
              <DebtMeter
                percentage={macro?.deuda_pib_pct || 100.2}
                label="Deuda pública como % del PIB"
                sublabel="España · 2026"
              />
            </div>
            <div className="metric-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-ink">Otros gastos cuestionados</p>
                  <p className="text-xs text-ink-mute">Partidas frecuentemente señaladas</p>
                </div>
              </div>
              <div className="mt-2 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-psoe-rose/40 px-4 py-3">
                  <span className="text-sm text-ink">Publicidad institucional</span>
                  <span className="font-display text-lg text-psoe-red">{formatEuro(macro?.publicidad_institucional_anual)}/año</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-psoe-rose/40 px-4 py-3">
                  <span className="text-sm text-ink">Asesores a dedo (gabinetes)</span>
                  <span className="font-display text-lg text-psoe-red">{formatEuro(macro?.asesores_semestral)}/sem.</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-psoe-rose/40 px-4 py-3">
                  <span className="text-sm text-ink">Flota de coches oficiales</span>
                  <span className="font-display text-lg text-psoe-red">{macro?.coches_oficiales_flota || "—"}+ vehículos</span>
                </div>
              </div>
            </div>
          </div>

          {/* Band with BDNS totals */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 rounded-2xl bg-psoe-ink px-6 py-4 text-sm text-white">
            <span>
              <span className="font-display text-xl text-psoe-red">{formatNumber(highlights?.bdns_totals?.convocatorias_total)}</span>{" "}
              convocatorias BDNS
            </span>
            <span className="hidden sm:inline text-white/30">│</span>
            <span>
              <span className="font-display text-xl text-psoe-red">{formatNumber(highlights?.bdns_totals?.concesiones_total)}</span>{" "}
              concesiones registradas
            </span>
          </div>
        </div>
      </section>

      {/* ═══ MURO DEL DESPILFARRO ═══ */}
      <section id="despilfarro" className="container-obs py-16">
        <p className="section-eyebrow text-psoe-red">Casos documentados</p>
        <h2 className="mt-2 section-title">Muro del Despilfarro</h2>
        <p className="mt-3 max-w-2xl text-sm text-ink-mute">
          Proyectos de infraestructura y gasto público que han sido ampliamente
          documentados como ejemplos de mala planificación, sobrecoste o
          abandono. Datos contrastados con fuentes periodísticas e informes oficiales.
        </p>
        <div className="waste-grid mt-10">
          {wasteCases.map((w, i) => (
            <WasteCard key={i} waste={w} />
          ))}
        </div>
      </section>

      {/* ═══ COMPARACIONES ═══ */}
      <section className="border-y border-paper-line bg-slate-50 py-16">
        <div className="container-obs">
          <p className="section-eyebrow text-psoe-red">Perspectiva</p>
          <h2 className="mt-2 section-title">¿Qué se podría haber hecho?</h2>
          <p className="mt-3 max-w-2xl text-sm text-ink-mute">
            Para dimensionar el impacto real de estas cifras, estas son algunas
            equivalencias basadas en costes medios publicados.
          </p>
          <div className="mt-10">
            <ComparisonBlock items={COMPARISONS} />
          </div>
        </div>
      </section>

      {/* ═══ CONTRATOS Y SUBVENCIONES EN VIVO ═══ */}
      <section className="container-obs py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-eyebrow text-psoe-red">Datos oficiales · última actualización</p>
            <h2 className="mt-2 section-title">Contratos y subvenciones recientes</h2>
          </div>
          <Link href="/subvenciones" className="btn-secondary">
            Ver todos
          </Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="panel overflow-hidden">
            <div className="bg-psoe-ink px-6 py-4 text-white">
              <h3 className="font-display text-2xl tracking-wide">Subvención más alta (últimos días)</h3>
            </div>
            <div className="p-6">
              {topGrant ? (
                <>
                  <p className="font-display text-4xl text-psoe-red sm:text-5xl">
                    {formatEuro(topGrant.importe)}
                  </p>
                  <p className="mt-3 text-lg font-bold">{topGrant.beneficiario}</p>
                  <p className="mt-2 text-sm text-ink-mute">
                    {topGrant.territorio} · {topGrant.fecha}
                  </p>
                  <p className="mt-1 text-sm text-ink-mute">{topGrant.convocatoria}</p>
                  <p className="mt-3 text-xs text-ink-mute italic">Concesión registrada ≠ pago efectivo</p>
                  {topGrant.id && (
                    <Link href={`/subvenciones/${topGrant.id}`} className="btn-primary mt-5 inline-flex">
                      Ver detalle
                    </Link>
                  )}
                </>
              ) : (
                <p className="text-sm text-ink-mute">Sin datos disponibles.</p>
              )}
            </div>
          </article>

          <article className="panel overflow-hidden">
            <div className="bg-psoe-red px-6 py-4 text-white">
              <h3 className="font-display text-2xl tracking-wide">Contrato más alto del feed</h3>
            </div>
            <div className="p-6">
              {topContract ? (
                <>
                  <p className="font-display text-4xl text-psoe-red sm:text-5xl">
                    {formatEuro(topContract.importe)}
                  </p>
                  <p className="mt-3 text-lg font-bold">{topContract.organo}</p>
                  <p className="mt-2 text-sm text-ink-mute">{topContract.title}</p>
                  <Link href="/contratos" className="btn-primary mt-5 inline-flex">
                    Ver ranking completo
                  </Link>
                </>
              ) : (
                <p className="text-sm text-ink-mute">Sin datos disponibles.</p>
              )}
            </div>
          </article>
        </div>

        {/* Ranking de ayudas */}
        {(highlights?.top_grants?.length || 0) > 1 && (
          <div className="mt-10">
            <h3 className="font-display text-2xl tracking-wide">Últimas subvenciones registradas</h3>
            <div className="mt-4 space-y-3">
              {highlights!.top_grants!.slice(0, 5).map((g, i) => (
                <Link
                  key={g.id || i}
                  href={g.id ? `/subvenciones/${g.id}` : "/subvenciones"}
                  className="panel flex flex-col gap-1 p-4 transition hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold">{g.beneficiario}</p>
                    <p className="text-xs text-ink-mute">
                      {g.territorio} · {g.fecha}
                    </p>
                  </div>
                  <p className="font-display text-2xl text-psoe-red">{formatEuro(g.importe)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ═══ NAVEGACIÓN ═══ */}
      <section className="section-dark py-14">
        <div className="container-obs">
          <h2 className="font-display text-4xl tracking-wide sm:text-5xl">Explora los datos</h2>
          <p className="mt-3 max-w-xl text-white/60">
            Accede a las bases de datos oficiales en tiempo real. Contratos,
            subvenciones y encargos del sector público español.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/contratos", t: "Contratos", d: "PLACSP · licitaciones y adjudicaciones" },
              { href: "/subvenciones", t: "Subvenciones", d: "BDNS · convocatorias y concesiones" },
              { href: "/encargos", t: "Encargos", d: "Encargos a medios propios" },
              { href: "/buscar", t: "Buscador", d: "Empresa, organismo o expediente" },
            ].map((x) => (
              <Link
                key={x.href}
                href={x.href}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-psoe-red hover:bg-psoe-red/10"
              >
                <p className="font-display text-2xl tracking-wide">{x.t}</p>
                <p className="mt-2 text-sm text-white/60">{x.d}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ MAPA DE COBERTURA ═══ */}
      <section className="container-obs py-14">
        <SpainCoverageMap territories={coverage} />
      </section>
    </div>
  );
}