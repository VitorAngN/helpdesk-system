import { Router } from 'express';
import { apenasAdmin, apenasEquipe, autenticar, getUsuarioLogado } from '../middlewares/auth.js';
import { HttpError } from '../middlewares/errorHandler.js';
import {
    atribuirSchema,
    atualizarChamadoSchema,
    avaliacaoSchema,
    mensagemSchema,
    novoChamadoSchema,
    parseId,
    statusSchema,
} from '../schemas.js';
import { gerarProtocolo, protocoloTemporario } from '../services/protocolo.js';
import type { Deps, UsuarioLogado } from '../types.js';

/** RN-09: cliente só acessa os próprios chamados; agente e admin acessam todos. */
export const podeAcessarChamado = (usuario: UsuarioLogado, chamado: { idCliente: number }): boolean =>
    usuario.nivelAcesso !== 'cliente' || chamado.idCliente === usuario.idUsuario;

const semUndefined = <T extends Record<string, unknown>>(obj: T) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as {
        [K in keyof T]: Exclude<T[K], undefined>;
    };

export const chamadosRoutes = ({ prisma, realtime }: Deps): Router => {
    const router = Router();
    router.use(['/chamados', '/mensagens'], autenticar);

    const buscarChamadoAutorizado = async (id: number, usuario: UsuarioLogado) => {
        const chamado = await prisma.chamado.findUnique({ where: { idChamado: id } });
        if (!chamado) throw new HttpError(404, 'Chamado não encontrado.');
        if (!podeAcessarChamado(usuario, chamado)) throw new HttpError(403, 'Acesso negado.');
        return chamado;
    };

    router.post('/chamados', async (req, res) => {
        const logado = getUsuarioLogado(req);
        const dados = novoChamadoSchema.parse(req.body);
        // Cliente sempre abre chamado em nome próprio; a equipe pode abrir para um cliente.
        const idCliente = logado.nivelAcesso === 'cliente' ? logado.idUsuario : (dados.idCliente ?? logado.idUsuario);

        // RN-07: INSERT + UPDATE na mesma transação; o protocolo usa o ID gerado pelo banco.
        const chamado = await prisma.$transaction(async (tx) => {
            const criado = await tx.chamado.create({
                data: semUndefined({
                    protocolo: protocoloTemporario(),
                    idCliente,
                    idAgente: logado.nivelAcesso === 'cliente' ? undefined : dados.idAgente,
                    idEmpresa: dados.idEmpresa,
                    titulo: dados.titulo,
                    descricao: dados.descricao,
                    categoria: dados.categoria,
                    prioridade: dados.prioridade,
                    anexo: dados.anexo,
                    mimeTypeAnexo: dados.mimeTypeAnexo,
                }),
            });
            return tx.chamado.update({
                where: { idChamado: criado.idChamado },
                data: { protocolo: gerarProtocolo(criado.idChamado, criado.createdAt) },
            });
        });

        const equipe = await prisma.usuario.findMany({
            where: { nivelAcesso: { in: ['admin', 'agente'] } },
            select: { idUsuario: true },
        });
        if (equipe.length > 0) {
            await prisma.notificacao.createMany({
                data: equipe.map((u) => ({ idUsuario: u.idUsuario, idChamado: chamado.idChamado, tipo: 'novo_chamado' as const })),
            });
        }

        res.status(201).json(chamado);
    });

    router.get('/chamados', async (req, res) => {
        const { idUsuario, nivelAcesso } = getUsuarioLogado(req);
        const chamados = await prisma.chamado.findMany({
            where: nivelAcesso === 'cliente' ? { idCliente: idUsuario } : {},
            orderBy: { createdAt: 'desc' },
        });
        res.json(chamados);
    });

    router.get('/chamados/:id', async (req, res) => {
        res.json(await buscarChamadoAutorizado(parseId(req), getUsuarioLogado(req)));
    });

    // O protocolo não pode ser alterado manualmente (RN-07).
    router.put('/chamados/:id', apenasEquipe, async (req, res) => {
        const { idCliente, ...dados } = atualizarChamadoSchema.parse(req.body);
        const chamado = await prisma.chamado.update({
            where: { idChamado: parseId(req) },
            data: semUndefined({ ...dados, idCliente }),
        });
        res.json(chamado);
    });

    router.patch('/chamados/:id/status', async (req, res) => {
        const id = parseId(req);
        const { status } = statusSchema.parse(req.body);
        const usuario = getUsuarioLogado(req);
        await buscarChamadoAutorizado(id, usuario);

        if (usuario.nivelAcesso === 'cliente' && status !== 'cancelado') {
            throw new HttpError(403, 'Cliente só pode cancelar chamados.');
        }

        const encerrado = status === 'concluido' || status === 'cancelado';
        const chamado = await prisma.chamado.update({
            where: { idChamado: id },
            data: { status, dataFechamento: encerrado ? new Date() : null },
        });

        const tipo =
            status === 'concluido' ? 'chamado_concluido' : status === 'cancelado' ? 'chamado_cancelado' : 'status_alterado';
        const notificacao = await prisma.notificacao.create({
            data: { idUsuario: chamado.idCliente, idChamado: id, tipo },
        });
        realtime.paraUsuario(chamado.idCliente, `notificacao_${chamado.idCliente}`, notificacao);

        res.json(chamado);
    });

    router.patch('/chamados/:id/atribuir', apenasAdmin, async (req, res) => {
        const id = parseId(req);
        const { idAgente } = atribuirSchema.parse(req.body);
        const logado = getUsuarioLogado(req);

        const chamado = await prisma.$transaction(async (tx) => {
            const atualizado = await tx.chamado.update({ where: { idChamado: id }, data: { idAgente: idAgente ?? null } });
            await tx.logAuditoria.create({
                data: {
                    idUsuario: logado.idUsuario,
                    acao: 'ATRIBUICAO_CHAMADO',
                    detalhe: `Chamado ${id} atribuído ao agente ${idAgente ?? 'nenhum'}`,
                },
            });
            return atualizado;
        });
        res.json(chamado);
    });

    // CSAT: só o dono do chamado avalia, e só depois de concluído.
    router.patch('/chamados/:id/avaliar', async (req, res) => {
        const id = parseId(req);
        const { avaliacao } = avaliacaoSchema.parse(req.body);
        const usuario = getUsuarioLogado(req);

        const chamado = await prisma.chamado.findUnique({ where: { idChamado: id } });
        if (!chamado || chamado.idCliente !== usuario.idUsuario) throw new HttpError(403, 'Acesso negado.');
        if (chamado.status !== 'concluido') throw new HttpError(409, 'Só é possível avaliar chamados concluídos.');

        res.json(await prisma.chamado.update({ where: { idChamado: id }, data: { avaliacao } }));
    });

    router.delete('/chamados/:id', apenasAdmin, async (req, res) => {
        await prisma.chamado.delete({ where: { idChamado: parseId(req) } });
        res.json({ message: 'Chamado deletado com sucesso' });
    });

    // ─── Mensagens do chat (RN-05) ───────────────────────────────

    router.post('/chamados/:id/mensagens', async (req, res) => {
        const idChamado = parseId(req);
        const usuario = getUsuarioLogado(req);
        const chamado = await buscarChamadoAutorizado(idChamado, usuario);
        const dados = mensagemSchema.parse(req.body);

        // O remetente vem do token, não do corpo da requisição (evita se passar por outra pessoa).
        const mensagem = await prisma.chat_Mensagem.create({
            data: semUndefined({ idChamado, idRemetente: usuario.idUsuario, ...dados }),
        });
        realtime.paraChamado(idChamado, 'nova_mensagem', mensagem);

        // Destinatário: se o cliente escreveu, avisa o agente responsável (idAgente aponta
        // para a tabela de agentes, então buscamos o idUsuario dele); senão, avisa o cliente.
        let idDestinatario: number | null = chamado.idCliente;
        if (usuario.idUsuario === chamado.idCliente) {
            const agente = chamado.idAgente
                ? await prisma.agente.findUnique({ where: { idAgente: chamado.idAgente }, select: { idUsuario: true } })
                : null;
            idDestinatario = agente?.idUsuario ?? null;
        }
        if (idDestinatario) {
            const notificacao = await prisma.notificacao.create({
                data: { idUsuario: idDestinatario, idChamado, tipo: 'nova_mensagem' },
            });
            realtime.paraUsuario(idDestinatario, `notificacao_${idDestinatario}`, notificacao);
        }

        res.status(201).json(mensagem);
    });

    router.get('/chamados/:id/mensagens', async (req, res) => {
        const idChamado = parseId(req);
        await buscarChamadoAutorizado(idChamado, getUsuarioLogado(req));
        res.json(await prisma.chat_Mensagem.findMany({ where: { idChamado }, orderBy: { createdAt: 'asc' } }));
    });

    router.delete('/mensagens/:id', apenasEquipe, async (req, res) => {
        await prisma.chat_Mensagem.delete({ where: { idMensagem: parseId(req) } });
        res.json({ message: 'Mensagem deletada com sucesso' });
    });

    return router;
};
