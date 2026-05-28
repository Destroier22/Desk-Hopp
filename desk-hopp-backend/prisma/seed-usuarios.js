const { PrismaClient } = require('@prisma/client');
const { randomBytes, scryptSync } = require('crypto');

const prisma = new PrismaClient();

function gerarSenhaHash(senha) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const usuarios = [
  ['Administrador Teste', 'admin@deskhopp.local', 'Administrador'],
  ['Suporte Teste', 'suporte@deskhopp.local', 'Suporte'],
  ['Financeiro Teste', 'financeiro@deskhopp.local', 'Financeiro'],
  ['Gestor Financeiro Teste', 'gestor.financeiro@deskhopp.local', 'Gestor Financeiro'],
  ['Gestor Suporte Teste', 'gestor.suporte@deskhopp.local', 'Gestor Suporte'],
];

async function main() {
  for (const [nomeUsuario, email, tipoUsuario] of usuarios) {
    await prisma.usuario.upsert({
      where: { email },
      update: { nomeUsuario, tipoUsuario, senhaHash: gerarSenhaHash('123456') },
      create: {
        nomeUsuario,
        email,
        tipoUsuario,
        senhaHash: gerarSenhaHash('123456'),
      },
    });
  }

  console.log('Usuarios de teste criados/atualizados. Senha padrao: 123456');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
