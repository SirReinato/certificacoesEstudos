/**
 * GlobalStyle — Estilos globais da aplicação
 * Reset CSS, tipografia base, variáveis CSS customizadas, scrollbar, selection, etc.
 */

import { createGlobalStyle } from 'styled-components';

export const GlobalStyle = createGlobalStyle<Record<string, never>>`
  /* ============================================
     CSS RESET & BASE
     ============================================ */
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
    scroll-behavior: smooth;
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }

  body {
    font-family: ${({ theme }) => theme.fontFamilies.sans};
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: ${({ theme }) => theme.fontWeights.normal};
    line-height: ${({ theme }) => theme.lineHeights.normal};
    color: ${({ theme }) => theme.colors.text.primary};
    background-color: ${({ theme }) => theme.colors.background.primary};
    transition: background-color ${({ theme }) => theme.transitions.normal},
                color ${({ theme }) => theme.transitions.normal};
  }

  /* ============================================
     TIPOGRAFIA BASE
     ============================================ */
  h1, h2, h3, h4, h5, h6 {
    font-family: ${({ theme }) => theme.fontFamilies.sans};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
    line-height: ${({ theme }) => theme.lineHeights.tight};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  h1 { font-size: ${({ theme }) => theme.fontSizes['5xl']}; }
  h2 { font-size: ${({ theme }) => theme.fontSizes['4xl']}; }
  h3 { font-size: ${({ theme }) => theme.fontSizes['3xl']}; }
  h4 { font-size: ${({ theme }) => theme.fontSizes['2xl']}; }
  h5 { font-size: ${({ theme }) => theme.fontSizes.xl}; }
  h6 { font-size: ${({ theme }) => theme.fontSizes.lg}; }

  p {
    margin-bottom: 1rem;
    line-height: ${({ theme }) => theme.lineHeights.relaxed};
  }

  a {
    color: ${({ theme }) => theme.colors.text.link};
    text-decoration: none;
    transition: color ${({ theme }) => theme.transitions.fast};

    &:hover {
      color: ${({ theme }) => theme.colors.text.linkHover};
      text-decoration: underline;
    }

    &:focus-visible {
      outline: none;
      border-radius: ${({ theme }) => theme.radii.sm};
      box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
    }
  }

  code, pre, kbd, samp {
    font-family: ${({ theme }) => theme.fontFamilies.mono};
    font-size: 0.9em;
  }

  pre {
    background-color: ${({ theme }) => theme.colors.background.tertiary};
    border-radius: ${({ theme }) => theme.radii.md};
    padding: ${({ theme }) => theme.spacing[4]};
    overflow-x: auto;
    margin-bottom: ${({ theme }) => theme.spacing[4]};

    code {
      background: none;
      padding: 0;
      font-size: inherit;
    }
  }

  code:not(pre code) {
    background-color: ${({ theme }) => theme.colors.background.tertiary};
    padding: 0.125rem 0.375rem;
    border-radius: ${({ theme }) => theme.radii.sm};
    font-size: 0.875em;
  }

  /* ============================================
     LISTAS
     ============================================ */
  ul, ol {
    padding-left: ${({ theme }) => theme.spacing[6]};
    margin-bottom: ${({ theme }) => theme.spacing[4]};
  }

  li {
    margin-bottom: ${({ theme }) => theme.spacing[2]};
    line-height: ${({ theme }) => theme.lineHeights.relaxed};
  }

  /* ============================================
     IMAGENS E MÍDIA
     ============================================ */
  img, video, canvas, svg {
    display: block;
    max-width: 100%;
    height: auto;
  }

  /* ============================================
     FORMULÁRIOS
     ============================================ */
  button, input, select, textarea {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    color: inherit;
  }

  button {
    background: none;
    border: none;
    cursor: pointer;
  }

  input, select, textarea {
    width: 100%;
  }

  /* Remove setas de number input no Firefox */
  input[type='number'] {
    -moz-appearance: textfield;
  }

  input[type='number']::-webkit-outer-spin-button,
  input[type='number']::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* ============================================
     TABELAS
     ============================================ */
  table {
    border-collapse: collapse;
    width: 100%;
  }

  th, td {
    text-align: left;
    padding: ${({ theme }) => theme.spacing[3]} ${({ theme }) => theme.spacing[4]};
  }

  /* ============================================
     SELECTION
     ============================================ */
  ::selection {
    background-color: ${({ theme }) => theme.colors.brand.light};
    color: ${({ theme }) => theme.colors.brand.primaryHover};
  }

  ::-moz-selection {
    background-color: ${({ theme }) => theme.colors.brand.light};
    color: ${({ theme }) => theme.colors.brand.primaryHover};
  }

  /* ============================================
     SCROLLBAR
     ============================================ */
  * {
    scrollbar-width: thin;
    scrollbar-color: ${({ theme }) => theme.colors.border.secondary} transparent;
  }

  *::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  *::-webkit-scrollbar-track {
    background: transparent;
  }

  *::-webkit-scrollbar-thumb {
    background-color: ${({ theme }) => theme.colors.border.secondary};
    border-radius: ${({ theme }) => theme.radii.full};
    border: 2px solid transparent;
    background-clip: content-box;
  }

  *::-webkit-scrollbar-thumb:hover {
    background-color: ${({ theme }) => theme.colors.border.primary};
  }

  *::-webkit-scrollbar-corner {
    background: transparent;
  }

  /* ============================================
     FOCUS VISIBLE (acessibilidade)
     ============================================ */
  :focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand.light};
    border-radius: ${({ theme }) => theme.radii.sm};
  }

  /* Remove focus ring para mouse users */
  :focus:not(:focus-visible) {
    outline: none;
    box-shadow: none;
  }

  /* ============================================
     UTILITÁRIOS GLOBAIS
     ============================================ */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .skip-link {
    position: absolute;
    top: -100%;
    left: ${({ theme }) => theme.spacing[4]};
    padding: ${({ theme }) => theme.spacing[2]} ${({ theme }) => theme.spacing[4]};
    background: ${({ theme }) => theme.colors.brand.primary};
    color: ${({ theme }) => theme.colors.text.inverse};
    border-radius: ${({ theme }) => theme.radii.md};
    z-index: ${({ theme }) => theme.zIndices.toast};
    transition: top ${({ theme }) => theme.transitions.fast};

    &:focus {
      top: ${({ theme }) => theme.spacing[4]};
    }
  }

  /* Container helper */
  .container {
    width: 100%;
    max-width: ${({ theme }) => theme.containers.xl};
    margin: 0 auto;
    padding: 0 ${({ theme }) => theme.spacing[4]};
  }

  .container-narrow {
    max-width: ${({ theme }) => theme.containers.md};
  }

  .container-wide {
    max-width: ${({ theme }) => theme.containers['2xl']};
  }

  .container-prose {
    max-width: 65ch;
  }

  /* ============================================
     ANIMAÇÕES BASE
     ============================================ */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  @keyframes slideInFromTop {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInFromBottom {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideInFromLeft {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes slideInFromRight {
    from {
      opacity: 0;
      transform: translateX(10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  /* Classes de animação utilitárias */
  .animate-fade-in { animation: fadeIn ${({ theme }) => theme.transitions.normal} ease-out; }
  .animate-fade-out { animation: fadeOut ${({ theme }) => theme.transitions.normal} ease-in; }
  .animate-slide-down { animation: slideInFromTop ${({ theme }) => theme.transitions.normal} ease-out; }
  .animate-slide-up { animation: slideInFromBottom ${({ theme }) => theme.transitions.normal} ease-out; }
  .animate-slide-right { animation: slideInFromLeft ${({ theme }) => theme.transitions.normal} ease-out; }
  .animate-slide-left { animation: slideInFromRight ${({ theme }) => theme.transitions.normal} ease-out; }
  .animate-scale-in { animation: scaleIn ${({ theme }) => theme.transitions.fast} ease-out; }
  .animate-spin { animation: spin 1s linear infinite; }
  .animate-pulse { animation: pulse 2s ease-in-out infinite; }
  .animate-shimmer {
    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.colors.background.tertiary} 25%,
      ${({ theme }) => theme.colors.background.secondary} 50%,
      ${({ theme }) => theme.colors.background.tertiary} 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  /* ============================================
     PRINT STYLES
     ============================================ */
  @media print {
    .no-print { display: none !important; }
    body { background: white !important; color: black !important; }
    a { text-decoration: underline; }
    a[href^="http"]::after { content: " (" attr(href) ")"; }
  }
`;