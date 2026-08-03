import { Router } from 'express';
import { TicketController } from '../controllers/TicketController';
import { InventarioController } from '../controllers/InventarioController';

const router = Router();
const ticketController = new TicketController();
const inventarioController = new InventarioController();

// === ROTAS DE TICKETS ===
router.post('/tickets', ticketController.criar);
router.get('/tickets/kanban', ticketController.listarKanban);
router.put('/tickets/:id/status', ticketController.alterarStatus);

// === ROTAS DE INVENTÁRIO (CMDB) ===
router.post('/empresas', inventarioController.criarEmpresa);
router.get('/empresas', inventarioController.listarEmpresas);
router.post('/dispositivos', inventarioController.criarDispositivo);
router.get('/empresas/:empresaId/dispositivos', inventarioController.listarDispositivosPorEmpresa);

export default router;