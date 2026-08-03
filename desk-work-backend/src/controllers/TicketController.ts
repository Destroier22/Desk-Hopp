import { Request, Response } from 'express';
import { TicketService } from '../services/TicketService';

const ticketService = new TicketService();

export class TicketController {
  
  async criar(req: Request, res: Response) {
    try {
      const ticket = await ticketService.criarTicket(req.body);
      return res.status(201).json(ticket);
    } catch (error) {
      return res.status(400).json({ erro: "Erro ao criar ticket" });
    }
  }

  async listarKanban(req: Request, res: Response) {
    try {
      const resultado = await ticketService.obterFluxoKanban();
      return res.json(resultado);
    } catch (error) {
      return res.status(500).json({ erro: "Erro ao buscar o Kanban" });
    }
  }

  async alterarStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const ticketAtualizado = await ticketService.atualizarStatus(id, status);
      return res.json(ticketAtualizado);
    } catch (error) {
      return res.status(400).json({ erro: "Erro ao atualizar status" });
    }
  }
}