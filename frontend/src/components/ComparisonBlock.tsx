export type ComparisonItem = {
  icon: string;
  waste: string;
  wasteCost: string;
  couldBuy: string;
  couldBuyAmount: string;
};

export function ComparisonBlock({ items }: { items: ComparisonItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-2xl border border-paper-line bg-white p-6 transition hover:shadow-panel"
        >
          <div className="text-center">
            <span className="text-4xl">{item.icon}</span>
            <p className="mt-3 text-xs font-bold uppercase tracking-widest text-ink-mute">
              Lo que costó
            </p>
            <p className="mt-1 font-bold text-ink">{item.waste}</p>
            <p className="font-display text-2xl text-psoe-red">{item.wasteCost}</p>
          </div>
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-paper-line" />
            <span className="rounded-full bg-psoe-rose px-3 py-1 text-xs font-bold text-psoe-deep">
              equivale a
            </span>
            <div className="h-px flex-1 bg-paper-line" />
          </div>
          <div className="text-center">
            <p className="font-display text-2xl tracking-wide text-emerald-600">
              {item.couldBuyAmount}
            </p>
            <p className="mt-1 text-sm text-ink-mute">{item.couldBuy}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
