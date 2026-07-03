import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const router = Router();
const prisma = new PrismaClient();

const tiposUsuarioValidos = [
  'Financeiro',
  'Administrador',
  'Suporte',
  'Gestor Financeiro',
  'Gestor Suporte',
];

export function gerarSenhaHash(senha: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(senha, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function validarSenha(senha: string, senhaHash: string) {
  const [salt, hashSalvo] = senhaHash.split(':');
  if (!salt || !hashSalvo) return false;

  const hashInformado = scryptSync(senha, salt, 64);
  const hashSalvoBuffer = Buffer.from(hashSalvo, 'hex');

  return hashSalvoBuffer.length === hashInformado.length && timingSafeEqual(hashSalvoBuffer, hashInformado);
}

router.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'Informe e-mail e senha.' });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!usuario || !validarSenha(String(senha), usuario.senhaHash)) {
      return res.status(401).json({ erro: 'E-mail ou senha invalidos.' });
    }

    res.json({
      usuario: {
        id: usuario.id,
        nomeUsuario: usuario.nomeUsuario,
        email: usuario.email,
        tipoUsuario: usuario.tipoUsuario,
      },
    });
  } catch (error) {
    console.error('Erro ao realizar login:', error);
    res.status(500).json({ erro: 'Erro interno ao realizar login.' });
  }
});

router.get('/usuarios', async (_req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nomeUsuario: true,
        email: true,
        tipoUsuario: true,
      },
      orderBy: {
        nomeUsuario: 'asc',
      },
    });

    res.json(usuarios);
  } catch (error) {
    console.error('Erro ao listar usuarios:', error);
    res.status(500).json({ erro: 'Erro ao listar usuarios.' });
  }
});

router.post('/usuarios', async (req, res) => {
  try {
    const { nomeUsuario, email, senha, tipoUsuario } = req.body;

    if (!nomeUsuario || !email || !senha || !tipoUsuario) {
      return res.status(400).json({ erro: 'Nome de usuario, e-mail, senha e tipo de usuario sao obrigatorios.' });
    }

    if (!tiposUsuarioValidos.includes(tipoUsuario)) {
      return res.status(400).json({ erro: 'Tipo de usuario invalido.' });
    }

    const usuario = await prisma.usuario.create({
      data: {
        nomeUsuario,
        email: String(email).trim().toLowerCase(),
        senhaHash: gerarSenhaHash(String(senha)),
        tipoUsuario,
      },
    });

    res.status(201).json({
      id: usuario.id,
      nomeUsuario: usuario.nomeUsuario,
      email: usuario.email,
      tipoUsuario: usuario.tipoUsuario,
    });
  } catch (error) {
    console.error('Erro ao criar usuario:', error);
    res.status(500).json({ erro: 'Erro ao criar usuario.' });
  }
});

export default router;
