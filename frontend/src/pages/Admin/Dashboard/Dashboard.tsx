import { useState, useEffect } from 'react';
import { LayoutDashboard, Building2, Users } from 'lucide-react';
import Layout from '../../../components/Layout/Layout';
import StatusBadge, { type StatusType } from '../../../components/StatusBadge/StatusBadge';
import api from '../../../services/api';
import './Dashboard.css';

interface Empresa {
  idEmpresa: number;
  nome: string;
  cnpj: string;
  email: string;
  ativo: boolean;
  createdAt: string;
}

interface Agente {
  idUsuario: number;
  nome: string;
  email: string;
  nivelAcesso: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Empresas' | 'Agentes' | 'Relatorios'>('Dashboard');
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [loading, setLoading] = useState(true);

  // States para o form de Nova Empresa
  const [showNovaEmpresaForm, setShowNovaEmpresaForm] = useState(false);
  const [nomeEmpresa, setNomeEmpresa] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [emailEmpresa, setEmailEmpresa] = useState('');
  const [loadingCreate, setLoadingCreate] = useState(false);

  // States para o form de Novo Agente
  const [showNovoAgenteForm, setShowNovoAgenteForm] = useState(false);
  const [nomeAgente, setNomeAgente] = useState('');
  const [emailAgente, setEmailAgente] = useState('');
  const [senhaAgente, setSenhaAgente] = useState('');
  const [nivelAcessoAgente, setNivelAcessoAgente] = useState('agente');
  const [loadingCreateAgente, setLoadingCreateAgente] = useState(false);

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [resEmp, resAg] = await Promise.all([
        api.get('/empresas'),
        api.get('/agentes') // Presumo que seja /api/usuarios filtrado no back, ou usaremos usuarios genéricos
      ]);
      setEmpresas(resEmp.data);
      // Alguns backends retornam erro se /agentes não existir, vou tratar o erro global
      setAgentes(resAg.data);
    } catch (e) {
      console.error("Erro dashboard admin", e);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingCreate(true);
    try {
      await api.post('/empresas', { nome: nomeEmpresa, cnpj, email: emailEmpresa });
      alert("Empresa criada com sucesso!");
      setNomeEmpresa('');
      setCnpj('');
      setEmailEmpresa('');
      setShowNovaEmpresaForm(false);
      loadAdminData(); // Recarrega a lista
    } catch(err) {
      alert("Erro ao criar empresa.");
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleCreateAgente = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingCreateAgente(true);
    try {
      await api.post('/usuarios', { nome: nomeAgente, email: emailAgente, senha: senhaAgente, nivelAcesso: nivelAcessoAgente });
      alert("Usuário criado com sucesso!");
      setNomeAgente('');
      setEmailAgente('');
      setSenhaAgente('');
      setShowNovoAgenteForm(false);
      loadAdminData(); // re-fetch /agentes
    } catch(err) {
      alert("Erro ao criar usuário.");
    } finally {
      setLoadingCreateAgente(false);
    }
  };

  return (
    <Layout role="Admin">
      <div className="admin-dashboard-container">
        
        {/* SIDEBAR INTERNA */}
        <div className="admin-sidebar">
          <nav className="admin-nav">
            <button className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </button>
            <button className={`nav-item ${activeTab === 'Empresas' ? 'active' : ''}`} onClick={() => setActiveTab('Empresas')}>
              <Building2 size={18} />
              <span>Empresas</span>
            </button>
            <button className={`nav-item ${activeTab === 'Agentes' ? 'active' : ''}`} onClick={() => setActiveTab('Agentes')}>
              <Users size={18} />
              <span>Agentes/Usuários</span>
            </button>
          </nav>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="admin-main-content">
          
          {/* ABA 1: DASHBOARD GERAL */}
          {activeTab === 'Dashboard' && (
            <div className="admin-summary-cards">
              <div className="admin-card">
                <span className="card-lbl">Empresas cadastradas</span>
                <span className="card-val">{empresas.length}</span>
              </div>
              <div className="admin-card">
                <span className="card-lbl">Agentes / Usuários</span>
                <span className="card-val">{agentes.length || 0}</span>
              </div>
            </div>
          )}

          {/* ABA 2: EMPRESAS */}
          {activeTab === 'Empresas' && (
            <div className="admin-list-container">
              <div className="admin-list-header">
                <h3>Gerenciamento de Empresas</h3>
                <button 
                    className="btn-add" 
                    onClick={() => setShowNovaEmpresaForm(!showNovaEmpresaForm)}
                  >
                    {showNovaEmpresaForm ? '✕ Cancelar' : '+ Adicionar'}
                </button>
              </div>

              {/* Form Inline (Arrumado Margin e Wrap para não quebrar UI flex) */}
              {showNovaEmpresaForm && (
                <form className="admin-inline-form" onSubmit={handleCreateEmpresa} style={{padding: '24px', backgroundColor: '#2a2a2a', marginBottom: '24px', borderRadius: '12px', border: '1px solid #3c3c3c', boxSizing: 'border-box'}}>
                  <h4 style={{marginTop: 0, color: '#f9fafb'}}>Cadastrar Empresa</h4>
                  <div style={{display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap'}}>
                    <input type="text" placeholder="Nome Fantasia" required value={nomeEmpresa} onChange={(e)=>setNomeEmpresa(e.target.value)} style={{flex: '1 1 200px', padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: '#fff'}} />
                    <input type="text" placeholder="CNPJ" required value={cnpj} onChange={(e)=>setCnpj(e.target.value)} style={{flex: '1 1 200px', padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: '#fff'}} />
                    <input type="email" placeholder="E-mail principal" required value={emailEmpresa} onChange={(e)=>setEmailEmpresa(e.target.value)} style={{flex: '1 1 200px', padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: '#fff'}} />
                  </div>
                  <button type="submit" disabled={loadingCreate} style={{padding: '10px 24px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500}}>
                    {loadingCreate ? 'Salvando...' : 'Salvar Empresa'}
                  </button>
                </form>
              )}

              <div className="admin-list">
                {loading ? (
                  <p style={{padding: '20px', color: '#6b7280'}}>Carregando empresas...</p>
                ) : empresas.length === 0 ? (
                  <p style={{padding: '20px', color: '#6b7280'}}>Nenhuma empresa cadastrada.</p>
                ) : empresas.map(empresa => (
                  <div key={empresa.idEmpresa} className="admin-list-item">
                    <div className="company-info">
                      <p className="company-name">{empresa.nome}</p>
                      <p className="company-meta">CNPJ {empresa.cnpj} · {empresa.email}</p>
                    </div>
                    <StatusBadge status={(empresa.ativo ? 'Concluído' : 'Cancelado') as StatusType} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ABA 3: AGENTES */}
          {activeTab === 'Agentes' && (
            <div className="admin-list-container">
              <div className="admin-list-header">
                <h3>Agentes e Usuários</h3>
                <button 
                    className="btn-add" 
                    onClick={() => setShowNovoAgenteForm(!showNovoAgenteForm)}
                  >
                    {showNovoAgenteForm ? '✕ Cancelar' : '+ Adicionar'}
                </button>
              </div>

              {/* Form de Cadastro de Agente/Admin */}
              {showNovoAgenteForm && (
                <form className="admin-inline-form" onSubmit={handleCreateAgente} style={{padding: '24px', backgroundColor: '#2a2a2a', marginBottom: '24px', borderRadius: '12px', border: '1px solid #3c3c3c', boxSizing: 'border-box'}}>
                  <h4 style={{marginTop: 0, color: '#f9fafb'}}>Cadastrar Novo Usuário</h4>
                  <div style={{display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap'}}>
                    <input type="text" placeholder="Nome Completo" required value={nomeAgente} onChange={(e)=>setNomeAgente(e.target.value)} style={{flex: '1 1 200px', padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: '#fff'}} />
                    <input type="email" placeholder="E-mail Corporativo" required value={emailAgente} onChange={(e)=>setEmailAgente(e.target.value)} style={{flex: '1 1 200px', padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: '#fff'}} />
                    <input type="password" placeholder="Senha Temporária" required value={senhaAgente} onChange={(e)=>setSenhaAgente(e.target.value)} style={{flex: '1 1 200px', padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: '#fff'}} />
                    
                    <select value={nivelAcessoAgente} onChange={(e)=>setNivelAcessoAgente(e.target.value)} style={{padding: '10px', borderRadius: '8px', border: '1px solid #444', background: '#1a1a1a', color: '#fff'}}>
                      <option value="cliente">Cliente</option>
                      <option value="agente">Agente</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button type="submit" disabled={loadingCreateAgente} style={{padding: '10px 24px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500}}>
                    {loadingCreateAgente ? 'Salvando...' : 'Criar Conta'}
                  </button>
                </form>
              )}

              <div className="admin-list">
                {loading ? (
                  <p style={{padding: '20px', color: '#6b7280'}}>Carregando usuários...</p>
                ) : agentes.length === 0 ? (
                  <p style={{padding: '20px', color: '#6b7280'}}>Nenhum agente cadastrado.</p>
                ) : agentes.map(agente => (
                  <div key={agente.idUsuario} className="admin-list-item">
                    <div className="company-info">
                      <p className="company-name">{agente.nome}</p>
                      <p className="company-meta">{agente.email}</p>
                    </div>
                    <span style={{color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', border: '1px solid #444', padding: '4px 8px', borderRadius: '4px'}}>
                      {agente.nivelAcesso}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </Layout>
  );
}
