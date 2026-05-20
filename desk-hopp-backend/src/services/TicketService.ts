import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TicketService {
  
  // 1. Criar um novo Ticket (Simulando a "Abertura de Ticket" do Milvus)
  async criarTicket(dados: { clienteNome: string; assunto: string; dispositivo?: string; descricao?: string }) {
    // Vamos gerar um número sequencial simples para o ticket
    const totalTickets = await prisma.ticket.count();
    const proximoNumero = 11241 + totalTickets; // Começando do padrão das suas imagens

    return await prisma.ticket.create({
      data: {
        numero: proximoNumero,
        clienteNome: dados.clienteNome,
        assunto: dados.assunto,
        dispositivo: dados.dispositivo,
        descricao: dados.descricao,
        status: "A_FAZER" // Todo ticket nasce no "A Fazer"
      }
    });
  }

  // 2. Buscar os Tickets organizados para o Kanban
  async obterFluxoKanban() {
    // Pega o início do dia de hoje (00:00:00)
    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);

    const tickets = await prisma.ticket.findMany();

    // Filtra e agrupa os tickets exatamente como você planejou para as colunas
    return {
      aFazer: tickets.filter(t => t.status === "A_FAZER"),
      atendendo: tickets.filter(t => t.status === "ATENDENDO"),
      pausados: tickets.filter(t => t.status === "PAUSADOS"),
      concluidosDoDia: tickets.filter(t => 
        t.status === "CONCLUIDO" && t.dataConclusao && t.dataConclusao >= inicioDoDia
      )
    };
  }

  // 3. Atualizar o Status (Quando arrastar o card no Front-end)
  async atualizarStatus(id: string, novoStatus: string) {
    let dataConclusao: Date | null = null;

    if (novoStatus === "CONCLUIDO") {
      dataConclusao = new Date();
    }

    return await prisma.ticket.update({
      where: { id },
      data: {
        status: novoStatus,
        dataConclusao: dataConclusao
      }
    });
  }
}