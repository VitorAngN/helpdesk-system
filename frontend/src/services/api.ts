import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`, // Rota do nosso backend Express
  timeout: 10000,
});

// Interceptador para adicionar o Token JWT em todas as requisições que faremos
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@HelpDesk:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Monta o crachá igual fazíamos no Postman
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
