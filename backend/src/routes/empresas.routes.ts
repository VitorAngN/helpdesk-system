import { Router } from 'express';
import { apenasAdmin, autenticar } from '../middlewares/auth.js';
import { HttpError } from '../middlewares/errorHandler.js';
import { empresaSchema, parseId } from '../schemas.js';
import type { Deps } from '../types.js';

export const empresasRoutes = ({ prisma }: Deps): Router => {
    const router = Router();
    router.use('/empresas', autenticar, apenasAdmin);

    router.post('/empresas', async (req, res) => {
        res.status(201).json(await prisma.empresa.create({ data: empresaSchema.parse(req.body) }));
    });

    router.get('/empresas', async (_req, res) => {
        res.json(await prisma.empresa.findMany());
    });

    router.get('/empresas/:id', async (req, res) => {
        const empresa = await prisma.empresa.findUnique({ where: { idEmpresa: parseId(req) } });
        if (!empresa) throw new HttpError(404, 'Empresa não encontrada.');
        res.json(empresa);
    });

    router.put('/empresas/:id', async (req, res) => {
        const dados = empresaSchema.parse(req.body);
        res.json(await prisma.empresa.update({ where: { idEmpresa: parseId(req) }, data: dados }));
    });

    router.delete('/empresas/:id', async (req, res) => {
        await prisma.empresa.delete({ where: { idEmpresa: parseId(req) } });
        res.json({ message: 'Empresa deletada com sucesso' });
    });

    return router;
};
