import { Router } from 'express';
import { apenasAdmin, apenasEquipe, autenticar, getUsuarioLogado } from '../middlewares/auth.js';
import { HttpError } from '../middlewares/errorHandler.js';
import { agenteSchema, disponibilidadeSchema, parseId } from '../schemas.js';
import type { Deps } from '../types.js';

const incluirRelacoes = {
    usuario: { select: { nome: true, email: true, nivelAcesso: true } },
    empresa: { select: { nome: true } },
} as const;

type AgenteComRelacoes = {
    idAgente: number;
    idUsuario: number;
    idEmpresa: number;
    cargo: string;
    disponivel: boolean;
    usuario: { nome: string; email: string; nivelAcesso: string };
    empresa: { nome: string };
};

export const formatarAgente = (agente: AgenteComRelacoes) => ({
    idAgente: agente.idAgente,
    idUsuario: agente.idUsuario,
    idEmpresa: agente.idEmpresa,
    cargo: agente.cargo,
    disponivel: agente.disponivel,
    nome: agente.usuario.nome,
    email: agente.usuario.email,
    nivelAcesso: agente.usuario.nivelAcesso,
    empresaNome: agente.empresa.nome,
});

export const agentesRoutes = ({ prisma }: Deps): Router => {
    const router = Router();
    router.use('/agentes', autenticar);

    router.post('/agentes', apenasAdmin, async (req, res) => {
        const dados = agenteSchema.parse(req.body);
        const agente = await prisma.agente.create({
            data: {
                idUsuario: dados.idUsuario,
                idEmpresa: dados.idEmpresa,
                ...(dados.cargo !== undefined && { cargo: dados.cargo }),
                ...(dados.disponivel !== undefined && { disponivel: dados.disponivel }),
            },
            include: incluirRelacoes,
        });
        res.status(201).json(formatarAgente(agente));
    });

    router.get('/agentes', apenasEquipe, async (_req, res) => {
        const agentes = await prisma.agente.findMany({ include: incluirRelacoes, orderBy: { idAgente: 'asc' } });
        res.json(agentes.map(formatarAgente));
    });

    router.get('/agentes/:id', apenasEquipe, async (req, res) => {
        const agente = await prisma.agente.findUnique({ where: { idAgente: parseId(req) }, include: incluirRelacoes });
        if (!agente) throw new HttpError(404, 'Agente não encontrado.');
        res.json(formatarAgente(agente));
    });

    router.put('/agentes/:id', apenasAdmin, async (req, res) => {
        const dados = agenteSchema.partial().parse(req.body);
        const agente = await prisma.agente.update({
            where: { idAgente: parseId(req) },
            data: {
                ...(dados.idUsuario !== undefined && { idUsuario: dados.idUsuario }),
                ...(dados.idEmpresa !== undefined && { idEmpresa: dados.idEmpresa }),
                ...(dados.cargo !== undefined && { cargo: dados.cargo }),
                ...(dados.disponivel !== undefined && { disponivel: dados.disponivel }),
            },
            include: incluirRelacoes,
        });
        res.json(formatarAgente(agente));
    });

    // RN-06: o agente altera a PRÓPRIA disponibilidade; o admin altera a de qualquer um.
    router.patch('/agentes/:id/disponibilidade', apenasEquipe, async (req, res) => {
        const id = parseId(req);
        const { disponivel } = disponibilidadeSchema.parse(req.body);
        const logado = getUsuarioLogado(req);

        if (logado.nivelAcesso === 'agente') {
            const agente = await prisma.agente.findUnique({ where: { idAgente: id } });
            if (!agente) throw new HttpError(404, 'Agente não encontrado.');
            if (agente.idUsuario !== logado.idUsuario) throw new HttpError(403, 'Acesso negado.');
        }

        const agente = await prisma.agente.update({ where: { idAgente: id }, data: { disponivel }, include: incluirRelacoes });
        res.json(formatarAgente(agente));
    });

    router.delete('/agentes/:id', apenasAdmin, async (req, res) => {
        await prisma.agente.delete({ where: { idAgente: parseId(req) } });
        res.json({ message: 'Agente deletado com sucesso' });
    });

    return router;
};
