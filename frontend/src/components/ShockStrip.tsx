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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {items.map((item, i) => (
        <Link
          key={`${item.title}-${i}`}
          href={item.href}
          className="shock-card animate-rise"
          style={{ animationDelay: `${i * 120}ms` }}
        >
          <p className="relative z-10 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
            {item.eyebrow}
          </p>
          <p className="relative z-10 mt-3 font-display text-3xl leading-none tracking-wide sm:text-4xl">
            {item.value}
          </p>
          <p className="relative z-10 mt-3 text-sm font-bold leading-snug">{item.title}</p>
          <p className="relative z-10 mt-2 text-[11px] leading-relaxed text-white/65">{item.note}</p>
        </Link>
      ))}
    </div>
  );
}