import { createContext, useState, useEffect, type ReactNode } from 'react';

// Essa é a Interface (molde) do Usuário que vamos salvar no frontend
interface Usuario {
  idUsuario: number;
  nome: string;
  email: string;
  nivelAcesso: 'cliente' | 'agente' | 'admin';
}

// O molde do que nosso Contexto vai expor para os ouros componentes usarem (App.tsx, Header.tsx)
interface AuthContextData {
  logado: boolean;
  usuario: Usuario | null;
  loginState: (token: string, userData: Usuario) => void;
  logout: () => void;
}

// Cria o contexto (inicialmente vazio)
export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  // Assim que qualquer tela carregar (F5), ele checa: "Eu tinha alguém salvo na memória?"
  useEffect(() => {
    const storagedUser = localStorage.getItem('@HelpDesk:user');
    const storagedToken = localStorage.getItem('@HelpDesk:token');

    if (storagedUser && storagedToken) {
      setUsuario(JSON.parse(storagedUser));
    }
  }, []);

  const loginState = (token: string, userData: Usuario) => {
    // 1. Salva nos Estados (Variáveis ativas) do React
    setUsuario(userData);
    // 2. Salva no Disco (Storage do Navegador) p/ resistir a F5
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
