import express from 'express';
import ticketRoutes from '../src/routes/TicketRoutes'; // Caso sua pasta se chame 'routers', lembre de ajustar o nome do caminho

const app = express();
const PORT = 3000;

// Configura o middleware para o Express compreender corpos de requisição em formato JSON
app.use(express.json());

// Injeta as rotas de gerenciamento de Tickets dentro da API
app.use(ticketRoutes);

app.get('/', (req, res) => {
  res.json({ 
    mensagem: "API do Desk Hopp rodando com suporte a rotas e modelo relacional de TI! 🚀" 
  });
});

app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  Desk Hopp Back-end Inicializado! 🔥     `);
  console.log(`  Servidor rodando em: http://localhost:${PORT} `);
  console.log(`=========================================`);
});