import { useState, useEffect, useContext } from 'react';
import { Bell, LogOut, ArchiveRestore, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import api from '../../services/api';
import './Header.css';

interface Notificacao {
  idNotificacao: number;
  tipo: string;
  lida: boolean;
  createdAt: string;
  idChamado?: number;
}

interface HeaderProps {
  userName?: string;
  userInitials?: string;
  role?: string;
}

export default function Header({ userName, userInitials = "U", role = "Cliente" }: HeaderProps) {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotificacoes();
  }, []);

  const fetchNotificacoes = async () => {
    try {
      const res = await api.get('/notificacoes');
      setNotificacoes(res.data);
    } catch (err) {
      console.error("Erro notifications", err);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notificacoes/${id}/lida`);
      setNotificacoes(prev => prev.map(n => n.idNotificacao === id ? { ...n, lida: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notificacoes.filter(n => !n.lida).length;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="header-container">
      <div className="header-logo">
        <div className="logo-icon-small">
          <span className="logo-squares-small"></span>
        </div>
        <h2>HelpDesk {role === 'Admin' ? '- Admin' : role === 'Agente' ? '- Agente' : ''}</h2>
      </div>

      <div className="header-actions">
        {role === 'Agente' && (
           <div className="status-indicator">
             <span className="dot online"></span> Disponível
           </div>
        )}
        <button className="notification-btn" onClick={() => navigate('/historico')} title="Acessar Histórico Geral">
          <ArchiveRestore size={20} />
        </button>
        
        <div className="notification-wrapper">
          <button className="notification-btn" onClick={() => setShowDropdown(!showDropdown)}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="notification-dot">{unreadCount}</span>}
          </button>
          
          {showDropdown && (
            <div className="notification-dropdown">
              <div className="notif-header">
                <h4>Notificações</h4>
                {unreadCount > 0 && <span>{unreadCount} novas</span>}
              </div>
              <div className="notif-list">
                {notificacoes.length === 0 ? (
                  <p className="notif-empty">Você não tem notificações.</p>
                ) : (
                  notificacoes.slice(0, 8).map(notif => (
                    <div key={notif.idNotificacao} className={`notif-item ${notif.lida ? 'lida' : 'nao-lida'}`}>
                      <div className="notif-content">
                        <strong>
                          {notif.tipo === 'nova_mensagem' ? 'Nova Mensagem' : 
                           notif.tipo === 'novo_chamado' ? 'Novo Chamado' :
                           notif.tipo === 'chamado_concluido' ? 'Chamado Concluído' : 'Aviso do Sistema'}
                        </strong>
                        {notif.idChamado && <span> Chamado #{notif.idChamado}</span>}
                      </div>
                      {!notif.lida && (
                        <button className="notif-read-btn" onClick={() => markAsRead(notif.idNotificacao)} title="Marcar como Lido">
                          <Check size={14} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="user-avatar" title={userName}>
          {userInitials}
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Sair da conta">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
}
