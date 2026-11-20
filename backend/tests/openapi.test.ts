import { describe, expect, it } from 'vitest';
import { gerarOpenApi, rotas } from '../src/openapi.js';
import { app } from './helpers.js';

type Camada = {
    route?: { path: string; methods: Record<string, boolean> };
    handle?: { stack?: Camada[] };
};

/** Lê as rotas registradas no Express (todas montadas em /api). */
const rotasDoExpress = (): string[] => {
    const encontradas: string[] = [];
    const pilha = (app as unknown as { router: { stack: Camada[] } }).router.stack;
    for (const camada of pilha) {
        if (camada.route) {
            for (const metodo of Object.keys(camada.route.methods)) {
                encontradas.push(`${metodo} ${camada.route.path.replace(/^\/api/, '')}`);
            }
        }
        for (const sub of camada.handle?.stack ?? []) {
            if (!sub.route) continue;
            for (const metodo of Object.keys(sub.route.methods)) encontradas.push(`${metodo} ${sub.route.path}`);
        }
    }
    return encontradas.sort();
};

describe('documentação OpenAPI', () => {
    it('documenta exatamente as rotas que existem na API', () => {
        const documentadas = rotas.map((r) => `${r.metodo} ${r.caminho}`).sort();
        expect(documentadas).toEqual(rotasDoExpress());
    });

    it('gera um documento OpenAPI 3.1 com segurança JWT e schemas de entrada', () => {
        const doc = gerarOpenApi();
        expect(doc.openapi).toBe('3.1.0');
        const login = doc.paths['/auth/login']?.post as { requestBody: { content: Record<string, { schema: { required: string[] } }> } };
        expect(login.requestBody.content['application/json']?.schema.required).toEqual(['email', 'senha']);
        const chamado = doc.paths['/chamados/{id}']?.get as { security: unknown[]; parameters: { name: string }[] };
        expect(chamado.security).toEqual([{ bearerAuth: [] }]);
        expect(chamado.parameters[0]?.name).toBe('id');
    });
});
