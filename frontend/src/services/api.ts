import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Rota do nosso backend Express
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
