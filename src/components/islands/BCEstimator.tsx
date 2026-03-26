import { useState, useMemo } from 'preact/hooks';

// Form factors (i) for common bullet shapes relative to G1 standard
// i = 1.0 for G1 reference, lower i = more efficient shape
const FORM_FACTORS: { label: string; g1: number; g7: number; desc: string }[] = [
  { label: 'Flat Nose / Wadcutter', g1: 1.40, g7: 2.80, desc: 'Revolver wadcutters, flat-nose pistol bullets' },
  { label: 'Round Nose', g1: 1.20, g7: 2.40, desc: 'Traditional round-nose rifle and pistol bullets' },
  { label: 'Flat Base Spitzer', g1: 1.00, g7: 2.00, desc: 'Standard pointed rifle bullets with flat base' },
  { label: 'Boat Tail Spitzer', g1: 0.90, g7: 1.00, desc: 'Most modern hunting and match rifle bullets' },
  { label: 'VLD / Secant Ogive', g1: 0.82, g7: 0.90, desc: 'Very Low Drag: Berger VLD, Hornady ELD-M' },
  { label: 'Ultra-Low Drag', g1: 0.75, g7: 0.82, desc: 'Cutting-edge designs: Hornady A-Tip, Berger Hybrid Target' },
];

// Common bullet diameters
const COMMON_DIAMETERS = [
  { label: '.224" (5.56mm)', value: 0.224 },
  { label: '.243" (6mm)', value: 0.243 },
  { label: '.264" (6.5mm)', value: 0.264 },
  { label: '.277" (6.8mm)', value: 0.277 },
  { label: '.284" (7mm)', value: 0.284 },
  { label: '.308" (7.62mm)', value: 0.308 },
  { label: '.338" (8.6mm)', value: 0.338 },
  { label: '.355" (9mm)', value: 0.355 },
  { label: '.400" (10mm)', value: 0.400 },
  { label: '.429" (.44 cal)', value: 0.429 },
  { label: '.451" (.45 cal)', value: 0.451 },
  { label: '.510" (.50 cal)', value: 0.510 },
];

export default function BCEstimator() {
  const [bulletWeight, setBulletWeight] = useState(168);
  const [bulletDiameter, setBulletDiameter] = useState(0.308);
  const [formFactorIdx, setFormFactorIdx] = useState(3); // Boat Tail Spitzer default
  const [customDia, setCustomDia] = useState(false);

  const ff = FORM_FACTORS[formFactorIdx];

  const results = useMemo(() => {
    // Sectional density = weight (lb) / diameter^2
    const weightLbs = bulletWeight / 7000;
    const sd = weightLbs / (bulletDiameter * bulletDiameter);

    // BC = SD / form_factor
    const bcG1 = sd / ff.g1;
    const bcG7 = sd / ff.g7;

    return {
      sd: sd.toFixed(3),
      bcG1: bcG1.toFixed(3),
      bcG7: bcG7.toFixed(3),
    };
  }, [bulletWeight, bulletDiameter, ff]);

  return (
    <div class="space-y-6">
      {/* Inputs */}
      <div class="grid gap-4 sm:grid-cols-3">
        <div>
          <label class="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">
            Bullet Weight (grains)
          </label>
          <input
            type="number"
            min={10}
            max={800}
            value={bulletWeight}
            onInput={e => setBulletWeight(Math.max(1, +(e.target as HTMLInputElement).value || 1))}
            class="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary"
          />
        </div>

        <div>
          <label class="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">
            Bullet Diameter
          </label>
          {customDia ? (
            <div class="flex gap-2">
              <input
                type="number"
                min={0.1}
                max={1.0}
                step={0.001}
                value={bulletDiameter}
                onInput={e => setBulletDiameter(Math.max(0.1, +(e.target as HTMLInputElement).value || 0.1))}
                class="flex-1 rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary"
              />
              <button
                onClick={() => setCustomDia(false)}
                class="rounded-md border border-surface-border px-2 py-2 text-xs font-medium text-text-muted hover:text-accent transition-colors"
                title="Switch to preset"
              >
                Preset
              </button>
            </div>
          ) : (
            <div class="flex gap-2">
              <select
                value={bulletDiameter}
                onChange={e => setBulletDiameter(+(e.target as HTMLSelectElement).value)}
                class="flex-1 rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary"
              >
                {COMMON_DIAMETERS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              <button
                onClick={() => setCustomDia(true)}
                class="rounded-md border border-surface-border px-2 py-2 text-xs font-medium text-text-muted hover:text-accent transition-colors"
                title="Enter custom diameter"
              >
                Custom
              </button>
            </div>
          )}
        </div>

        <div>
          <label class="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">
            Bullet Shape
          </label>
          <select
            value={formFactorIdx}
            onChange={e => setFormFactorIdx(+(e.target as HTMLSelectElement).value)}
            class="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary"
          >
            {FORM_FACTORS.map((f, i) => (
              <option key={i} value={i}>{f.label}</option>
            ))}
          </select>
          <p class="mt-1 text-xs text-text-muted">{ff.desc}</p>
        </div>
      </div>

      {/* Results */}
      <div class="rounded-lg border border-accent/30 bg-accent/5 p-4">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <div class="text-xs font-medium uppercase tracking-wide text-text-muted">Sectional Density</div>
            <div class="mt-1 font-mono text-2xl font-bold text-text-primary">{results.sd}</div>
          </div>
          <div>
            <div class="text-xs font-medium uppercase tracking-wide text-text-muted">Est. BC (G1)</div>
            <div class="mt-1 font-mono text-2xl font-bold text-accent">{results.bcG1}</div>
          </div>
          <div>
            <div class="text-xs font-medium uppercase tracking-wide text-text-muted">Est. BC (G7)</div>
            <div class="mt-1 font-mono text-2xl font-bold text-accent">{results.bcG7}</div>
          </div>
        </div>
      </div>

      {/* Form factor reference */}
      <div class="rounded-lg border border-surface-border">
        <div class="border-b border-surface-border bg-surface-overlay px-4 py-2.5">
          <h3 class="text-base font-medium text-text-muted">Form Factor Reference</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left font-mono">
            <thead>
              <tr class="border-b border-surface-border bg-surface-overlay text-text-muted">
                <th scope="col" class="px-3 py-2 text-xs font-medium uppercase tracking-wide">Shape</th>
                <th scope="col" class="px-3 py-2 text-xs font-medium uppercase tracking-wide text-right">G1 Factor</th>
                <th scope="col" class="px-3 py-2 text-xs font-medium uppercase tracking-wide text-right">G7 Factor</th>
                <th scope="col" class="px-3 py-2 text-xs font-medium uppercase tracking-wide">Examples</th>
              </tr>
            </thead>
            <tbody>
              {FORM_FACTORS.map((f, i) => (
                <tr key={i} class={`border-b border-surface-border-subtle ${i === formFactorIdx ? 'bg-accent/10' : i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised'}`}>
                  <td class="px-3 py-2 text-sm text-text-primary">{f.label}</td>
                  <td class="px-3 py-2 text-sm text-right text-text-secondary">{f.g1.toFixed(2)}</td>
                  <td class="px-3 py-2 text-sm text-right text-text-secondary">{f.g7.toFixed(2)}</td>
                  <td class="px-3 py-2 text-sm text-text-muted">{f.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div class="rounded-lg border border-surface-border-subtle bg-surface-overlay p-3">
        <p class="text-xs text-text-muted leading-relaxed">
          <span class="font-medium uppercase tracking-wide">Note:</span> BC estimates use the form factor method:
          BC = Sectional Density / Form Factor. Results are approximate — actual BC depends on precise ogive shape,
          meplat diameter, boat tail angle, and surface finish. For precise values, consult manufacturer data or
          use Doppler radar measurements.
        </p>
      </div>
    </div>
  );
}
