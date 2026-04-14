import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'cliente' | 'agente' | 'admin'>;
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { logado, usuario } = useContext(AuthContext);

  // 1. Se não estiver logado, chuta para a tela de Login
  if (!logado) {
    return <Navigate to="/" replace />;
  }

  // 2. Se a rota exigir um nível específico e o usuário não tiver, chuta para a tela respectiva dele
  if (allowedRoles && usuario && !allowedRoles.includes(usuario.nivelAcesso)) {
    // Redireciona para a home correta com base no perfil
    if (usuario.nivelAcesso === 'cliente') return <Navigate to="/cliente" replace />;
    if (usuario.nivelAcesso === 'agente') return <Navigate to="/agente" replace />;
    if (usuario.nivelAcesso === 'admin') return <Navigate to="/admin" replace />;
  }

  // Se tudo estiver certo, renderiza a tela que ele pediu
  return <>{children}</>;
}
