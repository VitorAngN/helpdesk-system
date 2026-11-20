import { Router } from 'express';
import { apenasAdmin, apenasEquipe, autenticar, getUsuarioLogado } from '../middlewares/auth.js';
import { HttpError } from '../middlewares/errorHandler.js';
import { notificacaoSchema, parseId } from '../schemas.js';
import type { Deps } from '../types.js';

export const notificacoesRoutes = ({ prisma }: Deps): Router => {
    const router = Router();
    router.use('/notificacoes', autenticar);

    const buscarPropria = async (id: number, idUsuario: number) => {
        const notificacao = await prisma.notificacao.findUnique({ where: { idNotificacao: id } });
        if (!notificacao) throw new HttpError(404, 'Notificação não encontrada.');
        if (notificacao.idUsuario !== idUsuario) throw new HttpError(403, 'Acesso negado.');
        return notificacao;
    };

    router.post('/notificacoes', apenasEquipe, async (req, res) => {
        const { idChamado, ...dados } = notificacaoSchema.parse(req.body);
        res.status(201).json(await prisma.notificacao.create({ data: { ...dados, idChamado: idChamado ?? null } }));
    });

    // Cada usuário só vê as próprias notificações.
    router.get('/notificacoes', async (req, res) => {
        const { idUsuario } = getUsuarioLogado(req);
        res.json(await prisma.notificacao.findMany({ where: { idUsuario }, orderBy: { createdAt: 'desc' } }));
    });

    router.get('/notificacoes/:id', async (req, res) => {
        res.json(await buscarPropria(parseId(req), getUsuarioLogado(req).idUsuario));
    });

    router.patch('/notificacoes/:id/lida', async (req, res) => {
        const id = parseId(req);
        await buscarPropria(id, getUsuarioLogado(req).idUsuario);
        res.json(await prisma.notificacao.update({ where: { idNotificacao: id }, data: { lida: true } }));
    });

    router.delete('/notificacoes/:id', apenasAdmin, async (req, res) => {
        await prisma.notificacao.delete({ where: { idNotificacao: parseId(req) } });
        res.json({ message: 'Notificação deletada com sucesso' });
    });

    return router;
};
