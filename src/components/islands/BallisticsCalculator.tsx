import { useState, useMemo, useRef, useEffect } from 'preact/hooks';

function getCSSVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

interface TrajectoryPoint {
  range_yd: number;
  velocity_fps: number;
  energy_ft_lbs: number;
  drop_in: number;
  drop_moa: number;
  wind_drift_in: number;
  wind_drift_moa: number;
  time_of_flight_s: number;
}

// Standard atmosphere at sea level
const STD_TEMP_F = 59;
const STD_PRESSURE_INHG = 29.92;
const STD_AIR_DENSITY = 0.0765; // lb/ft³

function airDensityRatio(tempF: number, pressureInHg: number, altitudeFt: number): number {
  // Adjust pressure for altitude (barometric formula approximation)
  const pressureAtAlt = pressureInHg * Math.pow(1 - 6.8756e-6 * altitudeFt, 5.2559);
  const tempR = tempF + 459.67;
  const stdTempR = STD_TEMP_F + 459.67;
  // Air density ratio = (P/P0) * (T0/T)
  return (pressureAtAlt / STD_PRESSURE_INHG) * (stdTempR / tempR);
}

function computeTrajectory(
  muzzleVelocity: number,
  bc_g1: number,
  bulletWeightGr: number,
  zeroRange: number,
  maxRange: number,
  stepYd: number,
  windMph: number,
  tempF: number,
  pressureInHg: number,
  altitudeFt: number,
  sightHeightIn: number,
): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];
  const dt = 0.0001; // Time step in seconds
  const densityRatio = airDensityRatio(tempF, pressureInHg, altitudeFt);
  const adjustedBC = bc_g1 / densityRatio;

  // G1 drag function approximation (Ingalls tables simplified)
  function dragCoeff(v: number): number {
    const mach = v / 1116.4; // Speed of sound at std conditions
    if (mach < 0.8) return 0.235;
    if (mach < 0.95) return 0.235 + (mach - 0.8) * 2.0;
    if (mach < 1.05) return 0.535 + (mach - 0.95) * 3.5;
    if (mach < 1.2) return 0.885 - (mach - 1.05) * 1.5;
    if (mach < 1.5) return 0.66 - (mach - 1.2) * 0.4;
    if (mach < 2.0) return 0.54 - (mach - 1.5) * 0.16;
    return 0.46 - (mach - 2.0) * 0.04;
  }

  function retardation(v: number): number {
    const cd = dragCoeff(v);
    // Deceleration = cd * v² / (bc * factor)
    // Using standard ballistic formula: a = cd * v² / (bc * 41617.4)
    return (cd * v * v) / (adjustedBC * 41617.4);
  }

  const windVelocityFps = windMph * 1.4667; // mph to fps (cross-wind)

  // State variables
  let vx = muzzleVelocity; // fps
  let vy = 0; // fps (vertical)
  let x = 0; // feet downrange
  let y = -sightHeightIn / 12; // feet (start below sight line)
  let windDrift = 0; // feet
  let time = 0;

  // First pass: find the bore angle needed for the zero range
  // Use iterative approach
  let boreAngle = 0;
  for (let iter = 0; iter < 10; iter++) {
    vx = muzzleVelocity * Math.cos(boreAngle);
    vy = muzzleVelocity * Math.sin(boreAngle);
    x = 0;
    y = -sightHeightIn / 12;
    time = 0;

    while (x < zeroRange * 3) {
      const v = Math.sqrt(vx * vx + vy * vy);
      const drag = retardation(v);
      const ax = -drag * (vx / v);
      const ay = -drag * (vy / v) - 32.174; // Gravity

      vx += ax * dt;
      vy += ay * dt;
      x += vx * dt;
      y += vy * dt;
      time += dt;

      if (x >= zeroRange * 3) break;
    }

    // Adjust bore angle to zero at specified range
    const dropAtZero = y;
    boreAngle += dropAtZero / (zeroRange * 3);
  }

  // Second pass: compute full trajectory with correct bore angle
  vx = muzzleVelocity * Math.cos(boreAngle);
  vy = muzzleVelocity * Math.sin(boreAngle);
  x = 0;
  y = -sightHeightIn / 12;
  windDrift = 0;
  time = 0;

  let nextRange = 0;

  while (nextRange <= maxRange) {
    const v = Math.sqrt(vx * vx + vy * vy);
    const drag = retardation(v);
    const ax = -drag * (vx / v);
    const ay = -drag * (vy / v) - 32.174;

    // Wind drift: lag time method approximation
    const windDrag = retardation(Math.abs(windVelocityFps));

    vx += ax * dt;
    vy += ay * dt;
    x += vx * dt;
    y += vy * dt;
    time += dt;

    // Wind drift using lag method: drift = wind * (time - x/muzzleVelocity)
    windDrift = windVelocityFps * (time - x / muzzleVelocity);

    const rangeYd = x / 3;

    if (rangeYd >= nextRange) {
      const dropIn = y * 12; // feet to inches
      const windIn = windDrift * 12;
      const rangeFt = nextRange * 3;
      const dropMoa = rangeFt > 0 ? (dropIn / (rangeFt / 100)) * 1.0472 : 0;
      const windMoa = rangeFt > 0 ? (windIn / (rangeFt / 100)) * 1.0472 : 0;
      const bulletWeightLbs = bulletWeightGr / 7000;
      const energy = (bulletWeightLbs * v * v) / (2 * 32.174);

      points.push({
        range_yd: nextRange,
        velocity_fps: Math.round(v),
        energy_ft_lbs: Math.round(energy),
        drop_in: Math.round(dropIn * 10) / 10,
        drop_moa: Math.round(dropMoa * 10) / 10,
        wind_drift_in: Math.round(windIn * 10) / 10,
        wind_drift_moa: Math.round(windMoa * 10) / 10,
        time_of_flight_s: Math.round(time * 1000) / 1000,
      });
      nextRange += stepYd;
    }

    if (rangeYd > maxRange + 50) break;
  }

  return points;
}

type ChartMetric = 'drop' | 'velocity' | 'energy' | 'wind';

export default function BallisticsCalculator() {
  const [muzzleVelocity, setMuzzleVelocity] = useState(2700);
  const [bcG1, setBcG1] = useState(0.450);
  const [bulletWeight, setBulletWeight] = useState(140);
  const [zeroRange, setZeroRange] = useState(100);
  const [maxRange, setMaxRange] = useState(1000);
  const [windMph, setWindMph] = useState(10);
  const [tempF, setTempF] = useState(59);
  const [altitudeFt, setAltitudeFt] = useState(0);
  const [sightHeight, setSightHeight] = useState(1.5);
  const [chartMetric, setChartMetric] = useState<ChartMetric>('drop');
  const [themeKey, setThemeKey] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const observer = new MutationObserver(() => setThemeKey(k => k + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const stepYd = maxRange <= 500 ? 25 : maxRange <= 1000 ? 50 : 100;

  const trajectory = useMemo(() =>
    computeTrajectory(muzzleVelocity, bcG1, bulletWeight, zeroRange, maxRange, stepYd, windMph, tempF, STD_PRESSURE_INHG, altitudeFt, sightHeight),
    [muzzleVelocity, bcG1, bulletWeight, zeroRange, maxRange, stepYd, windMph, tempF, altitudeFt, sightHeight]
  );

  // Chart rendering
  useEffect(() => {
    if (!canvasRef.current || trajectory.length === 0) return;

    let destroyed = false;

    (async () => {
      const { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler } = await import('chart.js');
      Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

      if (destroyed) return;
      if (chartRef.current) chartRef.current.destroy();

      const labels = trajectory.map(p => `${p.range_yd}`);
      const metricConfigs: Record<ChartMetric, { data: number[]; label: string; unit: string }> = {
        drop: { data: trajectory.map(p => p.drop_in), label: 'Bullet Drop', unit: 'in' },
        velocity: { data: trajectory.map(p => p.velocity_fps), label: 'Velocity', unit: 'fps' },
        energy: { data: trajectory.map(p => p.energy_ft_lbs), label: 'Energy', unit: 'ft·lbs' },
        wind: { data: trajectory.map(p => p.wind_drift_in), label: 'Wind Drift', unit: 'in' },
      };

      const cfg = metricConfigs[chartMetric];
      const accent = getCSSVar('--color-accent') || '#0d7c66';
      const textMuted = getCSSVar('--color-text-muted') || '#666';
      const border = getCSSVar('--color-surface-border') || '#333';

      chartRef.current = new Chart(canvasRef.current!, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: cfg.label,
            data: cfg.data,
            borderColor: accent,
            backgroundColor: accent + '20',
            borderWidth: 2,
            pointRadius: 2,
            pointHoverRadius: 5,
            fill: true,
            tension: 0.3,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: { display: true, text: 'Range (yd)', color: textMuted, font: { family: 'IBM Plex Mono, monospace', size: 11 } },
              ticks: { color: textMuted, font: { family: 'IBM Plex Mono, monospace', size: 10 } },
              grid: { color: border + '40' },
            },
            y: {
              title: { display: true, text: `${cfg.label} (${cfg.unit})`, color: textMuted, font: { family: 'IBM Plex Mono, monospace', size: 11 } },
              ticks: { color: textMuted, font: { family: 'IBM Plex Mono, monospace', size: 10 } },
              grid: { color: border + '40' },
            },
          },
          plugins: {
            tooltip: {
              titleFont: { family: 'IBM Plex Mono, monospace' },
              bodyFont: { family: 'IBM Plex Mono, monospace' },
              callbacks: {
                title: (items: any[]) => `${items[0].label} yd`,
                label: (item: any) => `${cfg.label}: ${item.raw.toLocaleString()} ${cfg.unit}`,
              },
            },
          },
        },
      });
    })();

    return () => { destroyed = true; if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [trajectory, chartMetric, themeKey]);

  return (
    <div class="space-y-6">
      {/* Input form */}
      <div class="rounded-lg border border-surface-border">
        <div class="border-b border-surface-border bg-surface-overlay px-4 py-2.5">
          <h3 class="text-base font-medium text-text-muted">Parameters</h3>
        </div>
        <div class="p-4 grid gap-4 sm:grid-cols-3">
          <label class="block">
            <span class="text-xs font-medium uppercase tracking-wide text-text-muted">Muzzle Velocity (fps)</span>
            <input type="number" value={muzzleVelocity} onInput={e => setMuzzleVelocity(+(e.target as HTMLInputElement).value)}
              class="mt-1 w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-base text-text-primary focus:border-accent focus:outline-none" />
          </label>
          <label class="block">
            <span class="text-xs font-medium uppercase tracking-wide text-text-muted">BC (G1)</span>
            <input type="number" step="0.001" value={bcG1} onInput={e => setBcG1(+(e.target as HTMLInputElement).value)}
              class="mt-1 w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-base text-text-primary focus:border-accent focus:outline-none" />
          </label>
          <label class="block">
            <span class="text-xs font-medium uppercase tracking-wide text-text-muted">Bullet Weight (gr)</span>
            <input type="number" value={bulletWeight} onInput={e => setBulletWeight(+(e.target as HTMLInputElement).value)}
              class="mt-1 w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-base text-text-primary focus:border-accent focus:outline-none" />
          </label>
          <label class="block">
            <span class="text-xs font-medium uppercase tracking-wide text-text-muted">Zero Range (yd)</span>
            <input type="number" value={zeroRange} onInput={e => setZeroRange(+(e.target as HTMLInputElement).value)}
              class="mt-1 w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-base text-text-primary focus:border-accent focus:outline-none" />
          </label>
          <label class="block">
            <span class="text-xs font-medium uppercase tracking-wide text-text-muted">Max Range (yd)</span>
            <input type="number" value={maxRange} onInput={e => setMaxRange(+(e.target as HTMLInputElement).value)}
              class="mt-1 w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-base text-text-primary focus:border-accent focus:outline-none" />
          </label>
          <label class="block">
            <span class="text-xs font-medium uppercase tracking-wide text-text-muted">Crosswind (mph)</span>
            <input type="number" value={windMph} onInput={e => setWindMph(+(e.target as HTMLInputElement).value)}
              class="mt-1 w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-base text-text-primary focus:border-accent focus:outline-none" />
          </label>
          <label class="block">
            <span class="text-xs font-medium uppercase tracking-wide text-text-muted">Temperature (°F)</span>
            <input type="number" value={tempF} onInput={e => setTempF(+(e.target as HTMLInputElement).value)}
              class="mt-1 w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-base text-text-primary focus:border-accent focus:outline-none" />
          </label>
          <label class="block">
            <span class="text-xs font-medium uppercase tracking-wide text-text-muted">Altitude (ft)</span>
            <input type="number" value={altitudeFt} onInput={e => setAltitudeFt(+(e.target as HTMLInputElement).value)}
              class="mt-1 w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-base text-text-primary focus:border-accent focus:outline-none" />
          </label>
          <label class="block">
            <span class="text-xs font-medium uppercase tracking-wide text-text-muted">Sight Height (in)</span>
            <input type="number" step="0.1" value={sightHeight} onInput={e => setSightHeight(+(e.target as HTMLInputElement).value)}
              class="mt-1 w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-base text-text-primary focus:border-accent focus:outline-none" />
          </label>
        </div>
      </div>

      {/* Chart */}
      <div class="rounded-lg border border-surface-border">
        <div class="border-b border-surface-border bg-surface-overlay px-4 py-2.5 flex items-center justify-between">
          <h3 class="text-base font-medium text-text-muted">Trajectory Chart</h3>
          <div class="flex gap-1">
            {(['drop', 'velocity', 'energy', 'wind'] as ChartMetric[]).map(m => (
              <button
                key={m}
                onClick={() => setChartMetric(m)}
                class={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  chartMetric === m ? 'text-accent bg-accent/10' : 'text-text-muted hover:text-accent'
                }`}
              >
                {m === 'wind' ? 'Wind' : m === 'drop' ? 'Drop' : m === 'velocity' ? 'Vel' : 'Energy'}
              </button>
            ))}
          </div>
        </div>
        <div class="p-4" style={{ height: '300px' }}>
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Results table */}
      <div class="rounded-lg border border-surface-border">
        <div class="border-b border-surface-border bg-surface-overlay px-4 py-2.5">
          <h3 class="text-base font-medium text-text-muted">Trajectory Table</h3>
        </div>
        <div class="overflow-x-auto" tabindex={0} role="region" aria-label="Trajectory data">
          <table class="w-full text-left font-mono">
            <thead>
              <tr class="border-b border-surface-border-subtle bg-surface-overlay text-text-muted">
                <th class="px-3 py-2 text-xs font-medium uppercase tracking-wide">Range</th>
                <th class="px-3 py-2 text-xs font-medium uppercase tracking-wide text-right">Vel</th>
                <th class="px-3 py-2 text-xs font-medium uppercase tracking-wide text-right">Energy</th>
                <th class="px-3 py-2 text-xs font-medium uppercase tracking-wide text-right">Drop</th>
                <th class="px-3 py-2 text-xs font-medium uppercase tracking-wide text-right">Drop</th>
                <th class="px-3 py-2 text-xs font-medium uppercase tracking-wide text-right">Wind</th>
                <th class="px-3 py-2 text-xs font-medium uppercase tracking-wide text-right">Wind</th>
                <th class="px-3 py-2 text-xs font-medium uppercase tracking-wide text-right">ToF</th>
              </tr>
              <tr class="border-b border-surface-border bg-surface-overlay text-text-muted">
                <th class="px-3 py-1 text-xs">(yd)</th>
                <th class="px-3 py-1 text-xs text-right">(fps)</th>
                <th class="px-3 py-1 text-xs text-right">(ft·lbs)</th>
                <th class="px-3 py-1 text-xs text-right">(in)</th>
                <th class="px-3 py-1 text-xs text-right">(MOA)</th>
                <th class="px-3 py-1 text-xs text-right">(in)</th>
                <th class="px-3 py-1 text-xs text-right">(MOA)</th>
                <th class="px-3 py-1 text-xs text-right">(s)</th>
              </tr>
            </thead>
            <tbody>
              {trajectory.map((p, i) => (
                <tr key={p.range_yd} class={`border-b border-surface-border-subtle ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised'}`}>
                  <td class="px-3 py-1.5 text-sm text-text-secondary">{p.range_yd}</td>
                  <td class="px-3 py-1.5 text-sm text-right text-text-primary">{p.velocity_fps.toLocaleString()}</td>
                  <td class="px-3 py-1.5 text-sm text-right text-text-primary">{p.energy_ft_lbs.toLocaleString()}</td>
                  <td class={`px-3 py-1.5 text-sm text-right ${p.drop_in < 0 ? 'text-danger' : 'text-text-primary'}`}>
                    {p.drop_in > 0 ? '+' : ''}{p.drop_in.toFixed(1)}
                  </td>
                  <td class="px-3 py-1.5 text-sm text-right text-text-muted">{p.drop_moa.toFixed(1)}</td>
                  <td class={`px-3 py-1.5 text-sm text-right ${Math.abs(p.wind_drift_in) > 0.5 ? 'text-info' : 'text-text-primary'}`}>
                    {p.wind_drift_in.toFixed(1)}
                  </td>
                  <td class="px-3 py-1.5 text-sm text-right text-text-muted">{p.wind_drift_moa.toFixed(1)}</td>
                  <td class="px-3 py-1.5 text-sm text-right text-text-muted">{p.time_of_flight_s.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
