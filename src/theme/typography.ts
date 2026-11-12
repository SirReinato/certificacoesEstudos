/**
 * Tipografia — Estilos para títulos, parágrafos, labels, etc.
 * Baseado na escala de tipos do tokens.ts
 */

import { fontSizes, fontWeights, lineHeights, letterSpacings, fontFamilies } from './tokens';

// ============================================
// ESTILOS DE TÍTULOS (h1-h6)
// ============================================
export const headings = {
  h1: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes['5xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.tight,
    marginBottom: '0.5em',
  },
  h2: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.tight,
    marginBottom: '0.5em',
  },
  h3: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.tight,
    letterSpacing: letterSpacings.tight,
    marginBottom: '0.5em',
  },
  h4: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    marginBottom: '0.5em',
  },
  h5: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    marginBottom: '0.5em',
  },
  h6: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    marginBottom: '0.5em',
  },
} as const;

// ============================================
// ESTILOS DE PARÁGRAFOS E TEXTOS
// ============================================
export const paragraphs = {
  // Parágrafo padrão
  base: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacings.normal,
    marginBottom: '1em',
  },

  // Parágrafo grande (lead)
  lead: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.relaxed,
    letterSpacing: letterSpacings.normal,
    marginBottom: '1em',
  },

  // Parágrafo pequeno
  small: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    marginBottom: '0.75em',
  },

  // Texto minúsculo (caption, legal, etc)
  tiny: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.wide,
    marginBottom: '0.5em',
  },

  // Código inline
  code: {
    fontFamily: fontFamilies.mono,
    fontSize: '0.9em',
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
  },

  // Bloco de código
  codeBlock: {
    fontFamily: fontFamilies.mono,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
  },

  // Link
  link: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    textDecoration: 'none',
  },

  // Label (formulários)
  label: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    marginBottom: '0.25rem',
  },

  // Helper text / error message
  helper: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.normal,
    marginTop: '0.25rem',
  },

  // Botão
  button: {
    fontFamily: fontFamilies.sans,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    lineHeight: lineHeights.normal,
    letterSpacing: letterSpacings.wide,
    textTransform: 'none' as const,
  },
} as const;

// ============================================
// ESTILOS DE LISTAS
// ============================================
export const lists = {
  unordered: {
    paddingLeft: '1.5rem',
    listStyle: 'disc',
  },
  ordered: {
    paddingLeft: '1.5rem',
    listStyle: 'decimal',
  },
  item: {
    marginBottom: '0.5rem',
    lineHeight: lineHeights.relaxed,
  },
} as const;

// ============================================
// TIPOS TYPESCRIPT
// ============================================
export type HeadingLevel = keyof typeof headings;
export type ParagraphVariant = keyof typeof paragraphs;