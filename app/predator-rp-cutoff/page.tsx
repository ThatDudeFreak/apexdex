import type { Metadata } from "next";
import { LastUpdated, StaleBanner } from "@/components/DataMeta";
import { getPredator, type PredatorPlatform } from "@/lib/apex";
import { absoluteUrl, jsonLdScript, SITE_NAME } from "@/lib/seo";

export const revalidate = 3600;

const PLATFORM_LABELS: Record<string, string> = {
  PC: "PC (Origin/Steam)",
  PS4: "PlayStation",
  X1: "Xbox",
  SWITCH: "Nintendo Switch",
};

function platformLabel(code: string): string {
  return PLATFORM_LABELS[code] ?? code;
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { data } = await getPredator();
    const pc = data?.RP?.PC?.val;
    const title = `Apex Predator RP Cutoff — ${pc ? `PC at ${pc.toLocaleString()} RP` : "Live by Platform"}`;
    const description = `Live Apex Predator RP cutoff per platform${
      pc ? `, currently ${pc.toLocaleString()} RP on PC` : ""
    }. Includes Master tier counts on PC, PlayStation, Xbox, and Switch.`;
    return {
      title,
      description,
      alternates: { canonical: absoluteUrl("/predator-rp-cutoff") },
      openGraph: { title, description, url: absoluteUrl("/predator-rp-cutoff") },
    };
  } catch {
    return {
      title: "Apex Predator RP Cutoff",
      description:
        "Live Apex Predator RP cutoff per platform plus Master tier counts on PC, PlayStation, Xbox, and Switch.",
    };
  }
}

function PlatformRow({
  code,
  rp,
}: {
  code: string;
  rp: PredatorPlatform | undefined;
}) {
  return (
    <tr className="border-t border-apex-line">
      <td className="py-3 pr-4 align-top">
        <div className="font-medium">{platformLabel(code)}</div>
        <div className="text-xs text-apex-dim">{code}</div>
      </td>
      <td className="py-3 pr-4 text-right align-top font-mono tabular-nums">
        {typeof rp?.val === "number" ? rp.val.toLocaleString() : "—"}
      </td>
      <td className="py-3 pr-4 text-right align-top font-mono tabular-nums">
        {typeof rp?.totalMastersAndPreds === "number"
          ? rp.totalMastersAndPreds.toLocaleString()
          : "—"}
      </td>
      <td className="py-3 text-right align-top font-mono tabular-nums">
        {typeof rp?.foundRank === "number" && rp.foundRank > 0
          ? `#${rp.foundRank.toLocaleString()}`
          : "—"}
      </td>
    </tr>
  );
}

export default async function PredatorPage() {
  let stale = false;
  let fetchedAt = Date.now();
  let rp: Record<string, PredatorPlatform | undefined> = {};
  try {
    const result = await getPredator();
    stale = result.stale;
    fetchedAt = result.fetchedAt;
    rp = (result.data?.RP ?? {}) as Record<string, PredatorPlatform | undefined>;
  } catch (err) {
    return (
      <div className="rounded-md border border-red-700/50 bg-red-900/20 p-4 text-sm">
        Couldn&apos;t reach the Apex API and no cached data is available yet.
        Make sure APEX_API_KEY is set in <code>.env.local</code>.
        <br />
        <span className="text-apex-dim">({(err as Error).message})</span>
      </div>
    );
  }

  const platforms = ["PC", "PS4", "X1", "SWITCH"];

  const ld = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Apex Legends Predator RP Cutoff",
    description:
      "RP/AP cutoff to reach Apex Predator on each platform, with Master and Predator player counts.",
    url: absoluteUrl("/predator-rp-cutoff"),
    isPartOf: { "@type": "WebSite", name: SITE_NAME },
    dateModified: new Date(fetchedAt).toISOString(),
    creator: {
      "@type": "Organization",
      name: "apexlegendsstatus.com",
      url: "https://apexlegendsstatus.com",
    },
    variableMeasured: platforms.map((p) => ({
      "@type": "PropertyValue",
      name: `${platformLabel(p)} Predator cutoff`,
      value: rp[p]?.val,
      unitText: "RP",
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(ld)} />
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Apex Predator RP Cutoff
        </h1>
        <p className="mt-2 text-apex-dim">
          The RP you need to hold rank #750 (Apex Predator) on each platform,
          plus how many players currently sit in Master+. Page regenerates
          hourly.
        </p>
      </header>
      <StaleBanner stale={stale} />
      <div className="overflow-x-auto rounded-lg border border-apex-line bg-apex-panel">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wide text-apex-dim">
            <tr>
              <th className="px-4 py-3 text-left">Platform</th>
              <th className="px-4 py-3 text-right">Predator RP</th>
              <th className="px-4 py-3 text-right">Master+ Players</th>
              <th className="px-4 py-3 text-right">Predator Cutoff Rank</th>
            </tr>
          </thead>
          <tbody>
            {platforms.map((p) => (
              <PlatformRow key={p} code={p} rp={rp[p]} />
            ))}
          </tbody>
        </table>
      </div>
      <LastUpdated fetchedAt={fetchedAt} />
    </>
  );
}
