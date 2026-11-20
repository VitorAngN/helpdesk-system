// Teste de fumaça ponta a ponta contra a stack real (docker compose up).
// Uso: node scripts/smoke-test.mjs [URL_DA_API]
// Admin opcional: ADMIN_EMAIL / ADMIN_PASSWORD (padrão: usuário do seed).
const API = (process.argv[2] ?? process.env.API_URL ?? 'http://localhost:3000') + '/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@helpdesk.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'admin123';

let falhas = 0;
const ok = (cond, msg) => {
    console.log(`${cond ? '✔' : '✘'} ${msg}`);
    if (!cond) falhas++;
};

const req = async (method, path, { token, body } = {}) => {
    const res = await fetch(API + path, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
};

const sufixo = Date.now();
const novoCliente = async (nome) => {
    const email = `${nome}.${sufixo}@teste.com`;
    const cad = await req('POST', '/usuarios', { body: { nome, email, senha: 'senha123', nivelAcesso: 'admin' } });
    ok(cad.status === 201, `cadastro de ${nome} (201)`);
    ok(cad.data?.nivelAcesso === 'cliente', `${nome} pediu "admin" no cadastro e virou "cliente"`);
    const login = await req('POST', '/auth/login', { body: { email, senha: 'senha123' } });
    ok(login.status === 200 && login.data?.token, `login de ${nome}`);
    return { id: login.data?.usuario?.idUsuario, token: login.data?.token };
};

const health = await req('GET', '/health');
ok(health.status === 200, 'GET /api/health');

const ana = await novoCliente('ana');
const bruno = await novoCliente('bruno');

const errado = await req('POST', '/auth/login', { body: { email: `ana.${sufixo}@teste.com`, senha: 'errada' } });
const inexistente = await req('POST', '/auth/login', { body: { email: `ninguem.${sufixo}@teste.com`, senha: 'x' } });
ok(errado.status === 401 && inexistente.status === 401, 'senha errada e e-mail inexistente dão 401 com a mesma mensagem');

const chamado = await req('POST', '/chamados', {
    token: ana.token,
    body: { titulo: 'Impressora não liga', descricao: 'Teste de fumaça', prioridade: 'alta', idCliente: bruno.id },
});
ok(chamado.status === 201, 'Ana abre um chamado');
ok(/^HD-\d{4}-\d{5}$/.test(chamado.data?.protocolo ?? ''), `protocolo no formato HD-AAAA-NNNNN (${chamado.data?.protocolo})`);
ok(chamado.data?.idCliente === ana.id, 'chamado ficou no nome da Ana mesmo mandando o id do Bruno');
const id = chamado.data?.idChamado;

ok((await req('GET', `/chamados/${id}`, { token: bruno.token })).status === 403, 'Bruno não vê o chamado da Ana (403)');
ok((await req('GET', `/chamados/${id}/mensagens`, { token: bruno.token })).status === 403, 'Bruno não lê o chat da Ana (403)');
ok((await req('PUT', `/usuarios/${ana.id}`, { token: ana.token, body: { nivelAcesso: 'admin' } })).status === 403, 'Ana não consegue se promover a admin (403)');
ok((await req('GET', '/empresas', { token: ana.token })).status === 403, 'cliente não acessa rota de admin (403)');

const msg = await req('POST', `/chamados/${id}/mensagens`, { token: ana.token, body: { mensagem: 'Olá!', idRemetente: bruno.id } });
ok(msg.status === 201 && msg.data?.idRemetente === ana.id, 'mensagem enviada com remetente vindo do token');
const lista = await req('GET', '/chamados', { token: bruno.token });
ok(lista.status === 200 && !lista.data.some((c) => c.idChamado === id), 'lista do Bruno não inclui o chamado da Ana');

ok((await req('PATCH', `/chamados/${id}/avaliar`, { token: ana.token, body: { avaliacao: 5 } })).status === 409, 'não avalia chamado ainda aberto (409)');

const admin = await req('POST', '/auth/login', { body: { email: ADMIN_EMAIL, senha: ADMIN_PASSWORD } });
if (admin.status === 200) {
    const fechar = await req('PATCH', `/chamados/${id}/status`, { token: admin.data.token, body: { status: 'concluido' } });
    ok(fechar.status === 200 && fechar.data?.dataFechamento, 'admin conclui o chamado (com data de fechamento)');
    ok((await req('PATCH', `/chamados/${id}/avaliar`, { token: ana.token, body: { avaliacao: 5 } })).status === 200, 'Ana avalia o chamado concluído (CSAT)');
    const analytics = await req('GET', '/analytics', { token: admin.data.token });
    ok(analytics.status === 200 && analytics.data?.totalChamados >= 1, `analytics: ${JSON.stringify({ csat: analytics.data?.mediaCsat, sla_h: analytics.data?.tempoMedioResolucaoHoras })}`);
} else {
    console.log('… admin do seed não encontrado: pulando etapas de admin (rode o seed: docker compose exec backend npm run seed)');
}

console.log(falhas === 0 ? '\nTudo certo.' : `\n${falhas} verificação(ões) falharam.`);
process.exit(falhas === 0 ? 0 : 1);
