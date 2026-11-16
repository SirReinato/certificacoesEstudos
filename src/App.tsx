/**
 * App — SafeZone Studies Portal
 * Main entry point with routing, theme provider, and layout
 */

import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './theme';
import { GlobalStyle } from './theme';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" enableSystem={true}>
      <GlobalStyle />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
