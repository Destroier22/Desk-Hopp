import type { KanbanData, Ticket } from '../types';

export const listarTicketsKanban = (kanban: KanbanData) => [
  ...kanban.aFazer,
  ...kanban.atendendo,
  ...kanban.pausados,
  ...kanban.concluidosDoDia,
];

export const filtrarUltimosDias = (tickets: Ticket[], dias = 30) => {
  const limite = new Date();
  limite.setDate(limite.getDate() - dias);
  return tickets.filter((ticket) => new Date(ticket.criadoEm) >= limite);
};

export const contarPorCampo = <T extends string>(
  tickets: Ticket[],
  obterChave: (ticket: Ticket) => T | undefined | null,
) => {
  const contagem = new Map<string, number>();
  tickets.forEach((ticket) => {
    const chave = obterChave(ticket) || 'Nao informado';
    contagem.set(chave, (contagem.get(chave) || 0) + 1);
  });

  return Array.from(contagem.entries())
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total);
};

export const criarFluxoTemporal = (tickets: Ticket[], dias = 30) => {
  const hoje = new Date();
  const pontos = Array.from({ length: dias }, (_, index) => {
    const data = new Date(hoje);
    data.setDate(hoje.getDate() - (dias - 1 - index));
    const chave = data.toISOString().slice(0, 10);
    return {
      chave,
      label: data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      total: 0,
    };
  });

  const indicePorData = new Map(pontos.map((ponto, index) => [ponto.chave, index]));
  tickets.forEach((ticket) => {
    const chave = new Date(ticket.criadoEm).toISOString().slice(0, 10);
    const index = indicePorData.get(chave);
    if (index !== undefined) pontos[index].total += 1;
  });

  return pontos;
};
