import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LastUpdated, StaleBanner } from "@/components/DataMeta";
import {
  getPlayer,
  type LegendEntry,
  type LegendTracker,
  type PlayerBadge,
  type PlayerRank,
  type PlayerRealtime,
  type PlayerResponse,
} from "@/lib/apex";
import {
  apiToLabel,
  isPlatformSlug,
  slugToApi,
  type PlatformSlug,
} from "@/lib/platform";
import {
  compactNumber,
  divisionRoman,
  fullNumber,
  isMeaningful,
  percent,
  rarityColor,
  statValue,
  tierColors,
} from "@/lib/format";
import { absoluteUrl, jsonLdScript, SITE_NAME } from "@/lib/seo";

export const revalidate = 300;
export const dynamicParams = true;

type PageParams = { platform: string; name: string };

function unwrapName(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function tierDisplay(rank: PlayerRank | undefined): string {
  if (!rank?.rankName) return "Unranked";
  const div = divisionRoman(rank.rankDiv);
  if (!div || rank.rankName === "Apex Predator" || rank.rankName === "Master" || rank.rankName === "Unranked")
    return rank.rankName;
  return `${rank.rankName} ${div}`;
}

function daysRemaining(meta: { start: number; end: number } | undefined): number | null {
  if (!meta?.end) return null;
  const ms = meta.end * 1000 - Date.now();
  if (ms <= 0) return 0;
  return Math.ceil(ms / 86_400_000);
}

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const name = unwrapName(params.name);
  const platformApi = slugToApi(params.platform);
  if (!platformApi) return { title: "Player not found" };
  try {
    const { data } = await getPlayer(name, platformApi);
    const g = data.global;
    const rankStr = tierDisplay(g?.rank);
    const title = `${g?.name ?? name} — ${rankStr} · Apex Legends Stats on ${apiToLabel(platformApi)}`;
    const kd = data.total?.kd?.value;
    const games = data.total?.games_played?.value;
    const description = `Live Apex Legends stats for ${g?.name ?? name} (${apiToLabel(platformApi)}): ${rankStr}${typeof g?.level === "number" ? `, level ${g.level}` : ""}${kd ? `, ${kd} K/D` : ""}${games ? `, ${games} BR games played` : ""}. Per-legend trackers, badges, and live status — auto-refreshed.`;
    return {
      title,
      description,
      alternates: { canonical: absoluteUrl(`/players/${params.platform}/${params.name}`) },
      openGraph: {
        title,
        description,
        url: absoluteUrl(`/players/${params.platform}/${params.name}`),
        type: "profile",
      },
    };
  } catch {
    return {
      title: `${name} — Apex Legends Stats`,
      description: `Apex Legends player stats for ${name}.`,
    };
  }
}

function rarityBadge(label: string, name: string | undefined, rarity: string | undefined) {
  if (!name || name === "None") return null;
  return (
    <div className="flex items-baseline justify-between gap-2 py-1 text-sm border-b border-apex-line last:border-0">
      <span className="text-apex-dim">{label}</span>
      <span className="text-right">
        <span className="text-apex-ink">{name}</span>
        {rarity ? <span className={`ml-2 text-xs uppercase ${rarityColor(rarity)}`}>{rarity}</span> : null}
      </span>
    </div>
  );
}

function RankCard({ title, rank }: { title: string; rank: PlayerRank | undefined }) {
  if (!rank) return null;
  const tier = tierColors(rank.rankName);
  const display = tierDisplay(rank);
  const days = daysRemaining(rank.rankedSeasonMeta);
  const platformPct = rank.ALStopPercent;
  const globalPct = rank.ALStopPercentGlobal;
  const platformInt = rank.ALStopInt;
  const globalInt = rank.ALStopIntGlobal;

  return (
    <div className={`rounded-xl border border-apex-line bg-apex-panel p-5 ring-1 ${tier.ring}`}>
      <div className="flex items-start gap-4">
        {rank.rankImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={rank.rankImg}
            alt={`${rank.rankName} rank badge`}
            className="h-16 w-16 object-contain"
          />
        ) : null}
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-wide text-apex-dim">{title}</p>
          <p className={`mt-1 text-2xl font-bold ${tier.text}`}>{display}</p>
          {typeof rank.rankScore === "number" ? (
            <p className="text-sm text-apex-ink font-mono tabular-nums">
              {fullNumber(rank.rankScore)} <span className="text-apex-dim text-xs">RP</span>
            </p>
          ) : null}
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {isMeaningful(platformPct) && (
          <div>
            <dt className="text-xs text-apex-dim">Top % on platform</dt>
            <dd className="font-mono tabular-nums">
              {percent(platformPct)}
              {isMeaningful(platformInt) ? (
                <span className="ml-1 text-xs text-apex-dim">
                  (#{statValue(platformInt)})
                </span>
              ) : null}
            </dd>
          </div>
        )}
        {isMeaningful(globalPct) && (
          <div>
            <dt className="text-xs text-apex-dim">Top % globally</dt>
            <dd className="font-mono tabular-nums">
              {percent(globalPct)}
              {isMeaningful(globalInt) ? (
                <span className="ml-1 text-xs text-apex-dim">
                  (#{statValue(globalInt)})
                </span>
              ) : null}
            </dd>
          </div>
        )}
        {rank.rankedSeason && (
          <div>
            <dt className="text-xs text-apex-dim">Season</dt>
            <dd className="font-mono text-xs">{rank.rankedSeason}</dd>
          </div>
        )}
        {days !== null && (
          <div>
            <dt className="text-xs text-apex-dim">Season ends in</dt>
            <dd className="font-mono tabular-nums">{days} days</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function RealtimePill({ rt }: { rt: PlayerRealtime | undefined }) {
  const isOnline = rt?.isOnline === 1;
  const isInGame = rt?.isInGame === 1;
  const text = rt?.currentStateAsText ?? (isOnline ? "Online" : "Offline");
  const dotColor = isInGame ? "bg-red-500" : isOnline ? "bg-emerald-500" : "bg-zinc-500";
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-apex-line bg-apex-panel px-3 py-1 text-xs">
      <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} />
      <span className="text-apex-ink">{text}</span>
      {rt?.selectedLegend ? (
        <span className="text-apex-dim">· as {rt.selectedLegend}</span>
      ) : null}
    </span>
  );
}

function LegendCard({ legendName, entry }: { legendName: string; entry: LegendEntry }) {
  const primary = (entry.data ?? []).filter((d) => isMeaningful(d.value))[0];
  const trackers = entry.data ?? [];
  return (
    <article className="overflow-hidden rounded-lg border border-apex-line bg-apex-panel">
      {entry.ImgAssets?.banner ? (
        <div
          className="h-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${entry.ImgAssets.banner})` }}
          aria-hidden
        />
      ) : null}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {entry.ImgAssets?.icon ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.ImgAssets.icon}
              alt={`${legendName} icon`}
              className="h-10 w-10 rounded-full bg-apex-bg object-cover"
            />
          ) : null}
          <h3 className="text-lg font-semibold">{legendName}</h3>
        </div>
        {trackers.length === 0 ? (
          <p className="mt-3 text-sm text-apex-dim">No tracker data for this legend.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm">
            {trackers.map((t, i) => (
              <li
                key={`${t.key ?? t.name}-${i}`}
                className="flex items-baseline justify-between gap-2 border-b border-apex-line/50 pb-2 last:border-0"
              >
                <span className="text-apex-dim">{t.name ?? t.key ?? "Tracker"}</span>
                <span className="text-right">
                  <span className="font-mono tabular-nums">{statValue(t.value)}</span>
                  {t.rank && isMeaningful(t.rank.topPercent) ? (
                    <span className="ml-2 text-xs text-apex-dim">
                      top {percent(t.rank.topPercent)}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

function findValue(total: Record<string, { value?: number | string }> | undefined, ...keys: string[]) {
  if (!total) return undefined;
  for (const k of keys) if (total[k]?.value !== undefined) return total[k].value;
  return undefined;
}

function uniqueBadges(badges: PlayerBadge[] | undefined): PlayerBadge[] {
  if (!badges) return [];
  const seen = new Set<string>();
  const out: PlayerBadge[] = [];
  for (const b of badges) {
    const k = `${b.name ?? ""}|${b.value ?? ""}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(b);
  }
  return out;
}

export default async function PlayerPage({ params }: { params: PageParams }) {
  if (!isPlatformSlug(params.platform)) notFound();
  const slug = params.platform as PlatformSlug;
  const apiPlatform = slugToApi(slug)!;
  const name = unwrapName(params.name);

  let data: PlayerResponse;
  let stale = false;
  let fetchedAt = Date.now();
  try {
    const result = await getPlayer(name, apiPlatform);
    data = result.data;
    stale = result.stale;
    fetchedAt = result.fetchedAt;
  } catch (err) {
    const msg = (err as Error).message;
    if (/player.*not found|404/i.test(msg)) notFound();
    return (
      <div className="rounded-md border border-red-700/50 bg-red-900/20 p-4 text-sm">
        Couldn&apos;t pull data for <strong>{name}</strong> on {apiToLabel(apiPlatform)}.
        <br />
        <span className="text-apex-dim">({msg})</span>
        <p className="mt-2">
          <Link className="underline" href="/">
            Try a different name or platform
          </Link>
        </p>
      </div>
    );
  }

  const g = data.global ?? {};
  const rt = data.realtime;
  const selected = data.legends?.selected;
  const allLegends = data.legends?.all ?? {};
  const totals = data.total ?? {};
  const badges = uniqueBadges(g.badges).filter((b) => b.name && b.name !== "null");
  const selectedBanner = selected?.ImgAssets?.banner;

  const headlineKD = findValue(totals, "kd");
  const headlineKills = findValue(totals, "kills", "specialEvent_kills");
  const headlineDamage = findValue(totals, "damage", "specialEvent_damage");
  const headlineWins = findValue(totals, "wins", "specialEvent_wins");
  const headlineGames = findValue(totals, "games_played");
  const headlineTop3 = findValue(totals, "top_3");

  const legendEntries: Array<{ name: string; entry: LegendEntry; primaryValue: number }> = Object.entries(allLegends).map(([n, entry]) => {
    const first = (entry.data ?? []).find((d) => typeof d.value === "number");
    return { name: n, entry, primaryValue: typeof first?.value === "number" ? first.value : 0 };
  });
  legendEntries.sort((a, b) => b.primaryValue - a.primaryValue);

  const ld = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${g.name ?? name} — Apex Legends Stats`,
    url: absoluteUrl(`/players/${params.platform}/${params.name}`),
    isPartOf: { "@type": "WebSite", name: SITE_NAME },
    dateModified: new Date(fetchedAt).toISOString(),
    mainEntity: {
      "@type": "Person",
      name: g.name ?? name,
      identifier: g.uid,
      additionalProperty: [
        g.level && { "@type": "PropertyValue", name: "Level", value: g.level },
        g.rank?.rankName && {
          "@type": "PropertyValue",
          name: "Ranked tier",
          value: tierDisplay(g.rank),
        },
        typeof g.rank?.rankScore === "number" && {
          "@type": "PropertyValue",
          name: "Ranked Points",
          value: g.rank.rankScore,
        },
        headlineKD && { "@type": "PropertyValue", name: "K/D", value: headlineKD },
        headlineKills && { "@type": "PropertyValue", name: "BR kills", value: headlineKills },
        headlineGames && { "@type": "PropertyValue", name: "BR games played", value: headlineGames },
      ].filter(Boolean),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(ld)} />

      {/* Hero */}
      <section className="relative -mx-4 -mt-8 mb-8 overflow-hidden border-b border-apex-line">
        {selectedBanner ? (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: `url(${selectedBanner})` }}
            aria-hidden
          />
        ) : null}
        <div className="relative px-4 py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wider text-apex-dim">
                {apiToLabel(g.platform ?? apiPlatform)}
              </p>
              <h1 className="mt-1 text-4xl md:text-5xl font-bold tracking-tight">
                {g.name ?? name}
                {g.tag ? <span className="ml-2 text-apex-dim text-2xl">[{g.tag}]</span> : null}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full border border-apex-line bg-apex-panel px-3 py-1">
                  Level <span className="font-mono">{g.level ?? "—"}</span>
                  {g.levelPrestige && g.levelPrestige > 0 ? (
                    <span className="ml-1 text-apex-accent">★{g.levelPrestige}</span>
                  ) : null}
                  {typeof g.toNextLevelPercent === "number" ? (
                    <span className="ml-2 text-xs text-apex-dim">
                      {g.toNextLevelPercent}% to next
                    </span>
                  ) : null}
                </span>
                <RealtimePill rt={rt} />
                {g.bans?.isActive ? (
                  <span className="rounded-full bg-red-500/20 border border-red-500/40 px-3 py-1 text-xs text-red-200">
                    Banned · {g.bans.last_banReason ?? "Reason unknown"}
                  </span>
                ) : g.bans?.last_banReason ? (
                  <span className="rounded-full border border-apex-line bg-apex-panel px-3 py-1 text-xs text-apex-dim">
                    Past ban: {g.bans.last_banReason}
                  </span>
                ) : null}
              </div>
            </div>
            {g.uid ? (
              <div className="text-xs text-apex-dim text-right">
                UID
                <div className="font-mono text-apex-ink">{g.uid}</div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <StaleBanner stale={stale} />

      {/* Headline stats */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm uppercase tracking-wide text-apex-dim">
          Career headlines
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatBlock label="K/D" value={headlineKD} />
          <StatBlock label="BR Kills" value={headlineKills} compact />
          <StatBlock label="BR Damage" value={headlineDamage} compact />
          <StatBlock label="Wins" value={headlineWins} />
          <StatBlock label="Top 3" value={headlineTop3} />
          <StatBlock label="Games" value={headlineGames} compact />
        </div>
      </section>

      {/* Rank cards */}
      <section className="mb-8 grid gap-4 md:grid-cols-2">
        <RankCard title="Battle Royale Rank" rank={g.rank} />
        <RankCard title="Arenas Rank" rank={g.arena} />
      </section>

      {/* Currently playing */}
      {selected?.LegendName ? (
        <section className="mb-8 overflow-hidden rounded-xl border border-apex-line bg-apex-panel">
          {selected.ImgAssets?.banner ? (
            <div
              className="h-40 bg-cover bg-center"
              style={{ backgroundImage: `url(${selected.ImgAssets.banner})` }}
              aria-hidden
            />
          ) : null}
          <div className="p-5">
            <p className="text-xs uppercase tracking-wide text-apex-dim">
              Currently equipped
            </p>
            <h2 className="mt-1 text-2xl font-bold">{selected.LegendName}</h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                {rarityBadge("Skin", selected.gameInfo?.skin, selected.gameInfo?.skinRarity)}
                {rarityBadge("Frame", selected.gameInfo?.frame, selected.gameInfo?.frameRarity)}
                {rarityBadge("Pose", selected.gameInfo?.pose, selected.gameInfo?.poseRarity)}
                {rarityBadge("Intro", selected.gameInfo?.intro, selected.gameInfo?.introRarity)}
              </div>
              {selected.data && selected.data.length > 0 && (
                <div className="mt-4 md:mt-0">
                  <p className="text-xs uppercase tracking-wide text-apex-dim mb-2">
                    Trackers on this legend
                  </p>
                  <ul className="space-y-1 text-sm">
                    {selected.data.map((t, i) => (
                      <li key={i} className="flex justify-between border-b border-apex-line/50 py-1">
                        <span className="text-apex-dim">{t.name ?? t.key}</span>
                        <span className="font-mono tabular-nums">{statValue(t.value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* Every legend with mastery data */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm uppercase tracking-wide text-apex-dim">
          Per-legend mastery ({legendEntries.length})
        </h2>
        {legendEntries.length === 0 ? (
          <p className="text-sm text-apex-dim">No per-legend data available.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {legendEntries.map(({ name: ln, entry }) => (
              <LegendCard key={ln} legendName={ln} entry={entry} />
            ))}
          </div>
        )}
      </section>

      {/* Full career tracker dump */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm uppercase tracking-wide text-apex-dim">
          Every career tracker ({Object.keys(totals).length})
        </h2>
        {Object.keys(totals).length === 0 ? (
          <p className="text-sm text-apex-dim">No career tracker data.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(totals).map(([k, t]) => (
              <div
                key={k}
                className="rounded-md border border-apex-line bg-apex-panel p-3 text-sm"
              >
                <p className="text-xs uppercase tracking-wide text-apex-dim truncate" title={t.name ?? k}>
                  {t.name ?? k}
                </p>
                <p className="mt-1 text-lg font-mono tabular-nums">
                  {statValue(t.value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Badges */}
      {badges.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm uppercase tracking-wide text-apex-dim">
            Account badges ({badges.length})
          </h2>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {badges.map((b, i) => (
              <li
                key={`${b.name}-${i}`}
                className="flex justify-between items-baseline rounded-md border border-apex-line bg-apex-panel px-3 py-2 text-sm"
              >
                <span className="truncate" title={b.name}>{b.name}</span>
                <span className="font-mono tabular-nums text-apex-dim">×{b.value ?? 1}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Raw debugging blob for power users */}
      <section className="mb-4">
        <details className="rounded-md border border-apex-line bg-apex-panel">
          <summary className="cursor-pointer px-4 py-2 text-xs text-apex-dim hover:text-apex-ink">
            Raw API response (debug)
          </summary>
          <pre className="overflow-auto max-h-[500px] px-4 py-3 text-xs font-mono leading-relaxed text-apex-dim">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </section>

      <LastUpdated fetchedAt={fetchedAt} />
    </>
  );
}

function StatBlock({
  label,
  value,
  compact: useCompact,
}: {
  label: string;
  value: number | string | undefined;
  compact?: boolean;
}) {
  const display =
    value === undefined
      ? "—"
      : typeof value === "number"
      ? useCompact
        ? compactNumber(value)
        : fullNumber(value)
      : value;
  return (
    <div className="rounded-lg border border-apex-line bg-apex-panel p-3">
      <p className="text-xs uppercase tracking-wide text-apex-dim">{label}</p>
      <p className="mt-1 text-2xl font-bold font-mono tabular-nums">{display}</p>
    </div>
  );
}
