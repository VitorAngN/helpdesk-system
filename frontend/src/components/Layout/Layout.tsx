import React, { useContext } from 'react';
import Header from '../Header/Header';
import Sidebar from '../Sidebar/Sidebar';
import { AuthContext } from '../../contexts/AuthContextValue';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  role?: 'Cliente' | 'Agente' | 'Admin';
}

export default function Layout({ children, role }: LayoutProps) {
  const { usuario } = useContext(AuthContext);
  
  // Pegar as iniciais (ex: "Vitor Neves" -> "VN")
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const partes = name.split(' ');
    if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  };

  const dynamicRole = usuario ? 
                      usuario.nivelAcesso.charAt(0).toUpperCase() + usuario.nivelAcesso.slice(1) 
                      : role || 'Cliente';

  return (
    <div className="layout-root">
      <Sidebar />
      <div className="layout-main">
        <Header 
          role={dynamicRole} 
          userName={usuario?.nome} 
          userInitials={getInitials(usuario?.nome)} 
        />
        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  );
}
