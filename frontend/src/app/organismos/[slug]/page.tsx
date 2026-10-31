import Link from "next/link";

export const dynamic = "force-static";
export function generateStaticParams() {
  return [{ slug: "placeholder" }];
}

export default async function OrganismoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const name = decodeURIComponent(slug);
  return (
    <div className="container-obs py-12">
      <h1 className="font-display text-4xl tracking-wide">{name}</h1>
      <p className="mt-4 text-sm text-ink-mute">
        En la versión cloud, busca contratos del organismo en el feed en vivo.
      </p>
      <Link href="/contratos/" className="btn-primary mt-6 inline-flex">
        Ir a contratos
      </Link>
    </div>
  );
}