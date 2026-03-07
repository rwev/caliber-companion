import { useState, useEffect, useRef, useMemo } from 'preact/hooks';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

interface BallisticsPoint {
  distance_yd: number;
  velocity_fps: number;
  energy_ft_lbs: number;
  drop_in: number;
}

interface Load {
  name: string;
  bullet_weight_gr: number;
  bullet_type: string;
  muzzle_velocity_fps: number;
  muzzle_energy_ft_lbs: number;
  barrel_length_in: number;
  ballistics: BallisticsPoint[];
}

interface CaliberEntry {
  name: string;
  designation: string;
  slug: string;
  category: string;
  dimensions: {
    bullet_diameter_in: number;
    case_length_in: number;
    overall_length_in: number;
    case_type: string;
  };
  typical_velocity_fps: [number, number];
  typical_energy_ft_lbs: [number, number];
  typical_bullet_weight_gr: [number, number];
  effective_range_yd: number;
  recoil: {
    free_recoil_ft_lbs: number;
    subjective: string;
  };
  year_introduced: number;
  country_of_origin: string;
  popularity_tier: string;
  cost_per_round_usd: [number, number];
  loads: Load[];
}

interface Props {
  calibers: CaliberEntry[];
  basePath: string;
}

type MetricKey = 'velocity' | 'energy' | 'drop';

const COLOR_VARS = ['--color-accent', '--color-info', '--color-danger', '--color-success'];

const METRICS: { key: MetricKey; label: string; unit: string; field: keyof BallisticsPoint }[] = [
  { key: 'velocity', label: 'Velocity', unit: 'fps', field: 'velocity_fps' },
  { key: 'energy', label: 'Energy', unit: 'ft·lbs', field: 'energy_ft_lbs' },
  { key: 'drop', label: 'Bullet Drop', unit: 'in', field: 'drop_in' },
];

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function ComparisonTool({ calibers, basePath }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [chartMetric, setChartMetric] = useState<MetricKey>('velocity');
  const [themeKey, setThemeKey] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Read initial selection from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get('c');
    if (c) {
      const slugs = c.split(',').filter(s => calibers.some(cal => cal.slug === s));
      setSelected(slugs.slice(0, 4));
    }
  }, []);

  // Sync selection to URL
  useEffect(() => {
    const url = new URL(window.location.href);
    if (selected.length > 0) {
      url.searchParams.set('c', selected.join(','));
    } else {
      url.searchParams.delete('c');
    }
    window.history.replaceState(null, '', url.toString());
  }, [selected]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeKey(k => k + 1);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const uiColors = useMemo(() => {
    // themeKey dependency ensures colors update on theme change
    void themeKey;
    if (typeof document === 'undefined') return COLOR_VARS.map(() => '#eb6b34');
    return COLOR_VARS.map(v => getCSSVar(v));
  }, [themeKey]);

  const selectedCalibers = useMemo(
    () => selected.map(slug => calibers.find(c => c.slug === slug)!).filter(Boolean),
    [selected, calibers]
  );

  const availableCalibers = useMemo(() => {
    const q = dropdownSearch.toLowerCase();
    return calibers
      .filter(c => !selected.includes(c.slug))
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.designation.toLowerCase().includes(q));
  }, [calibers, selected, dropdownSearch]);

  function addCaliber(slug: string) {
    if (selected.length < 4 && !selected.includes(slug)) {
      setSelected([...selected, slug]);
    }
    setDropdownOpen(false);
    setDropdownSearch('');
  }

  function removeCaliber(slug: string) {
    setSelected(selected.filter(s => s !== slug));
  }

  // Chart
  useEffect(() => {
    if (!canvasRef.current || selectedCalibers.length === 0) {
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      return;
    }

    if (chartRef.current) chartRef.current.destroy();

    const textSecondary = getCSSVar('--color-text-secondary');
    const textMuted = getCSSVar('--color-text-muted');
    const textPrimary = getCSSVar('--color-text-primary');
    const surfaceOverlay = getCSSVar('--color-surface-overlay');
    const surfaceBorder = getCSSVar('--color-surface-border');
    const gridColor = surfaceBorder + '99';
    const chartColors = COLOR_VARS.map(v => {
      const hex = getCSSVar(v);
      return { line: hex, bg: hex + '1a' };
    });

    const metric = METRICS.find(m => m.key === chartMetric)!;

    // Use first load of each caliber for comparison
    const allDistances = new Set<number>();
    selectedCalibers.forEach(c => {
      if (c.loads[0]) c.loads[0].ballistics.forEach(p => allDistances.add(p.distance_yd));
    });
    const distances = [...allDistances].sort((a, b) => a - b);

    const datasets = selectedCalibers.map((cal, i) => {
      const load = cal.loads[0];
      const color = chartColors[i % chartColors.length];
      const dataMap = new Map(load?.ballistics.map(p => [p.distance_yd, p[metric.field] as number]) || []);
      return {
        label: `${cal.name} (${load?.bullet_weight_gr}gr ${load?.bullet_type})`,
        data: distances.map(d => dataMap.get(d) ?? null),
        borderColor: color.line,
        backgroundColor: color.bg,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color.line,
        pointBorderColor: 'transparent',
        tension: 0.3,
        fill: true,
        spanGaps: true,
      };
    });

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: { labels: distances.map(d => `${d}`), datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textSecondary,
              font: { family: '"JetBrains Mono", monospace', size: 13 },
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 8,
            },
          },
          tooltip: {
            backgroundColor: surfaceOverlay,
            borderColor: surfaceBorder,
            borderWidth: 1,
            titleColor: textPrimary,
            bodyColor: textSecondary,
            titleFont: { family: '"JetBrains Mono", monospace', size: 13 },
            bodyFont: { family: '"JetBrains Mono", monospace', size: 13 },
            padding: 12,
            callbacks: {
              title: (items) => `${items[0].label} yd`,
              label: (item) => ` ${item.dataset.label}: ${item.formattedValue} ${metric.unit}`,
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: 'Distance (yd)', color: textMuted, font: { family: '"JetBrains Mono", monospace', size: 13 } },
            ticks: { color: textMuted, font: { family: '"JetBrains Mono", monospace', size: 12 } },
            grid: { color: gridColor },
            border: { color: surfaceBorder },
          },
          y: {
            title: { display: true, text: `${metric.label} (${metric.unit})`, color: textMuted, font: { family: '"JetBrains Mono", monospace', size: 13 } },
            ticks: { color: textMuted, font: { family: '"JetBrains Mono", monospace', size: 12 } },
            grid: { color: gridColor },
            border: { color: surfaceBorder },
          },
        },
      },
    });

    return () => { chartRef.current?.destroy(); };
  }, [selectedCalibers, chartMetric, themeKey]);

  const metricLabel = METRICS.find(m => m.key === chartMetric)!.label.toLowerCase();

  const comparisonRows = [
    { label: 'Category', values: selectedCalibers.map(c => titleCase(c.category)) },
    { label: 'Bullet Diameter', values: selectedCalibers.map(c => `${c.dimensions.bullet_diameter_in}"`) },
    { label: 'Case Length', values: selectedCalibers.map(c => `${c.dimensions.case_length_in}"`) },
    { label: 'Overall Length', values: selectedCalibers.map(c => `${c.dimensions.overall_length_in}"`) },
    { label: 'Velocity Range', values: selectedCalibers.map(c => `${c.typical_velocity_fps[0]}–${c.typical_velocity_fps[1]} fps`) },
    { label: 'Energy Range', values: selectedCalibers.map(c => `${c.typical_energy_ft_lbs[0]}–${c.typical_energy_ft_lbs[1]} ft·lbs`) },
    { label: 'Bullet Weight', values: selectedCalibers.map(c => `${c.typical_bullet_weight_gr[0]}–${c.typical_bullet_weight_gr[1]} gr`) },
    { label: 'Effective Range', values: selectedCalibers.map(c => `${c.effective_range_yd} yd`) },
    { label: 'Recoil', values: selectedCalibers.map(c => `${c.recoil.free_recoil_ft_lbs} ft·lbs (${titleCase(c.recoil.subjective)})`) },
    { label: 'Year Introduced', values: selectedCalibers.map(c => `${c.year_introduced}`) },
    { label: 'Origin', values: selectedCalibers.map(c => c.country_of_origin) },
    { label: 'Popularity', values: selectedCalibers.map(c => titleCase(c.popularity_tier)) },
    { label: 'Cost/Round', values: selectedCalibers.map(c => `$${c.cost_per_round_usd[0].toFixed(2)}–$${c.cost_per_round_usd[1].toFixed(2)}`) },
  ];

  return (
    <div>
      {/* Caliber Selector */}
      <div class="mb-8">
        <div class="flex flex-wrap items-center gap-2">
          {/* Selected chips */}
          {selectedCalibers.map((cal, i) => (
            <div
              key={cal.slug}
              class="flex items-center gap-2 border px-3 py-1.5"
              style={{ borderColor: uiColors[i % uiColors.length] + '60', backgroundColor: uiColors[i % uiColors.length] + '15' }}
            >
              <div class="h-2 w-2 rounded-full" style={{ backgroundColor: uiColors[i % uiColors.length] }} aria-hidden="true" />
              <a href={`${basePath}/calibers/${cal.slug}`} class="font-mono text-base text-text-primary hover:underline">
                {cal.name}
              </a>
              <button
                onClick={() => removeCaliber(cal.slug)}
                class="ml-1 text-text-muted hover:text-danger transition-colors"
                aria-label={`Remove ${cal.name}`}
              >
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {/* Add button / dropdown */}
          {selected.length < 4 && (
            <div class="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-controls="comparison-add-dropdown"
                class="flex items-center gap-1.5 border border-dashed border-surface-border px-3 py-1.5 font-mono text-sm text-text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M12 4v16m8-8H4" />
                </svg>
                Add caliber
              </button>

              {dropdownOpen && (
                <div id="comparison-add-dropdown" class="absolute left-0 top-full z-20 mt-1 w-72 border border-surface-border bg-surface-raised shadow-xl">
                  <div class="border-b border-surface-border p-2">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={dropdownSearch}
                      onInput={(e) => setDropdownSearch((e.target as HTMLInputElement).value)}
                      aria-label="Search calibers to add"
                      class="w-full bg-surface px-2 py-1.5 font-mono text-base text-text-primary placeholder:text-text-muted focus:border-accent/50"
                      autoFocus
                    />
                  </div>
                  <div class="max-h-56 overflow-y-auto" role="listbox" aria-label="Available calibers">
                    {availableCalibers.map(c => (
                      <button
                        key={c.slug}
                        role="option"
                        aria-selected={false}
                        onClick={() => addCaliber(c.slug)}
                        class="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-surface-overlay"
                      >
                        <span class="font-mono text-base text-text-primary">{c.name}</span>
                        <span class="font-mono text-sm text-text-muted">{c.category}</span>
                      </button>
                    ))}
                    {availableCalibers.length === 0 && (
                      <div role="status" class="px-3 py-2 font-mono text-base text-text-muted">No results</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {selected.length === 0 && (
          <p class="mt-4 font-mono text-base text-text-muted" role="status">
            Select up to 4 calibers to compare side-by-side.
          </p>
        )}
      </div>

      {/* Comparison Content */}
      {selectedCalibers.length > 0 && (
        <div class="space-y-8">
          {/* Comparison Table */}
          <div class="border border-surface-border overflow-x-auto" tabindex={0} role="region" aria-label="Comparison table">
            <table class="w-full text-left font-mono">
              <thead>
                <tr class="border-b border-surface-border bg-surface-overlay">
                  <th scope="col" class="px-4 py-2.5 text-sm font-medium tracking-wider uppercase text-text-muted w-40">Spec</th>
                  {selectedCalibers.map((cal, i) => (
                    <th scope="col" key={cal.slug} class="px-4 py-2.5 font-medium text-base" style={{ color: uiColors[i % uiColors.length] }}>
                      {cal.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, ri) => (
                  <tr key={row.label} class={`border-b border-surface-border-subtle ${ri % 2 === 0 ? 'bg-surface' : 'bg-surface-raised'}`}>
                    <th scope="row" class="px-4 py-2.5 text-sm font-medium text-text-secondary whitespace-nowrap">{row.label}</th>
                    {row.values.map((val, vi) => (
                      <td key={vi} class="px-4 py-2.5 text-base text-text-primary">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ballistics Chart */}
          <div class="border border-surface-border">
            <div class="flex items-center justify-between border-b border-surface-border bg-surface-overlay px-4 py-2.5">
              <h3 class="font-display text-base tracking-[0.2em] uppercase text-text-muted">
                Ballistics Comparison
              </h3>
              <div class="flex gap-1" role="group" aria-label="Chart metric">
                {METRICS.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setChartMetric(m.key)}
                    aria-pressed={chartMetric === m.key}
                    class={`px-2.5 py-1 font-mono text-sm tracking-wider uppercase transition-colors ${
                      chartMetric === m.key
                        ? 'bg-accent/15 text-accent border border-accent/30'
                        : 'text-text-muted border border-transparent hover:text-text-secondary'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
            <div class="p-4" style={{ height: '360px' }}>
              <canvas ref={canvasRef} aria-label={`Ballistics comparison chart showing ${metricLabel} by distance`} role="img" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
