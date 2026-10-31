import Link from "next/link";
import { ShockStrip, type ShockItem } from "./ShockStrip";

export function PagePunch({
  kicker,
  title,
  lead,
  shocks,
  ctaHref,
  ctaLabel,
}: {
  kicker: string;
  title: string;
  lead: string;
  shocks: ShockItem[];
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div>
      <section className="bg-psoe-red text-white">
        <div className="container-obs py-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
            {kicker}
          </p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl tracking-wide sm:text-6xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/85 sm:text-lg">{lead}</p>
          {ctaHref && ctaLabel && (
            <Link
              href={ctaHref}
              className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-psoe-red"
            >
              {ctaLabel}
            </Link>
          )}
        </div>
      </section>
      <div className="container-obs -mt-8 pb-4">
        <ShockStrip items={shocks} />
      </div>
    </div>
  );
}