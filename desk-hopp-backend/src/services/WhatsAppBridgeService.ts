import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { Client, LocalAuth } from 'whatsapp-web.js';

type BridgeStatus = 'desconectado' | 'iniciando' | 'aguardando_qr' | 'autenticado' | 'conectado' | 'erro';

const encontrarNavegador = () => {
  const candidatos = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].filter(Boolean) as string[];

  return candidatos.find((caminho) => fs.existsSync(caminho));
};

class WhatsAppBridgeService {
  private client: Client | null = null;
  private status: BridgeStatus = 'desconectado';
  private qrRaw: string | null = null;
  private qrDataUrl: string | null = null;
  private erro: string | null = null;
  private numeroConectado: string | null = null;

  async iniciar() {
    if (this.client && this.status !== 'erro') {
      return this.getStatus();
    }

    this.status = 'iniciando';
    this.erro = null;
    this.qrRaw = null;
    this.qrDataUrl = null;

    const executablePath = encontrarNavegador();
    const puppeteerOptions: Record<string, unknown> = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    };

    if (executablePath) {
      puppeteerOptions.executablePath = executablePath;
    }

    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: 'desk-hopp-chat-externo',
        dataPath: path.resolve(process.cwd(), '.wwebjs_auth'),
      }),
      puppeteer: puppeteerOptions,
    });

    this.client.on('qr', async (qr) => {
      this.status = 'aguardando_qr';
      this.qrRaw = qr;
      this.qrDataUrl = await QRCode.toDataURL(qr, {
        margin: 1,
        width: 320,
        color: {
          dark: '#111827',
          light: '#ffffff',
        },
      });
    });

    this.client.on('authenticated', () => {
      this.status = 'autenticado';
    });

    this.client.on('ready', async () => {
      this.status = 'conectado';
      this.qrRaw = null;
      this.qrDataUrl = null;
      const info = this.client?.info;
      this.numeroConectado = info?.wid?.user || null;
    });

    this.client.on('disconnected', (reason) => {
      this.status = 'desconectado';
      this.erro = reason;
      this.client = null;
      this.numeroConectado = null;
    });

    this.client.on('auth_failure', (message) => {
      this.status = 'erro';
      this.erro = message;
      this.client = null;
      this.numeroConectado = null;
    });

    try {
      await this.client.initialize();
    } catch (error) {
      this.status = 'erro';
      this.erro = error instanceof Error ? error.message : 'Erro ao iniciar bridge WhatsApp.';
      this.client = null;
    }

    return this.getStatus();
  }

  getStatus() {
    return {
      status: this.status,
      conectado: this.status === 'conectado',
      aguardandoQr: this.status === 'aguardando_qr',
      qrDisponivel: Boolean(this.qrDataUrl),
      numeroConectado: this.numeroConectado,
      erro: this.erro,
    };
  }

  getQr() {
    return {
      ...this.getStatus(),
      qr: this.qrRaw,
      qrDataUrl: this.qrDataUrl,
    };
  }

  async enviarMensagem(para: string, mensagem: string) {
    if (!this.client || this.status !== 'conectado') {
      throw new Error('Bridge WhatsApp nao conectado.');
    }

    const numero = String(para).replace(/\D/g, '');
    if (!numero) {
      throw new Error('Telefone de destino invalido.');
    }

    return this.client.sendMessage(`${numero}@c.us`, mensagem);
  }
}

export const whatsAppBridgeService = new WhatsAppBridgeService();
