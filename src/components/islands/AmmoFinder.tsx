import { useState, useMemo } from 'preact/hooks';

interface LoadEntry {
  caliberName: string;
  caliberSlug: string;
  category: string;
  loadName: string;
  bulletWeight: number;
  bulletType: string;
  muzzleVelocity: number;
  muzzleEnergy: number;
  barrelLength: number;
  bcG1: number | null;
  sectionalDensity: number | null;
  gelPenetration: number | null;
  expansionDiameter: number | null;
  barrierBlind: boolean | null;
}

interface Props {
  loads: LoadEntry[];
  basePath: string;
}

type SortKey = 'caliber' | 'load' | 'weight' | 'velocity' | 'energy' | 'penetration';
type SortDir = 'asc' | 'desc';

const CATEGORY_ORDER = ['handgun', 'rifle', 'shotgun', 'pdw', 'magnum_handgun', 'magnum_rifle'];

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function AmmoFinder({ loads, basePath }: Props) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [bulletTypeFilter, setBulletTypeFilter] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('caliber');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const categories = useMemo(() => {
    const cats = [...new Set(loads.map(l => l.category))];
    return cats.sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b));
  }, [loads]);

  const bulletTypes = useMemo(() => {
    const types = [...new Set(loads.map(l => l.bulletType))];
    return types.sort();
  }, [loads]);

  const filtered = useMemo(() => {
    let result = loads;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.caliberName.toLowerCase().includes(q) ||
        l.loadName.toLowerCase().includes(q) ||
        l.bulletType.toLowerCase().includes(q)
      );
    }

    if (categoryFilter) {
      result = result.filter(l => l.category === categoryFilter);
    }

    if (bulletTypeFilter) {
      result = result.filter(l => l.bulletType === bulletTypeFilter);
    }

    const dir = sortDir === 'asc' ? 1 : -1;
    result = [...result].sort((a, b) => {
      switch (sortKey) {
        case 'caliber': return dir * a.caliberName.localeCompare(b.caliberName);
        case 'load': return dir * a.loadName.localeCompare(b.loadName);
        case 'weight': return dir * (a.bulletWeight - b.bulletWeight);
        case 'velocity': return dir * (a.muzzleVelocity - b.muzzleVelocity);
        case 'energy': return dir * (a.muzzleEnergy - b.muzzleEnergy);
        case 'penetration': return dir * ((a.gelPenetration ?? 0) - (b.gelPenetration ?? 0));
        default: return 0;
      }
    });

    return result;
  }, [loads, search, categoryFilter, bulletTypeFilter, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir(key === 'caliber' || key === 'load' ? 'asc' : 'desc');
    }
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return '';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  }

  return (
    <div>
      {/* Controls */}
      <div class="mb-6 space-y-4">
        {/* Search */}
        <div class="relative">
          <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search loads by caliber, name, or bullet type..."
            value={search}
            onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
            aria-label="Search ammunition loads"
            class="w-full border border-surface-border bg-surface-raised py-3 pl-10 pr-4 font-mono text-base text-text-primary placeholder:text-text-muted focus:border-accent/50"
          />
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3">
          {/* Category filters */}
          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
            <button
              onClick={() => setCategoryFilter(null)}
              aria-pressed={!categoryFilter}
              class={`px-3 py-1.5 font-mono text-sm tracking-wider uppercase transition-colors ${
                !categoryFilter
                  ? 'border border-accent/30 bg-accent/15 text-accent'
                  : 'border border-surface-border text-text-muted hover:text-text-secondary'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                aria-pressed={categoryFilter === cat}
                class={`px-3 py-1.5 font-mono text-sm tracking-wider uppercase transition-colors ${
                  categoryFilter === cat
                    ? 'border border-accent/30 bg-accent/15 text-accent'
                    : 'border border-surface-border text-text-muted hover:text-text-secondary'
                }`}
              >
                {titleCase(cat)}
              </button>
            ))}
          </div>

          {/* Bullet type filter */}
          <div class="flex items-center gap-2">
            <label for="bullet-type-select" class="font-mono text-sm tracking-wider uppercase text-text-muted">Type</label>
            <select
              id="bullet-type-select"
              value={bulletTypeFilter ?? ''}
              onChange={(e) => {
                const val = (e.target as HTMLSelectElement).value;
                setBulletTypeFilter(val || null);
              }}
              class="border border-surface-border bg-surface-raised px-2 py-1 font-mono text-sm text-text-secondary focus:border-accent/50"
            >
              <option value="">All Types</option>
              {bulletTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div class="mb-4 font-mono text-sm text-text-muted">
        {filtered.length} load{filtered.length !== 1 ? 's' : ''} found
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div class="py-12 text-center" role="status">
          <div class="font-mono text-base text-text-muted">No loads match your search.</div>
        </div>
      ) : (
        <div class="overflow-x-auto border border-surface-border" tabindex={0} role="region" aria-label="Ammunition loads table">
          <table class="w-full text-left font-mono">
            <thead>
              <tr class="border-b border-surface-border bg-surface-overlay text-text-muted">
                <th scope="col" class="px-3 py-2.5 font-medium tracking-wider uppercase text-sm cursor-pointer hover:text-accent select-none" onClick={() => handleSort('caliber')}>
                  Caliber{sortIndicator('caliber')}
                </th>
                <th scope="col" class="px-3 py-2.5 font-medium tracking-wider uppercase text-sm cursor-pointer hover:text-accent select-none" onClick={() => handleSort('load')}>
                  Load{sortIndicator('load')}
                </th>
                <th scope="col" class="px-3 py-2.5 font-medium tracking-wider uppercase text-sm text-right cursor-pointer hover:text-accent select-none whitespace-nowrap" onClick={() => handleSort('weight')}>
                  Weight{sortIndicator('weight')}
                </th>
                <th scope="col" class="px-3 py-2.5 font-medium tracking-wider uppercase text-sm text-center select-none whitespace-nowrap">
                  Type
                </th>
                <th scope="col" class="px-3 py-2.5 font-medium tracking-wider uppercase text-sm text-right cursor-pointer hover:text-accent select-none whitespace-nowrap" onClick={() => handleSort('velocity')}>
                  Velocity{sortIndicator('velocity')}
                </th>
                <th scope="col" class="px-3 py-2.5 font-medium tracking-wider uppercase text-sm text-right cursor-pointer hover:text-accent select-none whitespace-nowrap" onClick={() => handleSort('energy')}>
                  Energy{sortIndicator('energy')}
                </th>
                <th scope="col" class="px-3 py-2.5 font-medium tracking-wider uppercase text-sm text-right cursor-pointer hover:text-accent select-none whitespace-nowrap" onClick={() => handleSort('penetration')}>
                  Gel{sortIndicator('penetration')}
                </th>
                <th scope="col" class="px-3 py-2.5 font-medium tracking-wider uppercase text-sm text-right select-none whitespace-nowrap">
                  Exp.
                </th>
                <th scope="col" class="px-3 py-2.5 font-medium tracking-wider uppercase text-sm text-center select-none whitespace-nowrap">
                  Barrel
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l, i) => (
                <tr key={`${l.caliberSlug}-${i}`} class={`border-b border-surface-border-subtle ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised'} hover:bg-accent/5 transition-colors`}>
                  <td class="px-3 py-2 text-sm">
                    <a href={`${basePath}/calibers/${l.caliberSlug}`} class="text-accent hover:underline whitespace-nowrap">
                      {l.caliberName}
                    </a>
                  </td>
                  <td class="px-3 py-2 text-sm text-text-secondary max-w-[240px] truncate" title={l.loadName}>
                    {l.loadName}
                  </td>
                  <td class="px-3 py-2 text-sm text-right text-text-primary whitespace-nowrap">
                    {l.bulletWeight}<span class="text-text-muted text-xs ml-0.5">gr</span>
                  </td>
                  <td class="px-3 py-2 text-sm text-center">
                    <span class="inline-block border border-surface-border px-1.5 py-0.5 text-xs tracking-wider uppercase text-text-muted">
                      {l.bulletType}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-sm text-right text-text-primary whitespace-nowrap">
                    {l.muzzleVelocity.toLocaleString()}<span class="text-text-muted text-xs ml-0.5">fps</span>
                  </td>
                  <td class="px-3 py-2 text-sm text-right text-text-primary whitespace-nowrap">
                    {l.muzzleEnergy.toLocaleString()}<span class="text-text-muted text-xs ml-0.5">ft·lbs</span>
                  </td>
                  <td class="px-3 py-2 text-sm text-right text-text-primary whitespace-nowrap">
                    {l.gelPenetration ? `${l.gelPenetration}"` : <span class="text-text-muted">—</span>}
                  </td>
                  <td class="px-3 py-2 text-sm text-right text-text-primary whitespace-nowrap">
                    {l.expansionDiameter ? `${l.expansionDiameter}"` : <span class="text-text-muted">—</span>}
                  </td>
                  <td class="px-3 py-2 text-sm text-center text-text-muted whitespace-nowrap">
                    {l.barrelLength}"
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
