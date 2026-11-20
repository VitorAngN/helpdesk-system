import bcrypt from 'bcrypt';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { gerarToken } from '../middlewares/auth.js';
import { loginSchema } from '../schemas.js';
import type { Deps } from '../types.js';

// Hash fixo usado quando o e-mail não existe, para o tempo de resposta não
// revelar se a conta existe (evita enumeração de usuários).
const HASH_FALSO = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.Qy6hU4x5DFjRZ7kDH7e6Gq4o1hGa';

export const authRoutes = ({ prisma }: Deps): Router => {
    const router = Router();

    const limiteLogin = rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 20,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        message: { error: 'Muitas tentativas de login. Tente novamente em alguns minutos.' },
    });

    // POST /api/auth/login (RN-01, RN-03)
    router.post('/auth/login', limiteLogin, async (req, res) => {
        const { email, senha } = loginSchema.parse(req.body);
        const usuario = await prisma.usuario.findUnique({ where: { email } });

        const senhaCorreta = await bcrypt.compare(senha, usuario?.senha ?? HASH_FALSO);
        if (!usuario || !senhaCorreta) {
            res.status(401).json({ error: 'E-mail ou senha incorretos.' });
            return;
        }

        const token = gerarToken({ idUsuario: usuario.idUsuario, nivelAcesso: usuario.nivelAcesso });
        const { senha: _senha, ...usuarioSemSenha } = usuario;
        res.status(200).json({ mensagem: 'Login realizado com sucesso', token, usuario: usuarioSemSenha });
    });

    return router;
};
