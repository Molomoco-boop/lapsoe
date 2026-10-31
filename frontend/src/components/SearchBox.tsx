"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function SearchBox({
  initial = "",
  large = false,
}: {
  initial?: string;
  large?: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    router.push(`/buscar?q=${encodeURIComponent(query)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full flex-col gap-3 sm:flex-row">
      <input
        className={`input-obs ${large ? "py-4 text-base" : ""}`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Empresa, organismo, expediente, convocatoria…"
        aria-label="Búsqueda global"
      />
      <button type="submit" className={`btn-primary ${large ? "px-8" : ""}`}>
        Buscar
      </button>
    </form>
  );
}