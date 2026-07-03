import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, KeyRound, MessageCircle, PlugZap, RefreshCw, Send, Webhook } from 'lucide-react';
import { api } from '../../services/api';

interface WhatsAppStatus {
  configurado: boolean;
  phoneNumberId: string | null;
  graphVersion: string;
  webhookPath: string;
}

export function ChatExternoWhatsApp() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [telefone, setTelefone] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [retorno, setRetorno] = useState('');

  const carregarStatus = async () => {
    try {
      const resposta = await api.get<WhatsAppStatus>('/whatsapp/status');
      setStatus(resposta.data);
    } catch (error) {
      console.error(error);
      setRetorno('Nao foi possivel consultar o status da integracao.');
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      carregarStatus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const enviarMensagemTeste = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setRetorno('');

    try {
      await api.post('/whatsapp/enviar', {
        para: telefone,
        mensagem,
      });
      setRetorno('Mensagem enviada para a API do WhatsApp com sucesso.');
      setMensagem('');
    } catch (error) {
      console.error(error);
      setRetorno('Nao foi possivel enviar. Verifique as credenciais, numero de destino e janela/template permitido pela Meta.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Chat Externo - WhatsApp Business</h1>
          <p className="text-xs text-gray-500">Base para conectar o Desk Hopp a uma conta WhatsApp Business Platform / Cloud API.</p>
        </div>
        <button onClick={carregarStatus} className="self-start lg:self-auto bg-[#202024] border border-gray-700 text-gray-300 px-3 py-2 rounded text-xs flex items-center gap-2 hover:bg-gray-800">
          <RefreshCw size={14} /> Atualizar status
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-[#202024] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <PlugZap size={18} className={status?.configurado ? 'text-emerald-400' : 'text-amber-400'} />
            <h2 className="text-sm font-bold text-white">Status da conexao</h2>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Credenciais</span>
              <strong className={status?.configurado ? 'text-emerald-300' : 'text-amber-300'}>
                {status?.configurado ? 'Configuradas' : 'Pendentes'}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Phone Number ID</span>
              <span className="text-gray-300">{status?.phoneNumberId || 'Nao informado'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Graph API</span>
              <span className="text-gray-300">{status?.graphVersion || '-'}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#202024] border border-gray-800 rounded-lg p-4 xl:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <KeyRound size={18} className="text-blue-400" />
            <h2 className="text-sm font-bold text-white">Variaveis do backend</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <InfoLinha rotulo="WHATSAPP_ACCESS_TOKEN" valor="Token permanente ou temporario da Meta" />
            <InfoLinha rotulo="WHATSAPP_PHONE_NUMBER_ID" valor="ID do numero conectado na Cloud API" />
            <InfoLinha rotulo="WHATSAPP_VERIFY_TOKEN" valor="Token que voce define para validar o webhook" />
            <InfoLinha rotulo="WHATSAPP_GRAPH_VERSION" valor="Versao da Graph API, ex: v21.0" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-[#202024] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <MessageCircle size={18} className="text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Enviar mensagem de teste</h2>
          </div>
          <form onSubmit={enviarMensagemTeste} className="space-y-3">
            <div>
              <label className="block text-[11px] text-gray-500 font-bold uppercase mb-1">Telefone com DDI e DDD</label>
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: 5511999999999"
                className="w-full bg-[#121214] border border-gray-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[11px] text-gray-500 font-bold uppercase mb-1">Mensagem</label>
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                rows={4}
                placeholder="Digite a mensagem de teste..."
                className="w-full bg-[#121214] border border-gray-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 resize-none"
              />
            </div>
            <button disabled={enviando || !telefone || !mensagem} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded px-4 py-2 text-xs font-bold flex items-center gap-2">
              <Send size={14} /> {enviando ? 'Enviando...' : 'Enviar teste'}
            </button>
            {retorno && <div className="text-xs text-gray-300 bg-[#121214] border border-gray-800 rounded p-3">{retorno}</div>}
          </form>
        </div>

        <div className="bg-[#202024] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Webhook size={18} className="text-blue-400" />
            <h2 className="text-sm font-bold text-white">Webhook de recebimento</h2>
          </div>
          <div className="space-y-3 text-xs text-gray-400">
            <p>Configure a URL publica do backend na Meta para receber mensagens de clientes.</p>
            <div className="bg-[#121214] border border-gray-800 rounded p-3 font-mono text-[11px] text-gray-300">
              https://seu-dominio.com{status?.webhookPath || '/whatsapp/webhook'}
            </div>
            <div className="flex items-start gap-2 text-emerald-300 bg-emerald-600/10 border border-emerald-600/20 rounded p-3">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
              <span>O backend ja possui verificacao GET e recebimento POST para o webhook.</span>
            </div>
            <p className="text-gray-500">Para funcionar fora do localhost, use HTTPS publico e cadastre o mesmo `WHATSAPP_VERIFY_TOKEN` no painel da Meta.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoLinha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="bg-[#121214] border border-gray-800 rounded p-3">
      <span className="block text-gray-300 font-mono">{rotulo}</span>
      <span className="block text-gray-600 mt-1">{valor}</span>
    </div>
  );
}
