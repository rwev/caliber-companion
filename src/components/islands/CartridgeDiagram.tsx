interface Dimensions {
  bullet_diameter_in: number;
  neck_diameter_in: number;
  case_length_in: number;
  overall_length_in: number;
  rim_diameter_in?: number;
  case_type: string;
}

interface Props {
  dimensions: Dimensions;
  name: string;
}

function getCSSVar(name: string): string {
  if (typeof document === 'undefined') return '#666';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export default function CartridgeDiagram({ dimensions: d, name }: Props) {
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
  const isStraight = case_type.includes('straight');
  const isTapered = case_type.includes('tapered');

  // SVG coordinate system: scale everything to fit nicely
  // We'll work in a coordinate system where 1 unit = proportional to real inches
  const scale = 120; // pixels per inch
  const padding = 50;

  const rimDia = rim_diameter_in || neck_diameter_in;
  const maxWidth = Math.max(rimDia, neck_diameter_in, bullet_diameter_in) * scale;
  const totalHeight = overall_length_in * scale;

  const svgWidth = maxWidth + padding * 2 + 120; // extra for dimension labels
  const svgHeight = totalHeight + padding * 2 + 30;

  // Center X
  const cx = padding + 60;

  // Y coordinates (bottom = 0, top = overall_length)
  const yBase = padding + totalHeight; // bottom of case (rim)
  const yCaseTop = yBase - case_length_in * scale; // top of case / base of bullet
  const yBulletTip = yBase - overall_length_in * scale; // tip of bullet

  // Widths (half-widths for symmetric drawing)
  const halfRim = (rimDia * scale) / 2;
  const halfNeck = (neck_diameter_in * scale) / 2;
  const halfBullet = (bullet_diameter_in * scale) / 2;

  // Body diameter: for bottleneck, body is wider than neck
  // Approximate body diameter as ~rim diameter for rimless, or slightly less
  const bodyDia = isBottleneck
    ? rimDia * 0.95
    : isTapered
      ? rimDia * 0.98
      : neck_diameter_in;
  const halfBody = (bodyDia * scale) / 2;

  // Shoulder position for bottleneck (approximately 70% up the case)
  const shoulderRatio = 0.75;
  const yShoulder = yBase - case_length_in * scale * shoulderRatio;

  // Rim groove for rimless
  const grooveDepth = 3;
  const grooveHeight = 4;
  const rimHeight = isRimmed ? 8 : 4;

  // Belt for belted magnums
  const beltHeight = 6;
  const beltExtra = 4;

  // Build the cartridge profile path (right side, then mirror left)
  function buildProfile(): string {
    const points: [number, number][] = [];

    // Start at bottom-right of rim
    points.push([cx + halfRim, yBase]);

    if (isRimmed) {
      // Rimmed: rim sticks out, then steps in to body
      points.push([cx + halfRim, yBase - rimHeight]);
      points.push([cx + halfBody, yBase - rimHeight]);
    } else {
      // Rimless: rim, then extraction groove, then body
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
      // Straight body up to shoulder
      points.push([cx + halfBody, yShoulder]);
      // Shoulder taper to neck
      points.push([cx + halfNeck, yCaseTop + 8]);
      // Neck
      points.push([cx + halfNeck, yCaseTop]);
    } else if (isTapered) {
      // Gradual taper from body to neck
      points.push([cx + halfNeck, yCaseTop]);
    } else {
      // Straight wall
      points.push([cx + halfNeck, yCaseTop]);
    }

    // Bullet
    points.push([cx + halfBullet, yCaseTop]);
    // Bullet ogive to tip
    points.push([cx + halfBullet, yCaseTop - (overall_length_in - case_length_in) * scale * 0.3]);
    points.push([cx + 1, yBulletTip]); // Tip (nearly pointed)

    // Mirror left side
    const leftPoints: [number, number][] = points.map(([x, y]) => [cx - (x - cx), y]).reverse();

    const allPoints = [...points, ...leftPoints.slice(1)];
    return allPoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ' Z';
  }

  const profilePath = buildProfile();

  // Dimension lines
  function dimLine(
    x1: number, y1: number, x2: number, y2: number,
    label: string, side: 'left' | 'right',
    offset: number = 25,
  ) {
    const isVertical = Math.abs(x1 - x2) < 1;
    const lineX = side === 'right' ? cx + maxWidth / 2 + offset : cx - maxWidth / 2 - offset;

    if (isVertical) {
      // Vertical dimension (length)
      return (
        <g>
          {/* Extension lines */}
          <line x1={x1} y1={y1} x2={lineX} y2={y1} stroke="currentColor" stroke-width="0.5" opacity="0.3" stroke-dasharray="2,2" />
          <line x1={x2} y1={y2} x2={lineX} y2={y2} stroke="currentColor" stroke-width="0.5" opacity="0.3" stroke-dasharray="2,2" />
          {/* Dimension line */}
          <line x1={lineX} y1={y1} x2={lineX} y2={y2} stroke="currentColor" stroke-width="1" opacity="0.6" />
          {/* Arrows */}
          <polygon points={`${lineX - 3},${y1 + 6} ${lineX + 3},${y1 + 6} ${lineX},${y1}`} fill="currentColor" opacity="0.6" />
          <polygon points={`${lineX - 3},${y2 - 6} ${lineX + 3},${y2 - 6} ${lineX},${y2}`} fill="currentColor" opacity="0.6" />
          {/* Label */}
          <text
            x={lineX + (side === 'right' ? 6 : -6)}
            y={(y1 + y2) / 2}
            font-family="IBM Plex Mono, monospace"
            font-size="9"
            fill="currentColor"
            opacity="0.8"
            text-anchor={side === 'right' ? 'start' : 'end'}
            dominant-baseline="middle"
          >
            {label}
          </text>
        </g>
      );
    } else {
      // Horizontal dimension (diameter)
      const lineY = y1 + offset;
      return (
        <g>
          <line x1={x1} y1={y1} x2={x1} y2={lineY} stroke="currentColor" stroke-width="0.5" opacity="0.3" stroke-dasharray="2,2" />
          <line x1={x2} y1={y2} x2={x2} y2={lineY} stroke="currentColor" stroke-width="0.5" opacity="0.3" stroke-dasharray="2,2" />
          <line x1={x1} y1={lineY} x2={x2} y2={lineY} stroke="currentColor" stroke-width="1" opacity="0.6" />
          <polygon points={`${x1 + 6},${lineY - 3} ${x1 + 6},${lineY + 3} ${x1},${lineY}`} fill="currentColor" opacity="0.6" />
          <polygon points={`${x2 - 6},${lineY - 3} ${x2 - 6},${lineY + 3} ${x2},${lineY}`} fill="currentColor" opacity="0.6" />
          <text
            x={(x1 + x2) / 2}
            y={lineY + 12}
            font-family="IBM Plex Mono, monospace"
            font-size="9"
            fill="currentColor"
            opacity="0.8"
            text-anchor="middle"
          >
            {label}
          </text>
        </g>
      );
    }
  }

  return (
    <div class="border border-surface-border rounded-lg">
      <div class="border-b border-surface-border bg-surface-overlay px-4 py-2.5">
        <h3 class="text-base font-medium text-text-muted">Cartridge Profile</h3>
      </div>
      <div class="flex justify-center p-4 text-text-muted">
        <svg
          width="100%"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ maxWidth: `${Math.min(svgWidth, 320)}px` }}
          role="img"
          aria-label={`${name} cartridge dimension diagram`}
        >
          {/* Cartridge body */}
          <path
            d={profilePath}
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            opacity="0.7"
          />

          {/* Fill with subtle gradient */}
          <path
            d={profilePath}
            fill="currentColor"
            opacity="0.06"
          />

          {/* Dimension: Overall Length (right side) */}
          {dimLine(
            cx + halfRim, yBase,
            cx + halfRim, yBulletTip,
            `${overall_length_in}" OAL`,
            'right',
            35
          )}

          {/* Dimension: Case Length (right side, closer) */}
          {dimLine(
            cx + halfBody, yBase,
            cx + halfNeck, yCaseTop,
            `${case_length_in}" case`,
            'right',
            15
          )}

          {/* Dimension: Bullet Diameter (bottom) */}
          {dimLine(
            cx - halfBullet, yCaseTop - 5,
            cx + halfBullet, yCaseTop - 5,
            `${bullet_diameter_in}"`,
            'left',
            15
          )}

          {/* Dimension: Rim Diameter (bottom) */}
          {rim_diameter_in && (
            dimLine(
              cx - halfRim, yBase,
              cx + halfRim, yBase,
              `${rim_diameter_in}" rim`,
              'left',
              15
            )
          )}

          {/* Case type label */}
          <text
            x={svgWidth / 2}
            y={svgHeight - 5}
            font-family="IBM Plex Mono, monospace"
            font-size="9"
            fill="currentColor"
            opacity="0.5"
            text-anchor="middle"
          >
            {case_type}
          </text>
        </svg>
      </div>
    </div>
  );
}
