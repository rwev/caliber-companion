import { useState, useMemo } from 'preact/hooks';

interface CaliberCost {
  slug: string;
  name: string;
  costLow: number;
  costHigh: number;
}

interface Props {
  calibers: CaliberCost[];
}

interface SelectedCaliber {
  slug: string;
  roundsPerTrip: number;
  costPerRound: number;
}

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AmmoCostCalculator({ calibers }: Props) {
  const [selected, setSelected] = useState<SelectedCaliber[]>([]);
  const [tripsPerMonth, setTripsPerMonth] = useState(2);
  const [addSlug, setAddSlug] = useState('');

  const caliberMap = useMemo(() => {
    const m = new Map<string, CaliberCost>();
    calibers.forEach(c => m.set(c.slug, c));
    return m;
  }, [calibers]);

  const available = calibers.filter(c => !selected.some(s => s.slug === c.slug));

  function addCaliber() {
    const cal = caliberMap.get(addSlug);
    if (!cal) return;
    setSelected(prev => [
      ...prev,
      {
        slug: cal.slug,
        roundsPerTrip: 50,
        costPerRound: +((cal.costLow + cal.costHigh) / 2).toFixed(2),
      },
    ]);
    setAddSlug('');
  }

  function removeCaliber(slug: string) {
    setSelected(prev => prev.filter(s => s.slug !== slug));
  }

  function updateField(slug: string, field: 'roundsPerTrip' | 'costPerRound', value: number) {
    setSelected(prev =>
      prev.map(s => (s.slug === slug ? { ...s, [field]: value } : s)),
    );
  }

  const results = selected.map(s => {
    const cal = caliberMap.get(s.slug)!;
    const monthlyRounds = s.roundsPerTrip * tripsPerMonth;
    const monthlyCost = monthlyRounds * s.costPerRound;
    const annualCost = monthlyCost * 12;
    return { ...s, name: cal.name, monthlyRounds, monthlyCost, annualCost };
  });

  const totalMonthly = results.reduce((sum, r) => sum + r.monthlyCost, 0);
  const totalAnnual = results.reduce((sum, r) => sum + r.annualCost, 0);
  const maxAnnual = Math.max(...results.map(r => r.annualCost), 1);

  return (
    <div class="space-y-6">
      {/* Trips per month */}
      <div class="rounded-lg border border-surface-border p-4">
        <label class="block text-xs font-medium uppercase tracking-wide text-text-muted mb-2">
          Range Trips per Month
        </label>
        <div class="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={12}
            value={tripsPerMonth}
            onInput={e => setTripsPerMonth(+(e.target as HTMLInputElement).value)}
            class="flex-1 accent-[var(--color-accent)]"
          />
          <span class="font-mono text-xl font-semibold text-accent w-8 text-right">{tripsPerMonth}</span>
        </div>
      </div>

      {/* Add caliber */}
      <div class="flex gap-2">
        <select
          value={addSlug}
          onChange={e => setAddSlug((e.target as HTMLSelectElement).value)}
          class="flex-1 rounded-md border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary"
        >
          <option value="">Select a caliber to add...</option>
          {available.map(c => (
            <option key={c.slug} value={c.slug}>
              {c.name} (${c.costLow.toFixed(2)}–${c.costHigh.toFixed(2)}/rd)
            </option>
          ))}
        </select>
        <button
          onClick={addCaliber}
          disabled={!addSlug}
          class="rounded-md border border-accent bg-accent/10 px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {/* Selected calibers table */}
      {selected.length > 0 && (
        <div class="rounded-lg border border-surface-border">
          <div class="border-b border-surface-border bg-surface-overlay px-4 py-2.5">
            <h3 class="text-base font-medium text-text-muted">Your Calibers</h3>
          </div>

          <div class="divide-y divide-surface-border-subtle">
            {results.map(r => {
              const cal = caliberMap.get(r.slug)!;
              return (
                <div key={r.slug} class="p-4 space-y-3">
                  <div class="flex items-center justify-between gap-3">
                    <span class="font-mono text-base font-medium text-text-primary">{r.name}</span>
                    <button
                      onClick={() => removeCaliber(r.slug)}
                      class="p-1 text-text-muted hover:text-danger transition-colors"
                      aria-label={`Remove ${r.name}`}
                    >
                      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">
                        Rounds / Trip
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={1000}
                        value={r.roundsPerTrip}
                        onInput={e =>
                          updateField(r.slug, 'roundsPerTrip', Math.max(1, +(e.target as HTMLInputElement).value || 1))
                        }
                        class="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 font-mono text-sm text-text-primary"
                      />
                    </div>
                    <div>
                      <label class="block text-xs font-medium uppercase tracking-wide text-text-muted mb-1">
                        Cost / Round ($)
                      </label>
                      <input
                        type="number"
                        min={0.01}
                        max={50}
                        step={0.01}
                        value={r.costPerRound}
                        onInput={e =>
                          updateField(r.slug, 'costPerRound', Math.max(0.01, +(e.target as HTMLInputElement).value || 0.01))
                        }
                        class="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-1.5 font-mono text-sm text-text-primary"
                      />
                      <div class="mt-0.5 font-mono text-xs text-text-muted">
                        Range: ${cal.costLow.toFixed(2)}–${cal.costHigh.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Cost bar */}
                  <div class="flex items-center gap-3">
                    <div class="flex-1 h-6 bg-surface-raised border border-surface-border-subtle overflow-hidden">
                      <div
                        class="h-full bg-accent/70 transition-all duration-300"
                        style={{ width: `${Math.min(100, (r.annualCost / maxAnnual) * 100)}%` }}
                      />
                    </div>
                    <span class="font-mono text-sm font-medium text-accent whitespace-nowrap w-24 text-right">
                      ${fmt(r.annualCost)}/yr
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Totals */}
      {selected.length > 0 && (
        <div class="rounded-lg border border-accent/30 bg-accent/5 p-4">
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div class="text-xs font-medium uppercase tracking-wide text-text-muted">Monthly Rounds</div>
              <div class="mt-1 font-mono text-xl font-bold text-text-primary">
                {results.reduce((s, r) => s + r.monthlyRounds, 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div class="text-xs font-medium uppercase tracking-wide text-text-muted">Annual Rounds</div>
              <div class="mt-1 font-mono text-xl font-bold text-text-primary">
                {(results.reduce((s, r) => s + r.monthlyRounds, 0) * 12).toLocaleString()}
              </div>
            </div>
            <div>
              <div class="text-xs font-medium uppercase tracking-wide text-text-muted">Monthly Cost</div>
              <div class="mt-1 font-mono text-xl font-bold text-accent">${fmt(totalMonthly)}</div>
            </div>
            <div>
              <div class="text-xs font-medium uppercase tracking-wide text-text-muted">Annual Cost</div>
              <div class="mt-1 font-mono text-xl font-bold text-accent">${fmt(totalAnnual)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {selected.length === 0 && (
        <div class="rounded-lg border border-dashed border-surface-border p-8 text-center">
          <p class="text-sm text-text-muted">
            Select calibers above to calculate your ammunition costs.
          </p>
        </div>
      )}

      {/* Cost reference table */}
      <div class="rounded-lg border border-surface-border">
        <div class="border-b border-surface-border bg-surface-overlay px-4 py-2.5">
          <h3 class="text-base font-medium text-text-muted">Cost Reference — All Calibers</h3>
        </div>
        <div class="overflow-x-auto" tabindex={0} role="region" aria-label="Cost per round reference table">
          <table class="w-full text-left font-mono">
            <thead>
              <tr class="border-b border-surface-border-subtle bg-surface-overlay text-text-muted">
                <th scope="col" class="px-4 py-2 text-xs font-medium uppercase tracking-wide">Caliber</th>
                <th scope="col" class="px-4 py-2 text-xs font-medium uppercase tracking-wide text-right">Low</th>
                <th scope="col" class="px-4 py-2 text-xs font-medium uppercase tracking-wide text-right">High</th>
                <th scope="col" class="px-4 py-2 text-xs font-medium uppercase tracking-wide text-right">50 rds/trip, 2x/mo</th>
              </tr>
            </thead>
            <tbody>
              {[...calibers]
                .sort((a, b) => (a.costLow + a.costHigh) / 2 - (b.costLow + b.costHigh) / 2)
                .map((c, i) => {
                  const avg = (c.costLow + c.costHigh) / 2;
                  const annual = avg * 50 * 2 * 12;
                  return (
                    <tr
                      key={c.slug}
                      class={`border-b border-surface-border-subtle ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised'}`}
                    >
                      <td class="px-4 py-2 text-sm text-text-primary">{c.name}</td>
                      <td class="px-4 py-2 text-sm text-right text-text-secondary">${c.costLow.toFixed(2)}</td>
                      <td class="px-4 py-2 text-sm text-right text-text-secondary">${c.costHigh.toFixed(2)}</td>
                      <td class="px-4 py-2 text-sm text-right text-accent font-medium">${fmt(annual)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
