import { z } from 'zod';
import {
    agenteSchema,
    atribuirSchema,
    atualizarChamadoSchema,
    atualizarUsuarioSchema,
    avaliacaoSchema,
    cadastroSchema,
    categoriaSchema,
    disponibilidadeSchema,
    empresaSchema,
    loginSchema,
    macroSchema,
    mensagemSchema,
    notificacaoSchema,
    novoChamadoSchema,
    statusSchema,
} from './schemas.js';

/**
 * Documentação OpenAPI gerada a partir do código: os mesmos schemas Zod que
 * validam as requisições viram os schemas da documentação. Um teste garante
 * que toda rota registrada no Express aparece aqui (e vice-versa).
 */

type Acesso = 'publico' | 'autenticado' | 'equipe' | 'admin';

export type RotaDoc = {
    metodo: 'get' | 'post' | 'put' | 'patch' | 'delete';
    caminho: string; // no formato do Express, ex.: /chamados/:id
    tag: string;
    resumo: string;
    acesso: Acesso;
    corpo?: z.ZodType;
    multipart?: boolean;
    respostas?: Record<number, string>;
};

export const rotas: RotaDoc[] = [
    { metodo: 'get', caminho: '/health', tag: 'Health', resumo: 'Verifica se a API está no ar', acesso: 'publico' },
    { metodo: 'get', caminho: '/openapi.json', tag: 'Health', resumo: 'Este documento OpenAPI', acesso: 'publico' },

    { metodo: 'post', caminho: '/auth/login', tag: 'Auth', resumo: 'Login: devolve um JWT com validade de 12h', acesso: 'publico', corpo: loginSchema,
      respostas: { 401: 'E-mail ou senha incorretos (mesma resposta nos dois casos)', 429: 'Muitas tentativas: limite de 20 a cada 15 minutos' } },

    { metodo: 'post', caminho: '/usuarios', tag: 'Usuários', resumo: 'Cadastro. Público cria sempre um cliente; só um admin autenticado cria agentes e admins', acesso: 'publico', corpo: cadastroSchema,
      respostas: { 201: 'Usuário criado (sem o campo senha)', 409: 'E-mail já cadastrado' } },
    { metodo: 'get', caminho: '/usuarios', tag: 'Usuários', resumo: 'Lista usuários', acesso: 'admin' },
    { metodo: 'get', caminho: '/usuarios/:id', tag: 'Usuários', resumo: 'Perfil de um usuário (o próprio, ou qualquer um para admin)', acesso: 'autenticado' },
    { metodo: 'put', caminho: '/usuarios/:id', tag: 'Usuários', resumo: 'Atualiza o próprio perfil; só admin altera nível de acesso', acesso: 'autenticado', corpo: atualizarUsuarioSchema },
    { metodo: 'delete', caminho: '/usuarios/:id', tag: 'Usuários', resumo: 'Remove usuário', acesso: 'admin' },

    { metodo: 'post', caminho: '/empresas', tag: 'Empresas', resumo: 'Cadastra empresa', acesso: 'admin', corpo: empresaSchema, respostas: { 201: 'Empresa criada', 409: 'CNPJ duplicado' } },
    { metodo: 'get', caminho: '/empresas', tag: 'Empresas', resumo: 'Lista empresas', acesso: 'admin' },
    { metodo: 'get', caminho: '/empresas/:id', tag: 'Empresas', resumo: 'Detalha empresa', acesso: 'admin' },
    { metodo: 'put', caminho: '/empresas/:id', tag: 'Empresas', resumo: 'Atualiza empresa', acesso: 'admin', corpo: empresaSchema },
    { metodo: 'delete', caminho: '/empresas/:id', tag: 'Empresas', resumo: 'Remove empresa', acesso: 'admin' },

    { metodo: 'post', caminho: '/agentes', tag: 'Agentes', resumo: 'Vincula um usuário como agente de uma empresa', acesso: 'admin', corpo: agenteSchema, respostas: { 201: 'Agente criado' } },
    { metodo: 'get', caminho: '/agentes', tag: 'Agentes', resumo: 'Lista agentes', acesso: 'equipe' },
    { metodo: 'get', caminho: '/agentes/:id', tag: 'Agentes', resumo: 'Detalha agente', acesso: 'equipe' },
    { metodo: 'put', caminho: '/agentes/:id', tag: 'Agentes', resumo: 'Atualiza agente', acesso: 'admin', corpo: agenteSchema.partial() },
    { metodo: 'patch', caminho: '/agentes/:id/disponibilidade', tag: 'Agentes', resumo: 'Disponibilidade (o agente altera a própria; admin altera qualquer uma)', acesso: 'equipe', corpo: disponibilidadeSchema },
    { metodo: 'delete', caminho: '/agentes/:id', tag: 'Agentes', resumo: 'Remove agente', acesso: 'admin' },

    { metodo: 'post', caminho: '/chamados', tag: 'Chamados', resumo: 'Abre chamado. Protocolo HD-AAAA-NNNNN gerado em transação; cliente sempre abre em nome próprio', acesso: 'autenticado', corpo: novoChamadoSchema, respostas: { 201: 'Chamado criado' } },
    { metodo: 'get', caminho: '/chamados', tag: 'Chamados', resumo: 'Lista chamados (cliente vê só os próprios)', acesso: 'autenticado' },
    { metodo: 'get', caminho: '/chamados/:id', tag: 'Chamados', resumo: 'Detalha chamado (cliente só o próprio)', acesso: 'autenticado' },
    { metodo: 'put', caminho: '/chamados/:id', tag: 'Chamados', resumo: 'Atualiza chamado (o protocolo não pode ser alterado)', acesso: 'equipe', corpo: atualizarChamadoSchema },
    { metodo: 'patch', caminho: '/chamados/:id/status', tag: 'Chamados', resumo: 'Muda status e notifica o cliente em tempo real (cliente só pode cancelar)', acesso: 'autenticado', corpo: statusSchema },
    { metodo: 'patch', caminho: '/chamados/:id/atribuir', tag: 'Chamados', resumo: 'Atribui agente e grava log de auditoria na mesma transação', acesso: 'admin', corpo: atribuirSchema },
    { metodo: 'patch', caminho: '/chamados/:id/avaliar', tag: 'Chamados', resumo: 'CSAT de 1 a 5: só o dono avalia, e só chamado concluído', acesso: 'autenticado', corpo: avaliacaoSchema,
      respostas: { 409: 'O chamado ainda não foi concluído' } },
    { metodo: 'delete', caminho: '/chamados/:id', tag: 'Chamados', resumo: 'Remove chamado', acesso: 'admin' },

    { metodo: 'post', caminho: '/chamados/:id/mensagens', tag: 'Chat', resumo: 'Envia mensagem (remetente vem do token) e notifica via Socket.io', acesso: 'autenticado', corpo: mensagemSchema, respostas: { 201: 'Mensagem enviada' } },
    { metodo: 'get', caminho: '/chamados/:id/mensagens', tag: 'Chat', resumo: 'Histórico do chat do chamado', acesso: 'autenticado' },
    { metodo: 'delete', caminho: '/mensagens/:id', tag: 'Chat', resumo: 'Remove mensagem', acesso: 'equipe' },

    { metodo: 'post', caminho: '/notificacoes', tag: 'Notificações', resumo: 'Cria notificação manual', acesso: 'equipe', corpo: notificacaoSchema, respostas: { 201: 'Notificação criada' } },
    { metodo: 'get', caminho: '/notificacoes', tag: 'Notificações', resumo: 'Notificações do usuário logado', acesso: 'autenticado' },
    { metodo: 'get', caminho: '/notificacoes/:id', tag: 'Notificações', resumo: 'Detalha notificação própria', acesso: 'autenticado' },
    { metodo: 'patch', caminho: '/notificacoes/:id/lida', tag: 'Notificações', resumo: 'Marca notificação própria como lida', acesso: 'autenticado' },
    { metodo: 'delete', caminho: '/notificacoes/:id', tag: 'Notificações', resumo: 'Remove notificação', acesso: 'admin' },

    { metodo: 'get', caminho: '/categorias', tag: 'Admin', resumo: 'Lista categorias', acesso: 'autenticado' },
    { metodo: 'post', caminho: '/categorias', tag: 'Admin', resumo: 'Cria categoria', acesso: 'admin', corpo: categoriaSchema, respostas: { 201: 'Categoria criada' } },
    { metodo: 'delete', caminho: '/categorias/:id', tag: 'Admin', resumo: 'Remove categoria', acesso: 'admin' },
    { metodo: 'get', caminho: '/macros', tag: 'Admin', resumo: 'Lista respostas prontas', acesso: 'equipe' },
    { metodo: 'post', caminho: '/macros', tag: 'Admin', resumo: 'Cria resposta pronta', acesso: 'admin', corpo: macroSchema, respostas: { 201: 'Macro criada' } },
    { metodo: 'delete', caminho: '/macros/:id', tag: 'Admin', resumo: 'Remove resposta pronta', acesso: 'admin' },
    { metodo: 'get', caminho: '/logs', tag: 'Admin', resumo: 'Últimos 100 logs de auditoria', acesso: 'admin' },
    { metodo: 'get', caminho: '/analytics', tag: 'Admin', resumo: 'Indicadores: totais, SLA (tempo médio de resolução) e CSAT', acesso: 'admin' },

    { metodo: 'post', caminho: '/upload', tag: 'Anexos', resumo: 'Upload de anexo (PDF ou imagem, até 10 MB)', acesso: 'autenticado', multipart: true },
];

const descricaoAcesso: Record<Acesso, string> = {
    publico: 'Público',
    autenticado: 'Qualquer usuário autenticado',
    equipe: 'Agente ou admin',
    admin: 'Somente admin',
};

const erro = { type: 'object', properties: { error: { type: 'string' } } };

const paraJsonSchema = (schema: z.ZodType) => {
    const { $schema: _ignorado, ...resto } = z.toJSONSchema(schema, { io: 'input' }) as Record<string, unknown>;
    return resto;
};

export const caminhoOpenApi = (caminhoExpress: string): string => caminhoExpress.replace(/:(\w+)/g, '{$1}');

export const gerarOpenApi = () => {
    const paths: Record<string, Record<string, unknown>> = {};

    for (const rota of rotas) {
        const caminho = caminhoOpenApi(rota.caminho);
        const parametros = [...rota.caminho.matchAll(/:(\w+)/g)].map(([, nome]) => ({
            name: nome,
            in: 'path',
            required: true,
            schema: { type: 'integer', minimum: 1 },
        }));

        const respostas: Record<string, unknown> = {
            [rota.metodo === 'post' && rota.respostas?.[201] ? 201 : 200]: { description: rota.respostas?.[201] ?? 'Sucesso' },
        };
        if (rota.corpo || parametros.length) respostas[400] = { description: 'Dados ou ID inválidos', content: { 'application/json': { schema: erro } } };
        if (rota.acesso !== 'publico') respostas[401] = { description: 'Token ausente, inválido ou expirado' };
        if (rota.acesso !== 'publico') respostas[403] = { description: 'Perfil sem permissão, ou recurso de outro usuário' };
        if (parametros.length) respostas[404] = { description: 'Registro não encontrado' };
        for (const [codigo, descricao] of Object.entries(rota.respostas ?? {})) {
            if (codigo !== '201') respostas[codigo] = { description: descricao, content: { 'application/json': { schema: erro } } };
        }

        (paths[caminho] ??= {})[rota.metodo] = {
            tags: [rota.tag],
            summary: rota.resumo,
            description: `**Acesso:** ${descricaoAcesso[rota.acesso]}`,
            security: rota.acesso === 'publico' ? [] : [{ bearerAuth: [] }],
            ...(parametros.length && { parameters: parametros }),
            ...(rota.corpo && {
                requestBody: { required: true, content: { 'application/json': { schema: paraJsonSchema(rota.corpo) } } },
            }),
            ...(rota.multipart && {
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: { type: 'object', properties: { arquivo: { type: 'string', format: 'binary' } }, required: ['arquivo'] },
                        },
                    },
                },
            }),
            responses: respostas,
        };
    }

    return {
        openapi: '3.1.0',
        info: {
            title: 'Helpdesk Corporativo — API',
            version: '2.0.0',
            description:
                'API REST do sistema de helpdesk (Node.js, TypeScript, Express 5, Prisma, MySQL e Socket.io).\n\n' +
                'Autenticação por JWT (`Authorization: Bearer <token>`), obtido em `POST /auth/login`. ' +
                'Além do controle por perfil (cliente, agente, admin), a API verifica o **dono de cada recurso**: ' +
                'um cliente só acessa os próprios chamados, mensagens e notificações.\n\n' +
                'Esta documentação é gerada a partir dos mesmos schemas Zod que validam as requisições.',
        },
        servers: [{ url: 'http://localhost:3000/api', description: 'Ambiente local (docker compose up)' }],
        tags: [
            { name: 'Health', description: 'Disponibilidade e documentação da API' },
            { name: 'Auth', description: 'Login com JWT' },
            { name: 'Usuários', description: 'Cadastro e perfis (cliente, agente, admin)' },
            { name: 'Empresas', description: 'Empresas atendidas' },
            { name: 'Agentes', description: 'Equipe de atendimento e disponibilidade' },
            { name: 'Chamados', description: 'Abertura, acompanhamento, atribuição e avaliação (CSAT)' },
            { name: 'Chat', description: 'Mensagens em tempo real de cada chamado' },
            { name: 'Notificações', description: 'Avisos do usuário logado' },
            { name: 'Admin', description: 'Categorias, respostas prontas, auditoria e indicadores' },
            { name: 'Anexos', description: 'Upload de arquivos' },
        ],
        components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
        paths,
    };
};
