// Substitui o Socket.io no modo demonstração: um emissor de eventos local.
type Handler = (...args: unknown[]) => void;
const handlers = new Map<string, Set<Handler>>();

export const socketDemo = {
  connected: false,
  connect() { this.connected = true; return this; },
  disconnect() { this.connected = false; return this; },
  on(evento: string, fn: Handler) { if (!handlers.has(evento)) handlers.set(evento, new Set()); handlers.get(evento)!.add(fn); return this; },
  off(evento: string, fn?: Handler) { if (fn) handlers.get(evento)?.delete(fn); else handlers.delete(evento); return this; },
  emit() { return this; }, // entrar_sala etc. não precisam de nada aqui
};

export function dispararEvento(evento: string, dado: unknown) {
  handlers.get(evento)?.forEach((fn) => fn(dado));
}
