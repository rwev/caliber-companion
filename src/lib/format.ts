export function fmtRange(range: [number, number], unit: string): string {
  return `${range[0]}–${range[1]} ${unit}`;
}

export function fmtNumber(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: decimals });
}

export function fmtCurrency(range: [number, number]): string {
  return `$${range[0].toFixed(2)}–$${range[1].toFixed(2)}`;
}

export function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
