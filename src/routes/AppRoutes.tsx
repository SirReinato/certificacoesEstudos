import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Biblioteca } from '../pages/Biblioteca';
import { NovoConteudo } from '../pages/NovoConteudo';
import { EstudoDiario } from '../pages/EstudoDiario';
import { Configuracoes } from '../pages/Configuracoes';
import { Atividade } from '../pages/Atividade';
import { MainLayout } from '../components/layout/MainLayout';

const LoadingContainerStl = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.base};
`;

function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingContainerStl>Carregando SafeZone Studies...</LoadingContainerStl>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/biblioteca" element={<Biblioteca />} />
          <Route path="/biblioteca/novo" element={<NovoConteudo />} />
          <Route path="/estudo" element={<EstudoDiario />} />
          <Route path="/config" element={<Configuracoes />} />
          <Route path="/atividade" element={<Atividade />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}