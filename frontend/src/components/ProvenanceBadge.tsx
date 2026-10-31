type Kind = "official" | "calculated" | "sample" | "unavailable" | "estimate" | "planned";

const LABELS: Record<Kind, string> = {
  official: "Dato oficial",
  calculated: "Calculado",
  sample: "Muestra local",
  unavailable: "No disponible",
  estimate: "Estimación",
  planned: "Planificado",
};

const STYLES: Record<Kind, string> = {
  official: "bg-psoe-red text-white border-psoe-red",
  calculated: "bg-psoe-ink text-white border-psoe-ink",
  sample: "bg-amber-100 text-amber-900 border-amber-300",
  unavailable: "bg-slate-100 text-slate-600 border-slate-200",
  estimate: "bg-psoe-rose text-psoe-deep border-psoe-red/30",
  planned: "bg-sky-100 text-sky-900 border-sky-300",
};

export function ProvenanceBadge({
  kind,
  children,
}: {
  kind: Kind;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STYLES[kind]}`}
    >
      {children || LABELS[kind]}
    </span>
  );
}