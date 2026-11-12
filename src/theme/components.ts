/**
 * Component Tokens — Estilos base para componentes reutilizáveis
 * Botões, Cards, Inputs, Containers, Badges, etc.
 */

import { spacing, radii, shadows, transitions, fontSizes, fontWeights, fontFamilies, lineHeights } from './tokens';
import { lightColors } from './colors';

// ============================================
// BOTÕES
// ============================================
const buttonBase = {
  fontFamily: fontFamilies.sans,
  fontSize: fontSizes.sm,
  fontWeight: fontWeights.semibold,
  lineHeight: lineHeights.normal,
  borderRadius: radii.md,
  padding: `${spacing[2]} ${spacing[4]}`,
  transition: transitions.fast,
  cursor: 'pointer',
  border: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing[2],
  textDecoration: 'none',
  whiteSpace: 'nowrap' as const,
};

export const buttons = {
  // Variants
  primary: {
    ...buttonBase,
    backgroundColor: lightColors.brand.primary,
    color: lightColors.text.inverse,
    boxShadow: shadows.sm,
    '&:hover': {
      backgroundColor: lightColors.brand.primaryHover,
      boxShadow: shadows.md,
    },
    '&:active': {
      backgroundColor: lightColors.brand.primaryActive,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `${shadows.md}, 0 0 0 3px ${lightColors.brand.light}`,
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },

  secondary: {
    ...buttonBase,
    backgroundColor: lightColors.background.tertiary,
    color: lightColors.text.primary,
    border: `1px solid ${lightColors.border.primary}`,
    '&:hover': {
      backgroundColor: lightColors.background.secondary,
      borderColor: lightColors.border.secondary,
    },
    '&:active': {
      backgroundColor: lightColors.border.primary,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${lightColors.brand.light}`,
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },

  outline: {
    ...buttonBase,
    backgroundColor: 'transparent',
    color: lightColors.brand.primary,
    border: `2px solid ${lightColors.brand.primary}`,
    '&:hover': {
      backgroundColor: lightColors.brand.light,
    },
    '&:active': {
      backgroundColor: lightColors.brand.primary,
      color: lightColors.text.inverse,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${lightColors.brand.light}`,
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },

  ghost: {
    ...buttonBase,
    backgroundColor: 'transparent',
    color: lightColors.text.primary,
    '&:hover': {
      backgroundColor: lightColors.background.tertiary,
    },
    '&:active': {
      backgroundColor: lightColors.border.primary,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${lightColors.brand.light}`,
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },

  danger: {
    ...buttonBase,
    backgroundColor: lightColors.error.main,
    color: lightColors.text.inverse,
    '&:hover': {
      backgroundColor: lightColors.error.dark,
    },
    '&:active': {
      backgroundColor: lightColors.error.dark,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${lightColors.error.light}`,
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },

  ai: {
    ...buttonBase,
    background: lightColors.ai.main,
    color: lightColors.text.inverse,
    '&:hover': {
      background: lightColors.ai.dark,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${lightColors.ai.light}`,
    },
  },

  // Sizes
  sizes: {
    sm: {
      padding: `${spacing[1]} ${spacing[3]}`,
      fontSize: fontSizes.xs,
      borderRadius: radii.sm,
      gap: spacing[1],
    },
    md: {
      padding: `${spacing[2]} ${spacing[4]}`,
      fontSize: fontSizes.sm,
      borderRadius: radii.md,
      gap: spacing[2],
    },
    lg: {
      padding: `${spacing[3]} ${spacing[6]}`,
      fontSize: fontSizes.base,
      borderRadius: radii.lg,
      gap: spacing[3],
    },
    icon: {
      padding: spacing[2],
      borderRadius: radii.full,
    },
  },

  // Full width
  fullWidth: {
    width: '100%',
  },
} as const;

// ============================================
// CARDS
// ============================================
export const cards = {
  base: {
    backgroundColor: lightColors.background.primary,
    border: `1px solid ${lightColors.border.primary}`,
    borderRadius: radii.lg,
    boxShadow: shadows.sm,
    transition: transitions.normal,
  },
  elevated: {
    backgroundColor: lightColors.background.primary,
    border: `1px solid ${lightColors.border.primary}`,
    borderRadius: radii.lg,
    boxShadow: shadows.lg,
    transition: transitions.normal,
  },
  outlined: {
    backgroundColor: 'transparent',
    border: `1px solid ${lightColors.border.primary}`,
    borderRadius: radii.lg,
    boxShadow: 'none',
  },
  filled: {
    backgroundColor: lightColors.background.secondary,
    border: 'none',
    borderRadius: radii.lg,
    boxShadow: 'none',
  },
  interactive: {
    backgroundColor: lightColors.background.primary,
    border: `1px solid ${lightColors.border.primary}`,
    borderRadius: radii.lg,
    boxShadow: shadows.sm,
    transition: transitions.normal,
    cursor: 'pointer',
    '&:hover': {
      boxShadow: shadows.md,
      borderColor: lightColors.border.secondary,
      transform: 'translateY(-2px)',
    },
  },
} as const;

// ============================================
// INPUTS / FORMULÁRIOS
// ============================================
export const inputs = {
  base: {
    width: '100%',
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    color: lightColors.text.primary,
    backgroundColor: lightColors.background.primary,
    border: `1px solid ${lightColors.border.primary}`,
    borderRadius: radii.md,
    padding: `${spacing[2]} ${spacing[3]}`,
    transition: transitions.fast,
    '&:hover': {
      borderColor: lightColors.border.secondary,
    },
    '&:focus': {
      outline: 'none',
      borderColor: lightColors.border.focus,
      boxShadow: `0 0 0 3px ${lightColors.brand.light}`,
    },
    '&:disabled': {
      backgroundColor: lightColors.background.tertiary,
      color: lightColors.text.disabled,
      cursor: 'not-allowed',
    },
    '&::placeholder': {
      color: lightColors.text.tertiary,
    },
  },
  error: {
    borderColor: lightColors.error.main,
    '&:focus': {
      boxShadow: `0 0 0 3px ${lightColors.error.light}`,
    },
  },
  success: {
    borderColor: lightColors.success.main,
    '&:focus': {
      boxShadow: `0 0 0 3px ${lightColors.success.light}`,
    },
  },
  sizes: {
    sm: {
      padding: `${spacing[1]} ${spacing[2]}`,
      fontSize: fontSizes.sm,
      borderRadius: radii.sm,
    },
    md: {
      padding: `${spacing[2]} ${spacing[3]}`,
      fontSize: fontSizes.base,
      borderRadius: radii.md,
    },
    lg: {
      padding: `${spacing[3]} ${spacing[4]}`,
      fontSize: fontSizes.lg,
      borderRadius: radii.lg,
    },
  },
} as const;

// ============================================
// CONTAINERS / LAYOUT
// ============================================
export const containers = {
  // Simple max-width tokens (for use in GlobalStyle, etc.)
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '100%',
  // Layout objects (for styled-components)
  page: {
    width: '100%',
    maxWidth: '1280px',
    margin: '0 auto',
    padding: `0 ${spacing[4]}`,
  },
  narrow: {
    width: '100%',
    maxWidth: '768px',
    margin: '0 auto',
    padding: `0 ${spacing[4]}`,
  },
  wide: {
    width: '100%',
    maxWidth: '1536px',
    margin: '0 auto',
    padding: `0 ${spacing[4]}`,
  },
  fullLayout: {
    width: '100%',
    padding: `0 ${spacing[4]}`,
  },
  // Para conteúdo de leitura (artigos, docs)
  prose: {
    width: '100%',
    maxWidth: '65ch',
    margin: '0 auto',
    padding: `0 ${spacing[4]}`,
  },
} as const;

// ============================================
// BADGES / TAGS
// ============================================
export const badges = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    padding: `${spacing[1]} ${spacing[2]}`,
    borderRadius: radii.full,
    whiteSpace: 'nowrap' as const,
  },
  variants: {
    default: {
      backgroundColor: lightColors.background.tertiary,
      color: lightColors.text.secondary,
    },
    primary: {
      backgroundColor: lightColors.brand.light,
      color: lightColors.brand.primaryHover,
    },
    success: {
      backgroundColor: lightColors.success.light,
      color: lightColors.success.dark,
    },
    warning: {
      backgroundColor: lightColors.warning.light,
      color: lightColors.warning.dark,
    },
    error: {
      backgroundColor: lightColors.error.light,
      color: lightColors.error.dark,
    },
    ai: {
      backgroundColor: lightColors.ai.light,
      color: lightColors.ai.dark,
    },
  },
} as const;

// ============================================
// ALERTS / TOASTS
// ============================================
export const alerts = {
  base: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: radii.lg,
    fontSize: fontSizes.sm,
    lineHeight: lineHeights.normal,
  },
  variants: {
    info: {
      backgroundColor: lightColors.info.light,
      color: lightColors.info.dark,
      border: `1px solid ${lightColors.info.main}`,
    },
    success: {
      backgroundColor: lightColors.success.light,
      color: lightColors.success.dark,
      border: `1px solid ${lightColors.success.main}`,
    },
    warning: {
      backgroundColor: lightColors.warning.light,
      color: lightColors.warning.dark,
      border: `1px solid ${lightColors.warning.main}`,
    },
    error: {
      backgroundColor: lightColors.error.light,
      color: lightColors.error.dark,
      border: `1px solid ${lightColors.error.main}`,
    },
  },
} as const;

// ============================================
// MODAL / DRAWER
// ============================================
export const modal = {
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: lightColors.overlay,
    zIndex: 400,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },
  content: {
    backgroundColor: lightColors.background.primary,
    borderRadius: radii.xl,
    boxShadow: shadows.xl,
    maxWidth: '32rem',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto' as const,
    zIndex: 500,
  },
  closeButton: {
    position: 'absolute' as const,
    top: spacing[3],
    right: spacing[3],
    padding: spacing[1],
    borderRadius: radii.full,
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: lightColors.text.tertiary,
    '&:hover': {
      backgroundColor: lightColors.background.tertiary,
      color: lightColors.text.primary,
    },
  },
} as const;

// ============================================
// TABLES
// ============================================
export const tables = {
  container: {
    width: '100%',
    overflowX: 'auto' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: fontSizes.sm,
  },
  th: {
    padding: `${spacing[3]} ${spacing[4]}`,
    textAlign: 'left' as const,
    fontWeight: fontWeights.semibold,
    color: lightColors.text.secondary,
    backgroundColor: lightColors.background.secondary,
    borderBottom: `2px solid ${lightColors.border.primary}`,
    whiteSpace: 'nowrap' as const,
  },
  td: {
    padding: `${spacing[3]} ${spacing[4]}`,
    color: lightColors.text.primary,
    borderBottom: `1px solid ${lightColors.border.primary}`,
  },
  tr: {
    '&:hover': {
      backgroundColor: lightColors.background.secondary,
    },
  },
} as const;