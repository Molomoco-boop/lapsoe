"use client";

import { useEffect, useRef, useState } from "react";

export function DebtMeter({
  percentage,
  label,
  sublabel,
}: {
  percentage: number;
  label: string;
  sublabel?: string;
}) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setTimeout(() => setWidth(Math.min(percentage, 100)), 200);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [percentage]);

  const isExceeding = percentage >= 100;

  return (
    <div ref={ref} className="w-full">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-ink">{label}</p>
          {sublabel && (
            <p className="text-xs text-ink-mute">{sublabel}</p>
          )}
        </div>
        <p className={`font-display text-3xl tracking-wide ${
          isExceeding ? "text-red-600" : "text-psoe-red"
        }`}>
          {percentage.toFixed(1)}%
        </p>
      </div>
      <div className="mt-3 h-5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-[2000ms] ease-out ${
            isExceeding
              ? "bg-gradient-to-r from-red-500 to-red-700"
              : "bg-gradient-to-r from-psoe-red to-psoe-deep"
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
      {isExceeding && (
        <p className="mt-2 text-xs font-semibold text-red-600">
          ⚠ La deuda supera el 100% del PIB nacional
        </p>
      )}
    </div>
  );
}
