import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Paperclip, Search, Menu, Home, CheckCircle, XCircle, Star, X, Clock } from 'lucide-react';
import api from '../../../services/api';
import socket from '../../../services/socket';
import { AuthContext } from '../../../contexts/AuthContext';
import Layout from '../../../components/Layout/Layout';
import StatusBadge, { type StatusType } from '../../../components/StatusBadge/StatusBadge';
import { TicketUtils } from '../../../utils/TicketUtils';
import './Chat.css';

interface Mensagem { idMensagem: number; idRemetente: number; mensagem: string; createdAt: string; anexo?: string; mimeTypeAnexo?: string; }
interface ChamadoResumo { idChamado: number; protocolo: string; titulo: string; status: string; createdAt: string; }

export default function Chat() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { usuario } = useContext(AuthContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [listaChamados, setListaChamados] = useState<ChamadoResumo[]>([]);
  const [chamadoAtivo, setChamadoAtivo] = useState<any>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [termoBuscaSidebar, setTermoBuscaSidebar] = useState('');
  const [loadingSidebar, setLoadingSidebar] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);

  // Extras do Admin/Agente
  const [macros, setMacros] = useState<any[]>([]);
  const [agentes, setAgentes] = useState<any[]>([]);
  const [showMacros, setShowMacros] = useState(false);

  // Upload
  const [arquivoAnexo, setArquivoAnexo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CSAT
  const [avaliacaoHover, setAvaliacaoHover] = useState(0);
  const [avaliacaoEnviada, setAvaliacaoEnviada] = useState(false);

  // Auto-scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // Socket.io: entrar nas salas quando o ID muda
  useEffect(() => {
    if (id) {
      socket.emit('entrar_sala', id);
      socket.on('nova_mensagem', (msg: Mensagem) => {
        // Só adiciona se vier do outro lado (não é o nosso próprio envio optimistic)
        setMensagens(prev => {
          if (prev.find(m => m.idMensagem === msg.idMensagem)) return prev;
          return [...prev, msg];
        });
      });
    }
    if (usuario?.nivelAcesso === 'agente' || usuario?.nivelAcesso === 'admin') {
      socket.emit('entrar_sala_agentes');
    }
    return () => {
      if (id) { socket.emit('sair_sala', id); socket.off('nova_mensagem'); }
    };
  }, [id, usuario]);

  useEffect(() => {
    async function loadSidebar() {
      try { const res = await api.get('/chamados'); setListaChamados(res.data); }
      catch (err) { console.error(err); } finally { setLoadingSidebar(false); }
    }
    loadSidebar();
  }, []);

  useEffect(() => {
    async function loadExtras() {
      if (usuario?.nivelAcesso === 'admin' || usuario?.nivelAcesso === 'agente') {
        try {
          const resMac = await api.get('/macros'); setMacros(resMac.data);
          if (usuario?.nivelAcesso === 'admin') { const resAg = await api.get('/agentes'); setAgentes(resAg.data); }
        } catch(err) { console.error(err); }
      }
    }
    loadExtras();
  }, [usuario]);

  useEffect(() => {
    async function loadChat() {
      if (!id) { setChamadoAtivo(null); return; }
      setLoadingChat(true);
      setAvaliacaoEnviada(false);
      try {
        const [chamRes, msgRes] = await Promise.all([api.get(`/chamados/${id}`), api.get(`/chamados/${id}/mensagens`)]);
        setChamadoAtivo(chamRes.data); setMensagens(msgRes.data);
        if (chamRes.data.avaliacao) setAvaliacaoEnviada(true);
      } catch (err) { setChamadoAtivo(null); } finally { setLoadingChat(false); }
    }
    loadChat();
  }, [id]);

  const handleSendMessage = async () => {
    if (!id) return;
    
    let urlAnexo = '';
    let mimeTypeAnexo = '';

    // Upload do arquivo se houver
    if (arquivoAnexo) {
      try {
        const formData = new FormData();
        formData.append('arquivo', arquivoAnexo);
        const resUpload = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        urlAnexo = resUpload.data.url;
        mimeTypeAnexo = resUpload.data.mimeType;
        setArquivoAnexo(null);
      } catch (err) { alert('Erro ao enviar o arquivo.'); return; }
    }

    if (!novaMensagem.trim() && !urlAnexo) return;

    const msgTexto = novaMensagem || `📎 Arquivo: ${arquivoAnexo?.name || 'arquivo'}`;

    // Optimistic UI: adicionar mensagem imediatamente
    const msgTemp: Mensagem = {
      idMensagem: Date.now(),
      idRemetente: usuario?.idUsuario as number,
      mensagem: msgTexto,
      createdAt: new Date().toISOString(),
      anexo: urlAnexo,
      mimeTypeAnexo
    };
    setMensagens(prev => [...prev, msgTemp]);
    setNovaMensagem(''); setShowMacros(false);

    try {
      await api.post(`/chamados/${id}/mensagens`, { idRemetente: usuario?.idUsuario, mensagem: msgTexto, anexo: urlAnexo, mimeTypeAnexo });
    } catch(err) { console.error(err); }
  };

  const handleChangeStatus = async (novoStatus: string) => {
    if (!window.confirm(`Tem certeza que deseja marcar como "${TicketUtils.getStatusLabel(novoStatus)}"?`)) return;
    try {
      await api.patch(`/chamados/${id}/status`, { status: novoStatus });
      setChamadoAtivo((prev: any) => ({ ...prev, status: novoStatus }));
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao atualizar o status.");
    }
  };

  const handleAtribuir = async (agenteId: string) => {
    try {
      await api.patch(`/chamados/${id}/atribuir`, { idAgente: agenteId ? parseInt(agenteId) : null });
      setChamadoAtivo((prev: any) => ({ ...prev, idAgente: agenteId ? parseInt(agenteId) : null }));
    } catch(err) { alert("Erro ao atribuir chamado."); }
  };

  const handleAvaliar = async (nota: number) => {
    try {
      await api.patch(`/chamados/${id}/avaliar`, { avaliacao: nota });
      setChamadoAtivo((prev: any) => ({ ...prev, avaliacao: nota }));
      setAvaliacaoEnviada(true);
    } catch(err) { alert("Erro ao registrar avaliação."); }
  };

  const handleHomeBtn = () => {
    if (usuario?.nivelAcesso === 'admin') navigate('/admin');
    else if (usuario?.nivelAcesso === 'agente') navigate('/agente');
    else navigate('/cliente');
  };

  const contatosFiltrados = listaChamados.filter(c => {
    const isAtivo = c.status !== 'concluido' && c.status !== 'cancelado';
    return isAtivo && (c.protocolo.toLowerCase().includes(termoBuscaSidebar.toLowerCase()) || c.titulo.toLowerCase().includes(termoBuscaSidebar.toLowerCase()));
  });

  return (
    <Layout role={usuario?.nivelAcesso === 'admin' ? 'Admin' : (usuario?.nivelAcesso === 'agente' ? 'Agente' : 'Cliente')}>
      <div className="chat-layout-wrapper">
        <div className="chat-sidebar">
          <div className="sidebar-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3>Mensagens</h3><button className="chat-home-btn" onClick={handleHomeBtn} title="Voltar ao Painel"><Home size={20} /></button>
          </div>
          <div className="sidebar-search">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input type="text" placeholder="Buscar protocolo..." value={termoBuscaSidebar} onChange={(e) => setTermoBuscaSidebar(e.target.value)} />
            </div>
          </div>
          <div className="sidebar-contact-list">
            {loadingSidebar ? <p className="sidebar-msg">Carregando...</p> : contatosFiltrados.length === 0 ? <p className="sidebar-msg">Nenhum chamado ativo.</p> : contatosFiltrados.map(c => {
              const ativoCSS = id === String(c.idChamado) ? 'active-contact' : '';
              return (
                <div key={c.idChamado} className={`contact-item ${ativoCSS}`} onClick={() => navigate(`/chamado/${c.idChamado}`)}>
                  <div className="contact-avatar">{c.titulo.charAt(0).toUpperCase()}</div>
                  <div className="contact-info">
                    <div className="contact-title-row"><span className="contact-protocol">{c.protocolo}</span><span className="contact-time">{TicketUtils.formatTime(c.createdAt)}</span></div>
                    <p className="contact-subject">{c.titulo}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chat-main">
          {!id ? (
            <div className="no-chat-selected"><div className="empty-chat-icon"><Menu size={48} /></div><h2>Selecione um chamado</h2><p>Escolha um protocolo ativo na lateral para ver as mensagens.</p></div>
          ) : loadingChat ? (
            <div className="chat-loading">Carregando...</div>
          ) : !chamadoAtivo ? (
            <div className="chat-loading" style={{color: 'var(--danger)'}}>Chamado não encontrado!</div>
          ) : (
            <>
              <div className="chat-topbar">
                <div className="topbar-info">
                  <span className="topbar-protocol">{chamadoAtivo.protocolo}</span><span className="dot-separator">·</span><h3 className="topbar-title">{chamadoAtivo.titulo}</h3>
                </div>
                <div className="topbar-actions">
                  <StatusBadge status={TicketUtils.getStatusLabel(chamadoAtivo.status) as StatusType} />
                  {usuario?.nivelAcesso === 'admin' && chamadoAtivo.status !== 'concluido' && chamadoAtivo.status !== 'cancelado' && (
                    <select value={chamadoAtivo.idAgente || ''} onChange={(e) => handleAtribuir(e.target.value)} style={{ background: 'var(--bg-main)', color: 'var(--text-main)', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                      <option value="">Sem Atribuição</option>
                      {agentes.map(a => <option key={a.idUsuario} value={a.idUsuario}>{a.nome}</option>)}
                    </select>
                  )}
                  {chamadoAtivo.status !== 'concluido' && chamadoAtivo.status !== 'cancelado' && (
                    <div className="agent-controls">
                      {(usuario?.nivelAcesso === 'agente' || usuario?.nivelAcesso === 'admin') && (
                        <>
                          <button 
                            className="ctrl-btn resolve-btn" 
                            title="Marcar como Resolvido" 
                            onClick={() => handleChangeStatus('concluido')}
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            className="ctrl-btn" 
                            title="Aguardando Cliente" 
                            onClick={() => handleChangeStatus('aguardando_cliente')}
                            style={{ 
                              color: chamadoAtivo.status === 'aguardando_cliente' ? '#fff' : 'var(--warning)',
                              background: chamadoAtivo.status === 'aguardando_cliente' ? 'var(--warning)' : 'transparent',
                              border: `1px solid var(--warning)`,
                              borderRadius: '6px', padding: '6px', cursor: 'pointer'
                            }}
                          >
                            <Clock size={18} />
                          </button>
                        </>
                      )}
                      <button className="ctrl-btn cancel-btn" title="Cancelar Chamado" onClick={() => handleChangeStatus('cancelado')}><XCircle size={18} /></button>
                    </div>
                  )}
                </div>
              </div>

              <div className="chat-messages-area">
                {mensagens.length === 0 ? <p className="sidebar-msg">Nenhuma mensagem ainda. Comece a conversar!</p> : mensagens.map(msg => {
                  const isMine = msg.idRemetente === usuario?.idUsuario;
                  const isImage = msg.mimeTypeAnexo?.startsWith('image/');
                  return (
                    <div key={msg.idMensagem} className={`message-row ${isMine ? 'mine' : 'theirs'}`}>
                      <div className="message-bubble-modern">
                        {!isMine && <div className="msg-sender">Atendente</div>}
                        <div className="msg-text">{msg.mensagem}</div>
                        {msg.anexo && (
                          <div style={{marginTop: '8px'}}>
                            {isImage ? (
                              <a href={`http://localhost:3000${msg.anexo}`} target="_blank" rel="noreferrer">
                                <img src={`http://localhost:3000${msg.anexo}`} alt="anexo" style={{maxWidth: '220px', borderRadius: '8px', display: 'block'}} />
                              </a>
                            ) : (
                              <a href={`http://localhost:3000${msg.anexo}`} target="_blank" rel="noreferrer" style={{color: 'var(--primary-color)', fontSize: '0.85rem'}}>📎 Ver Anexo</a>
                            )}
                          </div>
                        )}
                        <div className="msg-time">{TicketUtils.formatTime(msg.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* AVALIAÇÃO CSAT - Cliente após chamado concluído */}
              {usuario?.nivelAcesso === 'cliente' && chamadoAtivo.status === 'concluido' && !avaliacaoEnviada && (
                <div style={{padding: '16px 24px', borderTop: '1px solid var(--border-color)', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap'}}>
                  <span style={{fontWeight: 600, color: 'var(--text-main)'}}>Como foi o atendimento?</span>
                  <div style={{display: 'flex', gap: '4px'}}>
                    {[1, 2, 3, 4, 5].map(nota => (
                      <button key={nota} onMouseEnter={() => setAvaliacaoHover(nota)} onMouseLeave={() => setAvaliacaoHover(0)} onClick={() => handleAvaliar(nota)}
                        style={{background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', transition: 'transform 0.1s', transform: avaliacaoHover >= nota ? 'scale(1.3)' : 'scale(1)'}}>
                        <Star size={28} fill={avaliacaoHover >= nota ? '#f59e0b' : 'transparent'} color={avaliacaoHover >= nota ? '#f59e0b' : '#9ca3af'} />
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setAvaliacaoEnviada(true)} style={{marginLeft: 'auto', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)'}}>
                    <X size={18} />
                  </button>
                </div>
              )}
              {usuario?.nivelAcesso === 'cliente' && chamadoAtivo.status === 'concluido' && avaliacaoEnviada && chamadoAtivo.avaliacao && (
                <div style={{padding: '12px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '4px', alignItems: 'center'}}>
                  <span style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>Avaliação registrada:</span>
                  {[1,2,3,4,5].map(n => <Star key={n} size={16} fill={chamadoAtivo.avaliacao >= n ? '#f59e0b' : 'transparent'} color={chamadoAtivo.avaliacao >= n ? '#f59e0b' : '#9ca3af'} />)}
                </div>
              )}

              {/* BARRA DE DIGITAÇÃO */}
              {chamadoAtivo.status !== 'concluido' && chamadoAtivo.status !== 'cancelado' && (
                <div className="chat-type-area">
                  <input type="file" ref={fileInputRef} style={{display: 'none'}} accept=".pdf,.png,.jpg,.jpeg,.gif,.webp" onChange={e => setArquivoAnexo(e.target.files?.[0] || null)} />
                  <button className="icon-action-btn" onClick={() => fileInputRef.current?.click()} title="Anexar arquivo" style={{position: 'relative'}}>
                    <Paperclip size={20} color={arquivoAnexo ? 'var(--primary-color)' : undefined} />
                    {arquivoAnexo && <span style={{position: 'absolute', top: '-6px', right: '-6px', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary-color)'}}></span>}
                  </button>

                  {(usuario?.nivelAcesso === 'admin' || usuario?.nivelAcesso === 'agente') && (
                    <div style={{position: 'relative'}}>
                      <button className="icon-action-btn" onClick={() => setShowMacros(!showMacros)} title="Respostas Prontas">⚡</button>
                      {showMacros && (
                        <div style={{position: 'absolute', bottom: '100%', left: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', zIndex: 10, width: '260px', maxHeight: '250px', overflowY: 'auto', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)'}}>
                          <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', paddingBottom: '4px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px'}}>Respostas Rápidas</div>
                          {macros.map(m => (
                            <button key={m.idMacro} onClick={() => { setNovaMensagem(m.texto); setShowMacros(false); }} style={{textAlign: 'left', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', flexDirection: 'column'}}>
                              <strong>{m.titulo}</strong>
                              <span style={{fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%'}}>{m.texto}</span>
                            </button>
                          ))}
                          {macros.length === 0 && <span style={{color: 'var(--text-muted)', fontSize: '0.8rem', padding: '4px'}}>Nenhuma macro cadastrada.</span>}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="type-input-wrapper">
                    {arquivoAnexo && <span style={{fontSize: '0.8rem', color: 'var(--primary-color)', padding: '4px 8px', background: 'var(--primary-light)', borderRadius: '4px', marginBottom: '4px', display: 'block'}}>📎 {arquivoAnexo.name}</span>}
                    <input type="text" placeholder="Digite sua resposta..." value={novaMensagem} onChange={(e) => setNovaMensagem(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
                  </div>
                  <button className="icon-action-btn send-bubble" onClick={handleSendMessage}>Enviar</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
