import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '../pages/Dashboard';
import { Biblioteca } from '../pages/Biblioteca';
import { NovoConteudo } from '../pages/NovoConteudo';
import { EstudoDiario } from '../pages/EstudoDiario';
import { Configuracoes } from '../pages/Configuracoes';
import { Atividade } from '../pages/Atividade';
import { MainLayout } from '../components/layout/MainLayout.tsx';

 export default function AppRoutes() {
    return (
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/biblioteca" element={<Biblioteca />} />
          <Route path="/biblioteca/novo" element={<NovoConteudo />} />
          <Route path="/estudo" element={<EstudoDiario />} />
          <Route path="/config" element={<Configuracoes />} />
          <Route path="/atividade" element={<Atividade />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }