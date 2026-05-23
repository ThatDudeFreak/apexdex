import type { Metadata } from "next";
import { Countdown } from "@/components/Countdown";
import { LastUpdated, StaleBanner } from "@/components/DataMeta";
import { getMapRotation, type MapInfo, type ModeRotation } from "@/lib/apex";
import { absoluteUrl, jsonLdScript, SITE_NAME } from "@/lib/seo";

export const revalidate = 60;

const MODE_LABELS: Record<string, string> = {
  battle_royale: "Battle Royale (Pubs)",
  ranked: "Battle Royale (Ranked)",
  ltm: "Limited-Time Mode",
  control: "Control",
  gunGame: "Gun Run",
  mixtape: "Mixtape",
};

function modeLabel(key: string): string {
  return (
    MODE_LABELS[key] ??
    key.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function endsAtMs(map: MapInfo | undefined): number | null {
  if (!map) return null;
  if (typeof map.end === "number" && map.end > 0) {
    return map.end > 1e12 ? map.end : map.end * 1000;
  }
  if (typeof map.remainingSecs === "number") {
    return Date.now() + map.remainingSecs * 1000;
  }
  return null;
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { data } = await getMapRotation();
    const br = data?.battle_royale?.current?.map ?? "the current map";
    const ranked = data?.ranked?.current?.map;
    const title = `Current Apex Legends Map Rotation — ${br}${ranked ? ` (Ranked: ${ranked})` : ""}`;
    const description = `Right now: ${br} in Battle Royale${ranked ? `, ${ranked} in Ranked` : ""}. Live countdown to the next map swap, plus what's next across every mode.`;
    return {
      title,
      description,
      alternates: { canonical: absoluteUrl("/map-rotation") },
      openGraph: { title, description, url: absoluteUrl("/map-rotation") },
    };
  } catch {
    return {
      title: "Current Apex Legends Map Rotation",
      description:
        "Live Apex Legends map rotation across Battle Royale, Ranked, and limited-time modes — with countdowns to the next swap.",
    };
  }
}

function ModeCard({ keyName, rotation }: { keyName: string; rotation: ModeRotation }) {
  const current = rotation.current;
  const next = rotation.next;
  const ends = endsAtMs(current);
  return (
    <li className="rounded-lg border border-apex-line bg-apex-panel p-5">
      <h2 className="text-sm uppercase tracking-wide text-apex-dim">
        {modeLabel(keyName)}
      </h2>
      <p className="mt-1 text-2xl font-semibold">
        {current?.map ?? "Unknown"}
      </p>
      {ends ? (
        <p className="mt-1 text-sm text-apex-dim">
          Swaps in <Countdown endsAtMs={ends} />
        </p>
      ) : current?.remainingTimer ? (
        <p className="mt-1 text-sm text-apex-dim">Swaps in {current.remainingTimer}</p>
      ) : null}
      {next?.map ? (
        <p className="mt-3 text-sm">
          <span className="text-apex-dim">Next:</span>{" "}
          <span className="text-apex-ink">{next.map}</span>
          {typeof next.DurationInMinutes === "number"
            ? ` · ${next.DurationInMinutes} min`
            : null}
        </p>
      ) : null}
    </li>
  );
}

export default async function MapRotationPage() {
  let stale = false;
  let fetchedAt = Date.now();
  let rotations: Record<string, ModeRotation> = {};
  try {
    const result = await getMapRotation();
    stale = result.stale;
    fetchedAt = result.fetchedAt;
    for (const [k, v] of Object.entries(result.data ?? {})) {
      if (v && typeof v === "object" && ("current" in v || "next" in v)) {
        rotations[k] = v as ModeRotation;
      }
    }
  } catch (err) {
    return (
      <div className="rounded-md border border-red-700/50 bg-red-900/20 p-4 text-sm">
        Couldn&apos;t reach the Apex API and no cached data is available yet.
        Make sure APEX_API_KEY is set in <code>.env.local</code>, then reload.
        <br />
        <span className="text-apex-dim">({(err as Error).message})</span>
      </div>
    );
  }

  const ld = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Apex Legends Current Map Rotation",
    url: absoluteUrl("/map-rotation"),
    description:
      "Live map rotation across every Apex Legends mode with countdowns to the next swap.",
    isPartOf: { "@type": "WebSite", name: SITE_NAME },
    dateModified: new Date(fetchedAt).toISOString(),
    mainEntity: Object.entries(rotations)
      .filter(([, r]) => r.current?.map)
      .map(([k, r]) => ({
        "@type": "Thing",
        name: `${modeLabel(k)}: ${r.current?.map}`,
        description: r.next?.map ? `Next map: ${r.next.map}` : undefined,
      })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(ld)} />
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Current Apex Legends Map Rotation
        </h1>
        <p className="mt-2 text-apex-dim">
          Live map per mode with countdowns to the next swap. Page regenerates
          every 60 seconds.
        </p>
      </header>
      <StaleBanner stale={stale} />
      {Object.keys(rotations).length === 0 ? (
        <p className="text-apex-dim">
          The API returned no rotation data this cycle. Try again shortly.
        </p>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-4">
          {Object.entries(rotations).map(([k, r]) => (
            <ModeCard key={k} keyName={k} rotation={r} />
          ))}
        </ul>
      )}
      <LastUpdated fetchedAt={fetchedAt} />
    </>
  );
}
