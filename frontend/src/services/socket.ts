import { io, type Socket } from 'socket.io-client';
import { API_URL, DEMO } from '../demo/config';
import { socketDemo } from '../demo/socketDemo';

// Instância global do socket. O JWT é enviado no handshake: o backend só aceita
// conexões autenticadas e coloca cada usuário na sua própria sala de notificações.
// Na demo do GitHub Pages, um emissor local faz o papel do servidor.
const socket: Socket = DEMO
  ? (socketDemo as unknown as Socket)
  : io(API_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: (cb) => cb({ token: localStorage.getItem('@HelpDesk:token') }),
    });

export const conectarSocket = () => {
  if (localStorage.getItem('@HelpDesk:token') && !socket.connected) socket.connect();
};

export const desconectarSocket = () => {
  socket.disconnect();
};

export default socket;
