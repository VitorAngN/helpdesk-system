import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import multer from 'multer';
import { autenticar } from '../middlewares/auth.js';
import { HttpError } from '../middlewares/errorHandler.js';
import type { Deps } from '../types.js';

export const EXTENSOES_PERMITIDAS = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp'];

export const uploadRoutes = ({ uploadsDir }: Deps): Router => {
    const router = Router();
    fs.mkdirSync(uploadsDir, { recursive: true });

    const upload = multer({
        storage: multer.diskStorage({
            destination: (_req, _file, cb) => cb(null, uploadsDir),
            // Nome aleatório: o arquivo não pode ser adivinhado nem sobrescrever outro.
            filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`),
        }),
        limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
        fileFilter: (_req, file, cb) => {
            if (EXTENSOES_PERMITIDAS.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
            else cb(new HttpError(400, 'Tipo de arquivo não permitido.'));
        },
    });

    router.post('/upload', autenticar, upload.single('arquivo'), (req, res) => {
        if (!req.file) throw new HttpError(400, 'Nenhum arquivo enviado.');
        res.json({ url: `/uploads/${req.file.filename}`, mimeType: req.file.mimetype, nome: req.file.originalname });
    });

    return router;
};
