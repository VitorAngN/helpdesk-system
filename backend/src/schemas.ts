import { z } from 'zod';
import { HttpError } from './middlewares/errorHandler.js';
import type { Request } from 'express';

export const parseId = (req: Request, nome = 'id'): number => {
    const id = Number(req.params[nome]);
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'ID inválido.');
    return id;
};

const nivelAcesso = z.enum(['cliente', 'agente', 'admin']);
const status = z.enum(['aberto', 'em_atendimento', 'aguardando_cliente', 'concluido', 'cancelado']);
const prioridade = z.enum(['baixa', 'media', 'alta']);
const idOpcional = z.number().int().positive().nullish();

export const cadastroSchema = z.object({
    nome: z.string().trim().min(2).max(100),
    email: z.email().max(100),
    senha: z.string().min(6).max(72),
    nivelAcesso: nivelAcesso.optional(),
});

export const loginSchema = z.object({
    email: z.email(),
    senha: z.string().min(1),
});

export const atualizarUsuarioSchema = z.object({
    nome: z.string().trim().min(2).max(100).optional(),
    email: z.email().max(100).optional(),
    nivelAcesso: nivelAcesso.optional(),
});

export const empresaSchema = z.object({
    nome: z.string().trim().min(2).max(150),
    cnpj: z.string().trim().min(14).max(18),
    email: z.email().max(100),
});

export const agenteSchema = z.object({
    idUsuario: z.coerce.number().int().positive(),
    idEmpresa: z.coerce.number().int().positive(),
    cargo: z.string().trim().max(50).optional(),
    disponivel: z.boolean().optional(),
});

export const disponibilidadeSchema = z.object({ disponivel: z.boolean() });

export const novoChamadoSchema = z.object({
    idCliente: z.number().int().positive().optional(),
    idAgente: idOpcional,
    idEmpresa: idOpcional,
    titulo: z.string().trim().min(3).max(150),
    descricao: z.string().trim().min(1),
    categoria: z.string().trim().max(50).nullish(),
    prioridade: prioridade.optional(),
    anexo: z.string().max(500).nullish(),
    mimeTypeAnexo: z.string().max(100).nullish(),
});

export const atualizarChamadoSchema = novoChamadoSchema.partial().extend({ status: status.optional() });

export const statusSchema = z.object({ status });

export const atribuirSchema = z.object({ idAgente: idOpcional });

export const avaliacaoSchema = z.object({ avaliacao: z.number().int().min(1).max(5) });

export const mensagemSchema = z.object({
    mensagem: z.string().trim().min(1),
    anexo: z.string().max(500).nullish(),
    mimeTypeAnexo: z.string().max(100).nullish(),
});

export const notificacaoSchema = z.object({
    idUsuario: z.number().int().positive(),
    idChamado: idOpcional,
    tipo: z.enum(['novo_chamado', 'nova_mensagem', 'status_alterado', 'chamado_concluido', 'chamado_cancelado']),
});

export const categoriaSchema = z.object({ nome: z.string().trim().min(1).max(50) });

export const macroSchema = z.object({
    titulo: z.string().trim().min(1).max(100),
    texto: z.string().trim().min(1),
});
