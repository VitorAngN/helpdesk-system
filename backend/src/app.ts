import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { adminRoutes } from './routes/admin.routes.js';
import { agentesRoutes } from './routes/agentes.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { chamadosRoutes } from './routes/chamados.routes.js';
import { empresasRoutes } from './routes/empresas.routes.js';
import { notificacoesRoutes } from './routes/notificacoes.routes.js';
import { uploadRoutes } from './routes/upload.routes.js';
import { usuariosRoutes } from './routes/usuarios.routes.js';
import type { Deps } from './types.js';

/**
 * Monta a aplicação Express sem abrir porta nem conectar no banco.
 * As dependências são injetadas, então os testes usam um Prisma falso.
 */
export const createApp = (deps: Deps): Express => {
    const app = express();

    // crossOriginResourcePolicy liberado para o frontend exibir imagens de /uploads
    app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
    app.use(cors({ origin: env.corsOrigin }));
    app.use(express.json({ limit: '1mb' }));
    app.use('/uploads', express.static(deps.uploadsDir));

    app.get('/api/health', (_req, res) => {
        res.json({ status: 'ok' });
    });

    app.use(
        '/api',
        authRoutes(deps),
        usuariosRoutes(deps),
        empresasRoutes(deps),
        agentesRoutes(deps),
        chamadosRoutes(deps),
        notificacoesRoutes(deps),
        adminRoutes(deps),
        uploadRoutes(deps),
    );

    app.use('/api', (_req, res) => {
        res.status(404).json({ error: 'Rota não encontrada.' });
    });
    app.use(errorHandler);

    return app;
};
