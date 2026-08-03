import { Request, Response } from 'express';
import { InventarioService } from '../services/InventarioService';

const inventarioService = new InventarioService();

export class InventarioController {
  
  async criarEmpresa(req: Request, res: Response) {
    try {
      const { nome } = req.body;
      if (!nome) {
        return res.status(400).json({ erro: "O nome da empresa é obrigatório" });
      }
      const empresa = await inventarioService.criarEmpresa(nome);
      return res.status(201).json(empresa);
    } catch (error) {
      return res.status(400).json({ erro: "Erro ao criar empresa (talvez o nome já exista)" });
    }
  }

  async listarEmpresas(req: Request, res: Response) {
    try {
      const empresas = await inventarioService.listarEmpresas();
      return res.json(empresas);
    } catch (error) {
      return res.status(500).json({ erro: "Erro ao listar empresas" });
    }
  }

  async criarDispositivo(req: Request, res: Response) {
    try {
      const { nome, tipo, empresaId } = req.body;
      if (!nome || !tipo || !empresaId) {
        return res.status(400).json({ erro: "Nome, tipo e empresaId são obrigatórios" });
      }
      const dispositivo = await inventarioService.criarDispositivo({ nome, tipo, empresaId });
      return res.status(201).json(dispositivo);
    } catch (error) {
      return res.status(400).json({ erro: "Erro ao cadastrar dispositivo" });
    }
  }

  async listarDispositivosPorEmpresa(req: Request, res: Response) {
    try {
      const { empresaId } = req.params;
      const dispositivos = await inventarioService.listarDispositivosPorEmpresa(empresaId);
      return res.json(dispositivos);
    } catch (error) {
      return res.status(500).json({ erro: "Erro ao buscar dispositivos da empresa" });
    }
  }
}