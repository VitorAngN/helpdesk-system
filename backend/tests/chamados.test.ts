import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { ADMIN, AGENTE, CLIENTE, OUTRO_CLIENTE, app, chamadoFake, prisma, realtime, resetMocks } from './helpers.js';

beforeEach(resetMocks);

describe('POST /api/chamados', () => {
    const corpo = { titulo: 'Sem internet', descricao: 'Caiu tudo', prioridade: 'alta' };

    it('cliente sempre abre o chamado em nome próprio, mesmo mandando outro idCliente', async () => {
        prisma.chamado.create.mockResolvedValue(chamadoFake({ idChamado: 7 }) as never);
        prisma.chamado.update.mockResolvedValue(chamadoFake({ idChamado: 7 }) as never);
        prisma.usuario.findMany.mockResolvedValue([]);

        const res = await request(app)
            .post('/api/chamados')
            .set('Authorization', CLIENTE)
            .send({ ...corpo, idCliente: 999 });

        expect(res.status).toBe(201);
        expect(prisma.chamado.create.mock.calls[0]?.[0].data.idCliente).toBe(3);
    });

    it('gera o protocolo a partir do ID, dentro de uma transação (RN-07)', async () => {
        prisma.chamado.create.mockResolvedValue(chamadoFake({ idChamado: 7 }) as never);
        prisma.chamado.update.mockResolvedValue(chamadoFake({ idChamado: 7, protocolo: 'HD-2026-00007' }) as never);
        prisma.usuario.findMany.mockResolvedValue([]);

        await request(app).post('/api/chamados').set('Authorization', CLIENTE).send(corpo);

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(prisma.chamado.update.mock.calls[0]?.[0]).toMatchObject({
            where: { idChamado: 7 },
            data: { protocolo: 'HD-2026-00007' },
        });
    });

    it('notifica toda a equipe sobre o novo chamado', async () => {
        prisma.chamado.create.mockResolvedValue(chamadoFake() as never);
        prisma.chamado.update.mockResolvedValue(chamadoFake() as never);
        prisma.usuario.findMany.mockResolvedValue([{ idUsuario: 1 }, { idUsuario: 2 }] as never);

        await request(app).post('/api/chamados').set('Authorization', CLIENTE).send(corpo);

        expect(prisma.notificacao.createMany.mock.calls[0]?.[0]?.data).toHaveLength(2);
    });

    it('rejeita prioridade inválida', async () => {
        const res = await request(app)
            .post('/api/chamados')
            .set('Authorization', CLIENTE)
            .send({ ...corpo, prioridade: 'urgentissima' });
        expect(res.status).toBe(400);
    });
});

describe('acesso aos chamados (RN-09)', () => {
    it('lista apenas os chamados do próprio cliente', async () => {
        prisma.chamado.findMany.mockResolvedValue([]);
        await request(app).get('/api/chamados').set('Authorization', CLIENTE);
        expect(prisma.chamado.findMany.mock.calls[0]?.[0]?.where).toEqual({ idCliente: 3 });
    });

    it('agente lista todos os chamados', async () => {
        prisma.chamado.findMany.mockResolvedValue([]);
        await request(app).get('/api/chamados').set('Authorization', AGENTE);
        expect(prisma.chamado.findMany.mock.calls[0]?.[0]?.where).toEqual({});
    });

    it('cliente não abre o chamado de outro cliente', async () => {
        prisma.chamado.findUnique.mockResolvedValue(chamadoFake({ idCliente: 3 }) as never);
        const res = await request(app).get('/api/chamados/42').set('Authorization', OUTRO_CLIENTE);
        expect(res.status).toBe(403);
    });

    it('cliente não lê as mensagens de um chamado que não é dele', async () => {
        prisma.chamado.findUnique.mockResolvedValue(chamadoFake({ idCliente: 3 }) as never);
        const res = await request(app).get('/api/chamados/42/mensagens').set('Authorization', OUTRO_CLIENTE);
        expect(res.status).toBe(403);
        expect(prisma.chat_Mensagem.findMany).not.toHaveBeenCalled();
    });

    it('ID não numérico retorna 400', async () => {
        const res = await request(app).get('/api/chamados/abc').set('Authorization', CLIENTE);
        expect(res.status).toBe(400);
    });

    it('chamado inexistente retorna 404', async () => {
        prisma.chamado.findUnique.mockResolvedValue(null);
        const res = await request(app).get('/api/chamados/999').set('Authorization', AGENTE);
        expect(res.status).toBe(404);
    });
});

describe('PATCH /api/chamados/:id/status', () => {
    it('cliente só pode cancelar', async () => {
        prisma.chamado.findUnique.mockResolvedValue(chamadoFake() as never);
        const res = await request(app)
            .patch('/api/chamados/42/status')
            .set('Authorization', CLIENTE)
            .send({ status: 'concluido' });
        expect(res.status).toBe(403);
    });

    it('ao concluir, registra a data de fechamento e notifica o cliente em tempo real', async () => {
        prisma.chamado.findUnique.mockResolvedValue(chamadoFake() as never);
        prisma.chamado.update.mockResolvedValue(chamadoFake({ status: 'concluido' }) as never);
        prisma.notificacao.create.mockResolvedValue({ idNotificacao: 1 } as never);

        const res = await request(app)
            .patch('/api/chamados/42/status')
            .set('Authorization', AGENTE)
            .send({ status: 'concluido' });

        expect(res.status).toBe(200);
        expect(prisma.chamado.update.mock.calls[0]?.[0].data.dataFechamento).toBeInstanceOf(Date);
        expect(prisma.notificacao.create.mock.calls[0]?.[0].data.tipo).toBe('chamado_concluido');
        expect(realtime.paraUsuario).toHaveBeenCalledWith(3, 'notificacao_3', { idNotificacao: 1 });
    });
});

describe('PATCH /api/chamados/:id/avaliar (CSAT)', () => {
    it('nota precisa estar entre 1 e 5', async () => {
        const res = await request(app).patch('/api/chamados/42/avaliar').set('Authorization', CLIENTE).send({ avaliacao: 6 });
        expect(res.status).toBe(400);
    });

    it('só avalia chamado concluído', async () => {
        prisma.chamado.findUnique.mockResolvedValue(chamadoFake({ status: 'em_atendimento' }) as never);
        const res = await request(app).patch('/api/chamados/42/avaliar').set('Authorization', CLIENTE).send({ avaliacao: 5 });
        expect(res.status).toBe(409);
    });

    it('outro cliente não avalia', async () => {
        prisma.chamado.findUnique.mockResolvedValue(chamadoFake({ status: 'concluido' }) as never);
        const res = await request(app)
            .patch('/api/chamados/42/avaliar')
            .set('Authorization', OUTRO_CLIENTE)
            .send({ avaliacao: 5 });
        expect(res.status).toBe(403);
    });
});

describe('mensagens do chat', () => {
    it('o remetente vem do token, não do corpo da requisição', async () => {
        prisma.chamado.findUnique.mockResolvedValue(chamadoFake({ idAgente: null }) as never);
        prisma.chat_Mensagem.create.mockResolvedValue({ idMensagem: 1 } as never);

        const res = await request(app)
            .post('/api/chamados/42/mensagens')
            .set('Authorization', CLIENTE)
            .send({ mensagem: 'Oi', idRemetente: 1 });

        expect(res.status).toBe(201);
        expect(prisma.chat_Mensagem.create.mock.calls[0]?.[0].data.idRemetente).toBe(3);
        expect(realtime.paraChamado).toHaveBeenCalledWith(42, 'nova_mensagem', { idMensagem: 1 });
    });

    it('mensagem do cliente notifica o USUÁRIO do agente responsável', async () => {
        prisma.chamado.findUnique.mockResolvedValue(chamadoFake({ idAgente: 5 }) as never);
        prisma.chat_Mensagem.create.mockResolvedValue({ idMensagem: 1 } as never);
        prisma.agente.findUnique.mockResolvedValue({ idUsuario: 2 } as never);
        prisma.notificacao.create.mockResolvedValue({ idNotificacao: 9 } as never);

        await request(app).post('/api/chamados/42/mensagens').set('Authorization', CLIENTE).send({ mensagem: 'Oi' });

        expect(prisma.notificacao.create.mock.calls[0]?.[0].data.idUsuario).toBe(2);
        expect(realtime.paraUsuario).toHaveBeenCalledWith(2, 'notificacao_2', { idNotificacao: 9 });
    });
});

describe('atribuição e auditoria', () => {
    it('atribuir chamado grava log de auditoria na mesma transação', async () => {
        prisma.chamado.update.mockResolvedValue(chamadoFake({ idAgente: 5 }) as never);

        const res = await request(app).patch('/api/chamados/42/atribuir').set('Authorization', ADMIN).send({ idAgente: 5 });

        expect(res.status).toBe(200);
        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(prisma.logAuditoria.create.mock.calls[0]?.[0].data).toMatchObject({
            idUsuario: 1,
            acao: 'ATRIBUICAO_CHAMADO',
        });
    });

    it('agente não pode atribuir chamados', async () => {
        const res = await request(app).patch('/api/chamados/42/atribuir').set('Authorization', AGENTE).send({ idAgente: 5 });
        expect(res.status).toBe(403);
    });
});

describe('notificações', () => {
    it('usuário não marca como lida a notificação de outra pessoa', async () => {
        prisma.notificacao.findUnique.mockResolvedValue({ idNotificacao: 1, idUsuario: 99 } as never);
        const res = await request(app).patch('/api/notificacoes/1/lida').set('Authorization', CLIENTE);
        expect(res.status).toBe(403);
        expect(prisma.notificacao.update).not.toHaveBeenCalled();
    });
});
