import axios from 'axios';
import { API_URL, DEMO } from '../demo/config';
import { adaptadorDemo } from '../demo/apiDemo';

const api = axios.create({
  baseURL: `${API_URL}/api`, // Rota do nosso backend Express
  timeout: 10000,
});

// Na demo do GitHub Pages as requisições são respondidas no próprio navegador.
if (DEMO) api.defaults.adapter = adaptadorDemo;

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
