import { useState, useMemo } from 'preact/hooks';

interface RecoilResult {
  freeRecoilEnergy: number;    // ft·lbs
  recoilVelocity: number;      // fps
  recoilImpulse: number;       // lb·s
  rating: string;
}

// Powder charge gas ejection velocity constant (~4700 fps average)
const GAS_VELOCITY_FPS = 4700;

function computeRecoil(
  bulletWeightGr: number,
  powderChargeGr: number,
  muzzleVelocityFps: number,
  gunWeightLbs: number,
): RecoilResult {
  // Convert grains to pounds
  const bulletWeightLbs = bulletWeightGr / 7000;
  const powderChargeLbs = powderChargeGr / 7000;
  const gunWeightSlug = gunWeightLbs / 32.174; // slugs

  // Momentum: bullet momentum + powder gas momentum
  const bulletMomentum = bulletWeightLbs * muzzleVelocityFps; // lb·fps
  const gasMomentum = powderChargeLbs * GAS_VELOCITY_FPS;     // lb·fps
  const totalMomentum = bulletMomentum + gasMomentum;

  // Recoil velocity (fps)
  const recoilVelocity = totalMomentum / gunWeightLbs;

  // Free recoil energy (ft·lbs)
  // KE = 0.5 * m * v² where m is in slugs, v in fps
  const freeRecoilEnergy = (gunWeightLbs * recoilVelocity * recoilVelocity) / (2 * 32.174);

  // Recoil impulse (lb·s)
  const recoilImpulse = totalMomentum / 32.174;

  // Subjective rating
  let rating: string;
  if (freeRecoilEnergy < 4) rating = 'Very Light';
  else if (freeRecoilEnergy < 8) rating = 'Light';
  else if (freeRecoilEnergy < 13) rating = 'Moderate';
  else if (freeRecoilEnergy < 20) rating = 'Stout';
  else if (freeRecoilEnergy < 30) rating = 'Heavy';
  else if (freeRecoilEnergy < 50) rating = 'Very Heavy';
  else rating = 'Punishing';

  return { freeRecoilEnergy, recoilVelocity, recoilImpulse, rating };
}

// Preset loads for quick selection
const PRESETS = [
  { label: '9mm Luger — 115gr FMJ, Glock 19', bullet: 115, powder: 6.0, velocity: 1180, gun: 1.56, desc: '9×19mm Parabellum' },
  { label: '.45 ACP — 230gr FMJ, 1911', bullet: 230, powder: 7.0, velocity: 830, gun: 2.44, desc: '.45 ACP' },
  { label: '.380 ACP — 95gr FMJ, LCP', bullet: 95, powder: 4.0, velocity: 955, gun: 0.94, desc: '.380 Auto' },
  { label: '5.56 NATO — 55gr FMJ, AR-15', bullet: 55, powder: 27.0, velocity: 3240, gun: 7.5, desc: '5.56×45mm NATO' },
  { label: '.308 Win — 168gr BTHP, Rem 700', bullet: 168, powder: 44.0, velocity: 2680, gun: 8.5, desc: '7.62×51mm NATO' },
  { label: '6.5 Creedmoor — 140gr ELD, RPR', bullet: 140, powder: 41.5, velocity: 2710, gun: 10.0, desc: '6.5 Creedmoor' },
  { label: '.30-06 — 150gr SP, M1 Garand', bullet: 150, powder: 50.0, velocity: 2910, gun: 9.5, desc: '.30-06 Springfield' },
  { label: '.300 Win Mag — 180gr SP, Rem 700', bullet: 180, powder: 72.0, velocity: 2960, gun: 8.5, desc: '.300 Winchester Magnum' },
  { label: '12ga — 1oz Slug, Rem 870', bullet: 437, powder: 35.0, velocity: 1560, gun: 7.5, desc: '12 Gauge Slug' },
  { label: '.22 LR — 40gr RN, 10/22', bullet: 40, powder: 1.5, velocity: 1255, gun: 5.0, desc: '.22 Long Rifle' },
  { label: '.44 Magnum — 240gr JSP, S&W 629', bullet: 240, powder: 23.0, velocity: 1350, gun: 2.94, desc: '.44 Rem Magnum' },
  { label: '.338 Lapua — 250gr BTHP, TRG-42', bullet: 250, powder: 91.0, velocity: 2950, gun: 12.3, desc: '.338 Lapua Magnum' },
];

function ratingColor(rating: string): string {
  switch (rating) {
    case 'Very Light': return 'text-success';
    case 'Light': return 'text-success';
    case 'Moderate': return 'text-info';
    case 'Stout': return 'text-accent';
    case 'Heavy': return 'text-danger';
    case 'Very Heavy': return 'text-danger';
    case 'Punishing': return 'text-danger';
    default: return 'text-text-primary';
  }
}

export default function RecoilCalculator() {
  const [bulletWeight, setBulletWeight] = useState(168);
  const [powderCharge, setPowderCharge] = useState(44.0);
  const [muzzleVelocity, setMuzzleVelocity] = useState(2680);
  const [gunWeight, setGunWeight] = useState(8.5);

  const result = useMemo(
    () => computeRecoil(bulletWeight, powderCharge, muzzleVelocity, gunWeight),
    [bulletWeight, powderCharge, muzzleVelocity, gunWeight]
  );

  function applyPreset(idx: number) {
    const p = PRESETS[idx];
    setBulletWeight(p.bullet);
    setPowderCharge(p.powder);
    setMuzzleVelocity(p.velocity);
    setGunWeight(p.gun);
  }

  // Compute all presets for the comparison table
  const presetResults = useMemo(
    () => PRESETS.map(p => ({
      ...p,
      result: computeRecoil(p.bullet, p.powder, p.velocity, p.gun),
    })),
    []
  );

  // Bar chart max for scaling
  const maxEnergy = Math.max(result.freeRecoilEnergy, ...presetResults.map(p => p.result.freeRecoilEnergy));

  return (
    <div class="space-y-8">
      {/* Input Section */}
      <div class="grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <div class="rounded-lg border border-surface-border">
          <div class="border-b border-surface-border bg-surface-overlay px-4 py-2.5">
            <h2 class="text-base font-medium text-text-muted">Input Parameters</h2>
          </div>

          <div class="p-4 space-y-4">
            {/* Preset selector */}
            <div>
              <label for="preset-select" class="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Quick Preset</label>
              <select
                id="preset-select"
                onChange={(e) => {
                  const val = (e.target as HTMLSelectElement).value;
                  if (val !== '') applyPreset(parseInt(val));
                }}
                class="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-secondary focus:border-accent/50"
              >
                <option value="">Select a preset...</option>
                {PRESETS.map((p, i) => (
                  <option key={i} value={i}>{p.label}</option>
                ))}
              </select>
            </div>

            <div class="h-px bg-surface-border" />

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label for="bullet-weight" class="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Bullet Weight</label>
                <div class="relative">
                  <input
                    id="bullet-weight"
                    type="number"
                    value={bulletWeight}
                    onInput={(e) => setBulletWeight(parseFloat((e.target as HTMLInputElement).value) || 0)}
                    min="10"
                    max="800"
                    step="1"
                    class="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 pr-10 font-mono text-base text-text-primary focus:border-accent/50"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-text-muted">gr</span>
                </div>
              </div>

              <div>
                <label for="powder-charge" class="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Powder Charge</label>
                <div class="relative">
                  <input
                    id="powder-charge"
                    type="number"
                    value={powderCharge}
                    onInput={(e) => setPowderCharge(parseFloat((e.target as HTMLInputElement).value) || 0)}
                    min="0.5"
                    max="150"
                    step="0.5"
                    class="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 pr-10 font-mono text-base text-text-primary focus:border-accent/50"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-text-muted">gr</span>
                </div>
              </div>

              <div>
                <label for="muzzle-velocity" class="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Muzzle Velocity</label>
                <div class="relative">
                  <input
                    id="muzzle-velocity"
                    type="number"
                    value={muzzleVelocity}
                    onInput={(e) => setMuzzleVelocity(parseFloat((e.target as HTMLInputElement).value) || 0)}
                    min="200"
                    max="5000"
                    step="10"
                    class="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 pr-12 font-mono text-base text-text-primary focus:border-accent/50"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-text-muted">fps</span>
                </div>
              </div>

              <div>
                <label for="gun-weight" class="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Firearm Weight</label>
                <div class="relative">
                  <input
                    id="gun-weight"
                    type="number"
                    value={gunWeight}
                    onInput={(e) => setGunWeight(parseFloat((e.target as HTMLInputElement).value) || 0)}
                    min="0.5"
                    max="30"
                    step="0.1"
                    class="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 pr-10 font-mono text-base text-text-primary focus:border-accent/50"
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-sm text-text-muted">lbs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div class="rounded-lg border border-surface-border">
          <div class="border-b border-surface-border bg-surface-overlay px-4 py-2.5">
            <h2 class="text-base font-medium text-text-muted">Recoil Results</h2>
          </div>

          <div class="p-4">
            <div class="grid grid-cols-2 gap-6">
              <div class="text-center p-4 rounded-lg border border-surface-border bg-surface-raised">
                <div class="text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Free Recoil Energy</div>
                <div class="font-mono text-3xl font-bold text-accent">{result.freeRecoilEnergy.toFixed(1)}</div>
                <div class="font-mono text-sm text-text-muted">ft·lbs</div>
              </div>

              <div class="text-center p-4 rounded-lg border border-surface-border bg-surface-raised">
                <div class="text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Recoil Velocity</div>
                <div class="font-mono text-3xl font-bold text-text-primary">{result.recoilVelocity.toFixed(1)}</div>
                <div class="font-mono text-sm text-text-muted">fps</div>
              </div>

              <div class="text-center p-4 rounded-lg border border-surface-border bg-surface-raised">
                <div class="text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Recoil Impulse</div>
                <div class="font-mono text-3xl font-bold text-text-primary">{result.recoilImpulse.toFixed(2)}</div>
                <div class="font-mono text-sm text-text-muted">lb·s</div>
              </div>

              <div class="text-center p-4 rounded-lg border border-surface-border bg-surface-raised">
                <div class="text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Subjective Rating</div>
                <div class={`text-2xl font-bold ${ratingColor(result.rating)}`}>{result.rating}</div>
              </div>
            </div>

            {/* Recoil bar visual */}
            <div class="mt-4 p-3 border border-surface-border bg-surface">
              <div class="text-xs font-medium uppercase tracking-wide text-text-muted mb-2">Recoil Scale</div>
              <div class="relative h-6 bg-surface-raised border border-surface-border-subtle overflow-hidden">
                <div
                  class="h-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, (result.freeRecoilEnergy / 60) * 100)}%`,
                    background: result.freeRecoilEnergy < 8 ? 'var(--color-success)' :
                                result.freeRecoilEnergy < 20 ? 'var(--color-accent)' :
                                'var(--color-danger)',
                  }}
                />
                {/* Scale markers */}
                {[4, 8, 13, 20, 30, 50].map(mark => (
                  <div
                    key={mark}
                    class="absolute top-0 h-full w-px bg-surface-border"
                    style={{ left: `${(mark / 60) * 100}%` }}
                  >
                    <span class="absolute -bottom-4 left-1/2 -translate-x-1/2 font-mono text-[10px] text-text-muted">{mark}</span>
                  </div>
                ))}
              </div>
              <div class="flex justify-between mt-5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
                <span>Light</span>
                <span>Moderate</span>
                <span>Heavy</span>
                <span>Punishing</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reference Comparison Table */}
      <div class="rounded-lg border border-surface-border">
        <div class="border-b border-surface-border bg-surface-overlay px-4 py-2.5">
          <h2 class="text-base font-medium text-text-muted">Reference Comparison</h2>
        </div>

        <div class="overflow-x-auto" tabindex={0} role="region" aria-label="Recoil comparison table">
          <table class="w-full text-left font-mono">
            <thead>
              <tr class="border-b border-surface-border bg-surface-overlay text-text-muted">
                <th scope="col" class="px-4 py-2 text-xs font-medium uppercase tracking-wide">Load</th>
                <th scope="col" class="px-4 py-2 text-xs font-medium uppercase tracking-wide text-right whitespace-nowrap">Gun (lbs)</th>
                <th scope="col" class="px-4 py-2 text-xs font-medium uppercase tracking-wide text-right whitespace-nowrap">Energy (ft·lbs)</th>
                <th scope="col" class="px-4 py-2 text-xs font-medium uppercase tracking-wide text-right whitespace-nowrap">Vel (fps)</th>
                <th scope="col" class="px-4 py-2 text-xs font-medium uppercase tracking-wide">Rating</th>
                <th scope="col" class="px-4 py-2 text-xs font-medium uppercase tracking-wide min-w-[120px]"></th>
              </tr>
            </thead>
            <tbody>
              {/* Current calculation row */}
              <tr class="border-b border-accent/30 bg-accent/5">
                <td class="px-4 py-2 text-sm text-accent font-medium">Your Calculation</td>
                <td class="px-4 py-2 text-sm text-right text-accent">{gunWeight.toFixed(1)}</td>
                <td class="px-4 py-2 text-sm text-right text-accent font-medium">{result.freeRecoilEnergy.toFixed(1)}</td>
                <td class="px-4 py-2 text-sm text-right text-accent">{result.recoilVelocity.toFixed(1)}</td>
                <td class={`px-4 py-2 text-sm font-medium ${ratingColor(result.rating)}`}>{result.rating}</td>
                <td class="px-4 py-2">
                  <div class="h-3 bg-surface-raised border border-surface-border-subtle overflow-hidden">
                    <div
                      class="h-full bg-accent transition-all duration-300"
                      style={{ width: `${Math.min(100, (result.freeRecoilEnergy / maxEnergy) * 100)}%` }}
                    />
                  </div>
                </td>
              </tr>

              {presetResults.map((p, i) => (
                <tr
                  key={i}
                  class={`border-b border-surface-border-subtle cursor-pointer hover:bg-accent/5 transition-colors ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised'}`}
                  onClick={() => applyPreset(i)}
                  title={`Click to load: ${p.label}`}
                >
                  <td class="px-4 py-2 text-sm text-text-secondary">{p.desc}</td>
                  <td class="px-4 py-2 text-sm text-right text-text-muted">{p.gun.toFixed(1)}</td>
                  <td class="px-4 py-2 text-sm text-right text-text-primary">{p.result.freeRecoilEnergy.toFixed(1)}</td>
                  <td class="px-4 py-2 text-sm text-right text-text-muted">{p.result.recoilVelocity.toFixed(1)}</td>
                  <td class={`px-4 py-2 text-sm ${ratingColor(p.result.rating)}`}>{p.result.rating}</td>
                  <td class="px-4 py-2">
                    <div class="h-3 bg-surface-raised border border-surface-border-subtle overflow-hidden">
                      <div
                        class="h-full bg-text-muted/40"
                        style={{ width: `${Math.min(100, (p.result.freeRecoilEnergy / maxEnergy) * 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Formula explanation */}
      <div class="rounded-lg border border-surface-border">
        <div class="border-b border-surface-border bg-surface-overlay px-4 py-2.5">
          <h2 class="text-base font-medium text-text-muted">How It Works</h2>
        </div>
        <div class="p-4 text-sm text-text-secondary space-y-3">
          <p>
            Free recoil is computed using Newton's third law. The total momentum transferred to the firearm equals the bullet momentum plus the powder gas momentum:
          </p>
          <div class="bg-surface-raised border border-surface-border-subtle rounded-md p-3 font-mono text-text-primary">
            <div>Recoil Momentum = (Bullet Weight × Muzzle Velocity) + (Powder Charge × Gas Velocity)</div>
            <div class="mt-1">Recoil Velocity = Recoil Momentum ÷ Firearm Weight</div>
            <div class="mt-1">Free Recoil Energy = ½ × Firearm Weight × Recoil Velocity²</div>
          </div>
          <p class="text-text-muted text-xs">
            Gas ejection velocity is approximated at 4,700 fps. Actual felt recoil is affected by stock design, recoil pad, muzzle brake, gas system, shooter technique, and other factors not captured in the free recoil calculation.
          </p>
        </div>
      </div>
    </div>
  );
}
