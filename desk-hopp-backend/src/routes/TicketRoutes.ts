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
 * Bloqueia chamados com máquinas trocadas. Só ativa após escolher a empresa.
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
 * Usada para classificar o tipo de problema (Redes, Hardware, etc)
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
 */
router.get('/tickets/kanban', async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      include: {
        empresa: true,
        dispositivo: true,
      },
    });

    // Separa os tickets em suas respectivas colunas com base no status do banco
    const kanbanData = {
      aFazer: tickets.filter(t => t.status === 'A_FAZER'),
      atendendo: tickets.filter(t => t.status === 'ATENDENDO'),
      pausados: tickets.filter(t => t.status === 'PAUSADOS'),
      concluidosDoDia: tickets.filter(t => t.status === 'CONCLUIDO'),
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

    // Geração automática do número do ticket baseado no timestamp (Padrão Milvus/MSP)
    const numeroTicket = Math.floor(10000 + Math.random() * 90000);

    const novoTicket = await prisma.ticket.create({
      data: {
        numero: numeroTicket,
        assunto,
        descricao: descricao || "",
        status: 'A_FAZER', // Todo chamado novo entra por padrão na triagem
        empresaId,
        dispositivoId: dispositivoId || null,
        // Caso você vá usar a relação de categoriaId no schema do Ticket no futuro, 
        // ela pode ser mapeada aqui. Por hora, passamos os dados base estruturais.
      },
      include: {
        empresa: true,
        dispositivo: true
      }
    });

    res.status(201).json(novoTicket);
  } catch (error) {
    console.error("Erro ao criar ticket no banco:", error);
    res.status(500).json({ erro: "Erro ao cadastrar novo ticket" });
  }
});

export default router;