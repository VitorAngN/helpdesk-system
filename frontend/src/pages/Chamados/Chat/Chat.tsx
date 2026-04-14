import { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Paperclip, Search, Menu, Home, CheckCircle, XCircle } from 'lucide-react';
import api from '../../../services/api';
import { AuthContext } from '../../../contexts/AuthContext';
import Layout from '../../../components/Layout/Layout';
import StatusBadge, { type StatusType } from '../../../components/StatusBadge/StatusBadge';
import './Chat.css';

interface Mensagem {
  idMensagem: number;
  idRemetente: number;
  mensagem: string;
  createdAt: string;
}

interface ChamadoResumo {
  idChamado: number;
  protocolo: string;
  titulo: string;
  status: string;
  createdAt: string;
}

export default function Chat() {
  const navigate = useNavigate();
  const { id } = useParams(); // Pode ser nulo se clicar só em "Mensagens" no menu
  const { usuario } = useContext(AuthContext);

  const [listaChamados, setListaChamados] = useState<ChamadoResumo[]>([]);
  const [chamadoAtivo, setChamadoAtivo] = useState<any>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  
  const [termoBuscaSidebar, setTermoBuscaSidebar] = useState('');

  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);

  // 1. Carregar a Sidebar (Lista de Contatos/Chamados)
  useEffect(() => {
    async function loadSidebar() {
      try {
        const res = await api.get('/chamados');
        setListaChamados(res.data);
      } catch (err) {
        console.error("Erro ao carregar lista de chamados", err);
      } finally {
        setLoadingSidebar(false);
      }
    }
    loadSidebar();
  }, []);

  // 2. Carregar o Chat Ativo (Quando o ID na URL muda)
  useEffect(() => {
    async function loadChat() {
      if (!id) {
        setChamadoAtivo(null);
        return;
      }
      setLoadingChat(true);
      try {
        const [chamRes, msgRes] = await Promise.all([
          api.get(`/chamados/${id}`),
          api.get(`/chamados/${id}/mensagens`)
        ]);
        setChamadoAtivo(chamRes.data);
        setMensagens(msgRes.data);
      } catch (err) {
        console.error("Erro ao carregar o chat ativo", err);
        setChamadoAtivo(null);
      } finally {
        setLoadingChat(false);
      }
    }
    loadChat();
  }, [id]);

  // Enviar nova msg
  const handleSendMessage = async () => {
    if(!novaMensagem.trim() || !id) return;
    try {
      await api.post(`/chamados/${id}/mensagens`, {
        idRemetente: usuario?.idUsuario,
        mensagem: novaMensagem
      });
      // Atualiza lista local
      setMensagens(prev => [...prev, {
        idMensagem: Date.now(),
        idRemetente: usuario?.idUsuario as number,
        mensagem: novaMensagem,
        createdAt: new Date().toISOString()
      }]);
      setNovaMensagem('');
    } catch(err) {
      console.error("Erro ao enviar mensagem", err);
    }
  };

  // Mudar Status (Restrito Agente/Admin)
  const handleChangeStatus = async (novoStatus: string) => {
    try {
      await api.patch(`/chamados/${id}/status`, { status: novoStatus });
      setChamadoAtivo((prev: any) => ({ ...prev, status: novoStatus }));
      alert(`Chamado marcado com sucesso como: ${novoStatus.toUpperCase()}`);
    } catch (err) {
      alert("Erro ao tentar atualizar o status do chamado.");
    }
  };

  // Botão Voltar Dinâmico
  const handleHomeBtn = () => {
    if (usuario?.nivelAcesso === 'admin') navigate('/admin');
    else if (usuario?.nivelAcesso === 'agente') navigate('/agente');
    else navigate('/cliente');
  };

  // Formatações auxiliares
  const formatarHora = (dataString: string) => {
    const d = new Date(dataString);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const converterLabelStatus = (status: string) => {
    if(status === 'em_atendimento') return 'Em atendimento';
    if(status === 'aguardando_cliente') return 'Aguardando';
    if(status === 'concluido') return 'Concluído';
    return 'Aberto';
  };

  const contatosFiltrados = listaChamados.filter(c => 
    c.protocolo.toLowerCase().includes(termoBuscaSidebar.toLowerCase()) || 
    c.titulo.toLowerCase().includes(termoBuscaSidebar.toLowerCase())
  );

  return (
    <Layout role={usuario?.nivelAcesso === 'admin' ? 'Admin' : (usuario?.nivelAcesso === 'agente' ? 'Agente' : 'Cliente')}>
      
      <div className="chat-layout-wrapper">
        
        {/* ==========================================
            SIDEBAR (Esquerda) - Lista de Chamados
            ========================================== */}
        <div className="chat-sidebar">
          
          <div className="sidebar-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3>Mensagens</h3>
            <button className="chat-home-btn" onClick={handleHomeBtn} title="Voltar ao Painel">
              <Home size={20} />
            </button>
          </div>

          <div className="sidebar-search">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                placeholder="Buscar protocolo..." 
                value={termoBuscaSidebar}
                onChange={(e) => setTermoBuscaSidebar(e.target.value)}
              />
            </div>
          </div>

          <div className="sidebar-contact-list">
            {loadingSidebar ? (
              <p className="sidebar-msg">Carregando contatos...</p>
            ) : contatosFiltrados.length === 0 ? (
              <p className="sidebar-msg">Nenhum chamado encontrado.</p>
            ) : (
              contatosFiltrados.map(c => {
                const ativoCSS = id === String(c.idChamado) ? 'active-contact' : '';
                return (
                  <div 
                    key={c.idChamado} 
                    className={`contact-item ${ativoCSS}`}
                    onClick={() => navigate(`/chamado/${c.idChamado}`)}
                  >
                    <div className="contact-avatar">
                      {c.titulo.charAt(0).toUpperCase()}
                    </div>
                    <div className="contact-info">
                      <div className="contact-title-row">
                        <span className="contact-protocol">{c.protocolo}</span>
                        <span className="contact-time">{formatarHora(c.createdAt)}</span>
                      </div>
                      <p className="contact-subject">{c.titulo}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* ==========================================
            MAIN AREA (Direita) - Conversa Ativa
            ========================================== */}
        <div className="chat-main">
          {!id ? (
            <div className="no-chat-selected">
              <div className="empty-chat-icon">
                <Menu size={48} />
              </div>
              <h2>Selecione um chamado</h2>
              <p>Escolha um protocolo na lateral esquerda para visualizar o histórico de mensagens.</p>
            </div>
          ) : loadingChat ? (
            <div className="chat-loading">Restaurando backup de mensagens...</div>
          ) : !chamadoAtivo ? (
            <div className="chat-loading" style={{color: '#ef4444'}}>Chamado não encontrado!</div>
          ) : (
            <>
              {/* TOPBAR DA CONVERSA */}
              <div className="chat-topbar">
                <div className="topbar-info">
                  <span className="topbar-protocol">{chamadoAtivo.protocolo}</span>
                  <span className="dot-separator">·</span>
                  <h3 className="topbar-title">{chamadoAtivo.titulo}</h3>
                </div>
                
                <div className="topbar-actions">
                  <StatusBadge status={converterLabelStatus(chamadoAtivo.status) as StatusType} />
                  
                  {/* BOTÕES DE CONTROLE (Somente Agentes/Admin e se não estiver concluído/cancelado) */}
                  {(usuario?.nivelAcesso === 'agente' || usuario?.nivelAcesso === 'admin') && 
                   chamadoAtivo.status !== 'concluido' && chamadoAtivo.status !== 'cancelado' && (
                    <div className="agent-controls">
                      <button 
                        className="ctrl-btn resolve-btn" 
                        title="Marcar como Resolvido"
                        onClick={() => handleChangeStatus('concluido')}
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button 
                        className="ctrl-btn cancel-btn" 
                        title="Cancelar Chamado"
                        onClick={() => handleChangeStatus('cancelado')}
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* LISTA DE MENSAGENS */}
              <div className="chat-messages-area">
                {mensagens.length === 0 ? (
                  <p className="sidebar-msg">Nenhuma mensagem neste chamado. Comece a conversar!</p>
                ) : (
                  mensagens.map(msg => {
                    const isMine = msg.idRemetente === usuario?.idUsuario;
                    return (
                      <div key={msg.idMensagem} className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
                        <div className="message-bubble-modern">
                          {!isMine && <div className="msg-sender">Atendente</div>}
                          <div className="msg-text">{msg.mensagem}</div>
                          <div className="msg-time">{formatarHora(msg.createdAt)}</div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {/* BARRA DE DIGITAÇÃO */}
              <div className="chat-type-area">
                <button className="icon-action-btn"><Paperclip size={20}/></button>
                <div className="type-input-wrapper">
                  <input 
                    type="text" 
                    placeholder="Digite sua resposta e aperte Enter..." 
                    value={novaMensagem}
                    onChange={(e) => setNovaMensagem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                </div>
                <button className="icon-action-btn send-bubble" onClick={handleSendMessage}>
                  Enviar
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </Layout>
  );
}
