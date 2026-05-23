export function compactNumber(n: number): string {
  if (!Number.isFinite(n)) return String(n);
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, "") + "M";
  if (abs >= 10_000) return (n / 1_000).toFixed(0) + "K";
  if (abs >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toLocaleString();
}

export function fullNumber(n: number): string {
  return n.toLocaleString();
}

export function percent(v: unknown): string {
  if (typeof v === "number" && Number.isFinite(v)) return v.toFixed(2) + "%";
  if (typeof v === "string") return v;
  return "—";
}

export function isMeaningful(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") {
    if (v === "" || v === "NOT_CALCULATED_YET" || v.startsWith("No game")) return false;
  }
  return true;
}

export function statValue(v: unknown): string {
  if (typeof v === "number") return fullNumber(v);
  if (typeof v === "string") return v;
  return "—";
}

export function statCompact(v: unknown): string {
  if (typeof v === "number") return compactNumber(v);
  if (typeof v === "string") return v;
  return "—";
}

const TIER_COLORS: Record<string, { text: string; bg: string; ring: string }> = {
  Rookie:    { text: "text-zinc-300",    bg: "bg-zinc-500/15",    ring: "ring-zinc-500/40" },
  Bronze:    { text: "text-amber-300",   bg: "bg-amber-700/20",   ring: "ring-amber-700/50" },
  Silver:    { text: "text-slate-200",   bg: "bg-slate-400/15",   ring: "ring-slate-400/50" },
  Gold:      { text: "text-yellow-300",  bg: "bg-yellow-500/15",  ring: "ring-yellow-500/50" },
  Platinum:  { text: "text-cyan-200",    bg: "bg-cyan-500/15",    ring: "ring-cyan-500/50" },
  Diamond:   { text: "text-indigo-200",  bg: "bg-indigo-500/15",  ring: "ring-indigo-500/50" },
  Master:    { text: "text-purple-200",  bg: "bg-purple-500/15",  ring: "ring-purple-500/50" },
  "Apex Predator": { text: "text-red-300", bg: "bg-red-500/15", ring: "ring-red-500/50" },
};

export function tierColors(rankName: string | undefined): { text: string; bg: string; ring: string } {
  if (!rankName) return TIER_COLORS.Rookie;
  return TIER_COLORS[rankName] ?? TIER_COLORS.Rookie;
}

const RARITY_COLORS: Record<string, string> = {
  Common: "text-zinc-300",
  Rare: "text-blue-300",
  Epic: "text-purple-300",
  Legendary: "text-amber-300",
  Mythic: "text-red-300",
  Heirloom: "text-red-300",
  None: "text-apex-dim",
};

export function rarityColor(rarity: string | undefined): string {
  if (!rarity) return "text-apex-dim";
  return RARITY_COLORS[rarity] ?? "text-apex-ink";
}

const ROMAN: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV" };
export function divisionRoman(div: number | undefined): string {
  if (typeof div !== "number") return "";
  return ROMAN[div] ?? String(div);
}
