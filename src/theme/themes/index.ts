/**
 * Temas Completos — Light & Dark
 * Combina todos os tokens em um objeto de theme único para o ThemeProvider
 */

import { lightColors, darkColors, gradients } from '../colors';
import { tokens } from '../tokens';
import { headings, paragraphs, lists } from '../typography';
import { buttons, cards, inputs, containers as containerTokens, badges, alerts, modal, tables } from '../components';

// ============================================
// BASE THEME SHAPE (tipos genéricos flexíveis)
// ============================================
export interface ThemeColors {
  background: Record<string, string>;
  text: Record<string, string>;
  border: Record<string, string>;
  brand: Record<string, string>;
  success: Record<string, string>;
  warning: Record<string, string>;
  error: Record<string, string>;
  info: Record<string, string>;
  ai: Record<string, string>;
  overlay: string;
  overlayLight: string;
}

export interface ThemeGradients {
  brand: Record<string, string>;
  ai: Record<string, string>;
  success: Record<string, string>;
  surface: Record<string, string>;
  hero: Record<string, string>;
  mesh: Record<string, string>;
}

export interface ThemeSpacing {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  [key: string]: string;
}

export interface ThemeFontSizes {
  xs: string;
  sm: string;
  base: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
  '5xl': string;
  '6xl': string;
  [key: string]: string;
}

export interface ThemeFontFamilies {
  sans: string;
  mono: string;
}

export interface ThemeFontWeights {
  normal: number;
  medium: number;
  semibold: number;
  bold: number;
}

export interface ThemeLineHeights {
  tight: number;
  normal: number;
  relaxed: number;
}

export interface ThemeLetterSpacings {
  tight: string;
  normal: string;
  wide: string;
}

export interface ThemeRadii {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  full: string;
}

export interface ThemeShadows {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
}

export interface ThemeTransitions {
  fast: string;
  normal: string;
  slow: string;
}

export interface ThemeZIndices {
  hide: number;
  base: number;
  dropdown: number;
  sticky: number;
  fixed: number;
  modalBackdrop: number;
  modal: number;
  popover: number;
  tooltip: number;
  toast: number;
  sidebar: number;
}

export interface ThemeBreakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface ThemeMedia {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  downSm: string;
  downMd: string;
  downLg: string;
}

export interface ThemeContainers {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  full: string;
  page: Record<string, string>;
  narrow: Record<string, string>;
  wide: Record<string, string>;
  fullLayout: Record<string, string>;
  prose: Record<string, string>;
  [key: string]: string | Record<string, string>;
}

// Tipos flexíveis para componentes (aceitam pseudo-selectors, nested objects, etc.)
export type ThemeComponentStyles = Record<string, unknown>;

export interface ThemeHeadings {
  h1: ThemeComponentStyles;
  h2: ThemeComponentStyles;
  h3: ThemeComponentStyles;
  h4: ThemeComponentStyles;
  h5: ThemeComponentStyles;
  h6: ThemeComponentStyles;
}

export interface ThemeParagraphs {
  base: ThemeComponentStyles;
  lead: ThemeComponentStyles;
  small: ThemeComponentStyles;
  tiny: ThemeComponentStyles;
  code: ThemeComponentStyles;
  codeBlock: ThemeComponentStyles;
  link: ThemeComponentStyles;
  label: ThemeComponentStyles;
  helper: ThemeComponentStyles;
  button: ThemeComponentStyles;
}

export interface ThemeLists {
  unordered: ThemeComponentStyles;
  ordered: ThemeComponentStyles;
  item: ThemeComponentStyles;
}

export interface ThemeButtons extends ThemeComponentStyles {
  primary: ThemeComponentStyles;
  secondary: ThemeComponentStyles;
  outline: ThemeComponentStyles;
  ghost: ThemeComponentStyles;
  danger: ThemeComponentStyles;
  ai: ThemeComponentStyles;
  sizes: ThemeComponentStyles;
  fullWidth: ThemeComponentStyles;
}

export interface ThemeCards extends ThemeComponentStyles {
  base: ThemeComponentStyles;
  elevated: ThemeComponentStyles;
  outlined: ThemeComponentStyles;
  filled: ThemeComponentStyles;
  interactive: ThemeComponentStyles;
}

export interface ThemeInputs extends ThemeComponentStyles {
  base: ThemeComponentStyles;
  error: ThemeComponentStyles;
  success: ThemeComponentStyles;
  sizes: ThemeComponentStyles;
}

export interface ThemeBadges extends ThemeComponentStyles {
  base: ThemeComponentStyles;
  variants: ThemeComponentStyles;
}

export interface ThemeAlerts extends ThemeComponentStyles {
  base: ThemeComponentStyles;
  variants: ThemeComponentStyles;
}

export interface ThemeModal extends ThemeComponentStyles {
  overlay: ThemeComponentStyles;
  content: ThemeComponentStyles;
  closeButton: ThemeComponentStyles;
}

export interface ThemeTables extends ThemeComponentStyles {
  container: ThemeComponentStyles;
  table: ThemeComponentStyles;
  th: ThemeComponentStyles;
  td: ThemeComponentStyles;
  tr: ThemeComponentStyles;
}

// ============================================
// THEME COMPLETO
// ============================================
export interface BaseTheme {
  name: 'light' | 'dark';
  colors: ThemeColors;
  gradients: ThemeGradients;
  spacing: ThemeSpacing;
  fontSizes: ThemeFontSizes;
  fontFamilies: ThemeFontFamilies;
  fontWeights: ThemeFontWeights;
  lineHeights: ThemeLineHeights;
  letterSpacings: ThemeLetterSpacings;
  radii: ThemeRadii;
  shadows: ThemeShadows;
  transitions: ThemeTransitions;
  zIndices: ThemeZIndices;
  breakpoints: ThemeBreakpoints;
  media: ThemeMedia;
  containers: ThemeContainers;
  headings: ThemeHeadings;
  paragraphs: ThemeParagraphs;
  lists: ThemeLists;
  buttons: ThemeButtons;
  cards: ThemeCards;
  inputs: ThemeInputs;
  badges: ThemeBadges;
  alerts: ThemeAlerts;
  modal: ThemeModal;
  tables: ThemeTables;
}

// ============================================
// THEME LIGHT
// ============================================
export const lightTheme: BaseTheme = {
  name: 'light',
  colors: lightColors,
  gradients,
  spacing: tokens.spacing,
  fontSizes: tokens.fontSizes,
  fontFamilies: tokens.fontFamilies,
  fontWeights: tokens.fontWeights,
  lineHeights: tokens.lineHeights,
  letterSpacings: tokens.letterSpacings,
  radii: tokens.radii,
  shadows: tokens.shadows,
  transitions: tokens.transitions,
  zIndices: tokens.zIndices,
  breakpoints: tokens.breakpoints,
  media: tokens.media,
  containers: containerTokens,
  headings,
  paragraphs,
  lists,
  buttons,
  cards,
  inputs,
  badges,
  alerts,
  modal,
  tables,
} as const;

// ============================================
// THEME DARK
// ============================================
export const darkTheme: BaseTheme = {
  name: 'dark',
  colors: darkColors,
  gradients: {
    ...gradients,
    surface: {
      light: gradients.surface.dark,
      dark: gradients.surface.dark,
      card: gradients.surface.cardDark,
      cardDark: gradients.surface.cardDark,
    },
    hero: {
      light: gradients.hero.dark,
      dark: gradients.hero.dark,
    },
    mesh: {
      light: gradients.mesh.dark,
      dark: gradients.mesh.dark,
    },
  },
  spacing: tokens.spacing,
  fontSizes: tokens.fontSizes,
  fontFamilies: tokens.fontFamilies,
  fontWeights: tokens.fontWeights,
  lineHeights: tokens.lineHeights,
  letterSpacings: tokens.letterSpacings,
  radii: tokens.radii,
  shadows: {
    ...tokens.shadows,
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.4), 0 4px 6px -4px rgb(0 0 0 / 0.3)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.4), 0 8px 10px -6px rgb(0 0 0 / 0.3)',
  },
  transitions: tokens.transitions,
  zIndices: tokens.zIndices,
  breakpoints: tokens.breakpoints,
  media: tokens.media,
  containers: containerTokens,
  headings,
  paragraphs,
  lists,
  buttons: {
    ...buttons,
    primary: {
      ...buttons.primary,
      backgroundColor: darkColors.brand.primary,
      color: darkColors.text.inverse,
      '&:hover': { backgroundColor: darkColors.brand.primaryHover },
      '&:active': { backgroundColor: darkColors.brand.primaryActive },
      '&:focus-visible': { boxShadow: `0 0 0 3px ${darkColors.brand.light}` },
    },
    secondary: {
      ...buttons.secondary,
      backgroundColor: darkColors.background.tertiary,
      color: darkColors.text.primary,
      borderColor: darkColors.border.primary,
      '&:hover': {
        backgroundColor: darkColors.background.secondary,
        borderColor: darkColors.border.secondary,
      },
    },
    outline: {
      ...buttons.outline,
      color: darkColors.brand.primary,
      borderColor: darkColors.brand.primary,
      '&:hover': { backgroundColor: darkColors.brand.light },
    },
    ghost: {
      ...buttons.ghost,
      color: darkColors.text.primary,
      '&:hover': { backgroundColor: darkColors.background.tertiary },
    },
    danger: {
      ...buttons.danger,
      backgroundColor: darkColors.error.main,
      '&:hover': { backgroundColor: darkColors.error.dark },
    },
    ai: {
      ...buttons.ai,
      background: darkColors.ai.main,
      '&:hover': { background: darkColors.ai.dark },
      '&:focus-visible': { boxShadow: `0 0 0 3px ${darkColors.ai.light}` },
    },
  },
  cards: {
    ...cards,
    base: { ...cards.base, backgroundColor: darkColors.background.primary, borderColor: darkColors.border.primary },
    elevated: { ...cards.elevated, backgroundColor: darkColors.background.primary, borderColor: darkColors.border.primary },
    outlined: { ...cards.outlined, borderColor: darkColors.border.primary },
    filled: { ...cards.filled, backgroundColor: darkColors.background.secondary },
    interactive: {
      ...cards.interactive,
      backgroundColor: darkColors.background.primary,
      borderColor: darkColors.border.primary,
      '&:hover': { borderColor: darkColors.border.secondary },
    },
  },
  inputs: {
    ...inputs,
    base: {
      ...inputs.base,
      color: darkColors.text.primary,
      backgroundColor: darkColors.background.primary,
      borderColor: darkColors.border.primary,
      '&:hover': { borderColor: darkColors.border.secondary },
      '&:focus': { borderColor: darkColors.border.focus, boxShadow: `0 0 0 3px ${darkColors.brand.light}` },
      '&:disabled': { backgroundColor: darkColors.background.tertiary, color: darkColors.text.disabled },
      '&::placeholder': { color: darkColors.text.tertiary },
    },
    error: { ...inputs.error, borderColor: darkColors.error.main, '&:focus': { boxShadow: `0 0 0 3px ${darkColors.error.light}` } },
  },
  badges: {
    ...badges,
    variants: {
      default: { backgroundColor: darkColors.background.tertiary, color: darkColors.text.secondary },
      primary: { backgroundColor: darkColors.brand.light, color: darkColors.brand.primaryHover },
      success: { backgroundColor: darkColors.success.light, color: darkColors.success.text },
      warning: { backgroundColor: darkColors.warning.light, color: darkColors.warning.text },
      error: { backgroundColor: darkColors.error.light, color: darkColors.error.text },
      ai: { backgroundColor: darkColors.ai.light, color: darkColors.ai.text },
    },
  },
  alerts: {
    ...alerts,
    variants: {
      info: { backgroundColor: darkColors.info.light, color: darkColors.info.text, border: `1px solid ${darkColors.info.main}` },
      success: { backgroundColor: darkColors.success.light, color: darkColors.success.text, border: `1px solid ${darkColors.success.main}` },
      warning: { backgroundColor: darkColors.warning.light, color: darkColors.warning.text, border: `1px solid ${darkColors.warning.main}` },
      error: { backgroundColor: darkColors.error.light, color: darkColors.error.text, border: `1px solid ${darkColors.error.main}` },
    },
  },
  modal: {
    ...modal,
    overlay: { ...modal.overlay, backgroundColor: darkColors.overlay },
    content: { ...modal.content, backgroundColor: darkColors.background.primary },
    closeButton: {
      ...modal.closeButton,
      color: darkColors.text.tertiary,
      '&:hover': { backgroundColor: darkColors.background.tertiary, color: darkColors.text.primary },
    },
  },
  tables: {
    ...tables,
    th: { ...tables.th, color: darkColors.text.secondary, backgroundColor: darkColors.background.secondary, borderBottomColor: darkColors.border.primary },
    td: { ...tables.td, color: darkColors.text.primary, borderBottomColor: darkColors.border.primary },
    tr: { ...tables.tr, '&:hover': { backgroundColor: darkColors.background.secondary } },
  },
} as const;

// ============================================
// MAPA DE TEMAS
// ============================================
export const themes = {
  light: lightTheme,
  dark: darkTheme,
} as const;

export type ThemeName = keyof typeof themes;

// ============================================
// TYPE HELPERS PARA TYPESCRIPT
// ============================================
export type AppTheme = BaseTheme;

// Extender o DefaultTheme do styled-components
declare module 'styled-components' {
  export interface DefaultTheme extends BaseTheme {}
}