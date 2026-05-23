import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllLegends, getLegendBySlug } from "@/lib/legends";
import { absoluteUrl, jsonLdScript, SITE_NAME } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllLegends().map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const legend = getLegendBySlug(params.slug);
  if (!legend) return { title: "Legend not found" };
  const title = `${legend.name} — ${legend.class} Abilities & Guide`;
  const description = `${legend.name} is a ${legend.class} legend in Apex Legends. Tactical: ${legend.abilities.tactical.name}. Ultimate: ${legend.abilities.ultimate.name}. Passive: ${legend.abilities.passive.name}.`;
  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/legends/${legend.slug}`) },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/legends/${legend.slug}`),
      type: "article",
    },
  };
}

export default function LegendPage({ params }: { params: { slug: string } }) {
  const legend = getLegendBySlug(params.slug);
  if (!legend) notFound();

  const ld = {
    "@context": "https://schema.org",
    "@type": "VideoGameCharacter",
    name: legend.name,
    alternateName: legend.realName,
    url: absoluteUrl(`/legends/${legend.slug}`),
    description: `${legend.name} (${legend.tagline}) — ${legend.class} legend in Apex Legends.`,
    characterClass: legend.class,
    homeLocation: legend.origin
      ? { "@type": "Place", name: legend.origin }
      : undefined,
    isPartOf: {
      "@type": "VideoGame",
      name: "Apex Legends",
      publisher: { "@type": "Organization", name: "Electronic Arts" },
    },
    knowsAbout: [
      legend.abilities.passive.name,
      legend.abilities.tactical.name,
      legend.abilities.ultimate.name,
    ],
    mainEntityOfPage: { "@type": "WebSite", name: SITE_NAME },
  };

  const others = getAllLegends().filter((l) => l.slug !== legend.slug);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(ld)} />
      <header className="mb-8">
        <p className="text-sm uppercase tracking-wide text-apex-accent">
          {legend.class}
        </p>
        <h1 className="mt-1 text-4xl font-bold tracking-tight">{legend.name}</h1>
        <p className="mt-2 text-apex-dim">{legend.tagline}</p>
        {(legend.realName || legend.origin) && (
          <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
            {legend.realName && (
              <>
                <dt className="text-apex-dim">Real name</dt>
                <dd>{legend.realName}</dd>
              </>
            )}
            {legend.origin && (
              <>
                <dt className="text-apex-dim">Homeworld</dt>
                <dd>{legend.origin}</dd>
              </>
            )}
          </dl>
        )}
      </header>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Abilities</h2>
        <ul className="space-y-3">
          {(["passive", "tactical", "ultimate"] as const).map((slot) => {
            const a = legend.abilities[slot];
            return (
              <li
                key={slot}
                className="rounded-lg border border-apex-line bg-apex-panel p-4"
              >
                <p className="text-xs uppercase tracking-wide text-apex-dim">
                  {slot}
                </p>
                <p className="mt-1 text-lg font-semibold">{a.name}</p>
                <p className="mt-1 text-sm text-apex-dim">{a.description}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Other legends</h2>
        <ul className="grid sm:grid-cols-2 gap-3">
          {others.map((l) => (
            <li key={l.slug}>
              <Link
                href={`/legends/${l.slug}`}
                className="block rounded-md border border-apex-line bg-apex-panel px-4 py-3 hover:border-apex-accent"
              >
                <span className="font-medium">{l.name}</span>{" "}
                <span className="text-sm text-apex-dim">— {l.class}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
