import os from 'node:os';
import path from 'node:path';
import type { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended';
import { vi } from 'vitest';
import { createApp } from '../src/app.js';
import { gerarToken } from '../src/middlewares/auth.js';
import type { NivelAcesso, Realtime } from '../src/types.js';

export const prisma: DeepMockProxy<PrismaClient> = mockDeep<PrismaClient>();
export const realtime = { paraChamado: vi.fn(), paraUsuario: vi.fn() } satisfies Realtime;

export const app = createApp({
    prisma,
    realtime,
    uploadsDir: path.join(os.tmpdir(), 'helpdesk-test-uploads'),
});

export const resetMocks = () => {
    mockReset(prisma);
    realtime.paraChamado.mockReset();
    realtime.paraUsuario.mockReset();
    // $transaction(callback) executa o callback com o próprio Prisma falso.
    prisma.$transaction.mockImplementation(((fn: (tx: PrismaClient) => unknown) => fn(prisma)) as never);
};

export const bearer = (idUsuario: number, nivelAcesso: NivelAcesso) =>
    `Bearer ${gerarToken({ idUsuario, nivelAcesso })}`;

export const ADMIN = bearer(1, 'admin');
export const AGENTE = bearer(2, 'agente');
export const CLIENTE = bearer(3, 'cliente');
export const OUTRO_CLIENTE = bearer(4, 'cliente');

const agora = new Date('2026-05-10T12:00:00Z');

export const chamadoFake = (sobrescrever: Record<string, unknown> = {}) => ({
    idChamado: 42,
    protocolo: 'HD-2026-00042',
    idCliente: 3,
    idAgente: null,
    idEmpresa: null,
    titulo: 'Impressora não liga',
    descricao: 'Desde ontem',
    categoria: null,
    status: 'aberto' as const,
    prioridade: 'media' as const,
    anexo: null,
    mimeTypeAnexo: null,
    avaliacao: null,
    dataFechamento: null,
    createdAt: agora,
    updatedAt: agora,
    ...sobrescrever,
});
