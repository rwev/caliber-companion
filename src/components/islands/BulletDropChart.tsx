import { useState, useMemo, useRef, useEffect } from 'preact/hooks';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface BallisticPoint {
  distance_yd: number;
  velocity_fps: number;
  energy_ft_lbs: number;
  drop_in: number;
}

interface LoadEntry {
  name: string;
  bullet_weight_gr: number;
  bullet_type: string;
  muzzle_velocity_fps: number;
  ballistics: BallisticPoint[];
}

interface CaliberEntry {
  name: string;
  slug: string;
  loads: LoadEntry[];
}

interface Props {
  calibers: CaliberEntry[];
}

const COLORS = [
  { border: '#eb6b34', bg: 'rgba(235, 107, 52, 0.1)' },
  { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
  { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' },
  { border: '#f43f5e', bg: 'rgba(244, 63, 94, 0.1)' },
  { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)' },
];

interface SelectedItem {
  calSlug: string;
  loadIdx: number;
}

export default function BulletDropChart({ calibers }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [addSlug, setAddSlug] = useState('');
  const [addLoadIdx, setAddLoadIdx] = useState(0);
  const [metric, setMetric] = useState<'drop' | 'energy' | 'velocity'>('drop');

  const caliberMap = useMemo(() => {
    const m = new Map<string, CaliberEntry>();
    calibers.forEach(c => m.set(c.slug, c));
    return m;
  }, [calibers]);

  const addCaliber = caliberMap.get(addSlug);

  function handleAdd() {
    if (!addSlug || selected.length >= 6) return;
    setSelected(prev => [...prev, { calSlug: addSlug, loadIdx: addLoadIdx }]);
    setAddSlug('');
    setAddLoadIdx(0);
  }

  function handleRemove(idx: number) {
    setSelected(prev => prev.filter((_, i) => i !== idx));
  }

  // Build chart data
  const datasets = useMemo(() => {
    return selected.map((s, i) => {
      const cal = caliberMap.get(s.calSlug);
      if (!cal) return null;
      const load = cal.loads[s.loadIdx];
      if (!load) return null;
      const color = COLORS[i % COLORS.length];

      const data = load.ballistics.map(p => ({
        x: p.distance_yd,
        y: metric === 'drop' ? p.drop_in : metric === 'energy' ? p.energy_ft_lbs : p.velocity_fps,
      }));

      return {
        label: `${cal.name} — ${load.bullet_weight_gr}gr ${load.bullet_type}`,
        data,
        borderColor: color.border,
        backgroundColor: color.bg,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.3,
        fill: metric === 'drop',
      };
    }).filter(Boolean);
  }, [selected, caliberMap, metric]);

  // Render chart
  useEffect(() => {
    if (!canvasRef.current) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    if (datasets.length === 0) return;

    const yLabel = metric === 'drop' ? 'Drop (inches)' : metric === 'energy' ? 'Energy (ft·lbs)' : 'Velocity (fps)';

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: { datasets: datasets as any },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            type: 'linear',
            title: { display: true, text: 'Distance (yards)', color: '#999', font: { family: 'JetBrains Mono, monospace', size: 11 } },
            ticks: { color: '#999', font: { family: 'JetBrains Mono, monospace', size: 10 } },
            grid: { color: 'rgba(255,255,255,0.06)' },
          },
          y: {
            title: { display: true, text: yLabel, color: '#999', font: { family: 'JetBrains Mono, monospace', size: 11 } },
            ticks: { color: '#999', font: { family: 'JetBrains Mono, monospace', size: 10 } },
            grid: { color: 'rgba(255,255,255,0.06)' },
            reverse: metric === 'drop',
          },
        },
        plugins: {
          legend: {
            labels: {
              color: '#999',
              font: { family: 'JetBrains Mono, monospace', size: 11 },
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          tooltip: {
            backgroundColor: 'rgba(26,26,26,0.95)',
            titleFont: { family: 'JetBrains Mono, monospace', size: 11 },
            bodyFont: { family: 'JetBrains Mono, monospace', size: 11 },
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            callbacks: {
              label: (ctx: any) => {
                const val = ctx.parsed.y;
                if (metric === 'drop') return `${ctx.dataset.label}: ${val > 0 ? '+' : ''}${val.toFixed(1)}"`;
                if (metric === 'energy') return `${ctx.dataset.label}: ${val.toLocaleString()} ft·lbs`;
                return `${ctx.dataset.label}: ${val.toLocaleString()} fps`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [datasets, metric]);

  const available = calibers.filter(c => !selected.some(s => s.calSlug === c.slug));

  return (
    <div class="space-y-4">
      {/* Controls */}
      <div class="flex flex-wrap gap-2 items-end">
        <div class="flex-1 min-w-[200px]">
          <label class="block font-mono text-xs tracking-wider uppercase text-text-muted mb-1">Caliber</label>
          <select
            value={addSlug}
            onChange={e => { setAddSlug((e.target as HTMLSelectElement).value); setAddLoadIdx(0); }}
            class="w-full border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary"
          >
            <option value="">Select caliber...</option>
            {available.map(c => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        {addCaliber && (
          <div class="flex-1 min-w-[200px]">
            <label class="block font-mono text-xs tracking-wider uppercase text-text-muted mb-1">Load</label>
            <select
              value={addLoadIdx}
              onChange={e => setAddLoadIdx(+(e.target as HTMLSelectElement).value)}
              class="w-full border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary"
            >
              {addCaliber.loads.map((l, i) => (
                <option key={i} value={i}>{l.bullet_weight_gr}gr {l.bullet_type} ({l.muzzle_velocity_fps} fps)</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={!addSlug || selected.length >= 6}
          class="border border-accent bg-accent/10 px-4 py-2 font-mono text-sm tracking-wider uppercase text-accent transition-colors hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {/* Metric toggle */}
      <div class="flex items-center gap-2">
        <span class="font-mono text-xs tracking-wider uppercase text-text-muted">Show:</span>
        {(['drop', 'energy', 'velocity'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMetric(m)}
            class={`border px-2.5 py-1 font-mono text-xs tracking-wider uppercase transition-colors ${
              metric === m
                ? 'border-accent/40 bg-accent/15 text-accent'
                : 'border-surface-border text-text-muted hover:text-text-secondary'
            }`}
          >
            {m === 'drop' ? 'Bullet Drop' : m === 'energy' ? 'Energy' : 'Velocity'}
          </button>
        ))}
      </div>

      {/* Selected legend */}
      {selected.length > 0 && (
        <div class="flex flex-wrap gap-2">
          {selected.map((s, i) => {
            const cal = caliberMap.get(s.calSlug);
            const load = cal?.loads[s.loadIdx];
            if (!cal || !load) return null;
            return (
              <div key={i} class="flex items-center gap-2 border border-surface-border bg-surface-raised px-3 py-1.5">
                <span class="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length].border }} />
                <span class="font-mono text-sm text-text-primary">{cal.name}</span>
                <span class="font-mono text-xs text-text-muted">{load.bullet_weight_gr}gr</span>
                <button onClick={() => handleRemove(i)} class="ml-1 text-text-muted hover:text-danger transition-colors" aria-label="Remove">
                  <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Chart */}
      <div class="border border-surface-border bg-surface p-4">
        {selected.length > 0 ? (
          <div style={{ height: '400px' }}>
            <canvas ref={canvasRef} />
          </div>
        ) : (
          <div class="flex items-center justify-center h-64 text-center">
            <p class="font-mono text-sm text-text-muted">
              Select 2 or more calibers to compare their ballistic trajectories.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
