import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import StatusBadge, { type StatusType } from '../../../components/StatusBadge/StatusBadge';
import { AuthContext } from '../../../contexts/AuthContext';
import api from '../../../services/api';
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
  const { usuario } = useContext(AuthContext);
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');

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

  const formatData = (dataStr: string) => {
    return new Date(dataStr).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  const converterLabelStatus = (status: string) => {
    if(status === 'em_atendimento') return 'Em atendimento';
    if(status === 'aguardando_cliente') return 'Aguardando';
    if(status === 'concluido') return 'Concluído';
    if(status === 'cancelado') return 'Cancelado';
    return 'Aberto';
  };

  const chamadosFiltrados = chamados.filter(c => 
    c.protocolo.toLowerCase().includes(termoBusca.toLowerCase()) || 
    c.titulo.toLowerCase().includes(termoBusca.toLowerCase())
  );

  return (
    <Layout role={convertRole() as any}>
      <div className="historico-container">
        
        <div className="historico-header">
          <div style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
            <button className="base-back-btn" onClick={() => navigate(-1)} style={{background: '#2a2a2a', border: '1px solid #444', color: '#fff', width: '36px', height: '36px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
              <span style={{fontSize: '18px', fontWeight: 'bold'}}>←</span>
            </button>
            <div>
              <h2>Histórico Global de Chamados</h2>
              <p>Consulte e acesse o registro completo de protocolos gerados.</p>
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
                      Nenhum registro encontrado.
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
                        <StatusBadge status={converterLabelStatus(c.status) as StatusType} />
                      </td>
                      <td className="t-data">{formatData(c.createdAt)}</td>
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
