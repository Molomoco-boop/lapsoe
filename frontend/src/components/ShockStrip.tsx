import Link from "next/link";

export type ShockItem = {
  eyebrow: string;
  value: string;
  title: string;
  note: string;
  href: string;
};

export function ShockStrip({ items }: { items: ShockItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item, i) => (
        <Link
          key={`${item.title}-${i}`}
          href={item.href}
          className="shock-card animate-rise"
          style={{ animationDelay: `${i * 90}ms` }}
        >
          <p className="relative z-10 text-[11px] font-bold uppercase tracking-[0.18em] text-white/80">
            {item.eyebrow}
          </p>
          <p className="relative z-10 mt-4 font-display text-4xl leading-none tracking-wide sm:text-5xl">
            {item.value}
          </p>
          <p className="relative z-10 mt-4 text-lg font-bold leading-snug">{item.title}</p>
          <p className="relative z-10 mt-2 text-xs text-white/75">{item.note}</p>
        </Link>
      ))}
    </div>
  );
}