import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from './generated/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
//Inicializar o express
const app = express();

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
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error("Secret não configurado");
        const payload = jwt.verify(token, secret);
        // Salva os dados do usuário (ID e Nível) na requisição
        (req as any).usuarioLogado = payload;
        next();
    } catch (error) {
        res.status(401).json({ erro: "Crachá inválido ou expirado." });
    }
};

// 2. AUTORIZAÇÃO — verifica o nível de acesso depois de autenticado
const apenasAdmin = (req: Request, res: Response, next: NextFunction) => {
    const usuario = (req as any).usuarioLogado;
    if (usuario?.nivelAcesso !== 'admin') {
        res.status(403).json({ erro: "Acesso restrito ao administrador." });
        return;
    }
    next();
};

const apenasAgente = (req: Request, res: Response, next: NextFunction) => {
    const usuario = (req as any).usuarioLogado;
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
        const id = parseInt(req.params.id);
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
        const id = parseInt(req.params.id);
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
        const id = parseInt(req.params.id);
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
        const id = parseInt(req.params.id);
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
        const id = parseInt(req.params.id);
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
        const id = parseInt(req.params.id);
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
        const novoAgente = await prisma.agente.create({ data: { idUsuario, idEmpresa, cargo, disponivel } });
        res.status(201).json(novoAgente);
    } catch (error) {
        console.error("Erro ao criar agente:", error);
        res.status(500).json({ error: "Erro ao criar agente" });
    }
});
app.get("/api/agentes", verificarToken, apenasAgente, async (req: Request, res: Response) => {
    try {
        const agentes = await prisma.agente.findMany();
        res.status(200).json(agentes);
    } catch (error) {
        console.error("Erro ao buscar agentes:", error);
        res.status(500).json({ error: "Erro ao buscar agentes" });
    }
});
app.get("/api/agentes/:id", verificarToken, apenasAgente, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const agente = await prisma.agente.findUnique({ where: { idAgente: id } });
        if (!agente) {
            res.status(404).json({ error: "Agente não encontrado" });
            return;
        }
        res.status(200).json(agente);
    } catch (error) {
        console.error("Erro ao buscar agente:", error);
        res.status(500).json({ error: "Erro ao buscar agente" });
    }
});
app.put("/api/agentes/:id", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { idUsuario, idEmpresa, cargo, disponivel } = req.body;
        const agenteAtualizado = await prisma.agente.update({ where: { idAgente: id }, data: { idUsuario, idEmpresa, cargo, disponivel } });
        res.status(200).json(agenteAtualizado);
    } catch (error) {
        console.error("Erro ao atualizar agente:", error);
        res.status(500).json({ error: "Erro ao atualizar agente" });
    }
});
// PATCH - Agente atualiza a própria disponibilidade (RN-06)
app.patch("/api/agentes/:id/disponibilidade", verificarToken, apenasAgente, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { disponivel } = req.body;
        const agenteAtualizado = await prisma.agente.update({ where: { idAgente: id }, data: { disponivel } });
        res.status(200).json(agenteAtualizado);
    } catch (error) {
        console.error("Erro ao atualizar disponibilidade do agente:", error);
        res.status(500).json({ error: "Erro ao atualizar disponibilidade do agente" });
    }
});
app.delete("/api/agentes/:id", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
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
        res.status(201).json(novoChamado);
    } catch (error) {
        console.error("Erro ao criar chamado:", error);
        res.status(500).json({ error: "Erro ao criar chamado" });
    }
});
// RN-09: cliente só vê os próprios chamados; agente/admin vê todos
app.get("/api/chamados", verificarToken, async (req: Request, res: Response) => {
    try {
        const { idUsuario, nivelAcesso } = (req as any).usuarioLogado;
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
        const id = parseInt(req.params.id);
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
        const id = parseInt(req.params.id);
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
// PATCH - Só agente/admin muda o status do chamado (RN-04/RN-05)
app.patch("/api/chamados/:id/status", verificarToken, apenasAgente, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;
        const chamadoAtualizado = await prisma.chamado.update({ where: { idChamado: id }, data: { status } });
        res.status(200).json(chamadoAtualizado);
    } catch (error) {
        console.error("Erro ao atualizar status do chamado:", error);
        res.status(500).json({ error: "Erro ao atualizar status do chamado" });
    }
});
app.delete("/api/chamados/:id", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
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
        const idChamado = parseInt(req.params.id);
        const { idRemetente, mensagem, anexo, mimeTypeAnexo } = req.body;
        const novaMensagem = await prisma.chat_Mensagem.create({
            data: { idChamado, idRemetente, mensagem, anexo, mimeTypeAnexo }
        });
        res.status(201).json(novaMensagem);
    } catch (error) {
        console.error("Erro ao criar mensagem:", error);
        res.status(500).json({ error: "Erro ao criar mensagem" });
    }
});
app.get("/api/chamados/:id/mensagens", verificarToken, async (req: Request, res: Response) => {
    try {
        const idChamado = parseInt(req.params.id);
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
        const id = parseInt(req.params.id);
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
        const { idUsuario } = (req as any).usuarioLogado;
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
        const id = parseInt(req.params.id);
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
        const id = parseInt(req.params.id);
        const notificacaoAtualizada = await prisma.notificacao.update({ where: { idNotificacao: id }, data: { lida: true } });
        res.status(200).json(notificacaoAtualizada);
    } catch (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        res.status(500).json({ error: "Erro ao marcar notificação como lida" });
    }
});
app.delete("/api/notificacoes/:id", verificarToken, apenasAdmin, async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.notificacao.delete({ where: { idNotificacao: id } });
        res.status(200).json({ message: "Notificação deletada com sucesso" });
    } catch (error) {
        console.error("Erro ao deletar notificação:", error);
        res.status(500).json({ error: "Erro ao deletar notificação" });
    }
});


//porta aberta no pc
const PORTA = 3000;
//fazer o backend rodar na minha porta 3000 e deixar rodando.
app.listen(PORTA, () => {
    console.log(`Esta tudo rodando bem. na porta http://localhost:${PORTA}`);
});