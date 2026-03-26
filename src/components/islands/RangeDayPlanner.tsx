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
  barrel_length_in: number;
  ballistics: BallisticPoint[];
}

interface CaliberEntry {
  name: string;
  slug: string;
  effective_range_yd: number;
  loads: LoadEntry[];
}

interface Props {
  calibers: CaliberEntry[];
}

interface SelectedItem {
  calSlug: string;
  loadIdx: number;
  notes: string;
  rounds: number;
}

export default function RangeDayPlanner({ calibers }: Props) {
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [addSlug, setAddSlug] = useState('');
  const [addLoadIdx, setAddLoadIdx] = useState(0);
  const [rangeName, setRangeName] = useState('');
  const [rangeDate, setRangeDate] = useState('');

  const caliberMap = useMemo(() => {
    const m = new Map<string, CaliberEntry>();
    calibers.forEach(c => m.set(c.slug, c));
    return m;
  }, [calibers]);

  const addCaliber = caliberMap.get(addSlug);

  function handleAdd() {
    if (!addSlug) return;
    setSelected(prev => [...prev, { calSlug: addSlug, loadIdx: addLoadIdx, notes: '', rounds: 50 }]);
    setAddSlug('');
    setAddLoadIdx(0);
  }

  function handleRemove(idx: number) {
    setSelected(prev => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof SelectedItem, value: string | number) {
    setSelected(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }

  const totalRounds = selected.reduce((sum, s) => sum + s.rounds, 0);

  return (
    <div class="space-y-6">
      {/* Header inputs */}
      <div class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="block font-mono text-xs tracking-wider uppercase text-text-muted mb-1">Range / Location</label>
          <input
            type="text"
            value={rangeName}
            onInput={e => setRangeName((e.target as HTMLInputElement).value)}
            placeholder="e.g., Blue Ridge Shooting Range"
            class="w-full border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted/50"
          />
        </div>
        <div>
          <label class="block font-mono text-xs tracking-wider uppercase text-text-muted mb-1">Date</label>
          <input
            type="date"
            value={rangeDate}
            onInput={e => setRangeDate((e.target as HTMLInputElement).value)}
            class="w-full border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary"
          />
        </div>
      </div>

      {/* Add caliber */}
      <div class="flex flex-wrap gap-2 items-end">
        <div class="flex-1 min-w-[180px]">
          <label class="block font-mono text-xs tracking-wider uppercase text-text-muted mb-1">Add Caliber</label>
          <select
            value={addSlug}
            onChange={e => { setAddSlug((e.target as HTMLSelectElement).value); setAddLoadIdx(0); }}
            class="w-full border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary"
          >
            <option value="">Select caliber...</option>
            {calibers.map(c => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </div>
        {addCaliber && (
          <div class="flex-1 min-w-[180px]">
            <label class="block font-mono text-xs tracking-wider uppercase text-text-muted mb-1">Load</label>
            <select
              value={addLoadIdx}
              onChange={e => setAddLoadIdx(+(e.target as HTMLSelectElement).value)}
              class="w-full border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary"
            >
              {addCaliber.loads.map((l, i) => (
                <option key={i} value={i}>{l.bullet_weight_gr}gr {l.bullet_type}</option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={handleAdd}
          disabled={!addSlug}
          class="border border-accent bg-accent/10 px-4 py-2 font-mono text-sm tracking-wider uppercase text-accent transition-colors hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {selected.length > 0 && (
        <div class="flex items-center justify-between">
          <p class="font-mono text-xs text-text-muted">
            {selected.length} caliber{selected.length !== 1 ? 's' : ''} · {totalRounds.toLocaleString()} total rounds
          </p>
          <button
            onClick={() => window.print()}
            class="border border-accent bg-accent/10 px-4 py-2 font-mono text-sm tracking-wider uppercase text-accent transition-colors hover:bg-accent/20"
          >
            Print Cheat Sheet
          </button>
        </div>
      )}

      {/* Printable cheat sheet */}
      {selected.length > 0 ? (
        <div class="range-card space-y-4">
          {/* Sheet header */}
          <div class="border border-surface-border bg-surface-overlay px-4 py-3 flex items-start justify-between">
            <div>
              <div class="font-display text-xl font-bold text-text-primary">Range Day Cheat Sheet</div>
              <div class="font-mono text-sm text-text-muted">
                {rangeName && <span>{rangeName} · </span>}
                {rangeDate && <span>{rangeDate} · </span>}
                {selected.length} caliber{selected.length !== 1 ? 's' : ''} · {totalRounds.toLocaleString()} rounds
              </div>
            </div>
            <div class="font-mono text-xs text-text-muted text-right">
              Caliber Companion
            </div>
          </div>

          {/* Per-caliber cards */}
          {selected.map((s, idx) => {
            const cal = caliberMap.get(s.calSlug);
            if (!cal) return null;
            const load = cal.loads[s.loadIdx];
            if (!load) return null;

            return (
              <div key={idx} class="border border-surface-border">
                <div class="flex items-center justify-between bg-surface-overlay px-3 py-2 border-b border-surface-border">
                  <div>
                    <span class="font-display text-base font-semibold text-text-primary">{cal.name}</span>
                    <span class="font-mono text-xs text-text-muted ml-2">{load.bullet_weight_gr}gr {load.bullet_type} · {load.muzzle_velocity_fps} fps</span>
                  </div>
                  <div class="flex items-center gap-2 no-print">
                    <input
                      type="number"
                      min={0}
                      max={999}
                      value={s.rounds}
                      onInput={e => updateItem(idx, 'rounds', Math.max(0, +(e.target as HTMLInputElement).value || 0))}
                      class="w-16 border border-surface-border bg-surface-raised px-2 py-1 font-mono text-xs text-text-primary text-right"
                    />
                    <span class="font-mono text-xs text-text-muted">rds</span>
                    <button onClick={() => handleRemove(idx)} class="ml-2 text-text-muted hover:text-danger transition-colors" aria-label="Remove">
                      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>

                {/* Compact ballistic table */}
                <table class="w-full text-left font-mono">
                  <thead>
                    <tr class="bg-surface-overlay text-text-muted border-b border-surface-border-subtle">
                      <th class="px-2 py-1 text-xs font-medium tracking-wider uppercase">Dist</th>
                      <th class="px-2 py-1 text-xs font-medium tracking-wider uppercase text-right">Vel</th>
                      <th class="px-2 py-1 text-xs font-medium tracking-wider uppercase text-right">Energy</th>
                      <th class="px-2 py-1 text-xs font-medium tracking-wider uppercase text-right">Drop</th>
                    </tr>
                  </thead>
                  <tbody>
                    {load.ballistics.map((p, i) => (
                      <tr key={p.distance_yd} class={`border-b border-surface-border-subtle ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised'}`}>
                        <td class="px-2 py-0.5 text-xs text-text-primary">{p.distance_yd} yd</td>
                        <td class="px-2 py-0.5 text-xs text-right text-text-secondary">{p.velocity_fps.toLocaleString()}</td>
                        <td class="px-2 py-0.5 text-xs text-right text-text-secondary">{p.energy_ft_lbs.toLocaleString()}</td>
                        <td class={`px-2 py-0.5 text-xs text-right ${p.drop_in === 0 ? 'text-accent' : 'text-text-muted'}`}>
                          {p.drop_in === 0 ? 'ZERO' : `${p.drop_in > 0 ? '+' : ''}${p.drop_in.toFixed(1)}"`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Notes for this caliber */}
                <div class="px-3 py-1.5 bg-surface no-print">
                  <input
                    type="text"
                    value={s.notes}
                    onInput={e => updateItem(idx, 'notes', (e.target as HTMLInputElement).value)}
                    placeholder="Notes (e.g., zero distance, scope settings)..."
                    class="w-full bg-transparent font-mono text-xs text-text-muted placeholder:text-text-muted/40 outline-none"
                  />
                </div>
                {s.notes && (
                  <div class="px-3 py-1 bg-surface-overlay border-t border-surface-border-subtle print-only">
                    <span class="font-mono text-xs text-text-muted">Notes: {s.notes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div class="border border-dashed border-surface-border p-8 text-center">
          <p class="font-mono text-sm text-text-muted">
            Add calibers above to build your range day cheat sheet.
          </p>
        </div>
      )}
    </div>
  );
}
