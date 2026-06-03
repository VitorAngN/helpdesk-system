import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Cadastro.css';

type ApiError = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

export default function Cadastro() {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (senha !== confirmaSenha) {
      setErro('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      // Por padrão, quem se cadastra por essa página é 'cliente'
      await api.post('/usuarios', { nome, email, senha, nivelAcesso: 'cliente' });
      alert('Cadastro realizado com sucesso! Você já pode fazer login.');
      navigate('/');
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.response?.data?.error) {
        setErro(apiError.response.data.error);
      } else {
        setErro('Erro ao realizar cadastro.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{maxWidth: '430px'}}>
        
        <div className="login-header">
          <div className="logo-icon">
            <span className="logo-squares"></span>
          </div>
          <h1>HelpDesk</h1>
        </div>

        <p className="login-subtitle">Crie sua conta como Cliente</p>

        {erro && <div className="error-box">{erro}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="nome">Nome Completo</label>
            <input 
              type="text" 
              id="nome" 
              placeholder="Digite seu nome completo" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail corporativo</label>
            <input 
              type="email" 
              id="email" 
              placeholder="exemplo@empresa.com" 
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
              placeholder="Crie uma senha forte" 
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmaSenha">Confirmar Senha</label>
            <input 
              type="password" 
              id="confirmaSenha" 
              placeholder="Repita a senha" 
              value={confirmaSenha}
              onChange={(e) => setConfirmaSenha(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Criar Conta'}
          </button>
        </form>

        <p className="register-text">
          Já tem uma conta? <span onClick={() => navigate('/')} className="register-link">Faça Login</span>
        </p>

      </div>
    </div>
  );
}
