import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InventarioService {
  
  // Criar Empresa
  async criarEmpresa(nome: string) {
    return await prisma.empresa.create({ data: { nome } });
  }

  // Listar todas as empresas
  async listarEmpresas() {
    return await prisma.empresa.findMany({ orderBy: { nome: 'asc' } });
  }

  // Criar Dispositivo preso a uma Empresa
  async criarDispositivo(dados: { nome: string; tipo: string; empresaId: string }) {
    return await prisma.dispositivo.create({ data: dados });
  }

  // Listar dispositivos de UMA empresa específica
  async listarDispositivosPorEmpresa(empresaId: string) {
    return await prisma.dispositivo.findMany({
      where: { empresaId }
    });
  }
}