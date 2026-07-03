import { Router } from 'express';

const router = Router();

const graphVersion = process.env.WHATSAPP_GRAPH_VERSION || 'v21.0';
const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'desk-hopp-whatsapp';

router.get('/whatsapp/status', (_req, res) => {
  res.json({
    configurado: Boolean(accessToken && phoneNumberId),
    phoneNumberId: phoneNumberId ? `${phoneNumberId.slice(0, 4)}...${phoneNumberId.slice(-4)}` : null,
    graphVersion,
    webhookPath: '/whatsapp/webhook',
  });
});

router.get('/whatsapp/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

router.post('/whatsapp/webhook', (req, res) => {
  console.log('Webhook WhatsApp recebido:', JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

router.post('/whatsapp/enviar', async (req, res) => {
  try {
    const { para, mensagem } = req.body;

    if (!accessToken || !phoneNumberId) {
      return res.status(400).json({
        erro: 'Configure WHATSAPP_ACCESS_TOKEN e WHATSAPP_PHONE_NUMBER_ID no ambiente do backend.',
      });
    }

    if (!para || !mensagem) {
      return res.status(400).json({ erro: 'Informe o telefone de destino e a mensagem.' });
    }

    const resposta = await fetch(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: String(para).replace(/\D/g, ''),
        type: 'text',
        text: {
          body: String(mensagem),
        },
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      return res.status(resposta.status).json({ erro: 'Erro ao enviar mensagem pelo WhatsApp.', detalhes: dados });
    }

    return res.json(dados);
  } catch (error) {
    console.error('Erro na integracao WhatsApp:', error);
    return res.status(500).json({ erro: 'Erro interno na integracao WhatsApp.' });
  }
});

export default router;
