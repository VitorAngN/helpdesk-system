import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from './generated/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

type NivelAcessoJwt = 'cliente' | 'agente' | 'admin';

type UsuarioLogado = {
    idUsuario: number;
    nivelAcesso: NivelAcessoJwt;
};

type RequestAutenticada = Request & {
    usuarioLogado?: UsuarioLogado;
};

const getUsuarioLogado = (req: Request): UsuarioLogado => {
    return (req as RequestAutenticada).usuarioLogado as UsuarioLogado;
};

const parseIdParam = (req: Request, res: Response, paramName = 'id'): number | null => {
    const rawId = req.params[paramName];
    if (typeof rawId !== 'string') {
        res.status(400).json({ error: "ID invalido" });
        return null;
    }

    const id = Number.parseInt(rawId, 10);
    if (Number.isNaN(id)) {
        res.status(400).json({ error: "ID invalido" });
        return null;
    }

    return id;
};

const formatAgente = (agente: {
    idAgente: number;
    idUsuario: number;
    idEmpresa: number;
    cargo: string;
    disponivel: boolean;
    usuario: { nome: string; email: string; nivelAcesso: string };
    empresa: { nome: string };
}) => ({
    idAgente: agente.idAgente,
    idUsuario: agente.idUsuario,
    idEmpresa: agente.idEmpresa,
    cargo: agente.cargo,
    disponivel: agente.disponivel,
    nome: agente.usuario.nome,
    email: agente.usuario.email,
    nivelAcesso: agente.usuario.nivelAcesso,
    empresaNome: agente.empresa.nome
});

// ─── Inicialização do Servidor HTTP + Socket.io ───
const app = express();
const server = http.createServer(app);
export const io = new SocketServer(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'] }
});

// Configuração do Socket.io: cada chamado é uma "sala"
io.on('connection', (socket) => {
    socket.on('entrar_sala', (idChamado: string) => {
        socket.join(`chamado_${idChamado}`);
    });
    socket.on('sair_sala', (idChamado: string) => {
        socket.leave(`chamado_${idChamado}`);
    });
    socket.on('entrar_sala_agentes', () => {
        socket.join('sala_agentes');
    });
});

// ─── Multer (Upload de Arquivos) ───
const uploadsDir = path.resolve('./uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${uuidv4()}${ext}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req, file, cb) => {
        const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
        if (allowed.includes(path.extname(file.originalname).toLowerCase())) cb(null, true);
        else cb(new Error('Tipo de arquivo não permitido'));
    }
});

// Expor a pasta uploads como rota estática
app.use('/uploads', express.static(uploadsDir));

//fazer o express entender o formato json
app.use(express.json());
//instanciar o prisma client para usar o banco de dados
const prisma = new PrismaClient();
//usar Cors
app.use(cors());

// ═══════════════════════════════════════════════
// MIDDLEWARES
// ═══════════════════════════════════════════════

// 1. AUTENTICAÇÃO — verifica se o token existe e é válido
const verificarToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ erro: "Crachá não encontrado. Acesso negado." });
        return;
    }
    // O padrão é "Bearer <token>", separa para pegar só o código
    const token = authHeader.split(" ")[1];
    if (!token) {
        res.status(401).json({ erro: "Crachá não encontrado. Acesso negado." });
        return;
    }
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error("Secret não configurado");
        const payload = jwt.verify(token, secret) as UsuarioLogado;
        // Salva os dados do usuário (ID e Nível) na requisição
        (req as RequestAutenticada).usuarioLogado = payload;
        next();
    } catch (error) {
        res.status(401).json({ erro: "Crachá inválido ou expirado." });
    }
};

// 2. AUTORIZAÇÃO — verifica o nível de acesso depois de autenticado
const apenasAdmin = (req: Request, res: Response, next: NextFunction) => {
    const usuario = getUsuarioLogado(req);
    if (usuario?.nivelAcesso !== 'admin') {
        res.status(403).json({ erro: "Acesso restrito ao administrador." });
        return;
    }
    next();
};

const apenasAgente = (req: Request, res: Response, next: NextFunction) => {
    const usuario = getUsuarioLogado(req);
    if (!['agente', 'admin'].includes(usuario?.nivelAcesso)) {
        res.status(403).json({ erro: "Acesso restrito a agentes." });
        return;
    }
    next();
};


// ═══════════════════════════════════════════════
// ROTAS PÚBLICAS - Não precisam de token
// ═══════════════════════════════════════════════

// Cadastro de novo usuário (público para novos clientes se registrarem)
app.post("/api/usuarios", async (req: Request, res: Response) => {
    try {
        const { nome, email, senha, nivelAcesso } = req.body;
        const saltRounds = 10;
        const senhaCriptografada = await bcrypt.hash(senha, saltRounds);
        const novoUsuario = await prisma.usuario.create({
            data: { nome, email, senha: senhaCriptografada, nivelAcesso }
        });
        const { senha: _, ...usuarioSemSenha } = novoUsuario;
        res.status(201).json(usuarioSemSenha);
    } catch (error) {
        console.error("Erro ao criar usuário:", error);
        res.status(500).json({ error: "Erro ao criar usuário" });
    }
});

// Login - alinhado com o contrato: POST /api/auth/login
app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
        const { email, senha } = req.body;
        const usuario = await prisma.usuario.findUnique({
            where: { email: email }
        });
        if (!usuario) {
            res.status(404).json({ error: "Usuário não encontrado" });
            return;
        }
        // bcrypt.compare compara a senha digitada com o hash salvo no banco
        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
        if (!senhaCorreta) {
            res.status(401).json({ error: "E-mail ou Senha incorreta" });
            return;
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error("Chave secreta do JWT não configurada no .env");

        // Payload: dados que vão "impressos" no crachá
        const token = jwt.sign(
            { idUsuario: usuario.idUsuario, nivelAcesso: usuario.nivelAcesso },
            secret,
            { expiresIn: '12h' }
        );
        const { senha: _, ...usuarioSemSenha } = usuario;
        res.status(200).json({
            mensagem: "Login realizado com sucesso",
            token: token,
            usuario: usuarioSemSenha
        });
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
});

// Rota de teste (pública)
app.get('/api/teste', (req: Request, res: Response) => {
    res.status(200).json({ message: "Rota de teste funcionando!", status: "sucesso" });
});


// ═══════════════════════════════════════════════
// ROTAS PROTEGIDAS - Precisam do token JWT
// ═══════════════════════════════════════════════

// ─── USUARIOS ───────────────────────────────────

// Admin vê todos os usuários
app.get("/api/usuarios", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const usuarios = await prisma.usuario.findMany({
            select: { idUsuario: true, nome: true, email: true, nivelAcesso: true, createdAt: true, updatedAt: true }
        });
        res.status(200).json(usuarios);
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        res.status(500).json({ error: "Erro ao buscar usuários" });
    }
});
app.get("/api/usuarios/:id", verificarToken, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        const usuario = await prisma.usuario.findUnique({
            where: { idUsuario: id },
            select: { idUsuario: true, nome: true, email: true, nivelAcesso: true, createdAt: true, updatedAt: true }
        });
        if (!usuario) {
            res.status(404).json({ error: "Usuário não encontrado" });
            return;
        }
        res.status(200).json(usuario);
    } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        res.status(500).json({ error: "Erro ao buscar usuário" });
    }
});
app.put("/api/usuarios/:id", verificarToken, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        const { nome, email, nivelAcesso } = req.body;
        const usuarioAtualizado = await prisma.usuario.update({
            where: { idUsuario: id },
            data: { nome, email, nivelAcesso },
            select: { idUsuario: true, nome: true, email: true, nivelAcesso: true, createdAt: true, updatedAt: true }
        });
        res.status(200).json(usuarioAtualizado);
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        res.status(500).json({ error: "Erro ao atualizar usuário" });
    }
});
// Só admin pode deletar usuários
app.delete("/api/usuarios/:id", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        await prisma.usuario.delete({ where: { idUsuario: id } });
        res.status(200).json({ message: "Usuário deletado com sucesso" });
    } catch (error) {
        console.error("Erro ao deletar usuário:", error);
        res.status(500).json({ error: "Erro ao deletar usuário" });
    }
});

// ─── EMPRESAS (só admin) ────────────────────────
app.post("/api/empresas", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const { nome, cnpj, email } = req.body;
        const novaEmpresa = await prisma.empresa.create({ data: { nome, cnpj, email } });
        res.status(201).json(novaEmpresa);
    } catch (error) {
        console.error("Erro ao criar empresa:", error);
        res.status(500).json({ error: "Erro ao criar empresa" });
    }
});
app.get("/api/empresas", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const empresas = await prisma.empresa.findMany();
        res.status(200).json(empresas);
    } catch (error) {
        console.error("Erro ao buscar empresas:", error);
        res.status(500).json({ error: "Erro ao buscar empresas" });
    }
});
app.get("/api/empresas/:id", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        const empresa = await prisma.empresa.findUnique({ where: { idEmpresa: id } });
        if (!empresa) {
            res.status(404).json({ error: "Empresa não encontrada" });
            return;
        }
        res.status(200).json(empresa);
    } catch (error) {
        console.error("Erro ao buscar empresa:", error);
        res.status(500).json({ error: "Erro ao buscar empresa" });
    }
});
app.put("/api/empresas/:id", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        const { nome, cnpj, email } = req.body;
        const empresaAtualizada = await prisma.empresa.update({ where: { idEmpresa: id }, data: { nome, cnpj, email } });
        res.status(200).json(empresaAtualizada);
    } catch (error) {
        console.error("Erro ao atualizar empresa:", error);
        res.status(500).json({ error: "Erro ao atualizar empresa" });
    }
});
app.delete("/api/empresas/:id", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        await prisma.empresa.delete({ where: { idEmpresa: id } });
        res.status(200).json({ message: "Empresa deletada com sucesso" });
    } catch (error) {
        console.error("Erro ao deletar empresa:", error);
        res.status(500).json({ error: "Erro ao deletar empresa" });
    }
});

// ─── AGENTES ────────────────────────────────────
// Criar/deletar agente é só admin; ver agentes é agente/admin
app.post("/api/agentes", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const { idUsuario, idEmpresa, cargo, disponivel } = req.body;
        const novoAgente = await prisma.agente.create({
            data: { idUsuario, idEmpresa, cargo, disponivel },
            include: {
                usuario: { select: { nome: true, email: true, nivelAcesso: true } },
                empresa: { select: { nome: true } }
            }
        });
        res.status(201).json(formatAgente(novoAgente));
    } catch (error) {
        console.error("Erro ao criar agente:", error);
        res.status(500).json({ error: "Erro ao criar agente" });
    }
});
app.get("/api/agentes", verificarToken, apenasAgente, async (req: Request, res: Response) => {
    try {
        const agentes = await prisma.agente.findMany({
            include: {
                usuario: { select: { nome: true, email: true, nivelAcesso: true } },
                empresa: { select: { nome: true } }
            },
            orderBy: { idAgente: 'asc' }
        });
        res.status(200).json(agentes.map(formatAgente));
    } catch (error) {
        console.error("Erro ao buscar agentes:", error);
        res.status(500).json({ error: "Erro ao buscar agentes" });
    }
});
app.get("/api/agentes/:id", verificarToken, apenasAgente, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        const agente = await prisma.agente.findUnique({
            where: { idAgente: id },
            include: {
                usuario: { select: { nome: true, email: true, nivelAcesso: true } },
                empresa: { select: { nome: true } }
            }
        });
        if (!agente) {
            res.status(404).json({ error: "Agente não encontrado" });
            return;
        }
        res.status(200).json(formatAgente(agente));
    } catch (error) {
        console.error("Erro ao buscar agente:", error);
        res.status(500).json({ error: "Erro ao buscar agente" });
    }
});
app.put("/api/agentes/:id", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        const { idUsuario, idEmpresa, cargo, disponivel } = req.body;
        const agenteAtualizado = await prisma.agente.update({
            where: { idAgente: id },
            data: { idUsuario, idEmpresa, cargo, disponivel },
            include: {
                usuario: { select: { nome: true, email: true, nivelAcesso: true } },
                empresa: { select: { nome: true } }
            }
        });
        res.status(200).json(formatAgente(agenteAtualizado));
    } catch (error) {
        console.error("Erro ao atualizar agente:", error);
        res.status(500).json({ error: "Erro ao atualizar agente" });
    }
});
// PATCH - Agente atualiza a própria disponibilidade (RN-06)
app.patch("/api/agentes/:id/disponibilidade", verificarToken, apenasAgente, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        const { disponivel } = req.body;
        const agenteAtualizado = await prisma.agente.update({
            where: { idAgente: id },
            data: { disponivel },
            include: {
                usuario: { select: { nome: true, email: true, nivelAcesso: true } },
                empresa: { select: { nome: true } }
            }
        });
        res.status(200).json(formatAgente(agenteAtualizado));
    } catch (error) {
        console.error("Erro ao atualizar disponibilidade do agente:", error);
        res.status(500).json({ error: "Erro ao atualizar disponibilidade do agente" });
    }
});
app.delete("/api/agentes/:id", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        await prisma.agente.delete({ where: { idAgente: id } });
        res.status(200).json({ message: "Agente deletado com sucesso" });
    } catch (error) {
        console.error("Erro ao deletar agente:", error);
        res.status(500).json({ error: "Erro ao deletar agente" });
    }
});

// ─── CHAMADOS ───────────────────────────────────
app.post("/api/chamados", verificarToken, async (req: Request, res: Response) => {
    try {
        const { idCliente, idAgente, idEmpresa, titulo, descricao, categoria, prioridade, anexo, mimeTypeAnexo } = req.body;

        // RN-07: protocolo gerado automaticamente pelo backend no formato HD-YYYY-NNNNN
        // ⚠️ Nota: count() tem risco de duplicata em alta concorrência (race condition).
        // Para portfólio está ok. Solução robusta usaria transação ou UUID.
        const ano = new Date().getFullYear();
        const count = await prisma.chamado.count();
        const protocolo = `HD-${ano}-${String(count + 1).padStart(5, '0')}`;

        const novoChamado = await prisma.chamado.create({
            data: { protocolo, idCliente, idAgente, idEmpresa, titulo, descricao, categoria, prioridade, anexo, mimeTypeAnexo }
        });

        // Notificar Agentes e Admins sobre o novo chamado
        const agentesEAdmins = await prisma.usuario.findMany({
            where: { nivelAcesso: { in: ['admin', 'agente'] } },
            select: { idUsuario: true }
        });

        if (agentesEAdmins.length > 0) {
            await prisma.notificacao.createMany({
                data: agentesEAdmins.map(user => ({
                    idUsuario: user.idUsuario,
                    idChamado: novoChamado.idChamado,
                    tipo: 'novo_chamado'
                }))
            });
        }

        res.status(201).json(novoChamado);
    } catch (error) {
        console.error("Erro ao criar chamado:", error);
        res.status(500).json({ error: "Erro ao criar chamado" });
    }
});
// RN-09: cliente só vê os próprios chamados; agente/admin vê todos
app.get("/api/chamados", verificarToken, async (req: Request, res: Response) => {
    try {
        const { idUsuario, nivelAcesso } = getUsuarioLogado(req);
        const chamados = await prisma.chamado.findMany({
            where: nivelAcesso === 'cliente' ? { idCliente: idUsuario } : {}
        });
        res.status(200).json(chamados);
    } catch (error) {
        console.error("Erro ao buscar chamados:", error);
        res.status(500).json({ error: "Erro ao buscar chamados" });
    }
});
app.get("/api/chamados/:id", verificarToken, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        const chamado = await prisma.chamado.findUnique({ where: { idChamado: id } });
        if (!chamado) {
            res.status(404).json({ error: "Chamado não encontrado" });
            return;
        }
        res.status(200).json(chamado);
    } catch (error) {
        console.error("Erro ao buscar chamado:", error);
        res.status(500).json({ error: "Erro ao buscar chamado" });
    }
});
app.put("/api/chamados/:id", verificarToken, apenasAgente, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        // protocolo não pode ser alterado manualmente - RN-07
        const { idCliente, idAgente, idEmpresa, titulo, descricao, categoria, status, prioridade, anexo, mimeTypeAnexo } = req.body;
        const chamadoAtualizado = await prisma.chamado.update({
            where: { idChamado: id },
            data: { idCliente, idAgente, idEmpresa, titulo, descricao, categoria, status, prioridade, anexo, mimeTypeAnexo }
        });
        res.status(200).json(chamadoAtualizado);
    } catch (error) {
        console.error("Erro ao atualizar chamado:", error);
        res.status(500).json({ error: "Erro ao atualizar chamado" });
    }
});
app.patch("/api/chamados/:id/status", verificarToken, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        const { status } = req.body;
        const usuario = getUsuarioLogado(req);

        const chamadoExistente = await prisma.chamado.findUnique({ where: { idChamado: id } });
        if (!chamadoExistente) {
            res.status(404).json({ error: "Chamado não encontrado" });
            return;
        }

        // Validação de permissão: Cliente só pode alterar o próprio chamado, e só para 'cancelado'
        if (usuario.nivelAcesso === 'cliente') {
            if (chamadoExistente.idCliente !== usuario.idUsuario) {
                res.status(403).json({ error: "Acesso negado." });
                return;
            }
            if (status !== 'cancelado') {
                res.status(403).json({ error: "Cliente só pode cancelar chamados." });
                return;
            }
        }

        const dataFechamento = (status === 'concluido' || status === 'cancelado') ? new Date() : null;

        const chamadoAtualizado = await prisma.chamado.update({ 
            where: { idChamado: id }, 
            data: { status, dataFechamento } 
        });
        
        // Criar notificação para o cliente
        if (chamadoAtualizado && chamadoAtualizado.idCliente) {
            await prisma.notificacao.create({
                data: {
                    idUsuario: chamadoAtualizado.idCliente,
                    idChamado: id,
                    tipo: status === 'concluido' ? 'chamado_concluido' : status === 'cancelado' ? 'chamado_cancelado' : 'status_alterado'
                }
            });
        }
        
        res.status(200).json(chamadoAtualizado);
    } catch (error) {
        console.error("Erro ao atualizar status do chamado:", error);
        res.status(500).json({ error: "Erro ao atualizar status do chamado" });
    }
});
app.delete("/api/chamados/:id", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        await prisma.chamado.delete({ where: { idChamado: id } });
        res.status(200).json({ message: "Chamado deletado com sucesso" });
    } catch (error) {
        console.error("Erro ao deletar chamado:", error);
        res.status(500).json({ error: "Erro ao deletar chamado" });
    }
});

// ─── MENSAGENS (vinculadas ao chamado - RN-05) ──
app.post("/api/chamados/:id/mensagens", verificarToken, async (req: Request, res: Response) => {
    try {
        const idChamado = parseIdParam(req, res);
        if (idChamado === null) return;
        const { idRemetente, mensagem, anexo, mimeTypeAnexo } = req.body;
        const novaMensagem = await prisma.chat_Mensagem.create({
            data: { idChamado, idRemetente, mensagem, anexo, mimeTypeAnexo }
        });

        // Emitir via Socket.io para a sala do chamado (tempo real)
        io.to(`chamado_${idChamado}`).emit('nova_mensagem', novaMensagem);
        
        // Criar notificação para o destinatário da mensagem
        const chamado = await prisma.chamado.findUnique({ where: { idChamado } });
        if (chamado) {
            const idDestinatario = (idRemetente === chamado.idCliente) ? chamado.idAgente : chamado.idCliente;
            if (idDestinatario) {
                const novaNotif = await prisma.notificacao.create({
                    data: { idUsuario: idDestinatario, idChamado, tipo: 'nova_mensagem' }
                });
                // Emitir notificação em tempo real
                io.emit(`notificacao_${idDestinatario}`, novaNotif);
            }
        }

        res.status(201).json(novaMensagem);
    } catch (error) {
        console.error("Erro ao criar mensagem:", error);
        res.status(500).json({ error: "Erro ao criar mensagem" });
    }
});
app.get("/api/chamados/:id/mensagens", verificarToken, async (req: Request, res: Response) => {
    try {
        const idChamado = parseIdParam(req, res);
        if (idChamado === null) return;
        const mensagens = await prisma.chat_Mensagem.findMany({
            where: { idChamado },
            orderBy: { createdAt: 'asc' }
        });
        res.status(200).json(mensagens);
    } catch (error) {
        console.error("Erro ao buscar mensagens:", error);
        res.status(500).json({ error: "Erro ao buscar mensagens" });
    }
});
app.delete("/api/mensagens/:id", verificarToken, apenasAgente, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        await prisma.chat_Mensagem.delete({ where: { idMensagem: id } });
        res.status(200).json({ message: "Mensagem deletada com sucesso" });
    } catch (error) {
        console.error("Erro ao deletar mensagem:", error);
        res.status(500).json({ error: "Erro ao deletar mensagem" });
    }
});

// ─── NOTIFICACOES ────────────────────────────────
app.post("/api/notificacoes", verificarToken, apenasAgente, async (req: Request, res: Response) => {
    try {
        const { idUsuario, idChamado, tipo } = req.body;
        const novaNotificacao = await prisma.notificacao.create({ data: { idUsuario, idChamado, tipo } });
        res.status(201).json(novaNotificacao);
    } catch (error) {
        console.error("Erro ao criar notificação:", error);
        res.status(500).json({ error: "Erro ao criar notificação" });
    }
});
// Cada usuário só vê as próprias notificações
app.get("/api/notificacoes", verificarToken, async (req: Request, res: Response) => {
    try {
        const { idUsuario } = getUsuarioLogado(req);
        const notificacoes = await prisma.notificacao.findMany({
            where: { idUsuario }
        });
        res.status(200).json(notificacoes);
    } catch (error) {
        console.error("Erro ao buscar notificações:", error);
        res.status(500).json({ error: "Erro ao buscar notificações" });
    }
});
app.get("/api/notificacoes/:id", verificarToken, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        const notificacao = await prisma.notificacao.findUnique({ where: { idNotificacao: id } });
        if (!notificacao) {
            res.status(404).json({ error: "Notificação não encontrada" });
            return;
        }
        res.status(200).json(notificacao);
    } catch (error) {
        console.error("Erro ao buscar notificação:", error);
        res.status(500).json({ error: "Erro ao buscar notificação" });
    }
});
// PATCH - Marcar notificação como lida
app.patch("/api/notificacoes/:id/lida", verificarToken, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        const notificacaoAtualizada = await prisma.notificacao.update({ where: { idNotificacao: id }, data: { lida: true } });
        res.status(200).json(notificacaoAtualizada);
    } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        res.status(500).json({ error: "Erro ao marcar notificação como lida" });
    }
});
app.delete("/api/notificacoes/:id", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        await prisma.notificacao.delete({ where: { idNotificacao: id } });
        res.status(200).json({ message: "Notificação deletada com sucesso" });
    } catch (error) {
        console.error("Erro ao deletar notificação:", error);
        res.status(500).json({ error: "Erro ao deletar notificação" });
    }
});

// ─── ADMIN ENTERPRISE ────────────────────────────

// 1. Categorias
app.get("/api/categorias", verificarToken, async (req: Request, res: Response) => {
    try {
        const categorias = await prisma.categoria.findMany();
        res.status(200).json(categorias);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar categorias" });
    }
});

app.post("/api/categorias", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const { nome } = req.body;
        const categoria = await prisma.categoria.create({ data: { nome } });
        res.status(201).json(categoria);
    } catch (error) {
        res.status(500).json({ error: "Erro ao criar categoria" });
    }
});

app.delete("/api/categorias/:id", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        await prisma.categoria.delete({ where: { idCategoria: id } });
        res.status(200).json({ message: "Categoria deletada" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao deletar categoria" });
    }
});

// 2. Macros
app.get("/api/macros", verificarToken, apenasAgente, async (req: Request, res: Response) => {
    try {
        const macros = await prisma.macro.findMany();
        res.status(200).json(macros);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar macros" });
    }
});

app.post("/api/macros", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const { titulo, texto } = req.body;
        const macro = await prisma.macro.create({ data: { titulo, texto } });
        res.status(201).json(macro);
    } catch (error) {
        res.status(500).json({ error: "Erro ao criar macro" });
    }
});

app.delete("/api/macros/:id", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        await prisma.macro.delete({ where: { idMacro: id } });
        res.status(200).json({ message: "Macro deletada" });
    } catch (error) {
        res.status(500).json({ error: "Erro ao deletar macro" });
    }
});

// 3. Auditoria
app.get("/api/logs", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const logs = await prisma.logAuditoria.findMany({
            include: { usuario: { select: { nome: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar logs" });
    }
});

// 4. Analytics / Indicadores
app.get("/api/analytics", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const [totalChamados, abertos, concluidos, cancelados, porPrioridade] = await Promise.all([
            prisma.chamado.count(),
            prisma.chamado.count({ where: { status: { notIn: ['concluido', 'cancelado'] } } }),
            prisma.chamado.count({ where: { status: 'concluido' } }),
            prisma.chamado.count({ where: { status: 'cancelado' } }),
            prisma.chamado.groupBy({ by: ['prioridade'], _count: { prioridade: true } })
        ]);

        // CSAT: Média das avaliações dos chamados que foram avaliados
        const avaliacoesResult = await prisma.chamado.aggregate({
            _avg: { avaliacao: true },
            _count: { avaliacao: true },
            where: { avaliacao: { not: null } }
        });
        const mediaCsat = avaliacoesResult._avg.avaliacao 
            ? Math.round(avaliacoesResult._avg.avaliacao * 10) / 10 
            : null;
        const totalAvaliados = avaliacoesResult._count.avaliacao;

        // SLA: Tempo médio de resolução em horas (chamados concluídos com dataFechamento)
        const chamadosConcluidos = await prisma.chamado.findMany({
            where: { status: 'concluido', dataFechamento: { not: null } },
            select: { createdAt: true, dataFechamento: true }
        });

        let tempoMedioResolucaoHoras: number | null = null;
        if (chamadosConcluidos.length > 0) {
            const totalMs = chamadosConcluidos.reduce((acc, c) => {
                const diff = new Date(c.dataFechamento!).getTime() - new Date(c.createdAt).getTime();
                return acc + diff;
            }, 0);
            const mediaMs = totalMs / chamadosConcluidos.length;
            tempoMedioResolucaoHoras = Math.round((mediaMs / (1000 * 60 * 60)) * 10) / 10;
        }

        res.status(200).json({ 
            totalChamados, abertos, concluidos, cancelados, porPrioridade,
            mediaCsat, totalAvaliados,
            tempoMedioResolucaoHoras, totalConcluidosComSLA: chamadosConcluidos.length
        });
    } catch (error) {
        res.status(500).json({ error: "Erro ao gerar analytics" });
    }
});

// 5. Triagem e Atribuição
app.patch("/api/chamados/:id/atribuir", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        const { idAgente } = req.body;
        const usuarioLogado = getUsuarioLogado(req);

        const chamadoAtualizado = await prisma.chamado.update({
            where: { idChamado: id },
            data: { idAgente }
        });

        // Registrar auditoria
        await prisma.logAuditoria.create({
            data: {
                idUsuario: usuarioLogado.idUsuario,
                acao: 'ATRIBUICAO_CHAMADO',
                detalhe: `Chamado ${id} atribuido ao agente ${idAgente}`
            }
        });

        res.status(200).json(chamadoAtualizado);
    } catch (error) {
        res.status(500).json({ error: "Erro ao atribuir chamado" });
    }
});
// ─── UPLOAD DE ARQUIVOS ────────────────────────────────────
app.post('/api/upload', verificarToken, upload.single('arquivo'), (req: Request, res: Response) => {
    if (!req.file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado.' });
        return;
    }
    const url = `/uploads/${req.file.filename}`;
    res.status(200).json({ url, mimeType: req.file.mimetype, nome: req.file.originalname });
});

// ─── AVALIAÇÃO (CSAT) ─────────────────────────────────────
app.patch('/api/chamados/:id/avaliar', verificarToken, async (req: Request, res: Response) => {
    try {
        const id = parseIdParam(req, res);
        if (id === null) return;
        const { avaliacao } = req.body;
        const usuario = getUsuarioLogado(req);

        if (!avaliacao || avaliacao < 1 || avaliacao > 5) {
            res.status(400).json({ error: 'Avaliação deve ser entre 1 e 5.' });
            return;
        }

        const chamado = await prisma.chamado.findUnique({ where: { idChamado: id } });
        if (!chamado || chamado.idCliente !== usuario.idUsuario) {
            res.status(403).json({ error: 'Acesso negado.' });
            return;
        }

        const chamadoAtualizado = await prisma.chamado.update({
            where: { idChamado: id },
            data: { avaliacao }
        });
        res.status(200).json(chamadoAtualizado);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao registrar avaliação.' });
    }
});


//porta aberta no pc
const PORTA = 3000;
//fazer o backend rodar na minha porta 3000 e deixar rodando.
server.listen(PORTA, () => {
    console.log(`Esta tudo rodando bem. na porta http://localhost:${PORTA}`);
});
