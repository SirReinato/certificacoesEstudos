/**
 * Paleta de Cores — Tokens semânticos e primitivos
 * Atualizado para a nova paleta: Dark Navy, Slate Blue, Sage Green, Pale Lime
 */

// ============================================
// CORES PRIMITIVAS (Escalas 50-950)
// ============================================

// Neutros / Cinzas (Mantidos para estrutura)
export const gray = {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
  950: '#030712',
} as const;

// Brand Primary: Slate Blue / Navy (Baseado na imagem)
export const azure = {
  50: '#f0f4f8',
  100: '#d9e2ec',
  200: '#bcccdc',
  300: '#9fb3c8',
  400: '#829ab1',
  500: '#627d98', // Slate Blue
  600: '#486581',
  700: '#334d66',
  800: '#243b53',
  900: '#1b2e42',
  950: '#0f172a', // Dark Navy
} as const;

// Success: Sage Green / Pale Lime (Baseado na imagem)
export const emerald = {
  50: '#f7fee7',
  100: '#ecfccb',
  200: '#d9f99d',
  300: '#bef264',
  400: '#a3e635',
  500: '#84cc16', // Sage/Lime
  600: '#65a30d',
  700: '#4d7c0f',
  800: '#3f6212',
  900: '#36532c',
  950: '#1a2e05',
} as const;

// Amber / Yellow (Warning)
export const amber = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  400: '#fbbf24',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
  800: '#92400e',
  900: '#78350f',
  950: '#451a03',
} as const;

// Red (Error / Danger)
export const red = {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  400: '#f87171',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
  800: '#991b1b',
  900: '#7f1d1d',
  950: '#450a0a',
} as const;

// Purple / Violet (AI / Accent)
export const violet = {
  50: '#f5f3ff',
  100: '#ede9fe',
  200: '#ddd6fe',
  300: '#c4b5fd',
  400: '#a78bfa',
  500: '#8b5cf6',
  600: '#7c3aed',
  700: '#6d28d9',
  800: '#5b21b6',
  900: '#4c1d95',
  950: '#2e1065',
} as const;

// ============================================
// CORES SEMÂNTICAS (Light Theme)
// ============================================
export const lightColors = {
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
    tertiary: '#f1f5f9',
    inverse: '#0f172a',
  },

  text: {
    primary: '#0f172a',
    secondary: '#334155',
    tertiary: '#64748b',
    inverse: '#ffffff',
    disabled: '#94a3b8',
    link: '#486581',
    linkHover: '#334d66',
  },

  border: {
    primary: '#e2e8f0',
    secondary: '#cbd5e1',
    focus: '#627d98',
    error: '#ef4444',
    success: '#84cc16',
  },

  brand: {
    primary: '#486581',
    primaryHover: '#334d66',
    primaryActive: '#243b53',
    light: '#d9e2ec',
    dark: '#0f172a',
  },

  success: {
    light: '#ecfccb',
    main: '#84cc16',
    dark: '#3f6212',
    text: '#3f6212',
  },

  warning: {
    light: '#fef3c7',
    main: '#f59e0b',
    dark: '#92400e',
    text: '#92400e',
  },

  error: {
    light: '#fee2e2',
    main: '#ef4444',
    dark: '#991b1b',
    text: '#991b1b',
  },

  info: {
    light: '#d9e2ec',
    main: '#627d98',
    dark: '#243b53',
    text: '#243b53',
  },

  ai: {
    light: '#ede9fe',
    main: '#8b5cf6',
    dark: '#5b21b6',
    text: '#5b21b6',
  },

  overlay: 'rgba(15, 23, 42, 0.5)',
  overlayLight: 'rgba(15, 23, 42, 0.3)',
} as const;

// ============================================
// CORES SEMÂNTICAS (Dark Theme)
// ============================================
export const darkColors = {
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
    inverse: '#ffffff',
  },

  text: {
    primary: '#f8fafc',
    secondary: '#cbd5e1',
    tertiary: '#94a3b8',
    inverse: '#0f172a',
    disabled: '#475569',
    link: '#9fb3c8',
    linkHover: '#bcccdc',
  },

  border: {
    primary: '#334155',
    secondary: '#475569',
    focus: '#9fb3c8',
    error: '#f87171',
    success: '#bef264',
  },

  brand: {
    primary: '#9fb3c8',
    primaryHover: '#bcccdc',
    primaryActive: '#d9e2ec',
    light: '#1b2e42',
    dark: '#f8fafc',
  },

  success: {
    light: '#36532c',
    main: '#84cc16',
    dark: '#bef264',
    text: '#bef264',
  },

  warning: {
    light: '#451a03',
    main: '#f59e0b',
    dark: '#fcd34d',
    text: '#fcd34d',
  },

  error: {
    light: '#450a0a',
    main: '#ef4444',
    dark: '#fca5a5',
    text: '#fca5a5',
  },

  info: {
    light: '#1b2e42',
    main: '#627d98',
    dark: '#9fb3c8',
    text: '#9fb3c8',
  },

  ai: {
    light: '#2e1065',
    main: '#8b5cf6',
    dark: '#c4b5fd',
    text: '#c4b5fd',
  },

  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
} as const;

// ============================================
// GRADIENTS
// ============================================
export const gradients = {
  brand: {
    primary: 'linear-gradient(135deg, #627d98 0%, #486581 100%)',
    primaryHover: 'linear-gradient(135deg, #486581 0%, #334d66 100%)',
    reverse: 'linear-gradient(135deg, #486581 0%, #627d98 100%)',
  },

  ai: {
    primary: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    secondary: 'linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)',
    subtle: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
  },

  success: {
    primary: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
    subtle: 'linear-gradient(135deg, rgba(132, 204, 22, 0.1) 0%, rgba(101, 163, 13, 0.1) 100%)',
  },

  surface: {
    light: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
    dark: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
    card: 'linear-gradient(145deg, #ffffff 0%, #f1f5f9 100%)',
    cardDark: 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
  },

  hero: {
    light: 'linear-gradient(135deg, #f0f4f8 0%, #ede9fe 50%, #f5f3ff 100%)',
    dark: 'linear-gradient(135deg, #1b2e42 0%, #2e1065 50%, #0f172a 100%)',
  },

  mesh: {
    light: 'radial-gradient(ellipse at 50% 50%, rgba(72, 101, 129, 0.15) 0%, transparent 70%)',
    dark: 'radial-gradient(ellipse at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
  },
} as const;

export type ColorScale = typeof gray;
export type SemanticColors = typeof lightColors;
export type GradientSet = typeof gradients;
