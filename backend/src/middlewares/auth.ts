import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import type { NivelAcesso, RequestAutenticada, UsuarioLogado } from '../types.js';

const extrairToken = (req: Request): string | null => {
    const [tipo, token] = (req.headers.authorization ?? '').split(' ');
    return tipo === 'Bearer' && token ? token : null;
};

export const verificarJwt = (token: string): UsuarioLogado => {
    const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload & UsuarioLogado;
    return { idUsuario: payload.idUsuario, nivelAcesso: payload.nivelAcesso };
};

export const gerarToken = (usuario: UsuarioLogado): string =>
    jwt.sign({ idUsuario: usuario.idUsuario, nivelAcesso: usuario.nivelAcesso }, env.jwtSecret, {
        expiresIn: '12h',
    });

export const getUsuarioLogado = (req: Request): UsuarioLogado => {
    const usuario = (req as RequestAutenticada).usuarioLogado;
    if (!usuario) throw new Error('Rota protegida sem middleware de autenticação.');
    return usuario;
};

/** Exige um token JWT válido (RN-04). */
export const autenticar = (req: Request, res: Response, next: NextFunction): void => {
    const token = extrairToken(req);
    if (!token) {
        res.status(401).json({ error: 'Token não informado.' });
        return;
    }
    try {
        (req as RequestAutenticada).usuarioLogado = verificarJwt(token);
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido ou expirado.' });
    }
};

/** Lê o token se existir, mas não bloqueia a requisição (usado no cadastro público). */
export const autenticarOpcional = (req: Request, _res: Response, next: NextFunction): void => {
    const token = extrairToken(req);
    if (token) {
        try {
            (req as RequestAutenticada).usuarioLogado = verificarJwt(token);
        } catch {
            // token inválido no cadastro público: segue como visitante
        }
    }
    next();
};

/** Autorização por perfil (RBAC — RN-05/RN-06). */
export const exigirPerfil =
    (...perfis: NivelAcesso[]) =>
    (req: Request, res: Response, next: NextFunction): void => {
        const usuario = (req as RequestAutenticada).usuarioLogado;
        if (!usuario || !perfis.includes(usuario.nivelAcesso)) {
            res.status(403).json({ error: 'Acesso negado para este perfil.' });
            return;
        }
        next();
    };

export const apenasAdmin = exigirPerfil('admin');
export const apenasEquipe = exigirPerfil('agente', 'admin');
