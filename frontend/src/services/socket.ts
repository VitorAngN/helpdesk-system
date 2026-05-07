import { io } from 'socket.io-client';

const getBackendUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl;
  }
  return `http://${window.location.hostname}:3000`;
};

const API_URL = getBackendUrl();

// Instância global do socket, conectada ao backend
const socket = io(API_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

export default socket;
