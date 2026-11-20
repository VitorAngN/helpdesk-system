type ChamadoFechado = { createdAt: Date; dataFechamento: Date | null };

/** SLA: tempo médio de resolução em horas, com uma casa decimal. */
export const calcularTempoMedioResolucaoHoras = (chamados: ChamadoFechado[]): number | null => {
    const validos = chamados.filter((c): c is { createdAt: Date; dataFechamento: Date } => c.dataFechamento !== null);
    if (validos.length === 0) return null;

    const totalMs = validos.reduce(
        (acc, c) => acc + (new Date(c.dataFechamento).getTime() - new Date(c.createdAt).getTime()),
        0,
    );
    const mediaHoras = totalMs / validos.length / (1000 * 60 * 60);
    return Math.round(mediaHoras * 10) / 10;
};

/** CSAT: média das notas arredondada para uma casa decimal. */
export const arredondarCsat = (media: number | null): number | null =>
    media === null ? null : Math.round(media * 10) / 10;
