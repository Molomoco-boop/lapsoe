import { formatEuro } from "@/lib/api";

export type WasteCase = {
  icon: string;
  name: string;
  cost: number;
  description: string;
  comparison: string;
  source: string;
};

export function WasteCard({ waste }: { waste: WasteCase }) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-paper-line bg-white p-6 shadow-panel transition-all duration-300 hover:-translate-y-1 hover:shadow-punch">
      <div className="absolute -right-6 -top-6 text-7xl opacity-10 transition-transform duration-500 group-hover:scale-110">
        {waste.icon}
      </div>
      <div className="relative z-10">
        <span className="text-4xl">{waste.icon}</span>
        <p className="mt-4 font-display text-3xl tracking-wide text-psoe-red sm:text-4xl">
          {formatEuro(waste.cost)}
        </p>
        <h3 className="mt-2 text-lg font-bold text-ink">{waste.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-mute">
          {waste.description}
        </p>
        <div className="mt-4 rounded-xl bg-psoe-rose/60 px-4 py-3">
          <p className="text-xs font-semibold text-psoe-deep">
            💡 Equivalente a: {waste.comparison}
          </p>
        </div>
        <p className="mt-3 text-[10px] uppercase tracking-widest text-ink-mute">
          Fuente: {waste.source}
        </p>
      </div>
    </article>
  );
}
