import { useState, useEffect, useContext } from 'react';
import { Bell, LogOut, ArchiveRestore, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContextValue';
import api from '../../services/api';
import socket from '../../services/socket';
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
  const { logout, usuario } = useContext(AuthContext);
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    let ativo = true;

    async function fetchNotificacoes() {
      try {
        const res = await api.get('/notificacoes');
        if (ativo) setNotificacoes(res.data);
      } catch (err) {
        console.error("Erro notifications", err);
      }
    }

    fetchNotificacoes();

    return () => { ativo = false; };
  }, []);

  // Escutar notificações em tempo real via socket
  useEffect(() => {
    if (!usuario?.idUsuario) return;
    const eventKey = `notificacao_${usuario.idUsuario}`;
    socket.on(eventKey, (novaNotif: Notificacao) => {
      setNotificacoes(prev => [novaNotif, ...prev]);
    });
    return () => { socket.off(eventKey); };
  }, [usuario?.idUsuario]);

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
      {/* O logo e o título foram movidos para a Sidebar */}
      <div className="header-spacer"></div>

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
                    <div 
                      key={notif.idNotificacao} 
                      className={`notif-item ${notif.lida ? 'lida' : 'nao-lida'}`}
                    >
                      <div 
                        className="notif-content" 
                        style={{ cursor: notif.idChamado ? 'pointer' : 'default' }}
                        onClick={() => {
                          if (!notif.lida) markAsRead(notif.idNotificacao);
                          if (notif.idChamado) {
                            setShowDropdown(false);
                            navigate(`/chamado/${notif.idChamado}`);
                          }
                        }}
                      >
                        <strong>
                          {notif.tipo === 'nova_mensagem' ? 'Nova Mensagem' : 
                           notif.tipo === 'novo_chamado' ? 'Novo Chamado' :
                           notif.tipo === 'chamado_concluido' ? 'Chamado Concluído' : 
                           notif.tipo === 'status_alterado' ? 'Status Alterado' : 'Aviso do Sistema'}
                        </strong>
                        {notif.idChamado && <span> Chamado #{notif.idChamado}</span>}
                      </div>
                      {!notif.lida && (
                        <button className="notif-read-btn" onClick={(e) => { e.stopPropagation(); markAsRead(notif.idNotificacao); }} title="Marcar como Lido">
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
