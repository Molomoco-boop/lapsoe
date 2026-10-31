import Link from "next/link";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { apiGet, formatEuro } from "@/lib/api";

export const dynamic = "force-static";
export function generateStaticParams() {
  return [{ id: "0" }];
}

export default async function ContratoFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id === "0") {
    return (
      <div className="container-obs py-12">
        <p className="text-sm text-ink-mute">
          En la versión estática (GitHub Pages) las fichas locales no están pregeneradas.
          Usa el ranking en vivo en <Link className="text-psoe-red" href="/contratos/">Contratos</Link>.
        </p>
      </div>
    );
  }

  let data: {
    contract: {
      id: number;
      contract_folder_id?: string;
      title?: string;
      summary?: string;
      status_code?: string;
      contracting_body_name?: string;
      contracting_body_id?: string;
      amount?: number | null;
      updated_at_source?: string | null;
      extracted_at?: string | null;
      source_id?: string;
      source_url?: string | null;
    };
    provenance: string;
  } | null = null;

  try {
    data = await apiGet(`/contracts/${id}`);
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <div className="container-obs py-12">
        <p className="panel p-5 text-sm">Contrato no disponible en este entorno.</p>
        <Link href="/contratos/" className="btn-secondary mt-4 inline-flex">
          Volver
        </Link>
      </div>
    );
  }

  const c = data.contract;
  return (
    <div className="container-obs py-12">
      <Link href="/contratos/" className="text-sm text-psoe-red">
        ← Contratos
      </Link>
      <div className="mt-4">
        <ProvenanceBadge kind="sample" />
      </div>
      <h1 className="mt-4 font-display text-3xl tracking-wide text-ink sm:text-4xl">
        {c.title || "Contrato"}
      </h1>
      <dl className="panel mt-8 grid gap-6 p-6 sm:grid-cols-2">
        {[
          ["Expediente", c.contract_folder_id || "—"],
          ["Órgano", c.contracting_body_name || "—"],
          ["Importe", formatEuro(c.amount ?? null)],
          ["Estado", c.status_code || "—"],
          ["Fuente", c.source_id || "—"],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs uppercase tracking-wide text-ink-mute">{k}</dt>
            <dd className="mt-1 text-sm">{v}</dd>
          </div>
        ))}
      </dl>
      {c.source_url && (
        <a href={c.source_url} target="_blank" rel="noreferrer" className="btn-primary mt-6 inline-flex">
          Documento original
        </a>
      )}
    </div>
  );
}