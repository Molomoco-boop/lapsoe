import Link from "next/link";
import { HostingBanner } from "@/components/HostingBanner";
import { ShockStrip } from "@/components/ShockStrip";
import { SpainCoverageMap } from "@/components/SpainCoverageMap";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { formatEuro, formatNumber } from "@/lib/api";
import { COVERAGE_TERRITORIES } from "@/lib/coverage";
import bakedHighlights from "../../public/highlights.json";

export const dynamic = "force-static";

type Highlights = {
  missing?: boolean;
  generated_at?: string | null;
  disclaimer?: string;
  architecture?: { hosting_note?: string; homepage?: string; search_and_browse?: string };
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
    nif?: string | null;
  }>;
  top_contracts?: Array<{
    importe?: number | null;
    organo?: string;
    title?: string;
    source_url?: string;
  }>;
  top_encargos?: Array<{
    importe?: number | null;
    organo?: string;
    receptor?: string;
    title?: string;
  }>;
  bdns_totals?: { concesiones_total?: number; convocatorias_total?: number };
  local_analysis_summary?: {
    top_contracting_bodies?: Array<{ name: string; amount: number; operations: number }>;
    alerts?: Array<{
      id: string;
      title: string;
      value_pct?: number | null;
      why_interesting?: string;
      limitations?: string;
    }>;
  } | null;
};

function formatShockValue(kind: string | undefined, value: number | null | undefined): string {
  if (value == null) return "No disponible";
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

export default async function HomePage() {
  const [highlights, coverage] = await Promise.all([loadHighlights(), loadCoverage()]);
  const shocks = (highlights?.shocks || []).map((s) => ({
    eyebrow: s.eyebrow,
    value: formatShockValue(s.value_kind, s.value_num),
    title: s.title,
    note: s.note,
    href: s.href,
  }));
  const topBody = highlights?.local_analysis_summary?.top_contracting_bodies?.[0];
  const conc = highlights?.local_analysis_summary?.alerts?.find((a) => a.id === "concentration-bodies");
  const topGrant = highlights?.top_grants?.[0];
  const topContract = highlights?.top_contracts?.[0];

  return (
    <div>
      <HostingBanner note={highlights?.architecture?.hosting_note} />

      <section className="relative overflow-hidden bg-psoe-red text-white">
        <div className="pointer-events-none absolute -right-16 top-10 h-64 w-64 rounded-full bg-white/10" />
        <div className="container-obs relative py-16 sm:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/80">
            Transparencia sin anestesia
          </p>
          <h1 className="mt-4 max-w-4xl font-display text-5xl leading-[0.95] tracking-wide sm:text-7xl">
            ¿A dónde va
            <br />
            el dinero público?
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-white/85">
            Portada con lo más impactante ya descargado. Cuando buscas o navegas,
            pegamos en vivo a las APIs oficiales. Sin inventar cifras.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/investigaciones"
              className="rounded-full bg-white px-6 py-3 text-sm font-bold uppercase tracking-wide text-psoe-red"
            >
              Ver lo más gordo
            </Link>
            <Link
              href="/contratos"
              className="rounded-full border-2 border-white px-6 py-3 text-sm font-bold uppercase tracking-wide text-white"
            >
              Contratos en vivo
            </Link>
          </div>
          {highlights?.generated_at && (
            <p className="mt-6 text-xs text-white/70">
              Caché de portada generada: {highlights.generated_at}
            </p>
          )}
        </div>
      </section>

      <section className="container-obs -mt-10 pb-8">
        {highlights?.missing || shocks.length === 0 ? (
          <div className="panel p-6 text-sm text-ink-mute">
            Aún no hay highlights cacheados. Genera la portada impactante con{" "}
            <code className="font-mono text-xs">POST /api/highlights/refresh</code>.
          </div>
        ) : (
          <ShockStrip items={shocks} />
        )}
        <p className="mt-4 text-xs text-ink-mute">
          {highlights?.disclaimer ||
            "Portada cacheada · navegación y búsqueda en vivo a BDNS/PLACSP."}
        </p>
      </section>

      <section className="section-band py-4">
        <div className="container-obs flex flex-wrap items-center justify-between gap-3 text-sm font-bold uppercase tracking-wide">
          <span className="text-psoe-red">
            {formatNumber(highlights?.bdns_totals?.convocatorias_total)} convocatorias BDNS
          </span>
          <span className="text-psoe-red">
            {formatNumber(highlights?.bdns_totals?.concesiones_total)} concesiones
          </span>
          <span>
            Arquitectura: {highlights?.architecture?.homepage || "caché"} +{" "}
            {highlights?.architecture?.search_and_browse || "APIs en vivo"}
          </span>
        </div>
      </section>

      <section className="container-obs py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Precargado · para flipar</p>
            <h2 className="mt-2 font-display text-4xl tracking-wide text-ink sm:text-5xl">
              Lo más gordo ya bajado
            </h2>
          </div>
          <Link href="/subvenciones" className="btn-secondary">
            Seguir en vivo
          </Link>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <article className="panel overflow-hidden">
            <div className="bg-psoe-ink px-6 py-4 text-white">
              <ProvenanceBadge kind="official" />
              <h3 className="mt-3 font-display text-3xl tracking-wide">Ayuda más alta (ventana)</h3>
            </div>
            <div className="p-6">
              {topGrant ? (
                <>
                  <p className="font-display text-5xl text-psoe-red">
                    {formatEuro(topGrant.importe)}
                  </p>
                  <p className="mt-3 text-lg font-bold">{topGrant.beneficiario}</p>
                  <p className="mt-2 text-sm text-ink-mute">
                    {topGrant.territorio} · {topGrant.fecha} · concedido ≠ pagado
                  </p>
                  <p className="mt-2 text-sm text-ink-mute">{topGrant.convocatoria}</p>
                  {topGrant.id && (
                    <Link href={`/subvenciones/${topGrant.id}`} className="btn-primary mt-6 inline-flex">
                      Abrir concesión
                    </Link>
                  )}
                </>
              ) : (
                <p className="text-sm text-ink-mute">Sin ayudas en caché. Refresca highlights.</p>
              )}
            </div>
          </article>

          <article className="panel overflow-hidden">
            <div className="bg-psoe-red px-6 py-4 text-white">
              <ProvenanceBadge kind="official" />
              <h3 className="mt-3 font-display text-3xl tracking-wide">Contrato top del feed</h3>
            </div>
            <div className="p-6">
              {topContract ? (
                <>
                  <p className="font-display text-5xl text-psoe-red">
                    {formatEuro(topContract.importe)}
                  </p>
                  <p className="mt-3 text-lg font-bold">{topContract.organo}</p>
                  <p className="mt-2 text-sm text-ink-mute">{topContract.title}</p>
                  <Link href="/contratos" className="btn-primary mt-6 inline-flex">
                    Ver ranking en vivo
                  </Link>
                </>
              ) : (
                <p className="text-sm text-ink-mute">Sin contratos en caché.</p>
              )}
            </div>
          </article>
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <article className="panel p-6">
            <p className="eyebrow">Calculado · muestra local</p>
            <p className="mt-3 font-display text-4xl text-psoe-red">
              {conc?.value_pct != null ? `${conc.value_pct}%` : "N/D"}
            </p>
            <p className="mt-2 font-bold">Concentración en 3 órganos</p>
            <p className="mt-2 text-sm text-ink-mute">
              {conc?.why_interesting || "Tras refrescar highlights con datos locales."}
            </p>
          </article>
          <article className="panel p-6">
            <p className="eyebrow">Muestra local</p>
            <p className="mt-3 font-display text-4xl text-psoe-red">
              {topBody ? formatEuro(topBody.amount) : "N/D"}
            </p>
            <p className="mt-2 font-bold">{topBody?.name || "Órgano top local"}</p>
            <p className="mt-2 text-sm text-ink-mute">
              {topBody ? `${topBody.operations} operaciones en muestra` : "Sin análisis local"}
            </p>
          </article>
        </div>

        {(highlights?.top_grants?.length || 0) > 1 && (
          <div className="mt-10">
            <h3 className="font-display text-2xl tracking-wide">Ranking de ayudas (caché)</h3>
            <div className="mt-4 space-y-3">
              {highlights!.top_grants!.slice(0, 8).map((g, i) => (
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

      <section className="bg-psoe-ink py-14 text-white">
        <div className="container-obs">
          <h2 className="font-display text-4xl tracking-wide sm:text-5xl">Navega en vivo</h2>
          <p className="mt-3 max-w-xl text-white/70">
            Estos enlaces pegan a las APIs oficiales en el momento (no usan la caché de portada).
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { href: "/contratos", t: "Contratos", d: "Feed PLACSP en vivo" },
              { href: "/subvenciones", t: "Ayudas", d: "BDNS paginado en vivo" },
              { href: "/encargos", t: "Encargos", d: "EMP Atom en vivo" },
              { href: "/buscar", t: "Buscar", d: "Empresa, órgano, expediente" },
            ].map((x) => (
              <Link
                key={x.href}
                href={x.href}
                className="rounded-3xl border border-white/15 bg-white/5 p-5 transition hover:border-psoe-red hover:bg-psoe-red"
              >
                <p className="font-display text-2xl tracking-wide">{x.t}</p>
                <p className="mt-2 text-sm text-white/70">{x.d}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-obs py-14">
        <SpainCoverageMap territories={coverage} />
      </section>
    </div>
  );
}