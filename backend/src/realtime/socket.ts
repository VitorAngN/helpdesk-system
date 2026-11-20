import type http from 'node:http';
import type { PrismaClient } from '@prisma/client';
import { Server as SocketServer } from 'socket.io';
import { env } from '../config/env.js';
import { verificarJwt } from '../middlewares/auth.js';
import { podeAcessarChamado } from '../routes/chamados.routes.js';
import type { Realtime, UsuarioLogado } from '../types.js';

/**
 * Socket.io com autenticação: o cliente envia o JWT no handshake e cada usuário
 * entra automaticamente na sala `usuario_<id>`. Notificações vão só para essa sala
 * (antes eram enviadas para todos os sockets conectados).
 */
export const criarRealtime = (server: http.Server, prisma: PrismaClient): Realtime => {
    const io = new SocketServer(server, { cors: { origin: env.corsOrigin } });

    io.use((socket, next) => {
        const token = socket.handshake.auth?.token as string | undefined;
        if (!token) return next(new Error('Token não informado.'));
        try {
            socket.data.usuario = verificarJwt(token);
            next();
        } catch {
            next(new Error('Token inválido.'));
        }
    });

    io.on('connection', (socket) => {
        const usuario = socket.data.usuario as UsuarioLogado;
        void socket.join(`usuario_${usuario.idUsuario}`);

        socket.on('entrar_sala', async (idChamado: string | number) => {
            const id = Number(idChamado);
            if (!Number.isInteger(id)) return;
            const chamado = await prisma.chamado.findUnique({ where: { idChamado: id }, select: { idCliente: true } });
            if (chamado && podeAcessarChamado(usuario, chamado)) void socket.join(`chamado_${id}`);
        });

        socket.on('sair_sala', (idChamado: string | number) => {
            void socket.leave(`chamado_${idChamado}`);
        });

        socket.on('entrar_sala_agentes', () => {
            if (usuario.nivelAcesso !== 'cliente') void socket.join('sala_agentes');
        });
    });

    return {
        paraChamado: (idChamado, evento, payload) => {
            io.to(`chamado_${idChamado}`).emit(evento, payload);
        },
        paraUsuario: (idUsuario, evento, payload) => {
            io.to(`usuario_${idUsuario}`).emit(evento, payload);
        },
    };
};
