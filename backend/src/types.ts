import type { PrismaClient } from '@prisma/client';
import type { Request } from 'express';

export type NivelAcesso = 'cliente' | 'agente' | 'admin';

export type UsuarioLogado = {
    idUsuario: number;
    nivelAcesso: NivelAcesso;
};

export type RequestAutenticada = Request & {
    usuarioLogado?: UsuarioLogado;
};

/** Canal de eventos em tempo real (Socket.io em produção, mock nos testes). */
export interface Realtime {
    paraChamado(idChamado: number, evento: string, payload: unknown): void;
    paraUsuario(idUsuario: number, evento: string, payload: unknown): void;
}

/** Dependências injetadas na aplicação — facilita testes sem banco real. */
export type Deps = {
    prisma: PrismaClient;
    realtime: Realtime;
    uploadsDir: string;
};
