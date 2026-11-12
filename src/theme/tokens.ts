/**
 * Design Tokens — Base centralizada de todos os valores de design.
 * Fonte única da verdade para cores, tipografia, espaçamento, etc.
 */

// ============================================
// ESCALA DE ESPAÇAMENTO (base 4px)
// ============================================
export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

// ============================================
// TIPOGRAFIA
// ============================================
export const fontFamilies = {
  sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', monospace",
} as const;

export const fontSizes = {
  xs: '0.75rem',    // 12px
  sm: '0.875rem',   // 14px
  base: '1rem',     // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',    // 20px
  '2xl': '1.5rem',  // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
  '5xl': '3rem',     // 48px
  '6xl': '3.75rem',  // 60px
} as const;

export const fontWeights = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const lineHeights = {
  tight: 1.1,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const letterSpacings = {
  tight: '-0.02em',
  normal: '0',
  wide: '0.02em',
} as const;

// ============================================
// CONTAINERS (max-widths)
// ============================================
export const containers = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '100%',
} as const;

// ============================================
// BORDER RADIUS
// ============================================
export const radii = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

// ============================================
// SHADOWS
// ============================================
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const;

// ============================================
// TRANSITIONS
// ============================================
export const transitions = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
} as const;

// ============================================
// Z-INDEX
// ============================================
export const zIndices = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
  sidebar: 900,
} as const;

// ============================================
// BREAKPOINTS
// ============================================
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================
// MEDIA QUERIES HELPERS
// ============================================
export const media = {
  sm: `@media (min-width: ${breakpoints.sm})`,
  md: `@media (min-width: ${breakpoints.md})`,
  lg: `@media (min-width: ${breakpoints.lg})`,
  xl: `@media (min-width: ${breakpoints.xl})`,
  '2xl': `@media (min-width: ${breakpoints['2xl']})`,
  // Para mobile-first, usar max-width
  downSm: `@media (max-width: ${parseInt(breakpoints.sm) - 1}px)`,
  downMd: `@media (max-width: ${parseInt(breakpoints.md) - 1}px)`,
  downLg: `@media (max-width: ${parseInt(breakpoints.lg) - 1}px)`,
} as const;

// ============================================
// TOKENS AGREGADOS (para import único)
// ============================================
export const tokens = {
  spacing,
  fontFamilies,
  fontSizes,
  fontWeights,
  lineHeights,
  letterSpacings,
  containers,
  radii,
  shadows,
  transitions,
  zIndices,
  breakpoints,
  media,
} as const;