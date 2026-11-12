/**
 * ThemeProvider — Provider de tema com suporte a light/dark + persistência
 * Inclui hooks useTheme e useThemeToggle
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { lightTheme, darkTheme, type ThemeName, type AppTheme } from './themes';

interface ThemeContextValue {
  theme: AppTheme;
  themeName: ThemeName;
  toggleTheme: () => void;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// ============================================
// LOCALSTORAGE KEY
// ============================================
const THEME_STORAGE_KEY = 'app-theme-preference';

// ============================================
// HOOK PARA DETECTAR PREFERÊNCIA DO SISTEMA
// ============================================
function useSystemTheme(): ThemeName {
  const [systemTheme, setSystemTheme] = useState<ThemeName>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return systemTheme;
}

// ============================================
// THEME PROVIDER COMPONENT
// ============================================
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeName;
  enableSystem?: boolean; // Se true, segue preferência do sistema quando não há preferência salva
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  enableSystem = true,
}: ThemeProviderProps) {
  const systemTheme = useSystemTheme();

  // Inicializar tema do localStorage ou default
  const [themeName, setThemeNameState] = useState<ThemeName>(() => {
    if (typeof window === 'undefined') return defaultTheme;

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
    } catch {
      // localStorage não disponível
    }

    // Se enableSystem, usar preferência do sistema
    if (enableSystem) return systemTheme;
    return defaultTheme;
  });

  // Resolver theme object
  const theme = useMemo(() => (themeName === 'dark' ? darkTheme : lightTheme), [themeName]);

  // Persistir no localStorage
  const setTheme = useCallback((name: ThemeName) => {
    setThemeNameState(name);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, name);
    } catch {
      // ignore
    }
  }, []);

  // Toggle entre light/dark
  const toggleTheme = useCallback(() => {
    setTheme(themeName === 'light' ? 'dark' : 'light');
  }, [themeName, setTheme]);

  // Sincronizar com system theme se enableSystem e não há preferência salva
  useEffect(() => {
    if (!enableSystem) return;

    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (!stored) {
        setThemeNameState(systemTheme);
      }
    } catch {
      // ignore
    }
  }, [systemTheme, enableSystem]);

  // Aplicar classe no <html> para CSS globals se necessário
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(themeName);
    root.setAttribute('data-theme', themeName);
  }, [themeName]);

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      theme,
      themeName,
      toggleTheme,
      setTheme,
    }),
    [theme, themeName, toggleTheme, setTheme]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <StyledThemeProvider theme={theme}>
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
}

// ============================================
// HOOKS
// ============================================
export function useTheme(): AppTheme {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context.theme;
}

export function useThemeName(): ThemeName {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeName deve ser usado dentro de um ThemeProvider');
  }
  return context.themeName;
}

export function useThemeToggle(): () => void {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeToggle deve ser usado dentro de um ThemeProvider');
  }
  return context.toggleTheme;
}

export function useSetTheme(): (name: ThemeName) => void {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useSetTheme deve ser usado dentro de um ThemeProvider');
  }
  return context.setTheme;
}

// Hook combinado conveniente
export function useThemeControl() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeControl deve ser usado dentro de um ThemeProvider');
  }
  return context;
}