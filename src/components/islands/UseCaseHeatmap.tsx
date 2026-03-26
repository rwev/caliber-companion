import { useState, useMemo } from 'preact/hooks';

interface CaliberEntry {
  name: string;
  slug: string;
  category: string;
  useCases: string[];
}

interface Props {
  calibers: CaliberEntry[];
  basePath: string;
}

const USE_CASE_GROUPS: { key: string; label: string; matches: string[] }[] = [
  {
    key: 'self-defense',
    label: 'Self Defense',
    matches: ['self-defense', 'home defense', 'concealed carry', 'personal defense', 'woods defense', 'bear defense', 'deep concealment', 'backup gun', 'close-range stopping power'],
  },
  {
    key: 'target',
    label: 'Target / Plinking',
    matches: ['target shooting', 'plinking', 'sport shooting', 'recreational shooting', 'youth shooting', 'training'],
  },
  {
    key: 'competition',
    label: 'Competition',
    matches: ['competition', 'long-range competition', 'precision rifle competition', 'benchrest', 'silhouette', 'cowboy action', 'metallic silhouette', 'ELR competition', 'clay target'],
  },
  {
    key: 'deer',
    label: 'Deer',
    matches: ['deer hunting', 'hunting', 'mule deer', 'whitetail', 'antelope', 'pronghorn', 'medium game', 'hunting (medium'],
  },
  {
    key: 'big-game',
    label: 'Elk / Big Game',
    matches: ['elk', 'moose', 'large game', 'big game', 'mountain hunting', 'western big game'],
  },
  {
    key: 'dangerous',
    label: 'Dangerous Game',
    matches: ['dangerous game', 'African', 'safari', 'elephant', 'cape buffalo', 'hippopotamus', 'brown bear'],
  },
  {
    key: 'varmint',
    label: 'Varmint / Predator',
    matches: ['varmint', 'predator', 'pest control', 'prairie dog', 'hog hunting', 'small game'],
  },
  {
    key: 'long-range',
    label: 'Long Range',
    matches: ['long-range precision', 'long-range target', 'long-range hunting', 'extreme long-range', 'designated marksman', 'military sniping', 'extended range', 'extended-range'],
  },
  {
    key: 'military',
    label: 'Military / LE',
    matches: ['military', 'law enforcement', 'combat', 'PDW', 'patrol rifle', 'armor penetration', 'anti-materiel', 'breaching'],
  },
  {
    key: 'birds',
    label: 'Birds / Shotgun',
    matches: ['waterfowl', 'upland', 'turkey', 'goose', 'clay target', 'bird'],
  },
];

function scoreCaliberForUseCase(useCases: string[], matches: string[]): number {
  let score = 0;
  for (const uc of useCases) {
    const lower = uc.toLowerCase();
    for (const m of matches) {
      if (lower.includes(m.toLowerCase())) {
        score++;
        break;
      }
    }
  }
  return Math.min(score, 3); // Cap at 3
}

const CELL_COLORS = [
  'bg-surface',           // 0 = not suited
  'bg-accent/20',         // 1 = some relevance
  'bg-accent/45',         // 2 = well suited
  'bg-accent/70',         // 3 = primary purpose
];

const CELL_TEXT = [
  'text-text-muted/30',
  'text-text-secondary',
  'text-text-primary',
  'text-text-primary font-medium',
];

type SortField = 'name' | 'category' | string;

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function UseCaseHeatmap({ calibers, basePath }: Props) {
  const [filterCat, setFilterCat] = useState('all');
  const [sortField, setSortField] = useState<SortField>('name');

  const categories = useMemo(() => {
    const cats = new Map<string, number>();
    calibers.forEach(c => cats.set(c.category, (cats.get(c.category) || 0) + 1));
    return [...cats.entries()].sort((a, b) => b[1] - a[1]);
  }, [calibers]);

  const scored = useMemo(() => {
    return calibers.map(c => {
      const scores: Record<string, number> = {};
      USE_CASE_GROUPS.forEach(g => {
        scores[g.key] = scoreCaliberForUseCase(c.useCases, g.matches);
      });
      return { ...c, scores };
    });
  }, [calibers]);

  const filtered = useMemo(() => {
    let result = filterCat === 'all' ? scored : scored.filter(c => c.category === filterCat);
    if (sortField === 'name') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortField === 'category') {
      result = [...result].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
    } else {
      // Sort by use case score (descending) then name
      result = [...result].sort((a, b) => (b.scores[sortField] || 0) - (a.scores[sortField] || 0) || a.name.localeCompare(b.name));
    }
    return result;
  }, [scored, filterCat, sortField]);

  return (
    <div class="space-y-4">
      {/* Filters */}
      <div class="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilterCat('all')}
          class={`border px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
            filterCat === 'all' ? 'border-accent/40 bg-accent/15 text-accent' : 'border-surface-border text-text-muted hover:text-text-secondary'
          }`}
        >
          All ({calibers.length})
        </button>
        {categories.map(([cat, count]) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            class={`border px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              filterCat === cat ? 'border-accent/40 bg-accent/15 text-accent' : 'border-surface-border text-text-muted hover:text-text-secondary'
            }`}
          >
            {titleCase(cat)} ({count})
          </button>
        ))}
      </div>

      {/* Legend */}
      <div class="flex items-center gap-3 text-xs text-text-muted">
        <span>Suitability:</span>
        <span class="flex items-center gap-1"><span class="inline-block h-3 w-3 bg-surface border border-surface-border" /> None</span>
        <span class="flex items-center gap-1"><span class="inline-block h-3 w-3 bg-accent/20" /> Some</span>
        <span class="flex items-center gap-1"><span class="inline-block h-3 w-3 bg-accent/45" /> Good</span>
        <span class="flex items-center gap-1"><span class="inline-block h-3 w-3 bg-accent/70" /> Primary</span>
      </div>

      {/* Heatmap table */}
      <div class="overflow-x-auto border border-surface-border rounded-lg" tabindex={0} role="region" aria-label="Caliber use case heatmap">
        <table class="w-full text-left font-mono">
          <thead>
            <tr class="border-b border-surface-border bg-surface-overlay">
              <th
                scope="col"
                class="px-3 py-2 text-xs font-medium uppercase tracking-wide text-text-muted sticky left-0 bg-surface-overlay z-10 cursor-pointer hover:text-accent"
                onClick={() => setSortField('name')}
              >
                Caliber {sortField === 'name' ? '▼' : ''}
              </th>
              {USE_CASE_GROUPS.map(g => (
                <th
                  key={g.key}
                  scope="col"
                  class="px-2 py-2 text-xs font-medium uppercase tracking-wide text-text-muted text-center cursor-pointer hover:text-accent whitespace-nowrap"
                  onClick={() => setSortField(g.key)}
                  title={`Sort by ${g.label} suitability`}
                >
                  <span class="hidden sm:inline">{g.label}</span>
                  <span class="sm:hidden">{g.label.split(/[/ ]/)[0]}</span>
                  {sortField === g.key ? ' ▼' : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.slug} class={`border-b border-surface-border-subtle ${i % 2 === 0 ? '' : 'bg-surface-raised/50'}`}>
                <td class="px-3 py-1.5 sticky left-0 bg-surface z-10 border-r border-surface-border-subtle">
                  <a
                    href={`${basePath}/calibers/${c.slug}`}
                    class="text-sm text-text-primary hover:text-accent transition-colors truncate block max-w-[140px]"
                    title={c.name}
                  >
                    {c.name}
                  </a>
                </td>
                {USE_CASE_GROUPS.map(g => {
                  const score = c.scores[g.key] || 0;
                  return (
                    <td key={g.key} class={`px-2 py-1.5 text-center text-sm ${CELL_COLORS[score]} ${CELL_TEXT[score]}`}>
                      {score > 0 ? '●'.repeat(score) : '·'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p class="text-xs text-text-muted">
        {filtered.length} calibers shown · Click column headers to sort · Suitability derived from manufacturer use case data
      </p>
    </div>
  );
}
