import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * 1. ROTA AUXILIAR: Listar todas as empresas
 * Usada no campo "SOLICITANTE / EMPRESA" do Front-end
 */
router.get('/empresas', async (req, res) => {
  try {
    const empresas = await prisma.empresa.findMany({
      orderBy: { nome: 'asc' }
    });
    res.json(empresas);
  } catch (error) {
    console.error("Erro ao buscar empresas:", error);
    res.status(500).json({ erro: "Erro ao buscar empresas" });
  }
});

/**
 * 2. ROTA AUXILIAR: Listar dispositivos de uma empresa específica
 * Filtra as máquinas com base na empresa selecionada
 */
router.get('/empresas/:empresaId/dispositivos', async (req, res) => {
  try {
    const { empresaId } = req.params;
    const dispositivos = await prisma.dispositivo.findMany({
      where: { empresaId: empresaId },
      orderBy: { nome: 'asc' }
    });
    res.json(dispositivos);
  } catch (error) {
    console.error("Erro ao buscar dispositivos da empresa:", error);
    res.status(500).json({ erro: "Erro ao buscar dispositivos da empresa" });
  }
});

/**
 * 3. ROTA AUXILIAR: Listar todas as categorias de TI
 * Alimenta o seletor obrigatório de categorias
 */
router.get('/categorias', async (req, res) => {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { nome: 'asc' }
    });
    res.json(categorias);
  } catch (error) {
    console.error("Erro ao buscar categorias:", error);
    res.status(500).json({ erro: "Erro ao buscar categorias" });
  }
});

/**
 * 4. ROTA ESTRUTURAL: Buscar dados organizados para as colunas do Kanban
 * 📝 ATUALIZAÇÃO: Calcula o tempo "ao vivo" para chamados em andamento
 * durante o Refresh e traz o array de 'apontamentos' e a data de fechamento.
 */
router.get('/tickets/kanban', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        empresa: true,
        dispositivo: true,
        apontamentos: {
          orderBy: { criadoEm: 'asc' } // Histórico em ordem cronológica
        }
      },
    });

    const agora = new Date();

    // Mapeia os tickets injetando o cálculo de tempo em tempo real se o cronômetro estiver rodando
    const ticketsComTempoAtualizado = tickets.map(ticket => {
      let totalSegundosAtualizado = ticket.totalSegundos;

      // Se o ticket está em andamento agora, calcula a minutagem dinamicamente até este segundo
      if (ticket.status === 'ATENDENDO' && ticket.tempoIniciadoEm) {
        const diferencaMilissegundos = agora.getTime() - new Date(ticket.tempoIniciadoEm).getTime();
        const segundosRolaram = Math.floor(diferencaMilissegundos / 1000);
        
        // Acumula temporariamente para exibição na tela sem alterar o valor rígido do banco
        totalSegundosAtualizado += segundosRolaram;
      }

      return {
        ...ticket,
        totalSegundos: totalSegundosAtualizado
      };
    });

    // Separa os tickets nas colunas correspondentes com base no status do fluxo
    const kanbanData = {
      aFazer: ticketsComTempoAtualizado.filter(t => t.status === 'A_FAZER'),
      atendendo: ticketsComTempoAtualizado.filter(t => t.status === 'ATENDENDO'),
      pausados: ticketsComTempoAtualizado.filter(t => t.status === 'PAUSADOS'),
      concluidosDoDia: ticketsComTempoAtualizado.filter(t => t.status === 'CONCLUIDO'),
    };

    res.json(kanbanData);
  } catch (error) {
    console.error("Erro ao gerar estrutura do Kanban:", error);
    res.status(500).json({ erro: "Erro ao buscar dados do Kanban" });
  }
});

/**
 * 5. ROTA DE CRIAÇÃO: Cadastrar um novo Ticket no sistema
 */
router.post('/tickets', async (req, res) => {
  try {
    const { assunto, descricao, empresaId, dispositivoId, categoriaId } = req.body;

    // 🔒 TRAVA DE SEGURANÇA: Exige obrigatoriamente assunto, empresaId e categoriaId
    if (!assunto || !empresaId || !categoriaId) {
      return res.status(400).json({ erro: "Os campos assunto, empresaId e categoriaId são obrigatórios." });
    }

    // Geração automática do número do ticket com 5 dígitos (Padrão Milvus)
    const numeroTicket = Math.floor(10000 + Math.random() * 90000);

    const novoTicket = await prisma.ticket.create({
      data: {
        numero: numeroTicket,
        assunto,
        descricao: descricao || "",
        status: 'A_FAZER', // Todo chamado entra na triagem inicial
        empresaId,
        dispositivoId: dispositivoId || null,
      },
      include: {
        empresa: true,
        dispositivo: true,
        apontamentos: true
      }
    });

    res.status(201).json(novoTicket);
  } catch (error) {
    console.error("Erro ao criar ticket no banco:", error);
    res.status(500).json({ erro: "Erro ao cadastrar novo ticket" });
  }
});

/**
 * 6. ROTA DE TRANSIÇÃO DE STATUS, CRONÔMETRO E HISTÓRICO DE APONTAMENTO
 * PATCH /tickets/:id/status
 * 📝 ATUALIZAÇÃO: Gerencia o play, pause, acúmulo de tempo e grava a data finalizadoEm.
 */
router.patch('/tickets/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { novoStatus, texto } = req.body; // 'texto' é a justificativa do técnico

    // 1. Valida se o status pertence ao fluxo permitido
    const statusValidos = ['A_FAZER', 'ATENDENDO', 'PAUSADOS', 'CONCLUIDO'];
    if (!statusValidos.includes(novoStatus)) {
      return res.status(400).json({ erro: "Status inválido fornecido." });
    }

    // 2. Busca o estado atual do ticket diretamente do banco
    const ticketAtual = await prisma.ticket.findUnique({
      where: { id }
    });

    if (!ticketAtual) {
      return res.status(404).json({ erro: "Ticket não encontrado." });
    }

    // Trava de segurança: Exige texto explicativo ao pausar ou concluir
    if ((novoStatus === 'PAUSADOS' || novoStatus === 'CONCLUIDO') && ticketAtual.status === 'ATENDENDO' && !texto) {
      return res.status(400).json({ erro: "É obrigatório inserir um apontamento com o que foi feito antes de pausar ou concluir." });
    }

    const agora = new Date();
    let tempoIniciadoEm = ticketAtual.tempoIniciadoEm;
    let totalSegundos = ticketAtual.totalSegundos;
    let segundosDestaSessao = 0;
    let finalizadoEm = ticketAtual.finalizadoEm; 

    // 3. ENGENHARIA DO CRONÔMETRO E MARCAÇÃO DE DATAS
    
    // Cenário A: Técnico deu "Play" ou retomou o chamado -> Dá o Play
    if (novoStatus === 'ATENDENDO') {
      tempoIniciadoEm = agora;
      finalizadoEm = null; // Se reabriu ou retomou, limpa a data de fechamento antiga
    } 
    // Cenário B: Estava trabalhando ("ATENDENDO") e clicou em Pausar ou Concluir -> Dá o Pause/Stop
    else if (ticketAtual.status === 'ATENDENDO' && (novoStatus === 'PAUSADOS' || novoStatus === 'CONCLUIDO')) {
      if (ticketAtual.tempoIniciadoEm) {
        const diferencaMilissegundos = agora.getTime() - new Date(ticketAtual.tempoIniciadoEm).getTime();
        segundosDestaSessao = Math.floor(diferencaMilissegundos / 1000);
        
        // Acumula os segundos trabalhados nesta rodada ao histórico total do ticket
        totalSegundos += segundosDestaSessao;
      }
      tempoIniciadoEm = null; // Para o relógio

      // Se moveu para concluído, crava o carimbo de data/hora atual
      if (novoStatus === 'CONCLUIDO') {
        finalizadoEm = agora;
      }
    }
    // Cenário C: Caso o ticket retorne para a triagem inicial ('A_FAZER')
    else if (novoStatus === 'A_FAZER') {
      tempoIniciadoEm = null;
      finalizadoEm = null; // Remove a marcação de encerramento
    }

    // 4. TRANSAÇÃO ATÔMICA NO BANCO (Atualiza Ticket + Cria Apontamento juntos)
    const [ticketAtualizado] = await prisma.$transaction([
      prisma.ticket.update({
        where: { id },
        data: {
          status: novoStatus,
          tempoIniciadoEm,
          totalSegundos,
          finalizadoEm
        },
        include: {
          empresa: true,
          dispositivo: true,
          apontamentos: true
        }
      }),
      
      // Se gerou tempo ou se tem texto de pausa/conclusão, cria o registro na Timeline
      ...(segundosDestaSessao > 0 || (texto && (novoStatus === 'PAUSADOS' || novoStatus === 'CONCLUIDO')) ? [
        prisma.apontamento.create({
          data: {
            texto: texto || "Pausa/Conclusão efetuada.",
            segundosSessao: segundosDestaSessao,
            ticketId: id
          }
        })
      ] : [])
    ]);

    res.json(ticketAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar status, tempo e apontamento do ticket:", error);
    res.status(500).json({ erro: "Erro interno ao processar a transição com histórico." });
  }
});

export default router;