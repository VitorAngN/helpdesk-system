import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import StatusBadge, { type StatusType } from '../../../components/StatusBadge/StatusBadge';
import { AuthContext } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { TicketUtils } from '../../../utils/TicketUtils';
import './Historico.css';

interface Chamado {
  idChamado: number;
  protocolo: string;
  titulo: string;
  status: string;
  prioridade: string;
  createdAt: string;
  updatedAt: string;
}

export default function Historico() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario } = useContext(AuthContext);
  
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  
  // Lê a tab passada pelo state da rota, ou default para 'Abertos'
  const initialTab = location.state?.tab || 'Abertos';
  const [activeTab, setActiveTab] = useState<'Abertos' | 'Geral'>(initialTab);

  useEffect(() => {
    async function fetchHistorico() {
      try {
        const res = await api.get('/chamados');
        setChamados(res.data);
      } catch (err) {
        console.error("Erro ao buscar histórico", err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistorico();
  }, []);

  const convertRole = () => {
    if(usuario?.nivelAcesso === 'admin') return 'Admin';
    if(usuario?.nivelAcesso === 'agente') return 'Agente';
    return 'Cliente';
  }

  // Primeiro filtra pela aba
  let chamadosAba = chamados;
  if (activeTab === 'Abertos') {
    chamadosAba = chamados.filter(c => c.status !== 'concluido' && c.status !== 'cancelado');
  }

  // Depois filtra pela busca
  const chamadosFiltrados = chamadosAba.filter(c => 
    c.protocolo.toLowerCase().includes(termoBusca.toLowerCase()) || 
    c.titulo.toLowerCase().includes(termoBusca.toLowerCase())
  );

  return (
    <Layout role={convertRole() as any}>
      <div className="historico-container">
        
        <div className="historico-header" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '24px'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
              <button className="base-back-btn" onClick={() => navigate(-1)} style={{background: '#2a2a2a', border: '1px solid #444', color: '#fff', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                <span style={{fontSize: '18px', fontWeight: 'bold'}}>←</span>
              </button>
              <div>
                <h2>Meus Chamados</h2>
                <p>Consulte e acesse o registro de protocolos.</p>
              </div>
            </div>
            
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Buscar NS/Protocolo ou Assunto..." 
                value={termoBusca}
                onChange={e => setTermoBusca(e.target.value)}
              />
            </div>
          </div>

          <div className="tabs-container" style={{display: 'flex', gap: '16px'}}>
            <button 
              className={`tab-btn ${activeTab === 'Abertos' ? 'active' : ''}`}
              onClick={() => setActiveTab('Abertos')}
              style={{padding: '8px 16px', background: activeTab === 'Abertos' ? 'var(--primary-light)' : 'transparent', color: activeTab === 'Abertos' ? 'var(--primary-color)' : 'var(--text-muted)', border: 'none', borderRadius: '8px', fontWeight: activeTab === 'Abertos' ? 600 : 500, cursor: 'pointer'}}
            >
              Em Aberto
            </button>
            <button 
              className={`tab-btn ${activeTab === 'Geral' ? 'active' : ''}`}
              onClick={() => setActiveTab('Geral')}
              style={{padding: '8px 16px', background: activeTab === 'Geral' ? 'var(--primary-light)' : 'transparent', color: activeTab === 'Geral' ? 'var(--primary-color)' : 'var(--text-muted)', border: 'none', borderRadius: '8px', fontWeight: activeTab === 'Geral' ? 600 : 500, cursor: 'pointer'}}
            >
              Histórico Geral
            </button>
          </div>
        </div>

        <div className="historico-table-container">
          {loading ? (
             <p style={{padding: '20px', color: '#6b7280'}}>Carregando registros do banco...</p>
          ) : (
            <table className="historico-table">
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Assunto</th>
                  <th>Prioridade</th>
                  <th>Status</th>
                  <th>Abertura</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {chamadosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{textAlign: 'center', padding: '32px', color: '#6b7280'}}>
                      Nenhum registro encontrado nesta categoria.
                    </td>
                  </tr>
                ) : (
                  chamadosFiltrados.map(c => (
                    <tr key={c.idChamado}>
                      <td className="t-protocolo">{c.protocolo}</td>
                      <td className="t-assunto">{c.titulo}</td>
                      <td>
                        <span className={`p-badge p-${c.prioridade}`}>{c.prioridade}</span>
                      </td>
                      <td>
                        <StatusBadge status={TicketUtils.getStatusLabel(c.status) as StatusType} />
                      </td>
                      <td className="t-data">{TicketUtils.formatDateTime(c.createdAt)}</td>
                      <td>
                        <button 
                          className="t-btn-view"
                          onClick={() => navigate(`/chamado/${c.idChamado}`)}
                        >
                          Visualizar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </Layout>
  );
}
