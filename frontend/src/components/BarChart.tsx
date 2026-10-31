export function BarChart({
  items,
  valueKey = "amount",
  labelKey = "name",
}: {
  items: Array<Record<string, string | number | null | undefined>>;
  valueKey?: string;
  labelKey?: string;
}) {
  const max = Math.max(
    1,
    ...items.map((i) => Number(i[valueKey] || 0)),
  );

  if (!items.length) {
    return <p className="text-sm text-ink-mute">Sin datos en la muestra local.</p>;
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 10).map((item, idx) => {
        const value = Number(item[valueKey] || 0);
        const label = String(item[labelKey] || item.territory || item.nif || "—");
        const width = Math.max(2, Math.round((value / max) * 100));
        return (
          <div key={`${label}-${idx}`}>
            <div className="mb-1 flex justify-between gap-3 text-xs">
              <span className="truncate text-ink-soft">{label}</span>
              <span className="shrink-0 font-mono text-ink-mute">
                {new Intl.NumberFormat("es-ES", {
                  style: "currency",
                  currency: "EUR",
                  maximumFractionDigits: 0,
                }).format(value)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-paper-line">
              <div
                className="h-full rounded-full bg-signal transition-all duration-700"
                style={{ width: `${width}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}