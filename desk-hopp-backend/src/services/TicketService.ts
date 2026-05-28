import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Interface ajustada para receber a categoriaId obrigatória no fluxo de criação
interface CriarTicketDTO {
  assunto: string;
  descricao?: string;
  empresaId: string;
  dispositivoId?: string;
  solicitante?: string;
  operador?: string;
  categoriaId: string; // ⚡ Adicionado de acordo com o novo schema
}

export class TicketService {
  
  /**
   * 1. Criar um novo Ticket conectado à Empresa, Categoria e Dispositivo por ID
   */
  async criarTicket(dados: CriarTicketDTO) {
    // Gera o número sequencial simples para o chamado
    const ultimoTicket = await prisma.ticket.findFirst({
      orderBy: { numero: 'desc' },
      select: { numero: true }
    });
    const proximoNumero = (ultimoTicket?.numero || 0) + 1;

    return await prisma.ticket.create({
      data: {
        numero: proximoNumero,
        assunto: dados.assunto,
        descricao: dados.descricao,
        status: "A_FAZER",
        empresaId: dados.empresaId,
        dispositivoId: dados.dispositivoId || null,
        solicitante: dados.solicitante || "Nao informado",
        operador: dados.operador || null,
        categoriaId: dados.categoriaId // ⚡ Gravando a categoria obrigatória
      },
      // Retorna os dados agregados para o solicitante
      include: {
        empresa: true,
        dispositivo: true,
        categoria: true
      }
    });
  }

  /**
   * 2. Buscar os Tickets organizados para o Kanban incluindo dados relacionais
   * Filtra os concluídos do dia com base no carimbo correto de 'finalizadoEm'.
   */
  async obterFluxoKanban() {
    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);

    // Buscamos os tickets trazendo junto as informações das tabelas vinculadas
    const tickets = await prisma.ticket.findMany({
      include: {
        empresa: true,
        dispositivo: true,
        categoria: true
      }
    });

    return {
      aFazer: tickets.filter(t => t.status === "A_FAZER"),
      atendendo: tickets.filter(t => t.status === "ATENDENDO"),
      pausados: tickets.filter(t => t.status === "PAUSADOS"),
      concluidosDoDia: tickets.filter(t => 
        // ⚡ Corrigido: Agora filtra comparando com a propriedade correta 'finalizadoEm'
        t.status === "CONCLUIDO" && t.finalizadoEm && new Date(t.finalizadoEm) >= inicioDoDia
      )
    };
  }

  /**
   * 3. Atualizar o Status (Movimentação de colunas simplificada)
   * ⚡ Linha 56 corrigida de 'dataConclusao' para 'finalizadoEm', casando perfeitamente com o Banco.
   */
  async atualizarStatus(id: string, novoStatus: string) {
    let finalizadoEm: Date | null = null; // ⚡ Ajustado o nome da variável

    if (novoStatus === "CONCLUIDO") {
      finalizadoEm = new Date();
    }

    return await prisma.ticket.update({
      where: { id },
      data: {
        status: novoStatus,
        finalizadoEm: finalizadoEm // ⚡ Linha 56 Corrigida de forma definitiva!
      }
    });
  }
}
