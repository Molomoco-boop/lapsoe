import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-psoe-ink text-white">
      <div className="container-obs grid gap-8 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl text-psoe-red">OBSERVATORIO</p>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/50">
            Gasto Público · España
          </p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Plataforma independiente de análisis del gasto público basada
            exclusivamente en fuentes oficiales. Las cifras se presentan tal
            como aparecen en los registros públicos: una concesión no implica
            pago efectivo, y un contrato adjudicado puede no ejecutarse al
            importe inicial.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-bold uppercase tracking-wide text-psoe-red">Secciones</p>
          <ul className="mt-4 space-y-2 text-white/75">
            <li>
              <Link href="/investigaciones">Investigaciones</Link>
            </li>
            <li>
              <Link href="/contratos">Contratos públicos</Link>
            </li>
            <li>
              <Link href="/subvenciones">Subvenciones y ayudas</Link>
            </li>
            <li>
              <Link href="/metodologia">Metodología y fuentes</Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-bold uppercase tracking-wide text-psoe-red">Fuentes oficiales</p>
          <ul className="mt-4 space-y-2 text-white/75">
            <li>PLACSP — Contratos del Sector Público</li>
            <li>BDNS — Base de Datos Nacional de Subvenciones</li>
            <li>Banco de España — Estadísticas de deuda</li>
            <li>IGAE — Intervención General (presupuestos)</li>
            <li>AIReF — Autoridad Independiente Fiscal</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-obs flex flex-wrap items-center justify-between gap-4 py-4 text-xs text-white/50">
          <p>Datos oficiales · Análisis independiente · Sin afiliación partidista</p>
          <p>© {new Date().getFullYear()} Observatorio del Gasto Público</p>
        </div>
      </div>
    </footer>
  );
}