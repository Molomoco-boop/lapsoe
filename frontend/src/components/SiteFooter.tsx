import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-psoe-ink text-white">
      <div className="container-obs grid gap-8 py-14 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <p className="font-display text-3xl text-psoe-red">LAPSOE MACHINERY</p>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">
            Cifras reales del dinero público. Sin afiliación partidista. Una cifra
            llamativa no es una condena: es una pista para investigar con las
            fuentes oficiales.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-bold uppercase tracking-wide text-psoe-red">Explorar</p>
          <ul className="mt-4 space-y-2 text-white/75">
            <li>
              <Link href="/investigaciones">Lo más gordo</Link>
            </li>
            <li>
              <Link href="/contratos">Contratos</Link>
            </li>
            <li>
              <Link href="/subvenciones">Subvenciones</Link>
            </li>
            <li>
              <Link href="/metodologia">Metodología</Link>
            </li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-bold uppercase tracking-wide text-psoe-red">Fuentes</p>
          <ul className="mt-4 space-y-2 text-white/75">
            <li>PLACSP</li>
            <li>BDNS / SNPSAP</li>
            <li>AIReF PRTR (en progreso)</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-obs py-4 text-xs text-white/50">
          Dato oficial · Dato calculado · Muestra local — siempre etiquetado.
        </div>
      </div>
    </footer>
  );
}