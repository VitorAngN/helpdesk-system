import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { ADMIN, CLIENTE, app, prisma, resetMocks } from './helpers.js';

beforeEach(resetMocks);

const novoUsuario = { nome: 'Fulano', email: 'fulano@teste.com', senha: '123456' };
const criado = (nivelAcesso: 'cliente' | 'agente' | 'admin') => ({
    idUsuario: 10,
    nome: 'Fulano',
    email: 'fulano@teste.com',
    nivelAcesso,
    createdAt: new Date(),
    updatedAt: new Date(),
});

describe('POST /api/usuarios (cadastro)', () => {
    it('visitante que tenta se cadastrar como admin vira cliente', async () => {
        prisma.usuario.create.mockResolvedValue(criado('cliente') as never);

        const res = await request(app).post('/api/usuarios').send({ ...novoUsuario, nivelAcesso: 'admin' });

        expect(res.status).toBe(201);
        expect(prisma.usuario.create.mock.calls[0]?.[0].data.nivelAcesso).toBe('cliente');
    });

    it('a senha é salva como hash bcrypt (RN-02)', async () => {
        prisma.usuario.create.mockResolvedValue(criado('cliente') as never);
        await request(app).post('/api/usuarios').send(novoUsuario);

        const senhaSalva = prisma.usuario.create.mock.calls[0]?.[0].data.senha;
        expect(senhaSalva).not.toBe('123456');
        expect(senhaSalva).toMatch(/^\$2[aby]\$10\$/);
    });

    it('admin autenticado pode criar um agente', async () => {
        prisma.usuario.create.mockResolvedValue(criado('agente') as never);

        const res = await request(app)
            .post('/api/usuarios')
            .set('Authorization', ADMIN)
            .send({ ...novoUsuario, nivelAcesso: 'agente' });

        expect(res.status).toBe(201);
        expect(prisma.usuario.create.mock.calls[0]?.[0].data.nivelAcesso).toBe('agente');
    });

    it('rejeita e-mail inválido e senha curta', async () => {
        const res = await request(app).post('/api/usuarios').send({ nome: 'A', email: 'x', senha: '1' });
        expect(res.status).toBe(400);
        expect(res.body.detalhes.length).toBeGreaterThan(0);
    });

    it('e-mail duplicado retorna 409', async () => {
        const { Prisma } = await import('@prisma/client');
        prisma.usuario.create.mockRejectedValue(
            new Prisma.PrismaClientKnownRequestError('duplicado', { code: 'P2002', clientVersion: 'teste' }),
        );
        const res = await request(app).post('/api/usuarios').send(novoUsuario);
        expect(res.status).toBe(409);
    });
});

describe('perfil de usuário', () => {
    it('cliente não pode ver os dados de outro usuário', async () => {
        const res = await request(app).get('/api/usuarios/99').set('Authorization', CLIENTE);
        expect(res.status).toBe(403);
        expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
    });

    it('cliente não pode se promover a admin', async () => {
        const res = await request(app)
            .put('/api/usuarios/3')
            .set('Authorization', CLIENTE)
            .send({ nivelAcesso: 'admin' });
        expect(res.status).toBe(403);
        expect(prisma.usuario.update).not.toHaveBeenCalled();
    });

    it('cliente pode atualizar o próprio nome', async () => {
        prisma.usuario.update.mockResolvedValue(criado('cliente') as never);
        const res = await request(app).put('/api/usuarios/3').set('Authorization', CLIENTE).send({ nome: 'Novo Nome' });
        expect(res.status).toBe(200);
        expect(prisma.usuario.update.mock.calls[0]?.[0].data).toEqual({ nome: 'Novo Nome' });
    });
});
