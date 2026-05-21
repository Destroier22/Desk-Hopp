import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Definindo a estrutura de dados que o Service espera receber para criar um Ticket
interface CriarTicketDTO {
  assunto: string;
  descricao?: string;
  empresaId: string;
  dispositivoId?: string;
}

export class TicketService {
  
  // 1. Criar um novo Ticket conectado à Empresa e ao Dispositivo por ID
  async criarTicket(dados: CriarTicketDTO) {
    // Gera o número sequencial simples para o chamado
    const totalTickets = await prisma.ticket.count();
    const proximoNumero = 11241 + totalTickets;

    return await prisma.ticket.create({
      data: {
        numero: proximoNumero,
        assunto: dados.assunto,
        descricao: dados.descricao,
        status: "A_FAZER",
        empresaId: dados.empresaId,
        dispositivoId: dados.dispositivoId || null
      },
      // Faz o Prisma retornar os dados da empresa e dispositivo juntos no resultado do cadastro
      include: {
        empresa: true,
        dispositivo: true
      }
    });
  }

  // 2. Buscar os Tickets organizados para o Kanban incluindo dados relacionais
  async obterFluxoKanban() {
    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);

    // Buscamos os tickets trazendo junto as informações da Empresa e do Dispositivo cadastrados neles
    const tickets = await prisma.ticket.findMany({
      include: {
        empresa: true,
        dispositivo: true
      }
    });

    return {
      aFazer: tickets.filter(t => t.status === "A_FAZER"),
      atendendo: tickets.filter(t => t.status === "ATENDENDO"),
      pausados: tickets.filter(t => t.status === "PAUSADOS"),
      concluidosDoDia: tickets.filter(t => 
        t.status === "CONCLUIDO" && t.dataConclusao && t.dataConclusao >= inicioDoDia
      )
    };
  }

  // 3. Atualizar o Status (Movimentação de colunas)
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