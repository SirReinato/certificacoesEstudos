/**
 * Theme Barrel Export — Exportação centralizada de todo o sistema de theme
 */

// Tokens base
export * from './tokens';
export * from './colors';
export * from './typography';
// Export components but rename containers to avoid conflict
export { buttons, cards, inputs, containers as componentContainers, badges, alerts, modal, tables } from './components';

// Temas
export { lightTheme, darkTheme, themes, type ThemeName, type AppTheme } from './themes';

// GlobalStyle e Provider
export { GlobalStyle } from './GlobalStyle';
export { ThemeProvider, useTheme, useThemeName, useThemeToggle, useSetTheme, useThemeControl } from './ThemeProvider';