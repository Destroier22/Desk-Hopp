const { PrismaClient } = require('@prisma/client');
const { randomBytes, scryptSync } = require('crypto');

const prisma = new PrismaClient();

function gerarSenhaHash(senha) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const usuarios = [
  ['Ana Beatriz Lima', 'ana.lima@deskwork.local', 'Administrador'],
  ['Bruno Carvalho', 'bruno.carvalho@deskwork.local', 'Suporte'],
  ['Camila Rocha', 'camila.rocha@deskwork.local', 'Suporte'],
  ['Daniel Martins', 'daniel.martins@deskwork.local', 'Financeiro'],
  ['Eduarda Nunes', 'eduarda.nunes@deskwork.local', 'Gestor Suporte'],
  ['Felipe Andrade', 'felipe.andrade@deskwork.local', 'Gestor Financeiro'],
  ['Gabriela Santos', 'gabriela.santos@deskwork.local', 'Suporte'],
  ['Henrique Costa', 'henrique.costa@deskwork.local', 'Financeiro'],
];

const empresas = [
  'Alfa Comercio Digital',
  'Beta Logistica',
  'Clínica Vida Plena',
  'Delta Contabilidade',
  'Omega Engenharia',
];

const categorias = [
  'Acesso',
  'Hardware',
  'Sistemas',
  'Financeiro',
  'Rede e Internet',
  'Impressoras',
];

const dispositivosPorEmpresa = [
  ['NOTEBOOK-ADM-01', 'Notebook'],
  ['DESKTOP-FIN-02', 'Desktop'],
  ['IMPRESSORA-RECEPCAO', 'Impressora'],
  ['ROTEADOR-MATRIZ', 'Rede'],
  ['SERVIDOR-ARQUIVOS', 'Servidor'],
];

const tickets = [
  ['Falha ao acessar o sistema financeiro', 'Usuário informa erro de credenciais ao acessar o painel financeiro.', 'Alfa Comercio Digital', 'Acesso', 'NOTEBOOK-ADM-01', 'Juliana Santos', 'Bruno Carvalho', 'A_FAZER', 0],
  ['Computador reiniciando sozinho', 'Equipamento reinicia durante uso de planilhas pesadas.', 'Beta Logistica', 'Hardware', 'DESKTOP-FIN-02', 'Carlos Alberto', 'Camila Rocha', 'ATENDENDO', 1240],
  ['Internet instável no setor administrativo', 'Oscilações frequentes durante reuniões e envio de arquivos.', 'Clínica Vida Plena', 'Rede e Internet', 'ROTEADOR-MATRIZ', 'Mariana Lima', 'Gabriela Santos', 'PAUSADOS', 2840],
  ['Solicitação de segunda via de nota fiscal', 'Cliente precisa da segunda via referente ao contrato mensal.', 'Delta Contabilidade', 'Financeiro', null, 'Ricardo Pereira', 'Daniel Martins', 'A_FAZER', 0],
  ['Impressora com atolamento recorrente', 'Atolamento ocorre a cada lote de impressao no financeiro.', 'Omega Engenharia', 'Impressoras', 'IMPRESSORA-RECEPCAO', 'Fernanda Oliveira', 'Camila Rocha', 'CONCLUIDO', 3600],
  ['Erro ao gerar relatório mensal', 'Relatório abre em branco ao filtrar últimos 30 dias.', 'Alfa Comercio Digital', 'Sistemas', null, 'Paulo Henrique', 'Bruno Carvalho', 'ATENDENDO', 980],
  ['Criar acesso para novo colaborador', 'Novo usuário precisa de e-mail e acesso ao portal interno.', 'Beta Logistica', 'Acesso', null, 'Larissa Silva', 'Eduarda Nunes', 'A_FAZER', 0],
  ['Servidor de arquivos lento', 'Pastas compartilhadas estão demorando para abrir.', 'Clínica Vida Plena', 'Hardware', 'SERVIDOR-ARQUIVOS', 'Bruno Costa', 'Gabriela Santos', 'PAUSADOS', 5420],
  ['Dúvida sobre cobrança avulsa', 'Cliente questiona valor de cobrança técnica no chamado anterior.', 'Delta Contabilidade', 'Financeiro', null, 'Patrícia Gomes', 'Henrique Costa', 'CONCLUIDO', 1540],
  ['Atualização do sistema de atendimento', 'Solicitada atualização de versão e validação de permissões.', 'Omega Engenharia', 'Sistemas', null, 'Rafael Mendes', 'Eduarda Nunes', 'A_FAZER', 0],
];

async function main() {
  for (const [nomeUsuario, email, tipoUsuario] of usuarios) {
    await prisma.usuario.upsert({
      where: { email },
      update: { nomeUsuario, tipoUsuario },
      create: {
        nomeUsuario,
        email,
        tipoUsuario,
        senhaHash: gerarSenhaHash('123456'),
      },
    });
  }

  const empresasCriadas = {};
  for (const nome of empresas) {
    empresasCriadas[nome] = await prisma.empresa.upsert({
      where: { nome },
      update: {},
      create: { nome },
    });
  }

  const categoriasCriadas = {};
  for (const nome of categorias) {
    categoriasCriadas[nome] = await prisma.categoria.upsert({
      where: { nome },
      update: {},
      create: { nome },
    });
  }

  const dispositivosCriados = {};
  for (const empresaNome of empresas) {
    for (const [nome, tipo] of dispositivosPorEmpresa) {
      const nomeDispositivo = `${nome}-${empresaNome.split(' ')[0].toUpperCase()}`;
      const existente = await prisma.dispositivo.findFirst({
        where: { nome: nomeDispositivo, empresaId: empresasCriadas[empresaNome].id },
      });
      dispositivosCriados[`${empresaNome}:${nome}`] = existente || await prisma.dispositivo.create({
        data: {
          nome: nomeDispositivo,
          tipo,
          empresaId: empresasCriadas[empresaNome].id,
        },
      });
    }
  }

  const ultimoTicket = await prisma.ticket.findFirst({
    orderBy: { numero: 'desc' },
    select: { numero: true },
  });
  let proximoNumero = Math.max(ultimoTicket?.numero || 0, 1000) + 1;

  for (const [assunto, descricao, empresaNome, categoriaNome, dispositivoBase, solicitante, operador, status, totalSegundos] of tickets) {
    const existente = await prisma.ticket.findFirst({ where: { assunto, solicitante } });
    if (existente) continue;

    const finalizadoEm = status === 'CONCLUIDO' ? new Date() : null;
    const ticket = await prisma.ticket.create({
      data: {
        numero: proximoNumero,
        assunto,
        descricao,
        solicitante,
        operador,
        status,
        totalSegundos,
        finalizadoEm,
        empresaId: empresasCriadas[empresaNome].id,
        categoriaId: categoriasCriadas[categoriaNome].id,
        dispositivoId: dispositivoBase ? dispositivosCriados[`${empresaNome}:${dispositivoBase}`]?.id : null,
      },
    });
    proximoNumero += 1;

    if (status !== 'A_FAZER') {
      await prisma.apontamento.create({
        data: {
          texto: status === 'CONCLUIDO' ? 'Atendimento concluído em ambiente de teste.' : 'Apontamento inicial criado para massa de teste.',
          segundosSessao: Math.min(totalSegundos, 1800),
          ticketId: ticket.id,
        },
      });
    }
  }

  console.log('Dados de teste criados. Senha padrao dos novos usuarios: 123456');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
