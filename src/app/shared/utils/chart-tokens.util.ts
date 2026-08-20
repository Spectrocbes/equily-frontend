export interface ChartTokens {
  accent: string;
  gain: string;
  loss: string;
  gridline: string;
  axisText: string;
  surface: string;
}

function readVar(name: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const [r, g, b] = raw.split(/\s+/);
  return `rgb(${r}, ${g}, ${b})`;
}

/** Resolves the app's theme-aware CSS custom properties into rgb() strings D3 can use directly. */
export function getChartTokens(): ChartTokens {
  return {
    accent:   readVar('--accent'),
    gain:     readVar('--gain'),
    loss:     readVar('--loss'),
    gridline: readVar('--border-subtle'),
    axisText: readVar('--ink-muted'),
    surface:  readVar('--surface-card'),
  };
}

const DONUT_PALETTE_LIGHT = [
  '#0E5C56', '#8A6D3B', '#4B5A60', '#2F6F68',
  '#94A3B8', '#B08D57', '#64748B', '#3B4A50',
];
const DONUT_PALETTE_DARK = [
  '#4FB0A5', '#C7A66B', '#9FADB1', '#6FC4B8',
  '#6E7B7F', '#D9BD8C', '#889599', '#7C8B90',
];

/** Sober, theme-aware categorical palette for donut/allocation charts (holdings, wealth categories). */
export function getDonutPalette(): string[] {
  return document.documentElement.classList.contains('dark') ? DONUT_PALETTE_DARK : DONUT_PALETTE_LIGHT;
}
