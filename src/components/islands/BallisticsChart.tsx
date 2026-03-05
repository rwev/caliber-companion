import { useState, useRef, useEffect } from 'preact/hooks';
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
  ballistics: BallisticsPoint[];
}

interface Props {
  loads: Load[];
}

type MetricKey = 'velocity' | 'energy' | 'drop';

const METRICS: { key: MetricKey; label: string; unit: string; field: keyof BallisticsPoint }[] = [
  { key: 'velocity', label: 'Velocity', unit: 'fps', field: 'velocity_fps' },
  { key: 'energy', label: 'Energy', unit: 'ft·lbs', field: 'energy_ft_lbs' },
  { key: 'drop', label: 'Bullet Drop', unit: 'in', field: 'drop_in' },
];

const COLOR_VARS = ['--color-accent', '--color-info', '--color-danger', '--color-success'];

export default function BallisticsChart({ loads }: Props) {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('velocity');
  const [themeKey, setThemeKey] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeKey(k => k + 1);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const metric = METRICS.find(m => m.key === activeMetric)!;

  useEffect(() => {
    if (!canvasRef.current) return;

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

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const distances = loads[0].ballistics.map(p => `${p.distance_yd}`);

    const datasets = loads.map((load, i) => {
      const color = chartColors[i % chartColors.length];
      return {
        label: `${load.bullet_weight_gr}gr ${load.bullet_type}`,
        data: load.ballistics.map(p => p[metric.field] as number),
        borderColor: color.line,
        backgroundColor: color.bg,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: color.line,
        pointBorderColor: 'transparent',
        tension: 0.3,
        fill: true,
      };
    });

    chartRef.current = new Chart(canvasRef.current, {
      type: 'line',
      data: { labels: distances, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: textSecondary,
              font: { family: '"JetBrains Mono", monospace', size: 12 },
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
            titleFont: { family: '"JetBrains Mono", monospace', size: 12 },
            bodyFont: { family: '"JetBrains Mono", monospace', size: 12 },
            padding: 10,
            callbacks: {
              title: (items) => `${items[0].label} yd`,
              label: (item) => ` ${item.dataset.label}: ${item.formattedValue} ${metric.unit}`,
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: 'Distance (yd)',
              color: textMuted,
              font: { family: '"JetBrains Mono", monospace', size: 12 },
            },
            ticks: {
              color: textMuted,
              font: { family: '"JetBrains Mono", monospace', size: 12 },
            },
            grid: { color: gridColor },
            border: { color: surfaceBorder },
          },
          y: {
            title: {
              display: true,
              text: `${metric.label} (${metric.unit})`,
              color: textMuted,
              font: { family: '"JetBrains Mono", monospace', size: 12 },
            },
            ticks: {
              color: textMuted,
              font: { family: '"JetBrains Mono", monospace', size: 12 },
            },
            grid: { color: gridColor },
            border: { color: surfaceBorder },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
    };
  }, [activeMetric, loads, themeKey]);

  return (
    <div class="border border-surface-border">
      <div class="flex items-center justify-between border-b border-surface-border bg-surface-overlay px-4 py-2">
        <h3 class="font-display text-sm tracking-[0.2em] uppercase text-text-muted">
          Ballistics Chart
        </h3>
        <div class="flex gap-1">
          {METRICS.map(m => (
            <button
              key={m.key}
              onClick={() => setActiveMetric(m.key)}
              class={`px-2.5 py-1 font-mono text-sm tracking-wider uppercase transition-colors ${
                activeMetric === m.key
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'text-text-muted border border-transparent hover:text-text-secondary'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div class="p-4" style={{ height: '320px' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
