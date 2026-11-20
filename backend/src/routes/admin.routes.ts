import { Router } from 'express';
import { apenasAdmin, apenasEquipe, autenticar } from '../middlewares/auth.js';
import { categoriaSchema, macroSchema, parseId } from '../schemas.js';
import { arredondarCsat, calcularTempoMedioResolucaoHoras } from '../services/metricas.js';
import type { Deps } from '../types.js';

export const adminRoutes = ({ prisma }: Deps): Router => {
    const router = Router();
    router.use(['/categorias', '/macros', '/logs', '/analytics'], autenticar);

    // Categorias
    router.get('/categorias', async (_req, res) => {
        res.json(await prisma.categoria.findMany({ orderBy: { nome: 'asc' } }));
    });
    router.post('/categorias', apenasAdmin, async (req, res) => {
        res.status(201).json(await prisma.categoria.create({ data: categoriaSchema.parse(req.body) }));
    });
    router.delete('/categorias/:id', apenasAdmin, async (req, res) => {
        await prisma.categoria.delete({ where: { idCategoria: parseId(req) } });
        res.json({ message: 'Categoria deletada' });
    });

    // Macros (respostas prontas)
    router.get('/macros', apenasEquipe, async (_req, res) => {
        res.json(await prisma.macro.findMany());
    });
    router.post('/macros', apenasAdmin, async (req, res) => {
        res.status(201).json(await prisma.macro.create({ data: macroSchema.parse(req.body) }));
    });
    router.delete('/macros/:id', apenasAdmin, async (req, res) => {
        await prisma.macro.delete({ where: { idMacro: parseId(req) } });
        res.json({ message: 'Macro deletada' });
    });

    // Auditoria
    router.get('/logs', apenasAdmin, async (_req, res) => {
        res.json(
            await prisma.logAuditoria.findMany({
                include: { usuario: { select: { nome: true, email: true } } },
                orderBy: { createdAt: 'desc' },
                take: 100,
            }),
        );
    });

    // Indicadores (SLA e CSAT)
    router.get('/analytics', apenasAdmin, async (_req, res) => {
        const [totalChamados, abertos, concluidos, cancelados, porPrioridade, csat, chamadosConcluidos] =
            await Promise.all([
                prisma.chamado.count(),
                prisma.chamado.count({ where: { status: { notIn: ['concluido', 'cancelado'] } } }),
                prisma.chamado.count({ where: { status: 'concluido' } }),
                prisma.chamado.count({ where: { status: 'cancelado' } }),
                prisma.chamado.groupBy({ by: ['prioridade'], _count: { prioridade: true } }),
                prisma.chamado.aggregate({
                    _avg: { avaliacao: true },
                    _count: { avaliacao: true },
                    where: { avaliacao: { not: null } },
                }),
                prisma.chamado.findMany({
                    where: { status: 'concluido', dataFechamento: { not: null } },
                    select: { createdAt: true, dataFechamento: true },
                }),
            ]);

        res.json({
            totalChamados,
            abertos,
            concluidos,
            cancelados,
            porPrioridade,
            mediaCsat: arredondarCsat(csat._avg.avaliacao),
            totalAvaliados: csat._count.avaliacao,
            tempoMedioResolucaoHoras: calcularTempoMedioResolucaoHoras(chamadosConcluidos),
            totalConcluidosComSLA: chamadosConcluidos.length,
        });
    });

    return router;
};
