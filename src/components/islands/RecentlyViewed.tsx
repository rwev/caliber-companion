import { useState, useEffect } from 'preact/hooks';

const STORAGE_KEY = 'cc-recently-viewed';

interface CaliberInfo {
  slug: string;
  name: string;
  designation: string;
  category: string;
}

interface ViewEntry {
  slug: string;
  ts: number;
}

interface Props {
  allCalibers: CaliberInfo[];
  basePath: string;
}

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getRecent(): ViewEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RecentlyViewed({ allCalibers, basePath }: Props) {
  const [entries, setEntries] = useState<ViewEntry[]>([]);

  useEffect(() => {
    setEntries(getRecent());
  }, []);

  const recent = entries
    .map(e => {
      const cal = allCalibers.find(c => c.slug === e.slug);
      return cal ? { ...cal, ts: e.ts } : null;
    })
    .filter(Boolean) as (CaliberInfo & { ts: number })[];

  if (recent.length === 0) return null;

  return (
    <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <div class="mb-6 flex items-center gap-4">
        <div class="h-px flex-1 bg-surface-border" aria-hidden="true"></div>
        <h2 class="font-display text-base tracking-[0.25em] uppercase text-text-muted flex items-center gap-2">
          <svg class="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Recently Viewed
        </h2>
        <div class="h-px flex-1 bg-surface-border" aria-hidden="true"></div>
      </div>

      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recent.slice(0, 6).map(cal => (
          <a
            key={cal.slug}
            href={`${basePath}/calibers/${cal.slug}`}
            class="group border border-surface-border bg-surface p-4 transition-colors hover:border-accent/40 hover:bg-surface-raised"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="font-display text-lg font-semibold text-text-primary group-hover:text-accent transition-colors truncate">
                  {cal.name}
                </div>
                <div class="mt-0.5 font-mono text-sm text-text-muted truncate">
                  {cal.designation}
                </div>
              </div>
              <div class="shrink-0 text-right">
                <span class="border border-surface-border px-2 py-0.5 font-mono text-xs tracking-wider uppercase text-text-muted">
                  {titleCase(cal.category)}
                </span>
                <div class="mt-1 font-mono text-xs text-text-muted">
                  {timeAgo(cal.ts)}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
