import http from 'node:http';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { criarRealtime } from './realtime/socket.js';
import type { Realtime } from './types.js';

// Falha cedo se o segredo do JWT não estiver configurado.
void env.jwtSecret;

const prisma = new PrismaClient();
const uploadsDir = path.resolve(env.uploadsDir);

// O Socket.io precisa do servidor HTTP, e o app precisa do Socket.io:
// criamos um proxy que é preenchido logo depois.
let realtime: Realtime = { paraChamado: () => {}, paraUsuario: () => {} };
const app = createApp({
    prisma,
    uploadsDir,
    realtime: {
        paraChamado: (...args) => realtime.paraChamado(...args),
        paraUsuario: (...args) => realtime.paraUsuario(...args),
    },
});

const server = http.createServer(app);
realtime = criarRealtime(server, prisma);

server.listen(env.port, () => {
    console.log(`API do Helpdesk rodando em http://localhost:${env.port}`);
});

const encerrar = async () => {
    server.close();
    await prisma.$disconnect();
    process.exit(0);
};
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
