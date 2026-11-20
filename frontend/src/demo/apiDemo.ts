// Adaptador do axios que responde às mesmas rotas da API real usando dados
// em memória (salvos no localStorage). Assim a demo roda só no navegador.
import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { bancoInicial, type Banco, type Nivel, type Status } from './dados';
import { dispararEvento } from './socketDemo';

const CHAVE = '@HelpDesk:demo';

function carregar(): Banco {
  try { const salvo = localStorage.getItem(CHAVE); if (salvo) return JSON.parse(salvo) as Banco; } catch { /* dados corrompidos */ }
  return bancoInicial();
}
let db = carregar();
const salvar = () => { try { localStorage.setItem(CHAVE, JSON.stringify(db)); } catch { /* sem storage */ } };

export function restaurarDemo() {
  db = bancoInicial();
  salvar();
}

class ErroHttp extends Error {
  status: number;
  constructor(status: number, msg: string) { super(msg); this.status = status; }
}
const agora = () => new Date().toISOString();
const novoId = () => ++db.seq;

function log(idUsuario: number, acao: string, detalhe: string) {
  db.logs.unshift({ idLog: novoId(), idUsuario, acao, detalhe, createdAt: agora() });
}
function notificar(idUsuario: number, tipo: string, idChamado?: number) {
  const n = { idNotificacao: novoId(), idUsuario, tipo, lida: false, createdAt: agora(), idChamado };
  db.notificacoes.unshift(n);
  dispararEvento(`notificacao_${idUsuario}`, n);
}
const idsEquipe = () => db.usuarios.filter((u) => u.nivelAcesso !== 'cliente').map((u) => u.idUsuario);
const usuarioDoAgente = (idAgente: number | null) => db.agentes.find((a) => a.idAgente === idAgente)?.idUsuario;

function usuarioLogado(config: InternalAxiosRequestConfig) {
  const auth = String(config.headers?.Authorization ?? '');
  const id = Number(auth.replace('Bearer demo.', ''));
  const u = db.usuarios.find((x) => x.idUsuario === id);
  if (!u) throw new ErroHttp(401, 'Sessão expirada. Entre novamente.');
  return u;
}

function chamadoVisivel(id: number, u: ReturnType<typeof usuarioLogado>) {
  const c = db.chamados.find((x) => x.idChamado === id);
  if (!c) throw new ErroHttp(404, 'Chamado não encontrado.');
  if (u.nivelAcesso === 'cliente' && c.idCliente !== u.idUsuario) throw new ErroHttp(403, 'Acesso negado.');
  if (u.nivelAcesso === 'agente' && c.idAgente !== null && usuarioDoAgente(c.idAgente) !== u.idUsuario) throw new ErroHttp(403, 'Acesso negado.');
  return c;
}

const somenteAdmin = (u: { nivelAcesso: string }) => { if (u.nivelAcesso !== 'admin') throw new ErroHttp(403, 'Acesso negado.'); };

// Resposta automática do atendente, para mostrar o "tempo real" na demo.
function respostaAutomatica(idChamado: number) {
  setTimeout(() => {
    const c = db.chamados.find((x) => x.idChamado === idChamado);
    if (!c || c.status === 'concluido' || c.status === 'cancelado') return;
    const idAtendente = usuarioDoAgente(c.idAgente) ?? 2;
    const msg = { idMensagem: novoId(), idChamado, idRemetente: idAtendente, mensagem: 'Recebido! Já estou olhando isso para você.', createdAt: agora() };
    db.mensagens.push(msg);
    if (c.status === 'aberto') c.status = 'em_atendimento';
    salvar();
    dispararEvento('nova_mensagem', msg);
    notificar(c.idCliente, 'nova_mensagem', idChamado);
    salvar();
  }, 2500);
}

type Handler = (p: { u: () => ReturnType<typeof usuarioLogado>; body: Record<string, unknown>; params: string[]; config: InternalAxiosRequestConfig }) => unknown;
const rotas: [string, RegExp, Handler][] = [
  ['post', /^\/auth\/login$/, ({ body }) => {
    const u = db.usuarios.find((x) => x.email === String(body.email).trim().toLowerCase() && x.senha === body.senha);
    if (!u) throw new ErroHttp(401, 'E-mail ou senha incorretos.');
    return { token: `demo.${u.idUsuario}`, usuario: { idUsuario: u.idUsuario, nome: u.nome, email: u.email, nivelAcesso: u.nivelAcesso } };
  }],
  ['post', /^\/usuarios$/, ({ body, config }) => {
    const email = String(body.email).trim().toLowerCase();
    if (db.usuarios.some((x) => x.email === email)) throw new ErroHttp(409, 'E-mail já cadastrado.');
    const nivel: Nivel = body.nivelAcesso === 'admin' ? 'admin' : body.nivelAcesso === 'agente' ? 'agente' : 'cliente';
    if (nivel !== 'cliente') somenteAdmin(usuarioLogado(config));
    const novo = { idUsuario: novoId(), nome: String(body.nome), email, senha: String(body.senha), nivelAcesso: nivel };
    db.usuarios.push(novo);
    return { idUsuario: novo.idUsuario, nome: novo.nome, email: novo.email, nivelAcesso: novo.nivelAcesso };
  }],
  ['get', /^\/chamados$/, ({ u }) => {
    const eu = u();
    const lista = eu.nivelAcesso === 'cliente' ? db.chamados.filter((c) => c.idCliente === eu.idUsuario)
      : eu.nivelAcesso === 'agente' ? db.chamados.filter((c) => c.idAgente === null || usuarioDoAgente(c.idAgente) === eu.idUsuario)
      : db.chamados;
    return [...lista].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }],
  ['post', /^\/chamados$/, ({ u, body }) => {
    const eu = u();
    if (eu.nivelAcesso !== 'cliente') throw new ErroHttp(403, 'Só clientes abrem chamados.');
    const id = novoId();
    const c = {
      idChamado: id, protocolo: `${new Date().getFullYear()}-${String(id).padStart(6, '0')}`, titulo: String(body.titulo),
      descricao: String(body.descricao), categoria: String(body.categoria || 'Geral'), status: 'aberto' as Status,
      prioridade: (['baixa', 'media', 'alta', 'urgente'].includes(String(body.prioridade)) ? body.prioridade : 'media') as 'media',
      idCliente: eu.idUsuario, idAgente: null, avaliacao: null, createdAt: agora(), updatedAt: agora(), dataFechamento: null,
    };
    db.chamados.push(c);
    db.mensagens.push({ idMensagem: novoId(), idChamado: id, idRemetente: eu.idUsuario, mensagem: c.descricao, createdAt: agora(),
      anexo: body.anexo ? String(body.anexo) : undefined, mimeTypeAnexo: body.mimeTypeAnexo ? String(body.mimeTypeAnexo) : undefined });
    idsEquipe().forEach((idU) => notificar(idU, 'novo_chamado', id));
    log(eu.idUsuario, 'CRIAR_CHAMADO', `Chamado #${id} aberto`);
    respostaAutomatica(id);
    return c;
  }],
  ['get', /^\/chamados\/(\d+)$/, ({ u, params }) => chamadoVisivel(Number(params[0]), u())],
  ['get', /^\/chamados\/(\d+)\/mensagens$/, ({ u, params }) => {
    chamadoVisivel(Number(params[0]), u());
    return db.mensagens.filter((m) => m.idChamado === Number(params[0]));
  }],
  ['post', /^\/chamados\/(\d+)\/mensagens$/, ({ u, params, body }) => {
    const eu = u(); const c = chamadoVisivel(Number(params[0]), eu);
    if (c.status === 'concluido' || c.status === 'cancelado') throw new ErroHttp(409, 'Chamado encerrado.');
    const msg = { idMensagem: novoId(), idChamado: c.idChamado, idRemetente: eu.idUsuario, mensagem: String(body.mensagem ?? ''), createdAt: agora(),
      anexo: body.anexo ? String(body.anexo) : undefined, mimeTypeAnexo: body.mimeTypeAnexo ? String(body.mimeTypeAnexo) : undefined };
    db.mensagens.push(msg);
    c.updatedAt = agora();
    if (eu.nivelAcesso === 'cliente') {
      const idAtendente = usuarioDoAgente(c.idAgente);
      if (idAtendente) notificar(idAtendente, 'nova_mensagem', c.idChamado);
      respostaAutomatica(c.idChamado);
    } else {
      if (c.status === 'aberto') c.status = 'em_atendimento';
      notificar(c.idCliente, 'nova_mensagem', c.idChamado);
    }
    return msg;
  }],
  ['patch', /^\/chamados\/(\d+)\/status$/, ({ u, params, body }) => {
    const eu = u(); const c = chamadoVisivel(Number(params[0]), eu);
    const status = String(body.status) as Status;
    if (eu.nivelAcesso === 'cliente' && status !== 'cancelado') throw new ErroHttp(403, 'Cliente só pode cancelar chamados.');
    c.status = status; c.updatedAt = agora();
    c.dataFechamento = status === 'concluido' || status === 'cancelado' ? agora() : null;
    notificar(c.idCliente, status === 'concluido' ? 'chamado_concluido' : 'status_alterado', c.idChamado);
    log(eu.idUsuario, 'ALTERAR_STATUS', `Chamado #${c.idChamado} → ${status}`);
    return c;
  }],
  ['patch', /^\/chamados\/(\d+)\/atribuir$/, ({ u, params, body }) => {
    const eu = u(); somenteAdmin(eu);
    const c = chamadoVisivel(Number(params[0]), eu);
    c.idAgente = body.idAgente === null ? null : Number(body.idAgente);
    log(eu.idUsuario, 'ATRIBUIR_CHAMADO', `Chamado #${c.idChamado} → agente ${c.idAgente ?? 'nenhum'}`);
    return c;
  }],
  ['patch', /^\/chamados\/(\d+)\/avaliar$/, ({ u, params, body }) => {
    const eu = u(); const c = chamadoVisivel(Number(params[0]), eu);
    if (c.idCliente !== eu.idUsuario) throw new ErroHttp(403, 'Acesso negado.');
    if (c.status !== 'concluido') throw new ErroHttp(409, 'Só é possível avaliar chamados concluídos.');
    c.avaliacao = Math.min(5, Math.max(1, Number(body.avaliacao)));
    return c;
  }],
  ['get', /^\/notificacoes$/, ({ u }) => db.notificacoes.filter((n) => n.idUsuario === u().idUsuario)],
  ['patch', /^\/notificacoes\/(\d+)\/lida$/, ({ u, params }) => {
    const n = db.notificacoes.find((x) => x.idNotificacao === Number(params[0]) && x.idUsuario === u().idUsuario);
    if (!n) throw new ErroHttp(404, 'Notificação não encontrada.');
    n.lida = true; return n;
  }],
  ['get', /^\/categorias$/, ({ u }) => { u(); return db.categorias; }],
  ['post', /^\/categorias$/, ({ u, body }) => { const eu = u(); somenteAdmin(eu); const c = { idCategoria: novoId(), nome: String(body.nome) }; db.categorias.push(c); log(eu.idUsuario, 'CRIAR_CATEGORIA', c.nome); return c; }],
  ['delete', /^\/categorias\/(\d+)$/, ({ u, params }) => { somenteAdmin(u()); db.categorias = db.categorias.filter((c) => c.idCategoria !== Number(params[0])); return null; }],
  ['get', /^\/macros$/, ({ u }) => { if (u().nivelAcesso === 'cliente') throw new ErroHttp(403, 'Acesso negado.'); return db.macros; }],
  ['post', /^\/macros$/, ({ u, body }) => { somenteAdmin(u()); const m = { idMacro: novoId(), titulo: String(body.titulo), texto: String(body.texto) }; db.macros.push(m); return m; }],
  ['delete', /^\/macros\/(\d+)$/, ({ u, params }) => { somenteAdmin(u()); db.macros = db.macros.filter((m) => m.idMacro !== Number(params[0])); return null; }],
  ['get', /^\/empresas$/, ({ u }) => { somenteAdmin(u()); return db.empresas; }],
  ['post', /^\/empresas$/, ({ u, body }) => {
    const eu = u(); somenteAdmin(eu);
    const e = { idEmpresa: novoId(), nome: String(body.nome), cnpj: String(body.cnpj), email: String(body.email), ativo: true };
    db.empresas.push(e); log(eu.idUsuario, 'CRIAR_EMPRESA', `Empresa ${e.nome} cadastrada`); return e;
  }],
  ['get', /^\/agentes$/, ({ u }) => {
    somenteAdmin(u());
    return db.agentes.map((a) => {
      const us = db.usuarios.find((x) => x.idUsuario === a.idUsuario)!;
      return { ...a, nome: us.nome, email: us.email, nivelAcesso: us.nivelAcesso, empresaNome: db.empresas.find((e) => e.idEmpresa === a.idEmpresa)?.nome };
    });
  }],
  ['post', /^\/agentes$/, ({ u, body }) => {
    const eu = u(); somenteAdmin(eu);
    const a = { idAgente: novoId(), idUsuario: Number(body.idUsuario), idEmpresa: Number(body.idEmpresa), cargo: String(body.cargo || 'Atendente'), disponivel: true };
    db.agentes.push(a); log(eu.idUsuario, 'CRIAR_AGENTE', `Agente #${a.idAgente} criado`); return a;
  }],
  ['get', /^\/logs$/, ({ u }) => {
    somenteAdmin(u());
    return db.logs.map((l) => { const us = db.usuarios.find((x) => x.idUsuario === l.idUsuario); return { ...l, usuario: { nome: us?.nome ?? '—', email: us?.email ?? '' } }; });
  }],
  ['get', /^\/analytics$/, ({ u }) => {
    somenteAdmin(u());
    const cs = db.chamados;
    const avaliados = cs.filter((c) => c.avaliacao !== null);
    const resolvidos = cs.filter((c) => c.status === 'concluido' && c.dataFechamento);
    const horas = resolvidos.map((c) => (Date.parse(c.dataFechamento!) - Date.parse(c.createdAt)) / 3_600_000);
    const prioridades = ['baixa', 'media', 'alta', 'urgente'];
    return {
      totalChamados: cs.length,
      abertos: cs.filter((c) => !['concluido', 'cancelado'].includes(c.status)).length,
      concluidos: cs.filter((c) => c.status === 'concluido').length,
      cancelados: cs.filter((c) => c.status === 'cancelado').length,
      porPrioridade: prioridades.map((p) => ({ prioridade: p, _count: { prioridade: cs.filter((c) => c.prioridade === p).length } })).filter((p) => p._count.prioridade > 0),
      mediaCsat: avaliados.length ? Math.round((avaliados.reduce((s, c) => s + c.avaliacao!, 0) / avaliados.length) * 10) / 10 : null,
      totalAvaliados: avaliados.length,
      tempoMedioResolucaoHoras: horas.length ? Math.round((horas.reduce((a, b) => a + b, 0) / horas.length) * 10) / 10 : null,
      totalConcluidosComSLA: horas.length,
    };
  }],
  ['post', /^\/upload$/, ({ u, config }) => {
    u();
    const arquivo = (config.data as FormData).get('arquivo') as File;
    return { url: URL.createObjectURL(arquivo), mimeType: arquivo.type };
  }],
];

export const adaptadorDemo: AxiosAdapter = async (config) => {
  await new Promise((r) => setTimeout(r, 150)); // simula a latência da rede
  const metodo = (config.method ?? 'get').toLowerCase();
  const url = (config.url ?? '').split('?')[0];
  const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data ?? {});
  const resposta = (status: number, data: unknown): AxiosResponse => ({ data, status, statusText: String(status), headers: {}, config });

  for (const [m, padrao, handler] of rotas) {
    const achou = metodo === m && url.match(padrao);
    if (!achou) continue;
    try {
      const data = handler({ u: () => usuarioLogado(config), body, params: achou.slice(1), config });
      salvar();
      return resposta(m === 'post' ? 201 : data === null ? 204 : 200, data);
    } catch (e) {
      const status = e instanceof ErroHttp ? e.status : 500;
      const erro = Object.assign(new Error((e as Error).message), { response: resposta(status, { error: (e as Error).message }), config, isAxiosError: true });
      throw erro;
    }
  }
  throw Object.assign(new Error('Rota não encontrada'), { response: resposta(404, { error: 'Rota não encontrada na demo.' }), config, isAxiosError: true });
};
