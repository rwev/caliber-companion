import { useState, useMemo } from 'preact/hooks';

interface CaliberReload {
  name: string;
  slug: string;
  category: string;
  primerType: string | null;
  maxPressure: number | null;
  powderLow: number | null;
  powderHigh: number | null;
  bulletDia: number;
  bulletWeightLow: number;
  bulletWeightHigh: number;
}

interface Props {
  calibers: CaliberReload[];
  basePath: string;
}

type SortKey = 'name' | 'primerType' | 'maxPressure' | 'powderMid' | 'bulletDia';

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function ReloadingReference({ calibers, basePath }: Props) {
  const [search, setSearch] = useState('');
  const [filterPrimer, setFilterPrimer] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const primerTypes = useMemo(() => {
    const types = new Map<string, number>();
    calibers.forEach(c => {
      if (c.primerType) types.set(c.primerType, (types.get(c.primerType) || 0) + 1);
    });
    return [...types.entries()].sort((a, b) => b[1] - a[1]);
  }, [calibers]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  }

  const filtered = useMemo(() => {
    let result = calibers.filter(c => c.primerType || c.maxPressure);

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q));
    }

    if (filterPrimer !== 'all') {
      result = result.filter(c => c.primerType === filterPrimer);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'primerType':
          cmp = (a.primerType || 'zzz').localeCompare(b.primerType || 'zzz');
          break;
        case 'maxPressure':
          cmp = (a.maxPressure || 0) - (b.maxPressure || 0);
          break;
        case 'powderMid':
          const aMid = a.powderLow && a.powderHigh ? (a.powderLow + a.powderHigh) / 2 : 0;
          const bMid = b.powderLow && b.powderHigh ? (b.powderLow + b.powderHigh) / 2 : 0;
          cmp = aMid - bMid;
          break;
        case 'bulletDia':
          cmp = a.bulletDia - b.bulletDia;
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [calibers, search, filterPrimer, sortKey, sortDir]);

  const sortArrow = (key: SortKey) =>
    sortKey === key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : '';

  return (
    <div class="space-y-4">
      {/* Controls */}
      <div class="flex flex-wrap gap-3">
        <div class="flex-1 min-w-[200px]">
          <input
            type="text"
            value={search}
            onInput={e => setSearch((e.target as HTMLInputElement).value)}
            placeholder="Search calibers..."
            class="w-full border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted/50"
          />
        </div>
        <select
          value={filterPrimer}
          onChange={e => setFilterPrimer((e.target as HTMLSelectElement).value)}
          class="border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary"
        >
          <option value="all">All Primers ({calibers.filter(c => c.primerType).length})</option>
          {primerTypes.map(([type, count]) => (
            <option key={type} value={type}>{type} ({count})</option>
          ))}
        </select>
      </div>

      <p class="font-mono text-xs text-text-muted">
        {filtered.length} calibers shown · Click column headers to sort
      </p>

      {/* Table */}
      <div class="border border-surface-border overflow-x-auto" tabindex={0} role="region" aria-label="Reloading reference data">
        <table class="w-full text-left font-mono">
          <thead>
            <tr class="border-b border-surface-border bg-surface-overlay text-text-muted">
              <th
                scope="col"
                class="px-3 py-2 font-medium tracking-wider uppercase text-xs cursor-pointer hover:text-accent sticky left-0 bg-surface-overlay z-10"
                onClick={() => toggleSort('name')}
              >
                Caliber{sortArrow('name')}
              </th>
              <th
                scope="col"
                class="px-3 py-2 font-medium tracking-wider uppercase text-xs cursor-pointer hover:text-accent"
                onClick={() => toggleSort('bulletDia')}
              >
                Bullet Ø{sortArrow('bulletDia')}
              </th>
              <th
                scope="col"
                class="px-3 py-2 font-medium tracking-wider uppercase text-xs cursor-pointer hover:text-accent"
                onClick={() => toggleSort('primerType')}
              >
                Primer{sortArrow('primerType')}
              </th>
              <th
                scope="col"
                class="px-3 py-2 font-medium tracking-wider uppercase text-xs text-right cursor-pointer hover:text-accent"
                onClick={() => toggleSort('maxPressure')}
              >
                SAAMI Max{sortArrow('maxPressure')}
              </th>
              <th
                scope="col"
                class="px-3 py-2 font-medium tracking-wider uppercase text-xs text-right cursor-pointer hover:text-accent"
                onClick={() => toggleSort('powderMid')}
              >
                Powder Charge{sortArrow('powderMid')}
              </th>
              <th scope="col" class="px-3 py-2 font-medium tracking-wider uppercase text-xs text-right">
                Bullet Wt
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.slug} class={`border-b border-surface-border-subtle ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised'}`}>
                <td class="px-3 py-2 sticky left-0 bg-inherit z-10 border-r border-surface-border-subtle">
                  <a
                    href={`${basePath}/calibers/${c.slug}`}
                    class="text-sm text-text-primary hover:text-accent transition-colors"
                  >
                    {c.name}
                  </a>
                </td>
                <td class="px-3 py-2 text-sm text-text-secondary">{c.bulletDia}"</td>
                <td class="px-3 py-2 text-sm text-text-secondary">{c.primerType || '—'}</td>
                <td class="px-3 py-2 text-sm text-right text-text-secondary">
                  {c.maxPressure ? `${c.maxPressure.toLocaleString()} psi` : '—'}
                </td>
                <td class="px-3 py-2 text-sm text-right text-text-secondary">
                  {c.powderLow && c.powderHigh ? `${c.powderLow}–${c.powderHigh} gr` : '—'}
                </td>
                <td class="px-3 py-2 text-sm text-right text-text-muted">
                  {c.bulletWeightLow}–{c.bulletWeightHigh} gr
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Safety disclaimer */}
      <div class="border border-danger/30 bg-danger/5 p-3">
        <p class="font-mono text-xs text-text-secondary leading-relaxed">
          <span class="font-medium text-danger uppercase tracking-wider">Caution:</span> This data is for reference only.
          Always consult a current reloading manual from a reputable source (Hodgdon, Sierra, Nosler, Hornady) before
          developing loads. Start at minimum published charges and work up carefully. Never exceed SAAMI maximum pressure.
        </p>
      </div>
    </div>
  );
}
