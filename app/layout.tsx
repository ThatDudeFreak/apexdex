import type { Metadata } from "next";
import Link from "next/link";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — The Apex Legends Data Index`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Apexdex is the live Apex Legends data index: map rotation, Apex Predator RP cutoffs per platform, weekly crafting rotation, and legend abilities — all auto-refreshing.",
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    url: SITE_URL,
  },
  robots: { index: true, follow: true },
};

const NAV = [
  { href: "/map-rotation", label: "Map Rotation" },
  { href: "/predator-rp-cutoff", label: "Predator RP" },
  { href: "/crafting-rotation", label: "Crafting" },
  { href: "/legends/wraith", label: "Legends" },
  { href: "/#search", label: "Player Search" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-apex-bg text-apex-ink antialiased">
        <header className="border-b border-apex-line">
          <div className="mx-auto max-w-5xl px-4 py-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link href="/" className="font-semibold text-apex-ink hover:text-apex-accent">
              {SITE_NAME}
            </Link>
            <nav className="flex flex-wrap gap-4 text-sm text-apex-dim">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-apex-ink">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-apex-line">
          <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-apex-dim">
            Unofficial fan site. Data from{" "}
            <a className="underline hover:text-apex-ink" href="https://apexlegendsstatus.com" rel="noopener">
              apexlegendsstatus.com
            </a>
            . Apex Legends is a trademark of Electronic Arts Inc.
          </div>
        </footer>
      </body>
    </html>
  );
}
