import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Clock } from 'lucide-react';
import api from '../../../services/api';
import Layout from '../../../components/Layout/Layout';
import StatusBadge, { type StatusType } from '../../../components/StatusBadge/StatusBadge';
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

        <button className="action-card open-tickets">
          <div className="card-icon-wrapper open">
            <FileText size={20} />
          </div>
          <div className="card-texts">
            <h3>Em aberto</h3>
            <p>{abertos} chamados</p>
          </div>
        </button>

        <button className="action-card history">
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
          <a href="#" className="link-ver-todos">Ver todos</a>
        </div>

        <div className="list-content">
          {carregando ? (
            <p className="loading-text">Carregando chamados...</p>
          ) : chamados.length === 0 ? (
            <p className="empty-text">Nenhum chamado encontrado.</p>
          ) : (
            chamados.map((item) => {
              // Converte status do bd (em_atendimento) para label visual (Em atendimento)
              let labelStatus = item.status;
              if(item.status === 'em_atendimento') labelStatus = 'Em atendimento';
              if(item.status === 'aguardando_cliente') labelStatus = 'Aguardando';
              if(item.status === 'aberto') labelStatus = 'Aberto';
              if(item.status === 'concluido') labelStatus = 'Concluído';

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
