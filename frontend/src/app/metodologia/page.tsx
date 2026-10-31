import { ProvenanceBadge } from "@/components/ProvenanceBadge";

export const dynamic = "force-static";
export const metadata = { title: "Metodología" };

const SOURCES = [
  {
    id: "placsp",
    name: "PLACSP Atom (contratos / EMP)",
    status: "verified",
    note: "Feeds oficiales sindicados. Muestra del feed diario, no histórico completo.",
  },
  {
    id: "bdns",
    name: "BDNS API (convocatorias / concesiones / terceros)",
    status: "verified",
    note: "Paginación 0-index, fechas DD/MM/YYYY. Concedido ≠ pagado.",
  },
  {
    id: "airef",
    name: "AIReF PRTR",
    status: "deferred",
    note: "Sin conector auditable en esta fase.",
  },
];

export default function MetodologiaPage() {
  return (
    <div className="container-obs py-12">
      <p className="eyebrow">Transparencia metodológica</p>
      <h1 className="mt-3 font-display text-4xl text-ink">Metodología</h1>
      <p className="mt-4 max-w-2xl text-ink-mute">
        Documentamos qué sabemos, qué no sabemos y cómo se ha obtenido cada dato. Una anomalía
        estadística no implica ilegalidad.
      </p>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Arquitectura cloud (gratis)</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink-mute">
          <li>
            <strong className="text-ink">Portada:</strong> JSON cacheado en GitHub
            (`frontend/public/highlights.json`), regenerado a diario por Actions.
          </li>
          <li>
            <strong className="text-ink">Navegación:</strong> Cloudflare Worker hace de proxy CORS a
            BDNS/PLACSP. El PC puede estar apagado.
          </li>
          <li>
            <strong className="text-ink">Sitio:</strong> HTML estático en GitHub Pages.
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Fuentes</h2>
        <div className="mt-4 space-y-3">
          {SOURCES.map((s) => (
            <article key={s.id} className="panel p-5">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-medium text-ink">{s.name}</h3>
                <ProvenanceBadge
                  kind={
                    s.status === "verified"
                      ? "official"
                      : s.status === "deferred"
                        ? "unavailable"
                        : "planned"
                  }
                />
              </div>
              <p className="mt-2 text-sm text-ink-mute">{s.note}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
