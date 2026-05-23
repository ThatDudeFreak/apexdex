export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const SITE_NAME = "Apexdex";

export function absoluteUrl(pathname: string): string {
  const base = SITE_URL.replace(/\/$/, "");
  const p = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${base}${p}`;
}

export function jsonLdScript(obj: unknown): { __html: string } {
  return { __html: JSON.stringify(obj).replace(/</g, "\\u003c") };
}

export function formatTimestamp(ms: number): string {
  return new Date(ms).toISOString().replace("T", " ").slice(0, 19) + " UTC";
}
