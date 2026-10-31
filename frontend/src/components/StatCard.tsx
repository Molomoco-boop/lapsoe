import { ProvenanceBadge } from "./ProvenanceBadge";

export function StatCard({
  label,
  value,
  source,
  period,
  kind,
}: {
  label: string;
  value: string;
  source: string;
  period: string;
  kind: "official" | "calculated" | "sample" | "unavailable";
}) {
  return (
    <article className="panel flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink-mute">{label}</p>
        <ProvenanceBadge kind={kind} />
      </div>
      <p className="font-display text-3xl tracking-tight text-ink sm:text-4xl">
        {value}
      </p>
      <div className="mt-auto space-y-1 border-t border-paper-line pt-3 text-xs text-ink-mute">
        <p>
          <span className="text-ink-soft">Fuente:</span> {source}
        </p>
        <p>
          <span className="text-ink-soft">Periodo / alcance:</span> {period}
        </p>
      </div>
    </article>
  );
}