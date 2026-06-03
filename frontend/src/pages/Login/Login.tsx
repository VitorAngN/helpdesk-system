import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContextValue';
import api from '../../services/api';
import './Login.css';

type ApiError = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

export default function Login() {
  const navigate = useNavigate();
  const { loginState } = useContext(AuthContext); // Puxa a função de gravar do Contexto
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      // Faz o POST pra rota /api/auth/login do Backend Node
      const response = await api.post('/auth/login', { email, senha });
      
      const { token, usuario } = response.data;
      
      // Salva na memória global e no navegador
      loginState(token, usuario);

      // Redireciona conforme o perfil real salvo no Banco de Dados
      if (usuario.nivelAcesso === 'cliente') navigate('/cliente');
      else if (usuario.nivelAcesso === 'agente') navigate('/agente');
      else if (usuario.nivelAcesso === 'admin') navigate('/admin');

    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        setErro(apiError.response.data.error); // Pega a msg de erro do Backend (E-mail ou senha incorreta)
      } else {
        setErro("Não foi possível conectar ao servidor.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* LOGO E TÍTULO */}
        <div className="login-header">
          <div className="logo-icon">
            <span className="logo-squares"></span>
          </div>
          <h1>HelpDesk</h1>
        </div>

        <p className="login-subtitle">Acesse sua conta para continuar</p>

        {erro && <div className="error-box">{erro}</div>}

        {/* FORMULÁRIO (Removido os botões "Cliente/Agente" pois o nível será lido do BD) */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input 
              type="email" 
              id="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input 
              type="password" 
              id="senha" 
              placeholder="••••••••" 
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="login-footer">
          Não tem conta? <span onClick={() => navigate('/cadastro')} style={{cursor: 'pointer', color: '#3b82f6', fontWeight: 500}}>Cadastre-se</span>
        </p>
      </div>
    </div>
  );
}
