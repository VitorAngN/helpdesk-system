// Modo demonstração: ativado no build do GitHub Pages (VITE_DEMO=true).
// Nele, a API e o Socket.io são simulados no próprio navegador.
export const DEMO = import.meta.env.VITE_DEMO === 'true';

const backendUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && !envUrl.includes('localhost')) return envUrl;
  return `http://${window.location.hostname}:3000`;
};
export const API_URL = backendUrl();

/** URL de um anexo: na demo já é um blob do navegador; na API real vem relativo ao backend. */
export const urlAnexo = (anexo: string) => (/^(blob:|https?:)/.test(anexo) ? anexo : `${API_URL}${anexo}`);
