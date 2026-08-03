import express from 'express';
import cors from 'cors';
import ticketRoutes from '../src/routes/TicketRoutes';
import authRoutes from '../src/routes/AuthRoutes';
import whatsAppRoutes from '../src/routes/WhatsAppRoutes';

const app = express();
const PORT = 3000;

// 1. Permite que o Front-end (React) aceda aos dados deste Back-end com segurança
app.use(cors());

// 2. Configura o middleware para o Express compreender corpos de requisição em formato JSON
app.use(express.json({ limit: '10mb' }));

// 3. Injeta as rotas de gerenciamento de Tickets e Inventário dentro da API
app.use(authRoutes);
app.use(ticketRoutes);
app.use(whatsAppRoutes);

// Rota inicial apenas para teste rápido no navegador
app.get('/', (req, res) => {
  res.json({
    mensagem: "API do Desk Work rodando com suporte a rotas, CORS e modelo relacional de TI! 🚀"
  });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  Desk Work Back-end Inicializado! 🔥     `);
  console.log(`  Servidor rodando em: http://localhost:${PORT} `);
  console.log(`=========================================`);
});
