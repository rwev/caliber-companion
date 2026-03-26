import { useState, useMemo, useRef } from 'preact/hooks';

interface BallisticPoint {
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
  bc_g1?: number;
  ballistics: BallisticPoint[];
}

interface CaliberEntry {
  name: string;
  slug: string;
  designation: string;
  effective_range_yd: number;
  loads: Load[];
}

interface Props {
  calibers: CaliberEntry[];
}

export default function RangeCardGenerator({ calibers }: Props) {
  const [selectedSlug, setSelectedSlug] = useState('');
  const [selectedLoadIdx, setSelectedLoadIdx] = useState(0);
  const [zeroRange, setZeroRange] = useState(100);
  const [notes, setNotes] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  const caliber = useMemo(
    () => calibers.find(c => c.slug === selectedSlug),
    [selectedSlug, calibers],
  );

  const load = caliber?.loads[selectedLoadIdx];

  // Recompute drop relative to selected zero range
  const adjustedBallistics = useMemo(() => {
    if (!load) return [];
    const zeroPoint = load.ballistics.find(p => p.distance_yd === zeroRange);
    const zeroOffset = zeroPoint ? zeroPoint.drop_in : 0;
    return load.ballistics.map(p => ({
      ...p,
      adjusted_drop_in: +(p.drop_in - zeroOffset).toFixed(1),
      // MOA = (drop_in / distance_yd) * (100/1.047) — approximate
      drop_moa: p.distance_yd > 0
        ? +((p.drop_in - zeroOffset) / (p.distance_yd * 1.047 / 100)).toFixed(1)
        : 0,
    }));
  }, [load, zeroRange]);

  function handlePrint() {
    window.print();
  }

  return (
    <div class="space-y-6">
      {/* Configuration */}
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label class="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">
            Caliber
          </label>
          <select
            value={selectedSlug}
            onChange={e => {
              setSelectedSlug((e.target as HTMLSelectElement).value);
              setSelectedLoadIdx(0);
            }}
            class="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary"
          >
            <option value="">Select caliber...</option>
            {calibers.map(c => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">
            Load
          </label>
          <select
            value={selectedLoadIdx}
            onChange={e => setSelectedLoadIdx(+(e.target as HTMLSelectElement).value)}
            disabled={!caliber}
            class="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary disabled:opacity-40"
          >
            {caliber?.loads.map((l, i) => (
              <option key={i} value={i}>{l.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label class="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">
            Zero Range (yd)
          </label>
          <select
            value={zeroRange}
            onChange={e => setZeroRange(+(e.target as HTMLSelectElement).value)}
            class="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary"
          >
            {[25, 50, 100, 200, 300].map(r => (
              <option key={r} value={r}>{r} yd</option>
            ))}
          </select>
        </div>

        <div class="flex items-end">
          <button
            onClick={handlePrint}
            disabled={!load}
            class="w-full rounded-md border border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Print Range Card
          </button>
        </div>
      </div>

      {/* Notes field */}
      {load && (
        <div>
          <label class="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">
            Notes (optional — printed on card)
          </label>
          <input
            type="text"
            value={notes}
            onInput={e => setNotes((e.target as HTMLInputElement).value)}
            placeholder="e.g., Rifle: Tikka T3x, Scope: Vortex PST Gen II"
            class="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted/50"
          />
        </div>
      )}

      {/* Range Card Preview (also the printable area) */}
      {load && caliber && (
        <div ref={cardRef} class="range-card rounded-lg border border-surface-border">
          {/* Card Header */}
          <div class="border-b border-surface-border bg-surface-overlay px-4 py-3">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="text-xl font-bold text-text-primary">{caliber.name}</div>
                <div class="font-mono text-sm text-text-muted">{load.name}</div>
              </div>
              <div class="text-right font-mono text-xs text-text-muted">
                <div>Caliber Companion</div>
                <div>Range Card</div>
              </div>
            </div>
          </div>

          {/* Quick Specs */}
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-px bg-surface-border border-b border-surface-border">
            {[
              { label: 'Bullet', value: `${load.bullet_weight_gr}gr ${load.bullet_type}` },
              { label: 'MV / ME', value: `${load.muzzle_velocity_fps} fps / ${load.muzzle_energy_ft_lbs} ft·lbs` },
              { label: 'Barrel', value: `${load.barrel_length_in}"` },
              { label: 'Zero', value: `${zeroRange} yd` },
            ].map(spec => (
              <div key={spec.label} class="bg-surface px-3 py-2">
                <div class="text-xs font-medium uppercase tracking-wide text-text-muted">{spec.label}</div>
                <div class="font-mono text-sm text-text-primary mt-0.5">{spec.value}</div>
              </div>
            ))}
          </div>

          {/* Ballistic Table */}
          <div class="overflow-x-auto">
            <table class="w-full text-left font-mono">
              <thead>
                <tr class="border-b border-surface-border bg-surface-overlay text-text-muted">
                  <th scope="col" class="px-3 py-2 text-xs font-medium uppercase tracking-wide">Dist</th>
                  <th scope="col" class="px-3 py-2 text-xs font-medium uppercase tracking-wide text-right">Vel</th>
                  <th scope="col" class="px-3 py-2 text-xs font-medium uppercase tracking-wide text-right">Energy</th>
                  <th scope="col" class="px-3 py-2 text-xs font-medium uppercase tracking-wide text-right">Drop</th>
                  <th scope="col" class="px-3 py-2 text-xs font-medium uppercase tracking-wide text-right">MOA</th>
                  <th scope="col" class="px-3 py-2 text-xs font-medium uppercase tracking-wide text-right">% Energy</th>
                </tr>
              </thead>
              <tbody>
                {adjustedBallistics.map((p, i) => {
                  const pctEnergy = Math.round((p.energy_ft_lbs / load.muzzle_energy_ft_lbs) * 100);
                  const isZero = p.distance_yd === zeroRange;
                  return (
                    <tr
                      key={p.distance_yd}
                      class={`border-b border-surface-border-subtle ${
                        isZero ? 'bg-accent/10 font-medium' : i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised'
                      }`}
                    >
                      <td class="px-3 py-1.5 text-sm text-text-primary">{p.distance_yd} yd</td>
                      <td class="px-3 py-1.5 text-sm text-right text-text-secondary">{p.velocity_fps.toLocaleString()}</td>
                      <td class="px-3 py-1.5 text-sm text-right text-text-secondary">{p.energy_ft_lbs.toLocaleString()}</td>
                      <td class={`px-3 py-1.5 text-sm text-right ${
                        isZero ? 'text-accent' : p.adjusted_drop_in < 0 ? 'text-danger' : 'text-text-primary'
                      }`}>
                        {isZero ? 'ZERO' : `${p.adjusted_drop_in > 0 ? '+' : ''}${p.adjusted_drop_in}"`}
                      </td>
                      <td class="px-3 py-1.5 text-sm text-right text-text-muted">
                        {isZero ? '—' : `${p.drop_moa > 0 ? '+' : ''}${p.drop_moa}`}
                      </td>
                      <td class="px-3 py-1.5 text-sm text-right text-text-muted">{pctEnergy}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Notes */}
          {notes && (
            <div class="border-t border-surface-border px-4 py-2 bg-surface-overlay">
              <div class="font-mono text-xs text-text-muted">
                <span class="font-medium uppercase tracking-wide">Notes:</span> {notes}
              </div>
            </div>
          )}

          {/* Footer */}
          <div class="border-t border-surface-border px-4 py-2 bg-surface">
            <div class="flex justify-between font-mono text-xs text-text-muted">
              <span>Eff. Range: {caliber.effective_range_yd} yd{load.bc_g1 ? ` · BC (G1): ${load.bc_g1}` : ''}</span>
              <span>caliber-companion · For reference only</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!load && (
        <div class="rounded-lg border border-dashed border-surface-border p-8 text-center">
          <p class="text-sm text-text-muted">
            Select a caliber and load to generate a printable range card.
          </p>
        </div>
      )}
    </div>
  );
}
