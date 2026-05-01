import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Clock } from 'lucide-react';
import api from '../../../services/api';
import Layout from '../../../components/Layout/Layout';
import StatusBadge, { type StatusType } from '../../../components/StatusBadge/StatusBadge';
import { TicketUtils } from '../../../utils/TicketUtils';
import './Home.css';

// Interface do objeto no Banco de Dados
interface ChamadoModel {
  idChamado: number;
  protocolo: string;
  titulo: string;
  status: string;
}

export default function ClienteHome() {
  const navigate = useNavigate();
  const [chamados, setChamados] = useState<ChamadoModel[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarChamados() {
      try {
        const response = await api.get('/chamados');
        setChamados(response.data);
      } catch (error) {
        console.error("Erro ao buscar chamados", error);
      } finally {
        setCarregando(false);
      }
    }
    carregarChamados();
  }, []);

  // Filtros rápidos p/ contadores
  const abertos = chamados.filter(c => c.status !== 'concluido' && c.status !== 'cancelado').length;
  return (
    <Layout role="Cliente">
      <div className="home-header">
        <h1 className="greeting-title">Olá, Victor!</h1>
        <p className="greeting-subtitle">O que você precisa hoje?</p>
      </div>

      <div className="action-cards">
        <button 
          className="action-card new-ticket"
          onClick={() => navigate('/novo-chamado')}
        >
          <div className="card-icon-wrapper new">
            <Plus size={20} strokeWidth={3} />
          </div>
          <div className="card-texts">
            <h3>Novo chamado</h3>
            <p>Abrir suporte</p>
          </div>
        </button>

        <button 
          className="action-card open-tickets"
          onClick={() => navigate('/historico', { state: { tab: 'Abertos' } })}
        >
          <div className="card-icon-wrapper open">
            <FileText size={20} />
          </div>
          <div className="card-texts">
            <h3>Em aberto</h3>
            <p>{abertos} chamados</p>
          </div>
        </button>

        <button 
          className="action-card history"
          onClick={() => navigate('/historico', { state: { tab: 'Geral' } })}
        >
          <div className="card-icon-wrapper history-icon">
            <Clock size={20} />
          </div>
          <div className="card-texts">
            <h3>Histórico</h3>
            <p>{chamados.length} no total</p>
          </div>
        </button>
      </div>

      <div className="recent-list-container">
        <div className="list-header">
          <h3>Chamados recentes</h3>
          <button 
            className="link-ver-todos" 
            onClick={() => navigate('/historico', { state: { tab: 'Geral' } })}
            style={{background: 'transparent', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600}}
          >
            Ver todos
          </button>
        </div>

        <div className="list-content">
          {carregando ? (
            <p className="loading-text">Carregando chamados...</p>
          ) : chamados.filter(c => c.status !== 'concluido' && c.status !== 'cancelado').length === 0 ? (
            <p className="empty-text">Nenhum chamado em aberto no momento.</p>
          ) : (
            chamados
              .filter(c => c.status !== 'concluido' && c.status !== 'cancelado')
              .slice(0, 5) // Mostra apenas os 5 mais recentes
              .map((item) => {
              const labelStatus = TicketUtils.getStatusLabel(item.status);

              return (
                <div 
                  key={item.idChamado}
                  className="list-item" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/chamado/${item.idChamado}`)}
                >
                  <div className="item-info">
                    <span className="item-id">{item.protocolo}</span>
                    <p className="item-title">{item.titulo}</p>
                  </div>
                  <StatusBadge status={labelStatus as StatusType} />
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
