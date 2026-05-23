import { formatTimestamp } from "@/lib/seo";

export function StaleBanner({ stale }: { stale: boolean }) {
  if (!stale) return null;
  return (
    <div className="mb-4 rounded-md border border-yellow-700/50 bg-yellow-900/20 px-3 py-2 text-sm text-yellow-200">
      ⚠ Live API unreachable — showing the last cached snapshot. This page will
      refresh automatically on the next revalidation.
    </div>
  );
}

export function LastUpdated({ fetchedAt }: { fetchedAt: number }) {
  return (
    <p className="mt-8 text-xs text-apex-dim">
      Last updated: <span className="font-mono">{formatTimestamp(fetchedAt)}</span>
    </p>
  );
}
