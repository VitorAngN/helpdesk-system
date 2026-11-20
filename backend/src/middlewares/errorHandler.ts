import { Prisma } from '@prisma/client';
import multer from 'multer';
import { ZodError } from 'zod';
import type { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
    constructor(
        public readonly status: number,
        message: string,
    ) {
        super(message);
    }
}

/**
 * Tratamento centralizado de erros. O Express 5 encaminha para cá as exceções
 * lançadas em handlers async, então as rotas não precisam de try/catch.
 */
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message });
        return;
    }
    if (err instanceof ZodError) {
        res.status(400).json({
            error: 'Dados inválidos.',
            detalhes: err.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
        });
        return;
    }
    if (err instanceof multer.MulterError) {
        res.status(400).json({ error: err.message });
        return;
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === 'P2025') {
            res.status(404).json({ error: 'Registro não encontrado.' });
            return;
        }
        if (err.code === 'P2002') {
            res.status(409).json({ error: 'Registro duplicado.' });
            return;
        }
        if (err.code === 'P2003') {
            res.status(409).json({ error: 'Registro relacionado não existe ou está em uso.' });
            return;
        }
    }
    console.error(err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
};
