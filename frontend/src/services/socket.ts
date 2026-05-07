import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;

// Instância global do socket, conectada ao backend
const socket = io(API_URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
});

export default socket;
