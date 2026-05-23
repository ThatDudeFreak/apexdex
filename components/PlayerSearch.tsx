"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const PLATFORMS = [
  { value: "pc", label: "PC" },
  { value: "playstation", label: "PlayStation" },
  { value: "xbox", label: "Xbox" },
  { value: "switch", label: "Switch" },
] as const;

export function PlayerSearch({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState<string>("pc");
  const [loading, setLoading] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    router.push(`/players/${platform}/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={submit}
      className={
        compact
          ? "flex flex-wrap items-center gap-2"
          : "flex flex-wrap items-stretch gap-2 rounded-lg border border-apex-line bg-apex-panel p-3"
      }
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Player name (e.g. Freak407)"
        className="flex-1 min-w-[180px] rounded-md border border-apex-line bg-apex-bg px-3 py-2 text-sm placeholder:text-apex-dim focus:border-apex-accent focus:outline-none"
        autoComplete="off"
        spellCheck={false}
      />
      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        className="rounded-md border border-apex-line bg-apex-bg px-3 py-2 text-sm focus:border-apex-accent focus:outline-none"
      >
        {PLATFORMS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="rounded-md bg-apex-accent px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
