import { useState, useMemo } from 'preact/hooks';

interface CaliberCost {
  name: string;
  slug: string;
  category: string;
  costLow: number;
  costHigh: number;
  costMid: number;
}

interface Props {
  calibers: CaliberCost[];
  basePath: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  rifle: '#3b82f6',
  handgun: '#10b981',
  magnum_rifle: '#a855f7',
  magnum_handgun: '#f43f5e',
  shotgun: '#f59e0b',
  pdw: '#06b6d4',
};

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function CostComparison({ calibers, basePath }: Props) {
  const [sortBy, setSortBy] = useState<'low' | 'mid' | 'high'>('mid');
  const [filterCat, setFilterCat] = useState<string>('all');

  const categories = useMemo(() => {
    const cats = new Map<string, number>();
    calibers.forEach(c => cats.set(c.category, (cats.get(c.category) || 0) + 1));
    return [...cats.entries()].sort((a, b) => b[1] - a[1]);
  }, [calibers]);

  const filtered = useMemo(() => {
    let result = filterCat === 'all' ? calibers : calibers.filter(c => c.category === filterCat);
    result = [...result].sort((a, b) => {
      if (sortBy === 'low') return a.costLow - b.costLow;
      if (sortBy === 'high') return a.costHigh - b.costHigh;
      return a.costMid - b.costMid;
    });
    return result;
  }, [calibers, sortBy, filterCat]);

  const maxCost = Math.max(...calibers.map(c => c.costHigh), 1);

  return (
    <div class="space-y-4">
      {/* Controls */}
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2">
          <span class="text-xs font-medium uppercase tracking-wide text-text-muted">Sort:</span>
          {(['low', 'mid', 'high'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              class={`border px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                sortBy === s
                  ? 'border-accent/40 bg-accent/15 text-accent'
                  : 'border-surface-border text-text-muted hover:text-text-secondary'
              }`}
            >
              {s === 'mid' ? 'Avg' : s}
            </button>
          ))}
        </div>

        <div class="h-4 w-px bg-surface-border" />

        <div class="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterCat('all')}
            class={`border px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              filterCat === 'all'
                ? 'border-accent/40 bg-accent/15 text-accent'
                : 'border-surface-border text-text-muted hover:text-text-secondary'
            }`}
          >
            All ({calibers.length})
          </button>
          {categories.map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              class={`flex items-center gap-1 border px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                filterCat === cat
                  ? 'border-accent/40 bg-accent/15 text-accent'
                  : 'border-surface-border text-text-muted hover:text-text-secondary'
              }`}
            >
              <span class="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] || '#888' }} />
              {titleCase(cat)} ({count})
            </button>
          ))}
        </div>
      </div>

      <p class="text-xs text-text-muted">
        Showing {filtered.length} calibers · Bar shows low–high range · Dot is midpoint
      </p>

      {/* Chart */}
      <div class="border border-surface-border rounded-lg">
        <div class="divide-y divide-surface-border-subtle">
          {filtered.map((c, i) => {
            const leftPct = (c.costLow / maxCost) * 100;
            const widthPct = ((c.costHigh - c.costLow) / maxCost) * 100;
            const midPct = (c.costMid / maxCost) * 100;
            const color = CATEGORY_COLORS[c.category] || '#888';

            return (
              <div
                key={c.slug}
                class={`flex items-center gap-3 px-3 py-1.5 ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised'} hover:bg-surface-overlay transition-colors`}
              >
                <a
                  href={`${basePath}/calibers/${c.slug}`}
                  class="w-36 sm:w-44 shrink-0 font-mono text-sm text-text-primary hover:text-accent transition-colors truncate"
                  title={c.name}
                >
                  {c.name}
                </a>

                <div class="flex-1 relative h-5">
                  {/* Range bar */}
                  <div
                    class="absolute top-1.5 h-2 rounded-full opacity-30"
                    style={{
                      left: `${leftPct}%`,
                      width: `${Math.max(widthPct, 0.5)}%`,
                      backgroundColor: color,
                    }}
                  />
                  {/* Midpoint dot */}
                  <div
                    class="absolute top-0.5 h-4 w-4 rounded-full border-2 border-surface"
                    style={{
                      left: `calc(${midPct}% - 8px)`,
                      backgroundColor: color,
                    }}
                    title={`$${c.costLow.toFixed(2)} – $${c.costHigh.toFixed(2)}`}
                  />
                </div>

                <div class="w-28 shrink-0 text-right font-mono text-xs text-text-muted">
                  ${c.costLow.toFixed(2)}–${c.costHigh.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price scale */}
      <div class="flex justify-between font-mono text-xs text-text-muted px-3">
        <span>$0.00</span>
        <span>${(maxCost / 4).toFixed(2)}</span>
        <span>${(maxCost / 2).toFixed(2)}</span>
        <span>${(maxCost * 3 / 4).toFixed(2)}</span>
        <span>${maxCost.toFixed(2)}</span>
      </div>
    </div>
  );
}
