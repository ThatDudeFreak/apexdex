import type { Metadata } from "next";
import { LastUpdated, StaleBanner } from "@/components/DataMeta";
import { getCrafting, type CraftingBundle } from "@/lib/apex";
import { absoluteUrl, jsonLdScript, SITE_NAME } from "@/lib/seo";

export const revalidate = 21600;

function bundleTitle(b: CraftingBundle, fallback: string): string {
  if (b.bundleType) {
    return b.bundleType
      .split(/[_-]+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  }
  return b.bundle ?? fallback;
}

function rotationLabel(bundleType: string | undefined): string {
  if (!bundleType) return "Bundle";
  const lower = bundleType.toLowerCase();
  if (lower.includes("daily")) return "Daily";
  if (lower.includes("weekly")) return "Weekly";
  if (lower.includes("permanent")) return "Permanent";
  return "Bundle";
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { data } = await getCrafting();
    const items = (data ?? [])
      .flatMap((b) => b.bundleContent ?? [])
      .map((i) => i.item)
      .filter((x): x is string => Boolean(x))
      .slice(0, 4);
    const itemList = items.length ? items.join(", ") : "the current crafting bundle";
    return {
      title: `Apex Legends Crafting Rotation — ${itemList}`,
      description: `What's in Apex Legends replicators right now: ${itemList}${
        items.length ? "…" : ""
      } and the materials cost for each.`,
      alternates: { canonical: absoluteUrl("/crafting-rotation") },
      openGraph: {
        title: `Apex Legends Crafting Rotation`,
        description: `Current craftable items in replicators with materials cost.`,
        url: absoluteUrl("/crafting-rotation"),
      },
    };
  } catch {
    return {
      title: "Apex Legends Crafting Rotation",
      description:
        "The current daily, weekly, and permanent items in Apex Legends replicators with their materials cost.",
    };
  }
}

function BundleCard({ b, index }: { b: CraftingBundle; index: number }) {
  const items = b.bundleContent ?? [];
  return (
    <article className="rounded-lg border border-apex-line bg-apex-panel p-5">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold">{bundleTitle(b, `Bundle ${index + 1}`)}</h2>
        <span className="text-xs uppercase tracking-wide text-apex-dim">
          {rotationLabel(b.bundleType)}
        </span>
      </header>
      {items.length === 0 ? (
        <p className="text-sm text-apex-dim">No items reported.</p>
      ) : (
        <ul className="divide-y divide-apex-line text-sm">
          {items.map((it, i) => (
            <li key={`${it.item}-${i}`} className="flex justify-between py-2">
              <span>
                <span className="text-apex-ink">{it.item ?? "Unknown item"}</span>
                {it.itemType?.rarity ? (
                  <span className="ml-2 text-xs uppercase text-apex-dim">
                    {it.itemType.rarity}
                  </span>
                ) : null}
              </span>
              <span className="font-mono tabular-nums text-apex-dim">
                {typeof it.cost === "number" ? `${it.cost} mats` : "—"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default async function CraftingPage() {
  let stale = false;
  let fetchedAt = Date.now();
  let bundles: CraftingBundle[] = [];
  try {
    const result = await getCrafting();
    stale = result.stale;
    fetchedAt = result.fetchedAt;
    bundles = Array.isArray(result.data) ? result.data : [];
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

  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Apex Legends Crafting Rotation",
    description: "Items currently available in Apex Legends replicators.",
    url: absoluteUrl("/crafting-rotation"),
    isPartOf: { "@type": "WebSite", name: SITE_NAME },
    dateModified: new Date(fetchedAt).toISOString(),
    itemListElement: bundles.flatMap((b, bi) =>
      (b.bundleContent ?? []).map((it, i) => ({
        "@type": "ListItem",
        position: bi * 100 + i + 1,
        name: it.item,
        description: `${rotationLabel(b.bundleType)} bundle · ${typeof it.cost === "number" ? `${it.cost} crafting materials` : "cost unknown"}`,
      })),
    ),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(ld)} />
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Apex Legends Crafting Rotation
        </h1>
        <p className="mt-2 text-apex-dim">
          What&apos;s craftable in replicators this rotation, with materials
          cost per item. Page regenerates every 6 hours.
        </p>
      </header>
      <StaleBanner stale={stale} />
      {bundles.length === 0 ? (
        <p className="text-apex-dim">
          The API returned no crafting bundles this cycle. Try again shortly.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {bundles.map((b, i) => (
            <BundleCard key={`${b.bundle ?? b.bundleType ?? "b"}-${i}`} b={b} index={i} />
          ))}
        </div>
      )}
      <LastUpdated fetchedAt={fetchedAt} />
    </>
  );
}
