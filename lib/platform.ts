export const PLATFORM_SLUGS = ["pc", "playstation", "xbox", "switch"] as const;
export type PlatformSlug = (typeof PLATFORM_SLUGS)[number];

const SLUG_TO_API: Record<PlatformSlug, string> = {
  pc: "PC",
  playstation: "PS4",
  xbox: "X1",
  switch: "SWITCH",
};

const API_TO_LABEL: Record<string, string> = {
  PC: "PC",
  PS4: "PlayStation",
  X1: "Xbox",
  SWITCH: "Nintendo Switch",
};

export function slugToApi(slug: string): string | null {
  const s = slug.toLowerCase();
  if (s === "ps" || s === "ps4" || s === "ps5" || s === "playstation") return "PS4";
  if (s === "x1" || s === "xbox" || s === "xb") return "X1";
  if (s === "pc" || s === "origin" || s === "steam") return "PC";
  if (s === "switch" || s === "nintendo") return "SWITCH";
  return null;
}

export function apiToLabel(api: string): string {
  return API_TO_LABEL[api] ?? api;
}

export function apiToSlug(api: string): PlatformSlug {
  switch (api) {
    case "PS4":
      return "playstation";
    case "X1":
      return "xbox";
    case "SWITCH":
      return "switch";
    default:
      return "pc";
  }
}

export function isPlatformSlug(s: string): s is PlatformSlug {
  return (PLATFORM_SLUGS as readonly string[]).includes(s);
}
