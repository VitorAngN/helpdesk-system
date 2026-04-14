import './StatusBadge.css';

export type StatusType = 'Aberto' | 'Em atendimento' | 'Concluído' | 'Ativa' | 'Inativa';

interface StatusBadgeProps {
  status: StatusType;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  // Converte a string do status para uma classe CSS sem espaços/acentos
  // Ex: "Em atendimento" -> "em-atendimento"
  const statusClass = status
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-');

  return (
    <span className={`status-badge status-${statusClass}`}>
      {status}
    </span>
  );
}
