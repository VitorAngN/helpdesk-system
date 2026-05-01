export class TicketUtils {
  
  /**
   * Converte o status do banco de dados para a label de exibição.
   */
  static getStatusLabel(status: string): string {
    if (!status) return 'Aberto';
    switch (status.toLowerCase()) {
      case 'em_atendimento':
        return 'Em atendimento';
      case 'aguardando_cliente':
        return 'Aguardando Cliente';
      case 'concluido':
        return 'Concluído';
      case 'cancelado':
        return 'Cancelado';
      default:
        return 'Aberto';
    }
  }

  /**
   * Formata a data e hora para exibição longa (ex: 25/04/2026, 14:13)
   */
  static formatDateTime(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  }

  /**
   * Formata apenas a hora (ex: 14:13)
   */
  static formatTime(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
}
