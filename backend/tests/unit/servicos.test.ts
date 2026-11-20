import { describe, expect, it } from 'vitest';
import { podeAcessarChamado } from '../../src/routes/chamados.routes.js';
import { arredondarCsat, calcularTempoMedioResolucaoHoras } from '../../src/services/metricas.js';
import { gerarProtocolo, protocoloTemporario } from '../../src/services/protocolo.js';

describe('gerarProtocolo (RN-07)', () => {
    it('usa o formato HD-YYYY-NNNNN com zeros à esquerda', () => {
        expect(gerarProtocolo(7, new Date('2026-03-01'))).toBe('HD-2026-00007');
        expect(gerarProtocolo(12345, new Date('2026-03-01'))).toBe('HD-2026-12345');
    });

    it('protocolos temporários não se repetem', () => {
        const gerados = new Set(Array.from({ length: 500 }, protocoloTemporario));
        expect(gerados.size).toBe(500);
    });
});

describe('métricas de SLA e CSAT', () => {
    it('calcula o tempo médio de resolução em horas', () => {
        const base = new Date('2026-01-01T00:00:00Z');
        const horas = (h: number) => new Date(base.getTime() + h * 3_600_000);
        expect(
            calcularTempoMedioResolucaoHoras([
                { createdAt: base, dataFechamento: horas(2) },
                { createdAt: base, dataFechamento: horas(5) },
            ]),
        ).toBe(3.5);
    });

    it('ignora chamados sem data de fechamento e retorna null sem dados', () => {
        expect(calcularTempoMedioResolucaoHoras([])).toBeNull();
        expect(calcularTempoMedioResolucaoHoras([{ createdAt: new Date(), dataFechamento: null }])).toBeNull();
    });

    it('arredonda o CSAT para uma casa decimal', () => {
        expect(arredondarCsat(4.666)).toBe(4.7);
        expect(arredondarCsat(null)).toBeNull();
    });
});

describe('podeAcessarChamado (RN-09)', () => {
    it('cliente só acessa o próprio chamado', () => {
        expect(podeAcessarChamado({ idUsuario: 3, nivelAcesso: 'cliente' }, { idCliente: 3 })).toBe(true);
        expect(podeAcessarChamado({ idUsuario: 4, nivelAcesso: 'cliente' }, { idCliente: 3 })).toBe(false);
    });

    it('agente e admin acessam qualquer chamado', () => {
        expect(podeAcessarChamado({ idUsuario: 2, nivelAcesso: 'agente' }, { idCliente: 3 })).toBe(true);
        expect(podeAcessarChamado({ idUsuario: 1, nivelAcesso: 'admin' }, { idCliente: 3 })).toBe(true);
    });
});
