// Dados fictícios usados no modo demonstração (GitHub Pages).
export type Nivel = 'cliente' | 'agente' | 'admin';
export type Status = 'aberto' | 'em_atendimento' | 'aguardando_cliente' | 'concluido' | 'cancelado';
export type Prioridade = 'baixa' | 'media' | 'alta' | 'urgente';

export interface UsuarioDemo { idUsuario: number; nome: string; email: string; senha: string; nivelAcesso: Nivel; }
export interface ChamadoDemo {
  idChamado: number; protocolo: string; titulo: string; descricao: string; categoria: string;
  status: Status; prioridade: Prioridade; idCliente: number; idAgente: number | null;
  avaliacao: number | null; createdAt: string; updatedAt: string; dataFechamento: string | null;
}
export interface MensagemDemo { idMensagem: number; idChamado: number; idRemetente: number; mensagem: string; createdAt: string; anexo?: string; mimeTypeAnexo?: string; }
export interface NotificacaoDemo { idNotificacao: number; idUsuario: number; tipo: string; lida: boolean; createdAt: string; idChamado?: number; }
export interface Banco {
  usuarios: UsuarioDemo[];
  empresas: { idEmpresa: number; nome: string; cnpj: string; email: string; ativo: boolean }[];
  agentes: { idAgente: number; idUsuario: number; idEmpresa: number; cargo: string; disponivel: boolean }[];
  categorias: { idCategoria: number; nome: string }[];
  macros: { idMacro: number; titulo: string; texto: string }[];
  chamados: ChamadoDemo[];
  mensagens: MensagemDemo[];
  notificacoes: NotificacaoDemo[];
  logs: { idLog: number; idUsuario: number; acao: string; detalhe: string; createdAt: string }[];
  seq: number;
}

const horasAtras = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export function bancoInicial(): Banco {
  const ano = new Date().getFullYear();
  const chamado = (id: number, titulo: string, descricao: string, categoria: string, prioridade: Prioridade, status: Status,
    idAgente: number | null, criadoHa: number, fechadoHa: number | null = null, avaliacao: number | null = null): ChamadoDemo => ({
    idChamado: id, protocolo: `${ano}-${String(id).padStart(6, '0')}`, titulo, descricao, categoria, prioridade, status,
    idCliente: 1, idAgente, avaliacao, createdAt: horasAtras(criadoHa), updatedAt: horasAtras(fechadoHa ?? criadoHa / 2),
    dataFechamento: fechadoHa === null ? null : horasAtras(fechadoHa),
  });

  return {
    usuarios: [
      { idUsuario: 1, nome: 'Marina Costa', email: 'cliente@demo.com', senha: 'demo123', nivelAcesso: 'cliente' },
      { idUsuario: 2, nome: 'Ana Ribeiro', email: 'agente@demo.com', senha: 'demo123', nivelAcesso: 'agente' },
      { idUsuario: 3, nome: 'Carlos Mendes', email: 'admin@demo.com', senha: 'demo123', nivelAcesso: 'admin' },
      { idUsuario: 4, nome: 'Rafael Lima', email: 'rafael@demo.com', senha: 'demo123', nivelAcesso: 'agente' },
    ],
    empresas: [
      { idEmpresa: 1, nome: 'Suporte Central', cnpj: '12.345.678/0001-90', email: 'contato@suportecentral.com', ativo: true },
      { idEmpresa: 2, nome: 'TechFix Serviços', cnpj: '98.765.432/0001-10', email: 'atendimento@techfix.com', ativo: true },
    ],
    agentes: [
      { idAgente: 1, idUsuario: 2, idEmpresa: 1, cargo: 'Analista de Suporte', disponivel: true },
      { idAgente: 2, idUsuario: 4, idEmpresa: 2, cargo: 'Técnico de Campo', disponivel: false },
    ],
    categorias: [
      { idCategoria: 1, nome: 'Acesso e senha' }, { idCategoria: 2, nome: 'Rede e internet' },
      { idCategoria: 3, nome: 'Hardware' }, { idCategoria: 4, nome: 'Sistemas internos' },
    ],
    macros: [
      { idMacro: 1, titulo: 'Saudação', texto: 'Olá! Já estou verificando o seu chamado e retorno em instantes.' },
      { idMacro: 2, titulo: 'Pedir print', texto: 'Pode me enviar um print da mensagem de erro que aparece na tela?' },
      { idMacro: 3, titulo: 'Encerramento', texto: 'Resolvido! Se precisar de algo mais, é só abrir um novo chamado.' },
    ],
    chamados: [
      chamado(1, 'Não consigo acessar o e-mail corporativo', 'Desde hoje cedo o Outlook pede a senha e não aceita.', 'Acesso e senha', 'alta', 'em_atendimento', 1, 3),
      chamado(2, 'Impressora do 2º andar não imprime', 'Os documentos ficam presos na fila de impressão.', 'Hardware', 'media', 'aberto', null, 1),
      chamado(3, 'Wi-Fi caindo na sala de reunião', 'A conexão cai a cada 10 minutos durante as chamadas.', 'Rede e internet', 'urgente', 'aguardando_cliente', 1, 20),
      chamado(4, 'Instalar VPN no notebook novo', 'Preciso da VPN para trabalhar de casa.', 'Rede e internet', 'baixa', 'concluido', 1, 72, 50, 5),
      chamado(5, 'Erro ao emitir relatório no ERP', 'Aparece "tempo limite excedido" ao gerar o relatório mensal.', 'Sistemas internos', 'alta', 'concluido', 2, 120, 104, 4),
      chamado(6, 'Trocar mouse com defeito', 'O botão esquerdo está falhando.', 'Hardware', 'baixa', 'cancelado', null, 200, 190),
    ],
    mensagens: [
      { idMensagem: 1, idChamado: 1, idRemetente: 1, mensagem: 'Oi! O Outlook pede a senha toda hora e não aceita a minha.', createdAt: horasAtras(3) },
      { idMensagem: 2, idChamado: 1, idRemetente: 2, mensagem: 'Olá, Marina! Vou verificar se a sua conta foi bloqueada por tentativas.', createdAt: horasAtras(2.8) },
      { idMensagem: 3, idChamado: 1, idRemetente: 2, mensagem: 'Desbloqueei a conta. Pode tentar de novo com a senha atual?', createdAt: horasAtras(2.5) },
      { idMensagem: 4, idChamado: 3, idRemetente: 1, mensagem: 'A internet cai bem no meio das reuniões.', createdAt: horasAtras(20) },
      { idMensagem: 5, idChamado: 3, idRemetente: 2, mensagem: 'Trocamos o canal do roteador. Pode testar na próxima reunião e me avisar?', createdAt: horasAtras(18) },
      { idMensagem: 6, idChamado: 4, idRemetente: 2, mensagem: 'VPN instalada e testada. Qualquer coisa me chame!', createdAt: horasAtras(50) },
    ],
    notificacoes: [
      { idNotificacao: 1, idUsuario: 1, tipo: 'nova_mensagem', lida: false, createdAt: horasAtras(2.5), idChamado: 1 },
      { idNotificacao: 2, idUsuario: 1, tipo: 'status_alterado', lida: false, createdAt: horasAtras(18), idChamado: 3 },
      { idNotificacao: 3, idUsuario: 2, tipo: 'novo_chamado', lida: false, createdAt: horasAtras(1), idChamado: 2 },
      { idNotificacao: 4, idUsuario: 3, tipo: 'novo_chamado', lida: false, createdAt: horasAtras(1), idChamado: 2 },
    ],
    logs: [
      { idLog: 1, idUsuario: 3, acao: 'CRIAR_EMPRESA', detalhe: 'Empresa TechFix Serviços cadastrada', createdAt: horasAtras(300) },
      { idLog: 2, idUsuario: 3, acao: 'CRIAR_AGENTE', detalhe: 'Agente Rafael Lima vinculado à TechFix', createdAt: horasAtras(290) },
      { idLog: 3, idUsuario: 2, acao: 'ALTERAR_STATUS', detalhe: 'Chamado #4 → concluido', createdAt: horasAtras(50) },
    ],
    seq: 100,
  };
}
