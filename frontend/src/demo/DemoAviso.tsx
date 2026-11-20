import { restaurarDemo } from './apiDemo';

// Faixa discreta avisando que é uma demonstração com dados fictícios.
export default function DemoAviso() {
  const restaurar = () => {
    restaurarDemo();
    localStorage.removeItem('@HelpDesk:token');
    localStorage.removeItem('@HelpDesk:user');
    window.location.hash = '#/';
    window.location.reload();
  };
  return (
    <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
      background: '#111827', color: '#f9fafb', borderRadius: 999, padding: '8px 16px', fontSize: 13,
      display: 'flex', gap: 12, alignItems: 'center', boxShadow: '0 4px 16px rgba(0,0,0,.2)', whiteSpace: 'nowrap' }}>
      <span>Demonstração com dados fictícios, salvos só no seu navegador.</span>
      <button onClick={restaurar} style={{ background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer', fontWeight: 600, padding: 0, fontSize: 13 }}>
        Restaurar dados
      </button>
    </div>
  );
}
