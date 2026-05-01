import { io } from 'socket.io-client';

// Instância global do socket, conectada ao backend
const socket = io('http://localhost:3000', {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

export default socket;
