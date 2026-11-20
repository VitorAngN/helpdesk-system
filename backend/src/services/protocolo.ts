/**
 * RN-07: protocolo no formato HD-YYYY-NNNNN.
 *
 * O número vem do ID auto-incremento do chamado (único por definição), em vez de
 * `count() + 1`, que gerava protocolos duplicados quando dois chamados eram
 * abertos ao mesmo tempo.
 */
export const gerarProtocolo = (idChamado: number, data: Date = new Date()): string =>
    `HD-${data.getFullYear()}-${String(idChamado).padStart(5, '0')}`;

/** Valor provisório e único usado entre o INSERT e o UPDATE do protocolo definitivo. */
export const protocoloTemporario = (): string =>
    `TMP-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
