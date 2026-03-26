import { useState, useMemo } from 'preact/hooks';

interface CaliberEntry {
  name: string;
  slug: string;
  year: number;
  category: string;
  country: string;
}

interface Props {
  calibers: CaliberEntry[];
  basePath: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  rifle: 'Rifle',
  handgun: 'Handgun',
  magnum_rifle: 'Magnum Rifle',
  magnum_handgun: 'Magnum Handgun',
  shotgun: 'Shotgun',
  pdw: 'PDW',
};

const CATEGORY_COLORS: Record<string, string> = {
  rifle: 'bg-blue-500',
  handgun: 'bg-emerald-500',
  magnum_rifle: 'bg-purple-500',
  magnum_handgun: 'bg-rose-500',
  shotgun: 'bg-amber-500',
  pdw: 'bg-cyan-500',
};

const CATEGORY_DOT_COLORS: Record<string, string> = {
  rifle: 'bg-blue-400',
  handgun: 'bg-emerald-400',
  magnum_rifle: 'bg-purple-400',
  magnum_handgun: 'bg-rose-400',
  shotgun: 'bg-amber-400',
  pdw: 'bg-cyan-400',
};

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function CaliberTimeline({ calibers, basePath }: Props) {
  const [activeCategories, setActiveCategories] = useState<Set<string>>(
    new Set(Object.keys(CATEGORY_LABELS)),
  );
  const [hoveredDecade, setHoveredDecade] = useState<number | null>(null);

  const categories = useMemo(() => {
    const cats = new Map<string, number>();
    calibers.forEach(c => cats.set(c.category, (cats.get(c.category) || 0) + 1));
    return [...cats.entries()].sort((a, b) => b[1] - a[1]);
  }, [calibers]);

  const filtered = useMemo(
    () => calibers.filter(c => activeCategories.has(c.category)),
    [calibers, activeCategories],
  );

  const decades = useMemo(() => {
    const map = new Map<number, CaliberEntry[]>();
    filtered.forEach(c => {
      const dec = Math.floor(c.year / 10) * 10;
      if (!map.has(dec)) map.set(dec, []);
      map.get(dec)!.push(c);
    });
    // Sort calibers within each decade by year
    map.forEach(arr => arr.sort((a, b) => a.year - b.year || a.name.localeCompare(b.name)));
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [filtered]);

  function toggleCategory(cat: string) {
    setActiveCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (next.size > 1) next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }

  function selectOnly(cat: string) {
    setActiveCategories(new Set([cat]));
  }

  function selectAll() {
    setActiveCategories(new Set(Object.keys(CATEGORY_LABELS)));
  }

  const maxPerDecade = Math.max(...decades.map(([, arr]) => arr.length), 1);

  return (
    <div class="space-y-6">
      {/* Category filters */}
      <div class="flex flex-wrap items-center gap-2">
        <button
          onClick={selectAll}
          class={`border px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeCategories.size === Object.keys(CATEGORY_LABELS).length
              ? 'border-accent/40 bg-accent/15 text-accent'
              : 'border-surface-border text-text-muted hover:text-text-secondary'
          }`}
        >
          All ({calibers.length})
        </button>
        {categories.map(([cat, count]) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            onDblClick={() => selectOnly(cat)}
            class={`flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeCategories.has(cat)
                ? 'border-accent/40 bg-accent/10 text-text-primary'
                : 'border-surface-border text-text-muted opacity-50 hover:opacity-75'
            }`}
            title={`Click to toggle, double-click to isolate ${titleCase(cat)}`}
          >
            <span class={`inline-block h-2.5 w-2.5 rounded-full ${CATEGORY_COLORS[cat] || 'bg-gray-400'}`} />
            {CATEGORY_LABELS[cat] || titleCase(cat)} ({count})
          </button>
        ))}
      </div>

      <p class="text-xs text-text-muted">
        Showing {filtered.length} of {calibers.length} calibers · Click category to toggle · Double-click to isolate
      </p>

      {/* Timeline */}
      <div class="relative">
        {decades.map(([decade, entries]) => (
          <div
            key={decade}
            class="group relative border-l-2 border-surface-border ml-4 pl-6 pb-6 last:pb-0"
            onMouseEnter={() => setHoveredDecade(decade)}
            onMouseLeave={() => setHoveredDecade(null)}
          >
            {/* Decade marker */}
            <div class="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-surface-border bg-surface group-hover:border-accent transition-colors" />

            <div class="mb-3 flex items-baseline gap-3">
              <span class="text-xl font-bold text-text-primary">{decade}s</span>
              <span class="font-mono text-sm text-text-muted">
                {entries.length} caliber{entries.length !== 1 ? 's' : ''}
              </span>
              {/* Mini bar showing relative count */}
              <div class="hidden sm:flex flex-1 items-center gap-2">
                <div class="h-1.5 bg-accent/30 transition-all duration-300" style={{ width: `${(entries.length / maxPerDecade) * 100}%`, maxWidth: '200px' }} />
              </div>
            </div>

            <div class="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {entries.map(cal => (
                <a
                  key={cal.slug}
                  href={`${basePath}/calibers/${cal.slug}`}
                  class="group/item flex items-center gap-2 border border-surface-border-subtle rounded-md bg-surface px-3 py-2 transition-colors hover:border-accent/40 hover:bg-surface-raised"
                >
                  <span class={`inline-block h-2 w-2 shrink-0 rounded-full ${CATEGORY_DOT_COLORS[cal.category] || 'bg-gray-400'}`} />
                  <div class="min-w-0 flex-1">
                    <span class="font-mono text-sm text-text-primary group-hover/item:text-accent transition-colors truncate block">
                      {cal.name}
                    </span>
                  </div>
                  <span class="font-mono text-xs text-text-muted shrink-0">{cal.year}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div class="border border-dashed border-surface-border rounded-lg p-8 text-center">
          <p class="text-sm text-text-muted">No calibers match the selected filters.</p>
        </div>
      )}
    </div>
  );
}
