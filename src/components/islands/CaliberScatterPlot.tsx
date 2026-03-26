import { useState, useRef, useEffect } from 'preact/hooks';

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

interface CaliberPoint {
  name: string;
  slug: string;
  category: string;
  typical_energy_ft_lbs: [number, number];
  typical_velocity_fps: [number, number];
  effective_range_yd: number;
  recoil_ft_lbs: number;
  cost_per_round: number;
  year_introduced: number;
}

interface Props {
  calibers: CaliberPoint[];
  basePath: string;
}

type AxisKey = 'energy' | 'velocity' | 'range' | 'recoil' | 'cost' | 'year';

const AXES: { key: AxisKey; label: string; unit: string; getValue: (c: CaliberPoint) => number }[] = [
  { key: 'energy', label: 'Energy', unit: 'ft·lbs', getValue: c => (c.typical_energy_ft_lbs[0] + c.typical_energy_ft_lbs[1]) / 2 },
  { key: 'velocity', label: 'Velocity', unit: 'fps', getValue: c => (c.typical_velocity_fps[0] + c.typical_velocity_fps[1]) / 2 },
  { key: 'range', label: 'Eff. Range', unit: 'yd', getValue: c => c.effective_range_yd },
  { key: 'recoil', label: 'Recoil', unit: 'ft·lbs', getValue: c => c.recoil_ft_lbs },
  { key: 'cost', label: 'Cost/Round', unit: '$', getValue: c => c.cost_per_round },
  { key: 'year', label: 'Year Intro', unit: '', getValue: c => c.year_introduced },
];

const CATEGORY_COLORS: Record<string, string> = {
  handgun: '#3b82f6',
  rifle: '#22c55e',
  shotgun: '#f59e0b',
  pdw: '#8b5cf6',
  magnum_handgun: '#ec4899',
  magnum_rifle: '#ef4444',
};

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function CaliberScatterPlot({ calibers, basePath }: Props) {
  const [xAxis, setXAxis] = useState<AxisKey>('energy');
  const [yAxis, setYAxis] = useState<AxisKey>('recoil');
  const [themeKey, setThemeKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const observer = new MutationObserver(() => setThemeKey(k => k + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    let destroyed = false;

    (async () => {
      const { Chart, ScatterController, PointElement, LinearScale, Tooltip } = await import('chart.js');
      Chart.register(ScatterController, PointElement, LinearScale, Tooltip);

      if (destroyed) return;
      if (chartRef.current) chartRef.current.destroy();

      const xCfg = AXES.find(a => a.key === xAxis)!;
      const yCfg = AXES.find(a => a.key === yAxis)!;
      const textMuted = getCSSVar('--color-text-muted') || '#666';
      const border = getCSSVar('--color-surface-border') || '#333';

      // Group by category
      const groups = new Map<string, CaliberPoint[]>();
      for (const c of calibers) {
        if (!groups.has(c.category)) groups.set(c.category, []);
        groups.get(c.category)!.push(c);
      }

      const datasets = Array.from(groups.entries()).map(([cat, items]) => ({
        label: titleCase(cat),
        data: items.map(c => ({
          x: xCfg.getValue(c),
          y: yCfg.getValue(c),
          name: c.name,
          slug: c.slug,
        })),
        backgroundColor: (CATEGORY_COLORS[cat] || '#888') + 'CC',
        borderColor: CATEGORY_COLORS[cat] || '#888',
        borderWidth: 1,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointStyle: 'circle' as const,
      }));

      chartRef.current = new Chart(canvasRef.current!, {
        type: 'scatter',
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: (_event: any, elements: any[]) => {
            if (elements.length > 0) {
              const el = elements[0];
              const point = datasets[el.datasetIndex].data[el.index] as any;
              if (point.slug) {
                window.location.href = `${basePath}/calibers/${point.slug}`;
              }
            }
          },
          scales: {
            x: {
              title: { display: true, text: `${xCfg.label} (${xCfg.unit})`, color: textMuted, font: { family: 'IBM Plex Mono, monospace', size: 11 } },
              ticks: { color: textMuted, font: { family: 'IBM Plex Mono, monospace', size: 10 } },
              grid: { color: border + '40' },
            },
            y: {
              title: { display: true, text: `${yCfg.label} (${yCfg.unit})`, color: textMuted, font: { family: 'IBM Plex Mono, monospace', size: 11 } },
              ticks: { color: textMuted, font: { family: 'IBM Plex Mono, monospace', size: 10 } },
              grid: { color: border + '40' },
            },
          },
          plugins: {
            tooltip: {
              titleFont: { family: 'IBM Plex Mono, monospace' },
              bodyFont: { family: 'IBM Plex Mono, monospace' },
              callbacks: {
                label: (ctx: any) => {
                  const point = ctx.raw as any;
                  return `${point.name}: ${xCfg.label}=${ctx.parsed.x.toLocaleString()}${xCfg.unit ? ' ' + xCfg.unit : ''}, ${yCfg.label}=${ctx.parsed.y.toLocaleString()}${yCfg.unit ? ' ' + yCfg.unit : ''}`;
                },
              },
            },
            legend: {
              labels: {
                color: textMuted,
                font: { family: 'IBM Plex Mono, monospace', size: 11 },
                usePointStyle: true,
                pointStyle: 'circle',
              },
            },
          },
        },
      });
    })();

    return () => { destroyed = true; if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [xAxis, yAxis, calibers, themeKey]);

  return (
    <div class="border border-surface-border rounded-lg mb-6">
      <div class="border-b border-surface-border bg-surface-overlay px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <h3 class="text-base font-medium text-text-muted">Performance Map</h3>
        <div class="flex flex-wrap items-center gap-3">
          <label class="flex items-center gap-2">
            <span class="text-xs font-medium uppercase tracking-wide text-text-muted">X:</span>
            <select
              value={xAxis}
              onChange={e => setXAxis((e.target as HTMLSelectElement).value as AxisKey)}
              class="border border-surface-border bg-surface-raised px-2 py-1 font-mono text-sm text-text-primary rounded-md focus:border-accent focus:outline-none"
            >
              {AXES.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
          </label>
          <label class="flex items-center gap-2">
            <span class="text-xs font-medium uppercase tracking-wide text-text-muted">Y:</span>
            <select
              value={yAxis}
              onChange={e => setYAxis((e.target as HTMLSelectElement).value as AxisKey)}
              class="border border-surface-border bg-surface-raised px-2 py-1 font-mono text-sm text-text-primary rounded-md focus:border-accent focus:outline-none"
            >
              {AXES.map(a => <option key={a.key} value={a.key}>{a.label}</option>)}
            </select>
          </label>
        </div>
      </div>
      <div class="p-4" style={{ height: '400px' }}>
        <canvas ref={canvasRef} />
      </div>
      <div class="px-4 py-2 bg-surface-overlay border-t border-surface-border-subtle">
        <p class="text-xs text-text-muted">
          Click any point to view caliber details. Color-coded by category.
        </p>
      </div>
    </div>
  );
}
