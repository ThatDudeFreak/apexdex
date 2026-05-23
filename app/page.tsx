import Link from "next/link";
import type { Metadata } from "next";
import { PlayerSearch } from "@/components/PlayerSearch";
import { absoluteUrl, jsonLdScript, SITE_NAME, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: `${SITE_NAME} — The Apex Legends Data Index`,
  description:
    "Apexdex tracks the live Apex Legends map rotation, current Predator RP cutoff per platform, the weekly crafting rotation, and every legend — all auto-refreshing.",
  alternates: { canonical: SITE_URL },
};

const SECTIONS = [
  {
    href: "/map-rotation",
    title: "Current Map Rotation",
    blurb: "Live map per mode with countdown to the next swap.",
  },
  {
    href: "/predator-rp-cutoff",
    title: "Apex Predator RP Cutoff",
    blurb: "Current RP to hit Predator on PC, PS, Xbox, and Switch.",
  },
  {
    href: "/crafting-rotation",
    title: "Weekly Crafting Rotation",
    blurb: "What's in replicators this week and how much it costs.",
  },
  {
    href: "/legends/wraith",
    title: "Legend Guides",
    blurb: "Abilities, class, and lore for each legend.",
  },
];

export default function Home() {
  const ld = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Live Apex Legends map rotation, Predator RP cutoffs, weekly crafting rotation, and legend guides.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/legends/{search_term}`,
      "query-input": "required name=search_term",
    },
  };
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(ld)}
      />
      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          The Apex Legends data index, refreshed every minute.
        </h1>
        <p className="mt-3 text-apex-dim max-w-2xl">
          Apexdex pulls live data from the Apex Legends Status API and turns it
          into pages that update themselves. No refresh button. No app to
          install. Just the meta, as it&apos;s happening.
        </p>
      </section>
      <section id="search" className="mb-10">
        <h2 className="mb-2 text-sm uppercase tracking-wide text-apex-dim">
          Look up a player
        </h2>
        <PlayerSearch />
        <p className="mt-2 text-xs text-apex-dim">
          Use the Origin name for PC players. Examples:{" "}
          <Link className="underline hover:text-apex-ink" href="/players/xbox/Freak407">
            Freak407 (Xbox)
          </Link>
          .
        </p>
      </section>
      <ul className="grid sm:grid-cols-2 gap-4">
        {SECTIONS.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="block rounded-lg border border-apex-line bg-apex-panel p-5 hover:border-apex-accent transition-colors"
            >
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <p className="mt-1 text-sm text-apex-dim">{s.blurb}</p>
              <p className="mt-2 text-xs text-apex-accent">
                {absoluteUrl(s.href)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
