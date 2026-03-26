import { useRef, useEffect, useState } from 'preact/hooks';

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

interface Props {
  energy: number;       // avg of typical_energy_ft_lbs range
  range: number;        // effective_range_yd
  recoil: number;       // free_recoil_ft_lbs (inverted: lower = better)
  cost: number;         // avg of cost_per_round_usd range (inverted: lower = better)
  availability: number; // availability_rating 1-5
}

// Normalization bounds derived from the full dataset range
const BOUNDS = {
  energy:       { min: 80,   max: 15000 },  // .22 LR ~130 to .50 BMG ~13000
  range:        { min: 15,   max: 2500 },    // derringers to .50 BMG / .338 Lapua
  recoil:       { min: 0.5,  max: 80 },      // .22 LR ~0.5 to big magnums ~70+
  cost:         { min: 0.04, max: 5.0 },     // .22 LR ~$0.05 to exotic rounds ~$4+
  availability: { min: 1,    max: 5 },       // direct 1-5 scale
};

function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

const LABELS = ['Energy', 'Range', 'Low Recoil', 'Affordability', 'Availability'];

export default function CaliberRadarChart({ energy, range, recoil, cost, availability }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);
  const [themeKey, setThemeKey] = useState(0);

  useEffect(() => {
    const observer = new MutationObserver(() => setThemeKey(k => k + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  // Compute normalized scores (0-100)
  const scores = [
    normalize(energy, BOUNDS.energy.min, BOUNDS.energy.max) * 100,
    normalize(range, BOUNDS.range.min, BOUNDS.range.max) * 100,
    (1 - normalize(recoil, BOUNDS.recoil.min, BOUNDS.recoil.max)) * 100,   // invert: low recoil = high score
    (1 - normalize(cost, BOUNDS.cost.min, BOUNDS.cost.max)) * 100,          // invert: low cost = high score
    normalize(availability, BOUNDS.availability.min, BOUNDS.availability.max) * 100,
  ];

  useEffect(() => {
    if (!canvasRef.current) return;

    let destroyed = false;

    (async () => {
      const {
        Chart,
        RadarController,
        RadialLinearScale,
        LineElement,
        PointElement,
        Filler,
        Tooltip,
      } = await import('chart.js');

      if (destroyed || !canvasRef.current) return;

      Chart.register(RadarController, RadialLinearScale, LineElement, PointElement, Filler, Tooltip);

      const accent = getCSSVar('--color-accent');
      const textMuted = getCSSVar('--color-text-muted');
      const surfaceBorder = getCSSVar('--color-surface-border');
      const gridColor = surfaceBorder + '99';

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      chartRef.current = new Chart(canvasRef.current, {
        type: 'radar',
        data: {
          labels: LABELS,
          datasets: [{
            data: scores,
            borderColor: accent,
            backgroundColor: accent + '20',
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: accent,
            pointBorderColor: 'transparent',
            fill: true,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: getCSSVar('--color-surface-overlay'),
              borderColor: surfaceBorder,
              borderWidth: 1,
              titleColor: getCSSVar('--color-text-primary'),
              bodyColor: getCSSVar('--color-text-secondary'),
              titleFont: { family: '"JetBrains Mono", monospace', size: 12 },
              bodyFont: { family: '"JetBrains Mono", monospace', size: 12 },
              padding: 8,
              callbacks: {
                label: (ctx) => ` ${Math.round(ctx.raw as number)}/100`,
              },
            },
          },
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: {
                stepSize: 25,
                color: textMuted,
                backdropColor: 'transparent',
                font: { family: '"JetBrains Mono", monospace', size: 10 },
              },
              pointLabels: {
                color: textMuted,
                font: { family: '"Barlow Condensed", sans-serif', size: 13, weight: '500' },
                padding: 8,
              },
              grid: { color: gridColor },
              angleLines: { color: gridColor },
            },
          },
        },
      });
    })();

    return () => {
      destroyed = true;
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [themeKey, ...scores]);

  return (
    <div class="border border-surface-border">
      <div class="border-b border-surface-border bg-surface-overlay px-4 py-2.5">
        <h3 class="font-display text-base tracking-[0.2em] uppercase text-text-muted">
          Profile
        </h3>
      </div>
      <div class="p-3" style={{ maxWidth: '320px', margin: '0 auto' }}>
        <canvas ref={canvasRef} aria-label="Caliber profile radar chart" role="img" />
      </div>
    </div>
  );
}
