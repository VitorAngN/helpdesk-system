import { io } from 'socket.io-client';

const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }
  return `http://${window.location.hostname}:3000`;
};

const API_URL = getBackendUrl();

// Instância global do socket. O JWT é enviado no handshake: o backend só aceita
// conexões autenticadas e coloca cada usuário na sua própria sala de notificações.
const socket = io(API_URL, {
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
