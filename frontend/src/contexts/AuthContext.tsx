import { useEffect, useState, type ReactNode } from 'react';
import { conectarSocket, desconectarSocket } from '../services/socket';
import { AuthContext, type Usuario } from './AuthContextValue';

const getStoredUsuario = (): Usuario | null => {
  const storagedUser = localStorage.getItem('@HelpDesk:user');
  const storagedToken = localStorage.getItem('@HelpDesk:token');

  if (!storagedUser || !storagedToken) return null;

  try {
    return JSON.parse(storagedUser) as Usuario;
  } catch {
    localStorage.removeItem('@HelpDesk:user');
    localStorage.removeItem('@HelpDesk:token');
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(getStoredUsuario);

  // Conecta o socket (com o JWT) só quando há usuário logado.
  useEffect(() => {
    if (usuario) conectarSocket();
    else desconectarSocket();
  }, [usuario]);

  const loginState = (token: string, userData: Usuario) => {
    setUsuario(userData);
    localStorage.setItem('@HelpDesk:token', token);
    localStorage.setItem('@HelpDesk:user', JSON.stringify(userData));
  };

  const logout = () => {
    localStorage.removeItem('@HelpDesk:token');
    localStorage.removeItem('@HelpDesk:user');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ logado: !!usuario, usuario, loginState, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
