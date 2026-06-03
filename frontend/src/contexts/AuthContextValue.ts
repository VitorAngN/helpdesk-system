import { createContext } from 'react';

export interface Usuario {
  idUsuario: number;
  nome: string;
  email: string;
  nivelAcesso: 'cliente' | 'agente' | 'admin';
}

export interface AuthContextData {
  logado: boolean;
  usuario: Usuario | null;
  loginState: (token: string, userData: Usuario) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);
