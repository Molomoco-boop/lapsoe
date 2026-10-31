"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { apiGet, formatEuro, formatNumber } from "@/lib/api";

export default function EmpresaPage() {
  const params = useParams();
  const nif = String(params.nif || "").toUpperCase();
  const [profile, setProfile] = useState<{
    live_bdns?: {
      terceros?: Array<{ descripcion: string }>;
      concesiones_total?: number;
      concesiones?: Array<{
        id: number;
        fechaConcesion?: string;
        importe?: number;
        convocatoria?: string;
        nivel3?: string;
      }>;
    } | null;
    disclaimer?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nif || nif === "PLACEHOLDER") return;
    apiGet<NonNullable<typeof profile>>(`/companies/${encodeURIComponent(nif)}`)
      .then((data) => setProfile(data))
      .catch((e) => setError(e instanceof Error ? e.message : "Error"));
  }, [nif]);

  const name = profile?.live_bdns?.terceros?.[0]?.descripcion || nif;

  return (
    <div className="container-obs py-12">
      <p className="eyebrow">Ficha de empresa · en vivo</p>
      <h1 className="mt-3 font-display text-4xl tracking-wide text-ink">{name}</h1>
      <p className="mt-2 font-mono text-sm text-ink-mute">{nif}</p>
      <p className="mt-4 text-sm text-ink-mute">{profile?.disclaimer}</p>
      {error && <p className="panel mt-6 p-4 text-psoe-red">{error}</p>}
      {profile && (
        <>
          <div className="mt-8">
            <ProvenanceBadge kind="official" />
            <p className="mt-3 font-display text-4xl text-psoe-red">
              {formatNumber(profile.live_bdns?.concesiones_total)}
            </p>
            <p className="text-sm text-ink-mute">concesiones BDNS (universo filtrado)</p>
          </div>
          <div className="panel mt-8 overflow-x-auto p-4">
            <table className="data-table min-w-[700px]">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Importe</th>
                  <th>Convocatoria</th>
                  <th>Órgano</th>
                </tr>
              </thead>
              <tbody>
                {(profile.live_bdns?.concesiones || []).map((row) => (
                  <tr key={row.id}>
                    <td className="font-mono text-xs">{row.fechaConcesion || "—"}</td>
                    <td className="font-bold text-psoe-red">{formatEuro(row.importe)}</td>
                    <td>{row.convocatoria || "—"}</td>
                    <td>{row.nivel3 || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Link href="/subvenciones/" className="btn-secondary mt-8 inline-flex">
        Volver a ayudas
      </Link>
    </div>
  );
}
