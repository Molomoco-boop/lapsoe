"use client";

import { useEffect, useState } from "react";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { LiveStatus } from "@/components/LiveStatus";
import { apiGet } from "@/lib/api";

export default function EstadoPage() {
  const [sources, setSources] = useState<
    Array<{
      id: string;
      name: string;
      status: string;
      last_success_at?: string | null;
      last_error?: string | null;
      base_url?: string;
    }>
  >([]);
  const [health, setHealth] = useState<{ status?: string; mode?: string; service?: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, h] = await Promise.all([
          apiGet<typeof sources>("/meta/sources"),
          apiGet<{ status?: string; mode?: string; service?: string }>("/health").catch(() => null),
        ]);
        if (!cancelled) {
          setSources(s);
          setHealth(h);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="container-obs py-12">
      <p className="eyebrow">Operaciones</p>
      <h1 className="mt-3 font-display text-4xl text-ink">Estado</h1>
      <p className="mt-4 max-w-2xl text-ink-mute">
        En la nube no hay SQLite ni sync-runs locales: el Worker proxy + la caché de highlights en
        GitHub mantienen la web viva con el PC apagado.
      </p>

      <LiveStatus loading={loading} error={error} />

      {health && (
        <div className="panel mt-6 p-5 text-sm">
          <ProvenanceBadge kind="official" />
          <p className="mt-3">
            Worker: <strong>{health.service || "ok"}</strong> · modo{" "}
            <code>{health.mode || health.status}</code>
          </p>
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-display text-2xl text-ink">Fuentes</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {sources.map((s) => (
            <article key={s.id} className="panel p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium text-ink">{s.name}</h3>
                <span className="text-[11px] uppercase text-ink-mute">{s.status}</span>
              </div>
              {s.base_url && (
                <p className="mt-3 break-all text-xs text-ink-mute">{s.base_url}</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
