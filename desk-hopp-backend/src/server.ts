import express from 'express';

const app = express();
const PORT = 3000;

// Configura o servidor para aceitar dados no formato JSON
app.use(express.json());

// Criando a nossa primeira rota de teste
app.get('/', (req, res) => {
  res.json({ 
    mensagem: "Bem-vindo à API do Desk Hopp! Servidor rodando com sucesso. 🚀" 
  });
});

// Inicializa o servidor na porta 3000
app.listen(PORT, () => {
  console.log(`=========================================`);
  console.log(`  Desk Hopp Back-end Inicializado! 🔥     `);
  console.log(`  Servidor rodando em: http://localhost:${PORT} `);
  console.log(`=========================================`);
});