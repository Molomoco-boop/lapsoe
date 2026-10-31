"use client";

export function LiveStatus({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) {
    return (
      <p className="panel mb-4 p-4 text-sm text-ink-mute" role="status">
        Cargando datos oficiales en vivo…
      </p>
    );
  }
  if (error) {
    return (
      <p className="panel mb-4 p-4 text-sm text-psoe-red" role="alert">
        {error}
      </p>
    );
  }
  return null;
}
