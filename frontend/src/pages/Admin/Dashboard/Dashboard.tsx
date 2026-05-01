import { useState, useEffect } from 'react';
import { LayoutDashboard, Building2, Users, Settings, FileText } from 'lucide-react';
import Layout from '../../../components/Layout/Layout';
import StatusBadge, { type StatusType } from '../../../components/StatusBadge/StatusBadge';
import { TicketUtils } from '../../../utils/TicketUtils';
import api from '../../../services/api';
import './Dashboard.css';

interface Empresa { idEmpresa: number; nome: string; cnpj: string; email: string; ativo: boolean; }
interface Agente { idUsuario: number; nome: string; email: string; nivelAcesso: string; }
interface Categoria { idCategoria: number; nome: string; }
interface Macro { idMacro: number; titulo: string; texto: string; }
interface LogAuditoria { idLog: number; acao: string; detalhe: string; createdAt: string; usuario: { nome: string; email: string } }
interface AnalyticsData { 
  totalChamados: number; 
  abertos: number; 
  concluidos: number; 
  cancelados: number;
  porPrioridade: { prioridade: string; _count: { prioridade: number } }[];
  mediaCsat: number | null;
  totalAvaliados: number;
  tempoMedioResolucaoHoras: number | null;
  totalConcluidosComSLA: number;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Empresas' | 'Agentes' | 'Configuracoes' | 'Auditoria'>('Dashboard');
  
  // Data States
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [macros, setMacros] = useState<Macro[]>([]);
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Forms States
  const [showNovaEmpresaForm, setShowNovaEmpresaForm] = useState(false);
  const [nomeEmpresa, setNomeEmpresa] = useState(''); const [cnpj, setCnpj] = useState(''); const [emailEmpresa, setEmailEmpresa] = useState('');
  
  const [showNovoAgenteForm, setShowNovoAgenteForm] = useState(false);
  const [nomeAgente, setNomeAgente] = useState(''); const [emailAgente, setEmailAgente] = useState(''); const [senhaAgente, setSenhaAgente] = useState(''); const [nivelAcessoAgente, setNivelAcessoAgente] = useState('agente');

  const [nomeCategoria, setNomeCategoria] = useState('');
  const [tituloMacro, setTituloMacro] = useState(''); const [textoMacro, setTextoMacro] = useState('');

  useEffect(() => {
    loadAdminData();
  }, []);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [resEmp, resAg, resCat, resMac, resLog, resAna] = await Promise.all([
        api.get('/empresas'),
        api.get('/agentes'),
        api.get('/categorias'),
        api.get('/macros'),
        api.get('/logs'),
        api.get('/analytics')
      ]);
      setEmpresas(resEmp.data); setAgentes(resAg.data); setCategorias(resCat.data); 
      setMacros(resMac.data); setLogs(resLog.data); setAnalytics(resAna.data);
    } catch (e) {
      console.error("Erro dashboard admin", e);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/empresas', { nome: nomeEmpresa, cnpj, email: emailEmpresa }); loadAdminData(); setShowNovaEmpresaForm(false); setNomeEmpresa(''); setCnpj(''); setEmailEmpresa(''); alert("Criado!"); } 
    catch(err) { alert("Erro ao criar empresa."); }
  };

  const handleCreateAgente = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/usuarios', { nome: nomeAgente, email: emailAgente, senha: senhaAgente, nivelAcesso: nivelAcessoAgente }); loadAdminData(); setShowNovoAgenteForm(false); setNomeAgente(''); setEmailAgente(''); setSenhaAgente(''); alert("Criado!"); } 
    catch(err) { alert("Erro ao criar usuário."); }
  };

  const handleCreateCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/categorias', { nome: nomeCategoria }); loadAdminData(); setNomeCategoria(''); } 
    catch(err) { alert("Erro ao criar."); }
  };

  const handleCreateMacro = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post('/macros', { titulo: tituloMacro, texto: textoMacro }); loadAdminData(); setTituloMacro(''); setTextoMacro(''); } 
    catch(err) { alert("Erro ao criar."); }
  };

  const deleteCategoria = async (id: number) => {
    if(window.confirm('Excluir?')) { try { await api.delete(`/categorias/${id}`); loadAdminData(); } catch(err) { alert('Erro'); } }
  }
  
  const deleteMacro = async (id: number) => {
    if(window.confirm('Excluir?')) { try { await api.delete(`/macros/${id}`); loadAdminData(); } catch(err) { alert('Erro'); } }
  }

  return (
    <Layout role="Admin">
      <div className="admin-dashboard-container">
        <div className="admin-tabs-header">
          <nav className="admin-tabs-nav">
            <button className={`tab-item ${activeTab === 'Dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('Dashboard')}>
              <LayoutDashboard size={18} /><span>Analytics</span>
            </button>
            <button className={`tab-item ${activeTab === 'Empresas' ? 'active' : ''}`} onClick={() => setActiveTab('Empresas')}>
              <Building2 size={18} /><span>Empresas</span>
            </button>
            <button className={`tab-item ${activeTab === 'Agentes' ? 'active' : ''}`} onClick={() => setActiveTab('Agentes')}>
              <Users size={18} /><span>Usuários</span>
            </button>
            <button className={`tab-item ${activeTab === 'Configuracoes' ? 'active' : ''}`} onClick={() => setActiveTab('Configuracoes')}>
              <Settings size={18} /><span>Configurações</span>
            </button>
            <button className={`tab-item ${activeTab === 'Auditoria' ? 'active' : ''}`} onClick={() => setActiveTab('Auditoria')}>
              <FileText size={18} /><span>Auditoria</span>
            </button>
          </nav>
        </div>

        <div className="admin-main-content">
          
          {activeTab === 'Dashboard' && analytics && (
            <div>
              <h3 style={{marginBottom: '20px'}}>Visão Geral</h3>
              <div className="admin-summary-cards">
                <div className="admin-card"><span className="card-lbl">Total de Chamados</span><span className="card-val">{analytics.totalChamados}</span></div>
                <div className="admin-card"><span className="card-lbl">Em Aberto</span><span className="card-val text-red">{analytics.abertos}</span></div>
                <div className="admin-card"><span className="card-lbl">Concluídos</span><span className="card-val text-green">{analytics.concluidos}</span></div>
                <div className="admin-card"><span className="card-lbl">Cancelados</span><span className="card-val" style={{color: 'var(--text-muted)'}}>{analytics.cancelados}</span></div>
              </div>

              {/* CSAT + SLA lado a lado */}
              <div style={{display: 'flex', gap: '24px', marginTop: '24px'}}>
                {/* CSAT */}
                <div style={{flex: 1, background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
                  <h4 style={{margin: '0 0 16px'}}>Satisfação (CSAT)</h4>
                  {analytics.mediaCsat !== null ? (
                    <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
                      <div style={{fontSize: '3rem', fontWeight: 700, color: 'var(--warning)'}}>
                        {analytics.mediaCsat}
                      </div>
                      <div>
                        <div style={{display: 'flex', gap: '4px', marginBottom: '4px'}}>
                          {[1,2,3,4,5].map(n => (
                            <span key={n} style={{fontSize: '1.4rem', color: analytics.mediaCsat! >= n ? '#f59e0b' : '#d1d5db'}}>★</span>
                          ))}
                        </div>
                        <p style={{margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)'}}>{analytics.totalAvaliados} avaliações recebidas</p>
                      </div>
                    </div>
                  ) : (
                    <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0}}>Nenhuma avaliação registrada ainda.</p>
                  )}
                </div>

                {/* SLA */}
                <div style={{flex: 1, background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
                  <h4 style={{margin: '0 0 16px'}}>Tempo Médio de Resolução (SLA)</h4>
                  {analytics.tempoMedioResolucaoHoras !== null ? (
                    <div style={{display: 'flex', alignItems: 'baseline', gap: '8px'}}>
                      <span style={{fontSize: '3rem', fontWeight: 700, color: analytics.tempoMedioResolucaoHoras <= 24 ? 'var(--success)' : analytics.tempoMedioResolucaoHoras <= 48 ? 'var(--warning)' : 'var(--danger)'}}>
                        {analytics.tempoMedioResolucaoHoras < 1 
                          ? `${Math.round(analytics.tempoMedioResolucaoHoras * 60)}min`
                          : `${analytics.tempoMedioResolucaoHoras}h`}
                      </span>
                      <div>
                        <p style={{margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)'}}>
                          {analytics.tempoMedioResolucaoHoras <= 24 ? '✅ Dentro do SLA' : analytics.tempoMedioResolucaoHoras <= 48 ? '⚠️ Atenção ao SLA' : '🔴 SLA Excedido'}
                        </p>
                        <p style={{margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)'}}>{analytics.totalConcluidosComSLA} chamados medidos</p>
                      </div>
                    </div>
                  ) : (
                    <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0}}>Nenhum chamado concluído ainda.</p>
                  )}
                </div>
              </div>
              
              <div style={{marginTop: '24px', background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
                <h4>Distribuição por Prioridade</h4>
                <div style={{marginTop: '16px', display: 'flex', gap: '24px'}}>
                  {analytics.porPrioridade.map(p => (
                    <div key={p.prioridade} style={{background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', flex: 1, borderLeft: `4px solid ${p.prioridade==='alta'||p.prioridade==='urgente' ? 'var(--danger)' : p.prioridade==='media' ? 'var(--warning)' : 'var(--primary-color)'}`}}>
                      <p style={{margin: 0, color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.8rem'}}>{p.prioridade}</p>
                      <h2 style={{margin: '8px 0 0', fontSize: '2rem', color: 'var(--text-main)'}}>{p._count.prioridade}</h2>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* EMPRESAS */}
          {activeTab === 'Empresas' && (
            <div className="admin-list-container">
              {/* Mesmo código de antes... resumido por espaço */}
              <div className="admin-list-header">
                <h3>Gerenciamento de Empresas</h3>
                <button className="btn-add" onClick={() => setShowNovaEmpresaForm(!showNovaEmpresaForm)}>{showNovaEmpresaForm ? '✕ Cancelar' : '+ Adicionar'}</button>
              </div>
              {showNovaEmpresaForm && (
                <form className="admin-inline-form" onSubmit={handleCreateEmpresa} style={{padding: '24px', backgroundColor: 'var(--bg-card)', marginBottom: '24px', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
                  <div style={{display: 'flex', gap: '16px', marginBottom: '16px'}}><input type="text" placeholder="Nome" required value={nomeEmpresa} onChange={(e)=>setNomeEmpresa(e.target.value)} style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid var(--border-color)', background:'var(--bg-main)', color:'var(--text-main)'}} /><input type="text" placeholder="CNPJ" required value={cnpj} onChange={(e)=>setCnpj(e.target.value)} style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid var(--border-color)', background:'var(--bg-main)', color:'var(--text-main)'}} /><input type="email" placeholder="E-mail" required value={emailEmpresa} onChange={(e)=>setEmailEmpresa(e.target.value)} style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid var(--border-color)', background:'var(--bg-main)', color:'var(--text-main)'}} /></div>
                  <button type="submit" style={{padding:'10px 24px', background:'var(--primary-color)', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer'}}>Salvar Empresa</button>
                </form>
              )}
              <div className="admin-list">{empresas.map(e => (<div key={e.idEmpresa} className="admin-list-item"><div className="company-info"><p className="company-name">{e.nome}</p><p className="company-meta">CNPJ {e.cnpj} · {e.email}</p></div></div>))}</div>
            </div>
          )}

          {/* AGENTES */}
          {activeTab === 'Agentes' && (
            <div className="admin-list-container">
               <div className="admin-list-header">
                <h3>Usuários do Sistema</h3>
                <button className="btn-add" onClick={() => setShowNovoAgenteForm(!showNovoAgenteForm)}>{showNovoAgenteForm ? '✕ Cancelar' : '+ Adicionar'}</button>
              </div>
              {showNovoAgenteForm && (
                <form className="admin-inline-form" onSubmit={handleCreateAgente} style={{padding: '24px', backgroundColor: 'var(--bg-card)', marginBottom: '24px', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
                  <div style={{display: 'flex', gap: '16px', marginBottom: '16px'}}><input type="text" placeholder="Nome" required value={nomeAgente} onChange={(e)=>setNomeAgente(e.target.value)} style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid var(--border-color)', background:'var(--bg-main)', color:'var(--text-main)'}} /><input type="email" placeholder="Email" required value={emailAgente} onChange={(e)=>setEmailAgente(e.target.value)} style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid var(--border-color)', background:'var(--bg-main)', color:'var(--text-main)'}} /><input type="password" placeholder="Senha" required value={senhaAgente} onChange={(e)=>setSenhaAgente(e.target.value)} style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid var(--border-color)', background:'var(--bg-main)', color:'var(--text-main)'}} /><select value={nivelAcessoAgente} onChange={(e)=>setNivelAcessoAgente(e.target.value)} style={{padding:'10px', borderRadius:'8px', border:'1px solid var(--border-color)', background:'var(--bg-main)', color:'var(--text-main)'}}><option value="cliente">Cliente</option><option value="agente">Agente</option><option value="admin">Admin</option></select></div>
                  <button type="submit" style={{padding:'10px 24px', background:'var(--primary-color)', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer'}}>Criar Usuário</button>
                </form>
              )}
              <div className="admin-list">{agentes.map(a => (<div key={a.idUsuario} className="admin-list-item"><div className="company-info"><p className="company-name">{a.nome}</p><p className="company-meta">{a.email}</p></div><span style={{color: '#9ca3af', fontSize: '0.8rem', textTransform: 'uppercase', border: '1px solid #444', padding: '4px 8px', borderRadius: '4px'}}>{a.nivelAcesso}</span></div>))}</div>
            </div>
          )}

          {/* CONFIGURAÇÕES */}
          {activeTab === 'Configuracoes' && (
            <div>
              <div style={{display: 'flex', gap: '24px', alignItems: 'flex-start'}}>
                <div style={{flex: 1, background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
                  <h4>Categorias de Chamado</h4>
                  <form onSubmit={handleCreateCategoria} style={{display: 'flex', gap: '8px', margin: '16px 0'}}>
                    <input type="text" placeholder="Nova categoria..." required value={nomeCategoria} onChange={e=>setNomeCategoria(e.target.value)} style={{flex:1, padding:'10px', borderRadius:'8px', border:'1px solid var(--border-color)', background:'var(--bg-main)', color:'var(--text-main)'}} />
                    <button type="submit" style={{padding:'10px 16px', background:'var(--primary-color)', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer'}}>Adicionar</button>
                  </form>
                  <div>
                    {categorias.map(c => (
                      <div key={c.idCategoria} style={{display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid var(--border-color)'}}>
                        <span>{c.nome}</span>
                        <button onClick={() => deleteCategoria(c.idCategoria)} style={{background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer'}}>Excluir</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{flex: 2, background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)'}}>
                  <h4>Macros (Respostas Prontas)</h4>
                  <form onSubmit={handleCreateMacro} style={{display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0'}}>
                    <input type="text" placeholder="Título (Ex: Saudação Inicial)" required value={tituloMacro} onChange={e=>setTituloMacro(e.target.value)} style={{padding:'10px', borderRadius:'8px', border:'1px solid var(--border-color)', background:'var(--bg-main)', color:'var(--text-main)'}} />
                    <textarea placeholder="Texto da mensagem automática..." required value={textoMacro} onChange={e=>setTextoMacro(e.target.value)} rows={3} style={{padding:'10px', borderRadius:'8px', border:'1px solid var(--border-color)', background:'var(--bg-main)', color:'var(--text-main)', resize: 'vertical'}} />
                    <button type="submit" style={{padding:'10px 16px', background:'var(--primary-color)', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer', alignSelf: 'flex-start'}}>Salvar Macro</button>
                  </form>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px'}}>
                    {macros.map(m => (
                      <div key={m.idMacro} style={{background: 'var(--bg-main)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', position: 'relative'}}>
                        <button onClick={() => deleteMacro(m.idMacro)} style={{position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '12px'}}>✕</button>
                        <h5 style={{margin: '0 0 8px 0', color: 'var(--text-main)'}}>{m.titulo}</h5>
                        <p style={{margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>{m.texto}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AUDITORIA */}
          {activeTab === 'Auditoria' && (
            <div className="admin-list-container">
               <div className="admin-list-header">
                <h3>Logs de Auditoria</h3>
                <p style={{color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem'}}>Registro de ações sensíveis no sistema.</p>
              </div>
              <div style={{padding: '0 24px 24px'}}>
                <table className="historico-table" style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
                  <thead>
                    <tr style={{borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)'}}>
                      <th style={{padding: '12px'}}>Data/Hora</th>
                      <th style={{padding: '12px'}}>Usuário</th>
                      <th style={{padding: '12px'}}>Ação</th>
                      <th style={{padding: '12px'}}>Detalhe</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map(log => (
                      <tr key={log.idLog} style={{borderBottom: '1px solid var(--border-color)'}}>
                        <td style={{padding: '12px', whiteSpace: 'nowrap', color: 'var(--text-muted)'}}>{TicketUtils.formatDateTime(log.createdAt)}</td>
                        <td style={{padding: '12px', color: 'var(--text-main)'}}>{log.usuario.nome}</td>
                        <td style={{padding: '12px'}}>
                          <span style={{background: 'var(--bg-main)', color: 'var(--text-main)', border: '1px solid var(--border-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem'}}>{log.acao}</span>
                        </td>
                        <td style={{padding: '12px', color: 'var(--text-main)'}}>{log.detalhe}</td>
                      </tr>
                    ))}
                    {logs.length === 0 && (
                      <tr><td colSpan={4} style={{padding: '24px', textAlign: 'center', color: 'var(--text-muted)'}}>Nenhum log registrado ainda.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </Layout>
  );
}
