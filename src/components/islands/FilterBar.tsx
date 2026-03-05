import { useState, useMemo } from 'preact/hooks';

interface CaliberSummary {
  name: string;
  designation: string;
  slug: string;
  category: string;
  aliases: string[];
  typical_velocity_fps: [number, number];
  typical_energy_ft_lbs: [number, number];
  effective_range_yd: number;
  popularity_tier: string;
  recoil_subjective: string;
  year_introduced: number;
}

interface Props {
  calibers: CaliberSummary[];
  basePath: string;
}

type SortKey = 'name' | 'year' | 'popularity' | 'range';

const CATEGORY_ORDER = ['handgun', 'rifle', 'shotgun', 'pdw', 'magnum_handgun', 'magnum_rifle'];
const POPULARITY_ORDER = ['ubiquitous', 'very_common', 'common', 'niche', 'rare'];

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function FilterBar({ calibers, basePath }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('name');

  const categories = useMemo(() => {
    const cats = [...new Set(calibers.map(c => c.category))];
    return cats.sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b));
  }, [calibers]);

  const filtered = useMemo(() => {
    let result = calibers;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.designation.toLowerCase().includes(q) ||
        c.aliases.some(a => a.toLowerCase().includes(q))
      );
    }

    if (activeCategory) {
      result = result.filter(c => c.category === activeCategory);
    }

    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case 'name': return a.name.localeCompare(b.name);
        case 'year': return a.year_introduced - b.year_introduced;
        case 'popularity': return POPULARITY_ORDER.indexOf(a.popularity_tier) - POPULARITY_ORDER.indexOf(b.popularity_tier);
        case 'range': return b.effective_range_yd - a.effective_range_yd;
        default: return 0;
      }
    });

    return result;
  }, [calibers, search, activeCategory, sortKey]);

  // Group by category for display
  const grouped = useMemo(() => {
    if (activeCategory) return [[activeCategory, filtered] as const];
    const groups = new Map<string, CaliberSummary[]>();
    for (const c of filtered) {
      const arr = groups.get(c.category) || [];
      arr.push(c);
      groups.set(c.category, arr);
    }
    return [...groups.entries()].sort(
      ([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b)
    );
  }, [filtered, activeCategory]);

  return (
    <div>
      {/* Controls */}
      <div class="mb-8 space-y-4">
        {/* Search */}
        <div class="relative">
          <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search calibers..."
            value={search}
            onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
            class="w-full border border-surface-border bg-surface-raised py-2.5 pl-10 pr-4 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent/50 focus:outline-none"
          />
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3">
          {/* Category filters */}
          <div class="flex flex-wrap gap-1.5">
            <button
              onClick={() => setActiveCategory(null)}
              class={`px-3 py-1.5 font-mono text-sm tracking-wider uppercase transition-colors ${
                !activeCategory
                  ? 'border border-accent/30 bg-accent/15 text-accent'
                  : 'border border-surface-border text-text-muted hover:text-text-secondary'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                class={`px-3 py-1.5 font-mono text-sm tracking-wider uppercase transition-colors ${
                  activeCategory === cat
                    ? 'border border-accent/30 bg-accent/15 text-accent'
                    : 'border border-surface-border text-text-muted hover:text-text-secondary'
                }`}
              >
                {titleCase(cat)}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div class="flex items-center gap-2">
            <span class="font-mono text-sm tracking-wider uppercase text-text-muted">Sort</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey((e.target as HTMLSelectElement).value as SortKey)}
              class="border border-surface-border bg-surface-raised px-2 py-1 font-mono text-sm text-text-secondary focus:border-accent/50 focus:outline-none"
            >
              <option value="name">Name</option>
              <option value="year">Year Introduced</option>
              <option value="popularity">Popularity</option>
              <option value="range">Effective Range</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div class="py-12 text-center">
          <div class="font-mono text-sm text-text-muted">No calibers match your search.</div>
        </div>
      ) : (
        <div class="space-y-10">
          {grouped.map(([category, items]) => (
            <section key={category}>
              <div class="mb-4 flex items-center gap-4">
                <h2 class="font-display text-sm tracking-[0.25em] uppercase text-accent" style={{ fontFamily: '"Barlow Condensed", system-ui, sans-serif' }}>
                  {titleCase(category)}
                </h2>
                <div class="h-px flex-1 bg-surface-border"></div>
                <span class="font-mono text-sm text-text-muted">{items.length}</span>
              </div>

              <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(c => (
                  <a
                    key={c.slug}
                    href={`${basePath}/calibers/${c.slug}`}
                    class="group block border border-surface-border bg-surface transition-all hover:border-accent/40 hover:bg-surface-raised hover:shadow-[0_0_24px_rgba(224,90,43,0.06)]"
                  >
                    <div class="p-4">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <h3
                            class="text-lg font-semibold text-text-primary transition-colors group-hover:text-accent truncate"
                            style={{ fontFamily: '"Barlow Condensed", system-ui, sans-serif' }}
                          >
                            {c.name}
                          </h3>
                          <div class="mt-0.5 font-mono text-sm text-text-muted truncate">
                            {c.designation}
                          </div>
                        </div>
                        <span class="shrink-0 border border-surface-border px-2 py-0.5 font-mono text-sm tracking-wider uppercase text-text-muted">
                          {titleCase(c.category)}
                        </span>
                      </div>

                      <div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                          <div class="font-mono text-sm tracking-[0.15em] uppercase text-text-muted">Velocity</div>
                          <div class="font-mono text-sm text-text-secondary">
                            {c.typical_velocity_fps[0]}–{c.typical_velocity_fps[1]} <span class="text-text-muted">fps</span>
                          </div>
                        </div>
                        <div>
                          <div class="font-mono text-sm tracking-[0.15em] uppercase text-text-muted">Energy</div>
                          <div class="font-mono text-sm text-text-secondary">
                            {c.typical_energy_ft_lbs[0]}–{c.typical_energy_ft_lbs[1]} <span class="text-text-muted">ft·lbs</span>
                          </div>
                        </div>
                        <div>
                          <div class="font-mono text-sm tracking-[0.15em] uppercase text-text-muted">Eff. Range</div>
                          <div class="font-mono text-sm text-text-secondary">
                            {c.effective_range_yd} <span class="text-text-muted">yd</span>
                          </div>
                        </div>
                        <div>
                          <div class="font-mono text-sm tracking-[0.15em] uppercase text-text-muted">Recoil</div>
                          <div class="font-mono text-sm text-text-secondary">
                            {titleCase(c.recoil_subjective)}
                          </div>
                        </div>
                      </div>

                      <div class="mt-4 flex items-center justify-between border-t border-surface-border-subtle pt-3">
                        <span class="font-mono text-sm tracking-wider uppercase text-text-muted">
                          {titleCase(c.popularity_tier)}
                        </span>
                        <span class="font-mono text-sm text-text-muted transition-colors group-hover:text-accent">
                          View →
                        </span>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
