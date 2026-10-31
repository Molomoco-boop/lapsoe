import Link from "next/link";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";

export const dynamic = "force-static";
export function generateStaticParams() {
  return [{ id: "0" }];
}

export default async function SubvencionFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="container-obs py-12">
      <Link href="/subvenciones/" className="text-sm text-psoe-red">
        ← Subvenciones
      </Link>
      <div className="mt-4">
        <ProvenanceBadge kind="official" />
      </div>
      <h1 className="mt-4 font-display text-3xl tracking-wide">Concesión {id}</h1>
      <p className="mt-4 max-w-2xl text-sm text-ink-mute">
        En Pages/Worker la ficha detallada se consulta en el listado en vivo (BDNS). Abre
        subvenciones y pincha una fila, o busca por código.
      </p>
      <Link href="/subvenciones/" className="btn-primary mt-6 inline-flex">
        Ver ranking en vivo
      </Link>
    </div>
  );
}