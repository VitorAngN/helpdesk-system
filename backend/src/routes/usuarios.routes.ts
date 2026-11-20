import bcrypt from 'bcrypt';
import { Router } from 'express';
import { apenasAdmin, autenticar, autenticarOpcional, getUsuarioLogado } from '../middlewares/auth.js';
import { HttpError } from '../middlewares/errorHandler.js';
import { atualizarUsuarioSchema, cadastroSchema, parseId } from '../schemas.js';
import type { Deps, RequestAutenticada } from '../types.js';

const camposPublicos = {
    idUsuario: true,
    nome: true,
    email: true,
    nivelAcesso: true,
    createdAt: true,
    updatedAt: true,
} as const;

export const usuariosRoutes = ({ prisma }: Deps): Router => {
    const router = Router();

    // Cadastro: público para clientes. Só um admin autenticado pode criar
    // agentes ou outros admins — antes qualquer visitante podia se cadastrar como admin.
    router.post('/usuarios', autenticarOpcional, async (req, res) => {
        const dados = cadastroSchema.parse(req.body);
        const solicitante = (req as RequestAutenticada).usuarioLogado;
        const nivelAcesso = solicitante?.nivelAcesso === 'admin' ? (dados.nivelAcesso ?? 'cliente') : 'cliente';

        const senha = await bcrypt.hash(dados.senha, 10);
        const usuario = await prisma.usuario.create({
            data: { nome: dados.nome, email: dados.email, senha, nivelAcesso },
            select: camposPublicos,
        });
        res.status(201).json(usuario);
    });

    router.get('/usuarios', autenticar, apenasAdmin, async (_req, res) => {
        res.json(await prisma.usuario.findMany({ select: camposPublicos }));
    });

    // Cada usuário vê/edita o próprio perfil; admin vê/edita qualquer um.
    router.get('/usuarios/:id', autenticar, async (req, res) => {
        const id = parseId(req);
        const logado = getUsuarioLogado(req);
        if (logado.nivelAcesso !== 'admin' && logado.idUsuario !== id) throw new HttpError(403, 'Acesso negado.');

        const usuario = await prisma.usuario.findUnique({ where: { idUsuario: id }, select: camposPublicos });
        if (!usuario) throw new HttpError(404, 'Usuário não encontrado.');
        res.json(usuario);
    });

    router.put('/usuarios/:id', autenticar, async (req, res) => {
        const id = parseId(req);
        const logado = getUsuarioLogado(req);
        if (logado.nivelAcesso !== 'admin' && logado.idUsuario !== id) throw new HttpError(403, 'Acesso negado.');

        const dados = atualizarUsuarioSchema.parse(req.body);
        if (dados.nivelAcesso && logado.nivelAcesso !== 'admin') {
            throw new HttpError(403, 'Apenas administradores podem alterar o nível de acesso.');
        }

        const usuario = await prisma.usuario.update({
            where: { idUsuario: id },
            data: {
                ...(dados.nome !== undefined && { nome: dados.nome }),
                ...(dados.email !== undefined && { email: dados.email }),
                ...(dados.nivelAcesso !== undefined && { nivelAcesso: dados.nivelAcesso }),
            },
            select: camposPublicos,
        });
        res.json(usuario);
    });

    router.delete('/usuarios/:id', autenticar, apenasAdmin, async (req, res) => {
        await prisma.usuario.delete({ where: { idUsuario: parseId(req) } });
        res.json({ message: 'Usuário deletado com sucesso' });
    });

    return router;
};
