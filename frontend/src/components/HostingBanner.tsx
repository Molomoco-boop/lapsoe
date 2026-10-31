export function HostingBanner({ note }: { note?: string }) {
  const cloud =
    typeof process !== "undefined" &&
    Boolean(process.env.NEXT_PUBLIC_API_BASE?.includes("workers.dev") ||
      process.env.NEXT_PUBLIC_API_BASE?.includes("cloudflare"));

  if (cloud) {
    return (
      <div className="border-b border-emerald-300 bg-emerald-50 text-emerald-950">
        <div className="container-obs py-2 text-xs sm:text-sm">
          <strong className="font-bold">En la nube (gratis):</strong>{" "}
          {note ||
            "GitHub Pages + Cloudflare Worker. El PC puede estar apagado. Portada = caché en GitHub · búsqueda = APIs oficiales vía Worker."}
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-amber-300 bg-amber-50 text-amber-950">
      <div className="container-obs py-2 text-xs sm:text-sm">
        <strong className="font-bold">Hosting local / DuckDNS:</strong>{" "}
        {note ||
          "Si apagas el ordenador, Caddy/Next/API dejan de responder. Para web siempre viva: Pages + Worker (ver deploy/CLOUD_FREE.md)."}{" "}
        Portada = datos precargados · Búsqueda = APIs en vivo.
      </div>
    </div>
  );
}
