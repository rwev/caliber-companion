import { useState, useMemo } from 'preact/hooks';

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
  muzzle_energy_ft_lbs: number;
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

interface GameAnimal {
  name: string;
  minEnergy: number;
  icon: string;
  notes: string;
}

const GAME_ANIMALS: GameAnimal[] = [
  { name: 'Varmint / Prairie Dog', minEnergy: 100, icon: '🐿', notes: 'Groundhog, prairie dog, squirrel — shot placement matters more than energy' },
  { name: 'Coyote / Predator', minEnergy: 300, icon: '🐺', notes: 'Coyote, fox, bobcat — moderate energy with adequate bullet construction' },
  { name: 'Feral Hog (small)', minEnergy: 800, icon: '🐗', notes: 'Under 150 lbs — tough animals, use controlled expansion bullets' },
  { name: 'Whitetail Deer', minEnergy: 1000, icon: '🦌', notes: 'Standard recommendation for ethical harvest on medium deer' },
  { name: 'Mule Deer', minEnergy: 1200, icon: '🫎', notes: 'Larger-bodied deer — requires more energy for reliable penetration' },
  { name: 'Elk', minEnergy: 1500, icon: '🦬', notes: 'Large, heavy-boned game — premium bonded or partition bullets recommended' },
  { name: 'Moose', minEnergy: 1800, icon: '🫎', notes: 'Very large game — deep penetration critical, use heavy-for-caliber bullets' },
  { name: 'Brown / Grizzly Bear', minEnergy: 2000, icon: '🐻', notes: 'Heavy bone structure — controlled expansion or monolithic solids preferred' },
  { name: 'African Plains Game', minEnergy: 2500, icon: '🦓', notes: 'Kudu, eland, wildebeest — tough hides require deep-penetrating bullets' },
  { name: 'Dangerous Game', minEnergy: 4000, icon: '🦏', notes: 'Cape buffalo, elephant — solids or bonded heavy bullets at close range' },
];

function interpolateMaxRange(ballistics: BallisticPoint[], threshold: number): number | null {
  // If muzzle energy is below threshold, no ethical range
  if (ballistics.length === 0 || ballistics[0].energy_ft_lbs < threshold) return 0;

  // Find where energy drops below threshold
  for (let i = 1; i < ballistics.length; i++) {
    if (ballistics[i].energy_ft_lbs < threshold) {
      // Linear interpolation between points
      const prev = ballistics[i - 1];
      const curr = ballistics[i];
      const ratio = (threshold - curr.energy_ft_lbs) / (prev.energy_ft_lbs - curr.energy_ft_lbs);
      return Math.round(curr.distance_yd - ratio * (curr.distance_yd - prev.distance_yd));
    }
  }

  // Energy never dropped below threshold within the data range
  const lastPoint = ballistics[ballistics.length - 1];
  if (lastPoint.energy_ft_lbs >= threshold) return lastPoint.distance_yd;
  return null;
}

export default function EthicalRangeCalculator({ calibers }: Props) {
  const [selectedSlug, setSelectedSlug] = useState('');
  const [selectedLoadIdx, setSelectedLoadIdx] = useState(0);

  const caliberMap = useMemo(() => {
    const m = new Map<string, CaliberEntry>();
    calibers.forEach(c => m.set(c.slug, c));
    return m;
  }, [calibers]);

  const caliber = caliberMap.get(selectedSlug);
  const load = caliber?.loads[selectedLoadIdx];

  const results = useMemo(() => {
    if (!load) return [];
    return GAME_ANIMALS.map(animal => {
      const maxRange = interpolateMaxRange(load.ballistics, animal.minEnergy);
      return { ...animal, maxRange };
    });
  }, [load]);

  return (
    <div class="space-y-6">
      {/* Inputs */}
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Caliber</label>
          <select
            value={selectedSlug}
            onChange={e => { setSelectedSlug((e.target as HTMLSelectElement).value); setSelectedLoadIdx(0); }}
            class="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary"
          >
            <option value="">Select caliber...</option>
            {calibers.map(c => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">Load</label>
          <select
            value={selectedLoadIdx}
            onChange={e => setSelectedLoadIdx(+(e.target as HTMLSelectElement).value)}
            disabled={!caliber}
            class="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary disabled:opacity-40"
          >
            {caliber?.loads.map((l, i) => (
              <option key={i} value={i}>{l.bullet_weight_gr}gr {l.bullet_type} ({l.muzzle_velocity_fps} fps / {l.muzzle_energy_ft_lbs} ft-lbs)</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {load ? (
        <div class="rounded-lg border border-surface-border">
          <div class="border-b border-surface-border bg-surface-overlay px-4 py-2.5">
            <h3 class="text-base font-medium text-text-muted">
              Maximum Ethical Range — {caliber!.name} {load.bullet_weight_gr}gr
            </h3>
          </div>

          <div class="divide-y divide-surface-border-subtle">
            {results.map((r, i) => {
              const adequate = r.maxRange !== null && r.maxRange > 0;
              const maxRangeStr = r.maxRange === null ? `${load.ballistics[load.ballistics.length - 1].distance_yd}+` :
                                  r.maxRange === 0 ? 'Insufficient' : `${r.maxRange}`;
              const barPct = adequate ? Math.min(100, ((r.maxRange ?? 0) / 600) * 100) : 0;

              return (
                <div key={r.name} class={`px-4 py-3 ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised'}`}>
                  <div class="flex items-center justify-between gap-3 mb-2">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="text-lg" aria-hidden="true">{r.icon}</span>
                      <div class="min-w-0">
                        <span class="text-sm font-medium text-text-primary block">{r.name}</span>
                        <span class="text-xs text-text-muted">Min: <span class="font-mono">{r.minEnergy.toLocaleString()}</span> ft-lbs</span>
                      </div>
                    </div>
                    <span class={`font-mono text-lg font-bold shrink-0 ${
                      !adequate ? 'text-danger' : (r.maxRange ?? 0) >= 300 ? 'text-success' : 'text-warning'
                    }`}>
                      {adequate ? `${maxRangeStr} yd` : 'N/A'}
                    </span>
                  </div>

                  {/* Range bar */}
                  <div class="h-2 bg-surface-overlay rounded-full overflow-hidden">
                    {adequate ? (
                      <div
                        class={`h-full rounded-full transition-all duration-300 ${
                          (r.maxRange ?? 0) >= 300 ? 'bg-success' : 'bg-warning'
                        }`}
                        style={{ width: `${barPct}%` }}
                      />
                    ) : (
                      <div class="h-full bg-danger/50 w-full" />
                    )}
                  </div>

                  <p class="mt-1 text-xs text-text-muted">{r.notes}</p>
                </div>
              );
            })}
          </div>

          {/* Scale reference */}
          <div class="border-t border-surface-border px-4 py-2 flex justify-between font-mono text-xs text-text-muted">
            <span>0 yd</span>
            <span>150 yd</span>
            <span>300 yd</span>
            <span>450 yd</span>
            <span>600 yd</span>
          </div>
        </div>
      ) : (
        <div class="rounded-lg border border-dashed border-surface-border p-8 text-center">
          <p class="text-sm text-text-muted">
            Select a caliber and load to see maximum ethical killing distances for different game.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div class="rounded-lg border border-danger/30 bg-danger/5 p-3">
        <p class="text-xs text-text-secondary leading-relaxed">
          <span class="font-medium text-danger uppercase tracking-wide">Important:</span> These are energy-based estimates only.
          Ethical hunting depends on many factors: bullet construction, shot placement, angle, wind, and shooter skill.
          Energy alone does not determine killing effectiveness — a well-placed shot with adequate bullet construction
          is more important than raw energy numbers. Always know your personal effective range and practice at the distances you intend to hunt.
        </p>
      </div>
    </div>
  );
}
