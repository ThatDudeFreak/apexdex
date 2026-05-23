"use client";

import { useEffect, useState } from "react";

function format(seconds: number): string {
  if (seconds <= 0) return "swapping…";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}h ${pad(m)}m ${pad(s)}s` : `${m}m ${pad(s)}s`;
}

export function Countdown({ endsAtMs }: { endsAtMs: number }) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const remaining = Math.max(0, Math.floor((endsAtMs - now) / 1000));
  return <span className="font-mono tabular-nums">{format(remaining)}</span>;
}
