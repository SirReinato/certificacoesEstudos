/**
 * App — SafeZone Studies Portal
 * Main entry point with routing, theme provider, and layout
 */

import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './theme';
import { GlobalStyle } from './theme';
import AppRoutes from './routes/AppRoutes';



export default function App() {
  return (
    <ThemeProvider defaultTheme="light" enableSystem={true}>
      <GlobalStyle />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}
