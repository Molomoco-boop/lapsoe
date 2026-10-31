"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/investigaciones", label: "Lo gordo" },
  { href: "/contratos", label: "Contratos" },
  { href: "/subvenciones", label: "Ayudas" },
  { href: "/encargos", label: "Encargos" },
  { href: "/fondos-europeos", label: "Fondos UE" },
  { href: "/cobertura", label: "Mapa" },
  { href: "/metodologia", label: "Cómo" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b-4 border-psoe-red bg-white/95 backdrop-blur-md">
      <div className="container-obs flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-psoe-red font-display text-lg text-white animate-pulse-red">
            €
          </span>
          <div className="leading-none">
            <span className="block font-display text-2xl tracking-wide text-psoe-red">
              LAPSOE MACHINERY
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink-mute">
              Dinero público · España
            </span>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
                  active
                    ? "bg-psoe-red text-white"
                    : "text-ink-soft hover:bg-psoe-rose hover:text-psoe-red"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/buscar" className="btn-primary !py-2 !text-xs">
          Buscar
        </Link>
      </div>
      <div className="flex gap-2 overflow-x-auto border-t border-psoe-rose bg-psoe-rose/40 px-4 py-2 lg:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-[11px] font-bold uppercase text-psoe-red"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </header>
  );
}