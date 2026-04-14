import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import Login from './pages/Login/Login';
import Cadastro from './pages/Cadastro/Cadastro';
import ClienteHome from './pages/Cliente/Home/Home';
import NovoChamado from './pages/Cliente/NovoChamado/NovoChamado';
import Chat from './pages/Chamados/Chat/Chat';
import Historico from './pages/Chamados/Historico/Historico';
import AgenteDashboard from './pages/Agente/Dashboard/Dashboard';
import AdminDashboard from './pages/Admin/Dashboard/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          
          <Route path="/cliente" element={
            <ProtectedRoute allowedRoles={['cliente']}><ClienteHome /></ProtectedRoute>
          } />
          <Route path="/novo-chamado" element={
            <ProtectedRoute allowedRoles={['cliente']}><NovoChamado /></ProtectedRoute>
          } />
          <Route path="/chamado/:id?" element={
            <ProtectedRoute allowedRoles={['cliente', 'agente', 'admin']}><Chat /></ProtectedRoute>
          } />
          
          <Route path="/agente" element={
            <ProtectedRoute allowedRoles={['agente', 'admin']}><AgenteDashboard /></ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
          } />
        <Route path="/historico" element={
            <ProtectedRoute allowedRoles={['cliente', 'agente', 'admin']}><Historico /></ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;