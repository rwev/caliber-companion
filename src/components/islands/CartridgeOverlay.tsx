import { useState, useMemo } from 'preact/hooks';

interface Dimensions {
  bullet_diameter_in: number;
  neck_diameter_in: number;
  case_length_in: number;
  overall_length_in: number;
  rim_diameter_in?: number;
  case_type: string;
}

interface CaliberDim {
  name: string;
  slug: string;
  dimensions: Dimensions;
}

interface Props {
  calibers: CaliberDim[];
}

const COLORS = [
  '#eb6b34', // accent orange
  '#3b82f6', // blue
  '#10b981', // emerald
  '#a855f7', // purple
  '#f43f5e', // rose
  '#06b6d4', // cyan
];

function buildProfilePath(
  d: Dimensions,
  scale: number,
  cx: number,
  yBase: number,
): string {
  const {
    bullet_diameter_in,
    neck_diameter_in,
    case_length_in,
    overall_length_in,
    rim_diameter_in,
    case_type,
  } = d;

  const isBottleneck = case_type.includes('bottleneck');
  const isRimmed = case_type.includes('rimmed') && !case_type.includes('rimless');
  const isBelted = case_type.includes('belted');
  const isTapered = case_type.includes('tapered');

  const rimDia = rim_diameter_in || neck_diameter_in;
  const yCaseTop = yBase - case_length_in * scale;
  const yBulletTip = yBase - overall_length_in * scale;

  const halfRim = (rimDia * scale) / 2;
  const halfNeck = (neck_diameter_in * scale) / 2;
  const halfBullet = (bullet_diameter_in * scale) / 2;

  const bodyDia = isBottleneck ? rimDia * 0.95 : isTapered ? rimDia * 0.98 : neck_diameter_in;
  const halfBody = (bodyDia * scale) / 2;

  const yShoulder = yBase - case_length_in * scale * 0.75;
  const rimHeight = isRimmed ? 8 : 4;
  const grooveDepth = 3;
  const grooveHeight = 4;
  const beltHeight = 6;
  const beltExtra = 4;

  const points: [number, number][] = [];

  points.push([cx + halfRim, yBase]);

  if (isRimmed) {
    points.push([cx + halfRim, yBase - rimHeight]);
    points.push([cx + halfBody, yBase - rimHeight]);
  } else {
    points.push([cx + halfRim, yBase - rimHeight]);
    points.push([cx + halfRim - grooveDepth, yBase - rimHeight]);
    points.push([cx + halfRim - grooveDepth, yBase - rimHeight - grooveHeight]);
    if (isBelted) {
      points.push([cx + halfBody + beltExtra, yBase - rimHeight - grooveHeight]);
      points.push([cx + halfBody + beltExtra, yBase - rimHeight - grooveHeight - beltHeight]);
      points.push([cx + halfBody, yBase - rimHeight - grooveHeight - beltHeight]);
    } else {
      points.push([cx + halfBody, yBase - rimHeight - grooveHeight]);
    }
  }

  if (isBottleneck) {
    points.push([cx + halfBody, yShoulder]);
    points.push([cx + halfNeck, yCaseTop + 8]);
    points.push([cx + halfNeck, yCaseTop]);
  } else {
    points.push([cx + halfNeck, yCaseTop]);
  }

  points.push([cx + halfBullet, yCaseTop]);
  points.push([cx + halfBullet, yCaseTop - (overall_length_in - case_length_in) * scale * 0.3]);
  points.push([cx + 1, yBulletTip]);

  const leftPoints: [number, number][] = points.map(([x, y]) => [cx - (x - cx), y]).reverse();
  const allPoints = [...points, ...leftPoints.slice(1)];
  return allPoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ' Z';
}

export default function CartridgeOverlay({ calibers }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [addSlug, setAddSlug] = useState('');

  const available = calibers.filter(c => !selected.includes(c.slug));
  const selectedCalibers = selected
    .map(slug => calibers.find(c => c.slug === slug))
    .filter(Boolean) as CaliberDim[];

  function addCaliber() {
    if (!addSlug || selected.length >= 6) return;
    setSelected(prev => [...prev, addSlug]);
    setAddSlug('');
  }

  function removeCaliber(slug: string) {
    setSelected(prev => prev.filter(s => s !== slug));
  }

  // Common scale: find the largest cartridge to set the viewport
  const scale = 100; // pixels per inch
  const padding = 40;

  const maxOAL = selectedCalibers.length > 0
    ? Math.max(...selectedCalibers.map(c => c.dimensions.overall_length_in))
    : 3;
  const maxWidth = selectedCalibers.length > 0
    ? Math.max(...selectedCalibers.map(c => {
        const rimDia = c.dimensions.rim_diameter_in || c.dimensions.neck_diameter_in;
        return Math.max(rimDia, c.dimensions.bullet_diameter_in);
      }))
    : 0.5;

  const svgWidth = maxWidth * scale + padding * 2 + 40;
  const svgHeight = maxOAL * scale + padding * 2 + 20;
  const cx = svgWidth / 2;
  const yBase = padding + maxOAL * scale;

  return (
    <div class="space-y-6">
      {/* Add caliber */}
      <div class="flex gap-2">
        <select
          value={addSlug}
          onChange={e => setAddSlug((e.target as HTMLSelectElement).value)}
          class="flex-1 border border-surface-border bg-surface-raised px-3 py-2 font-mono text-sm text-text-primary"
        >
          <option value="">Select a caliber to overlay...</option>
          {available.map(c => (
            <option key={c.slug} value={c.slug}>{c.name} ({c.dimensions.overall_length_in}" OAL)</option>
          ))}
        </select>
        <button
          onClick={addCaliber}
          disabled={!addSlug || selected.length >= 6}
          class="border border-accent bg-accent/10 px-4 py-2 font-mono text-sm tracking-wider uppercase text-accent transition-colors hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {/* Legend */}
      {selectedCalibers.length > 0 && (
        <div class="flex flex-wrap gap-2">
          {selectedCalibers.map((c, i) => (
            <div
              key={c.slug}
              class="flex items-center gap-2 border border-surface-border bg-surface-raised px-3 py-1.5"
            >
              <span class="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <span class="font-mono text-sm text-text-primary">{c.name}</span>
              <span class="font-mono text-xs text-text-muted">{c.dimensions.overall_length_in}" OAL</span>
              <button
                onClick={() => removeCaliber(c.slug)}
                class="ml-1 text-text-muted hover:text-danger transition-colors"
                aria-label={`Remove ${c.name}`}
              >
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* SVG Overlay */}
      {selectedCalibers.length > 0 ? (
        <div class="border border-surface-border">
          <div class="border-b border-surface-border bg-surface-overlay px-4 py-2.5">
            <h3 class="font-display text-base tracking-[0.2em] uppercase text-text-muted">
              Cartridge Overlay — {selectedCalibers.length} caliber{selectedCalibers.length !== 1 ? 's' : ''}
            </h3>
          </div>
          <div class="flex justify-center p-4 text-text-muted bg-surface">
            <svg
              width="100%"
              viewBox={`0 0 ${svgWidth} ${svgHeight + 20}`}
              style={{ maxWidth: `${Math.min(svgWidth, 400)}px` }}
              role="img"
              aria-label={`Overlay comparison of ${selectedCalibers.map(c => c.name).join(', ')}`}
            >
              {/* Grid lines */}
              {Array.from({ length: Math.ceil(maxOAL) + 1 }, (_, i) => {
                const y = yBase - i * scale;
                if (y < padding - 10) return null;
                return (
                  <g key={i}>
                    <line x1={padding / 2} y1={y} x2={svgWidth - padding / 2} y2={y} stroke="currentColor" stroke-width="0.5" opacity="0.1" />
                    <text x={8} y={y + 3} font-family="JetBrains Mono, monospace" font-size="8" fill="currentColor" opacity="0.3">{i}"</text>
                  </g>
                );
              })}

              {/* Render each cartridge profile */}
              {selectedCalibers.map((c, i) => {
                const color = COLORS[i % COLORS.length];
                const path = buildProfilePath(c.dimensions, scale, cx, yBase);
                return (
                  <g key={c.slug}>
                    <path d={path} fill={color} opacity="0.12" />
                    <path d={path} fill="none" stroke={color} stroke-width="2" opacity="0.8" />
                  </g>
                );
              })}

              {/* Base line */}
              <line x1={padding / 2} y1={yBase} x2={svgWidth - padding / 2} y2={yBase} stroke="currentColor" stroke-width="1" opacity="0.3" />
            </svg>
          </div>

          {/* Comparison table */}
          <div class="border-t border-surface-border overflow-x-auto">
            <table class="w-full text-left font-mono">
              <thead>
                <tr class="border-b border-surface-border bg-surface-overlay text-text-muted">
                  <th scope="col" class="px-3 py-2 font-medium tracking-wider uppercase text-xs">Caliber</th>
                  <th scope="col" class="px-3 py-2 font-medium tracking-wider uppercase text-xs text-right">Bullet Ø</th>
                  <th scope="col" class="px-3 py-2 font-medium tracking-wider uppercase text-xs text-right">Case</th>
                  <th scope="col" class="px-3 py-2 font-medium tracking-wider uppercase text-xs text-right">OAL</th>
                  <th scope="col" class="px-3 py-2 font-medium tracking-wider uppercase text-xs text-right">Rim Ø</th>
                  <th scope="col" class="px-3 py-2 font-medium tracking-wider uppercase text-xs text-right">Type</th>
                </tr>
              </thead>
              <tbody>
                {selectedCalibers.map((c, i) => (
                  <tr key={c.slug} class={`border-b border-surface-border-subtle ${i % 2 === 0 ? 'bg-surface' : 'bg-surface-raised'}`}>
                    <td class="px-3 py-1.5 text-sm">
                      <span class="inline-block h-2.5 w-2.5 rounded-full mr-1.5 align-middle" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span class="text-text-primary">{c.name}</span>
                    </td>
                    <td class="px-3 py-1.5 text-sm text-right text-text-secondary">{c.dimensions.bullet_diameter_in}"</td>
                    <td class="px-3 py-1.5 text-sm text-right text-text-secondary">{c.dimensions.case_length_in}"</td>
                    <td class="px-3 py-1.5 text-sm text-right text-text-secondary">{c.dimensions.overall_length_in}"</td>
                    <td class="px-3 py-1.5 text-sm text-right text-text-secondary">{c.dimensions.rim_diameter_in ? `${c.dimensions.rim_diameter_in}"` : '—'}</td>
                    <td class="px-3 py-1.5 text-sm text-right text-text-muted">{c.dimensions.case_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div class="border border-dashed border-surface-border p-8 text-center">
          <p class="font-mono text-sm text-text-muted">
            Select 2 or more calibers to see their cartridge profiles overlaid at true scale.
          </p>
        </div>
      )}
    </div>
  );
}
