import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, ArchiveRestore, Home, Shield } from 'lucide-react';
import { AuthContext } from '../../contexts/AuthContextValue';
import './Sidebar.css';

export default function Sidebar() {
  const { usuario } = useContext(AuthContext);

  if (!usuario) return null;

  const role = usuario.nivelAcesso.toLowerCase();

  return (
    <aside className="global-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          HD
        </div>
        <h2>HelpDesk</h2>
      </div>

      <nav className="sidebar-nav">
        {/* LINKS DO CLIENTE */}
        {role === 'cliente' && (
          <>
            <NavLink to="/cliente" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Home size={20} />
              <span>Início</span>
            </NavLink>
            <NavLink to="/novo-chamado" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <PlusCircle size={20} />
              <span>Novo Chamado</span>
            </NavLink>
            <NavLink to="/historico" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <ArchiveRestore size={20} />
              <span>Meus Chamados</span>
            </NavLink>
          </>
        )}

        {/* LINKS DO AGENTE */}
        {role === 'agente' && (
          <>
            <NavLink to="/agente" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Painel do Agente</span>
            </NavLink>
            <NavLink to="/historico" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <ArchiveRestore size={20} />
              <span>Todos os Chamados</span>
            </NavLink>
          </>
        )}

        {/* LINKS DO ADMIN */}
        {role === 'admin' && (
          <>
            <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <Shield size={20} />
              <span>Painel Admin</span>
            </NavLink>
            <NavLink to="/agente" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <LayoutDashboard size={20} />
              <span>Visão Agente</span>
            </NavLink>
            <NavLink to="/historico" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <ArchiveRestore size={20} />
              <span>Todos os Chamados</span>
            </NavLink>
          </>
        )}
      </nav>
      
      <div className="sidebar-footer">
        <p className="version-text">v1.0.0</p>
      </div>
    </aside>
  );
}
