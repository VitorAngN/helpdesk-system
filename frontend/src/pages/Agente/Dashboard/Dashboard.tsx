import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../../components/Layout/Layout';
import StatusBadge, { type StatusType } from '../../../components/StatusBadge/StatusBadge';
import api from '../../../services/api';
import { TicketUtils } from '../../../utils/TicketUtils';
import './Dashboard.css';

interface Chamado {
  idChamado: number;
  protocolo: string;
  titulo: string;
  status: string;
  prioridade: string;
  createdAt: string;
}

export default function AgenteDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'Todos' | 'Urgentes' | 'Aguardando'>('Todos');
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChamados() {
      try {
        const res = await api.get('/chamados');
        setChamados(res.data);
      } catch (err) {
        console.error("Erro", err);
      } finally {
        setLoading(false);
      }
    }
    loadChamados();
  }, []);

  const total = chamados.length;
  const concluidos = chamados.filter(c => c.status === 'concluido').length;
  const urgentesAlta = chamados.filter(c => c.prioridade === 'urgente' || c.prioridade === 'alta').length;

  // Filtra da visualização os chamados concluídos ou cancelados (Limpa a fila do agente)
  let chamadosFiltrados = chamados.filter(c => c.status !== 'concluido' && c.status !== 'cancelado');
  
  if(activeTab === 'Urgentes') {
    chamadosFiltrados = chamadosFiltrados.filter(c => c.prioridade === 'urgente' || c.prioridade === 'alta');
  } else if(activeTab === 'Aguardando') {
    chamadosFiltrados = chamadosFiltrados.filter(c => c.status === 'aguardando_cliente');
  }

  return (
    <Layout role="Agente">
      {/* KPIs */}
      <div className="kpi-cards">
        <div className="kpi-card">
          <span className="kpi-label">Meus chamados</span>
          <span className="kpi-value">{total}</span>
          <span className="kpi-desc">no sistema</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Concluídos hoje</span>
          <span className="kpi-value text-green">{concluidos}</span>
          <span className="kpi-desc">nesta sessão</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">Urgentes / Alto</span>
          <span className="kpi-value text-red">{urgentesAlta}</span>
          <span className="kpi-desc">alta prioridade</span>
        </div>
      </div>

      {/* LISTA DE CHAMADOS ATRIBUÍDOS */}
      <div className="assigned-tickets-container">
        <div className="tickets-header">
          <h3>Chamados atribuídos</h3>
          <div className="tabs-container">
            <button 
              className={`tab-btn ${activeTab === 'Todos' ? 'active' : ''}`}
              onClick={() => setActiveTab('Todos')}
            >
              Fila Ativa
            </button>
            <button 
              className={`tab-btn ${activeTab === 'Urgentes' ? 'active' : ''}`}
              onClick={() => setActiveTab('Urgentes')}
            >
              Urgentes
            </button>
            <button 
              className={`tab-btn ${activeTab === 'Aguardando' ? 'active' : ''}`}
              onClick={() => setActiveTab('Aguardando')}
            >
              Aguardando
            </button>
          </div>
        </div>

        <div className="tickets-list">
          {loading ? (
             <p style={{padding: '20px', color: '#6b7280'}}>Carregando fila de atendimento...</p>
          ) : chamadosFiltrados.length === 0 ? (
             <p style={{padding: '20px', color: '#6b7280'}}>Nenhum chamado nesta categoria!</p>
          ) : (
            chamadosFiltrados.map(ticket => {
              const borderClass = ticket.prioridade === 'urgente' || ticket.prioridade === 'alta' ? 'border-red' : (ticket.prioridade === 'media' ? 'border-yellow' : '');

              return (
                <div 
                  key={ticket.idChamado} 
                  className={`ticket-item ${borderClass}`} 
                  style={{cursor: 'pointer'}}
                  onClick={() => navigate(`/chamado/${ticket.idChamado}`)}
                >
                  <div className="ticket-info">
                    <span className="ticket-id">{ticket.protocolo}</span>
                    <p className="ticket-title">{ticket.titulo}</p>
                    <span className="ticket-meta">Prioridade: {ticket.prioridade} · {ticket.status}</span>
                  </div>
                  <div className="ticket-status">
                    <StatusBadge status={TicketUtils.getStatusLabel(ticket.status) as StatusType} />
                    <span className="time-ago">{TicketUtils.formatTime(ticket.createdAt)}</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
