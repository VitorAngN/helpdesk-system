import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { ADMIN, AGENTE, CLIENTE, app, prisma, resetMocks } from './helpers.js';

beforeEach(resetMocks);

const usuarioDoBanco = async () => ({
    idUsuario: 3,
    nome: 'Cliente Teste',
    email: 'cliente@teste.com',
    senha: await bcrypt.hash('senha-certa', 4),
    nivelAcesso: 'cliente' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
});

describe('POST /api/auth/login', () => {
    it('retorna um JWT com idUsuario e nivelAcesso e não devolve a senha', async () => {
        prisma.usuario.findUnique.mockResolvedValue(await usuarioDoBanco());

        const res = await request(app).post('/api/auth/login').send({ email: 'cliente@teste.com', senha: 'senha-certa' });

        expect(res.status).toBe(200);
        expect(res.body.usuario).not.toHaveProperty('senha');
        const payload = jwt.verify(res.body.token, 'segredo-de-teste') as jwt.JwtPayload;
        expect(payload).toMatchObject({ idUsuario: 3, nivelAcesso: 'cliente' });
    });

    it('senha errada e e-mail inexistente dão a mesma resposta (sem enumeração de usuários)', async () => {
        prisma.usuario.findUnique.mockResolvedValueOnce(await usuarioDoBanco());
        const senhaErrada = await request(app).post('/api/auth/login').send({ email: 'cliente@teste.com', senha: 'errada' });

        prisma.usuario.findUnique.mockResolvedValueOnce(null);
        const emailInexistente = await request(app).post('/api/auth/login').send({ email: 'nao@existe.com', senha: 'x' });

        expect(senhaErrada.status).toBe(401);
        expect(emailInexistente.status).toBe(401);
        expect(senhaErrada.body).toEqual(emailInexistente.body);
    });

    it('valida o corpo da requisição', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: 'nao-e-email' });
        expect(res.status).toBe(400);
        expect(prisma.usuario.findUnique).not.toHaveBeenCalled();
    });
});

describe('autenticação e RBAC', () => {
    it('rota protegida sem token retorna 401', async () => {
        const res = await request(app).get('/api/chamados');
        expect(res.status).toBe(401);
    });

    it('token assinado com outro segredo é rejeitado', async () => {
        const falso = jwt.sign({ idUsuario: 1, nivelAcesso: 'admin' }, 'outro-segredo');
        const res = await request(app).get('/api/empresas').set('Authorization', `Bearer ${falso}`);
        expect(res.status).toBe(401);
    });

    it.each([
        ['cliente', CLIENTE, '/api/empresas'],
        ['agente', AGENTE, '/api/empresas'],
        ['cliente', CLIENTE, '/api/analytics'],
        ['agente', AGENTE, '/api/logs'],
        ['cliente', CLIENTE, '/api/macros'],
    ])('%s não acessa %s (403)', async (_perfil, token, rota) => {
        const res = await request(app).get(rota).set('Authorization', token);
        expect(res.status).toBe(403);
    });

    it('admin acessa a lista de empresas', async () => {
        prisma.empresa.findMany.mockResolvedValue([]);
        const res = await request(app).get('/api/empresas').set('Authorization', ADMIN);
        expect(res.status).toBe(200);
    });

    it('rota inexistente retorna 404 em JSON', async () => {
        const res = await request(app).get('/api/nao-existe');
        expect(res.status).toBe(404);
        expect(res.body).toHaveProperty('error');
    });
});
