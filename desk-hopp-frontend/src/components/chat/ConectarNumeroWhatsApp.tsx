import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, KeyRound, MessageCircle, PlugZap, QrCode, RefreshCw, Send, ShieldAlert, Smartphone, Webhook } from 'lucide-react';
import { api } from '../../services/api';

interface WhatsAppStatus {
  configurado: boolean;
  phoneNumberId: string | null;
  graphVersion: string;
  webhookPath: string;
}

interface BridgeStatus {
  status: 'desconectado' | 'iniciando' | 'aguardando_qr' | 'autenticado' | 'conectado' | 'erro';
  conectado: boolean;
  aguardandoQr: boolean;
  qrDisponivel: boolean;
  numeroConectado: string | null;
  erro: string | null;
  qrDataUrl?: string | null;
}

export function ConectarNumeroWhatsApp() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);
  const [telefone, setTelefone] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [iniciandoBridge, setIniciandoBridge] = useState(false);
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

  const carregarBridge = async () => {
    try {
      const resposta = await api.get<BridgeStatus>('/whatsapp-bridge/qr');
      setBridgeStatus(resposta.data);
    } catch (error) {
      console.error(error);
      setRetorno('Nao foi possivel consultar o bridge de QR Code.');
    }
  };

  const iniciarBridge = async () => {
    setIniciandoBridge(true);
    setRetorno('');

    try {
      const resposta = await api.post<BridgeStatus>('/whatsapp-bridge/iniciar');
      setBridgeStatus(resposta.data);
      window.setTimeout(() => {
        carregarBridge();
      }, 1500);
    } catch (error) {
      console.error(error);
      setRetorno('Nao foi possivel iniciar o bridge de WhatsApp Web.');
    } finally {
      setIniciandoBridge(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      carregarStatus();
      carregarBridge();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const enviarMensagemTeste = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setRetorno('');

    try {
      const rota = bridgeStatus?.conectado ? '/whatsapp-bridge/enviar' : '/whatsapp/enviar';
      await api.post(rota, {
        para: telefone,
        mensagem,
      });
      setRetorno(bridgeStatus?.conectado
        ? 'Mensagem enviada pelo bridge WhatsApp Web com sucesso.'
        : 'Mensagem enviada para a API do WhatsApp com sucesso.');
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
          <h1 className="text-xl font-bold text-white">Conexao - Chat Externo</h1>
          <p className="text-xs text-gray-500">Conecte o WhatsApp Business ao Desk Work por API oficial ou por pareamento QR em bridge propria.</p>
        </div>
        <button onClick={() => { carregarStatus(); carregarBridge(); }} className="self-start lg:self-auto bg-[#202024] border border-gray-700 text-gray-300 px-3 py-2 rounded text-xs flex items-center gap-2 hover:bg-gray-800">
          <RefreshCw size={14} /> Atualizar status
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-4">
        <div className="bg-[#202024] border border-gray-800 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <QrCode size={18} className="text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Pareamento por QR Code</h2>
          </div>

          <div className="bg-white rounded-lg p-4 w-64 min-h-64 mx-auto shadow flex items-center justify-center">
            {bridgeStatus?.qrDataUrl ? (
              <img src={bridgeStatus.qrDataUrl} alt="QR Code para conectar WhatsApp" className="w-56 h-56" />
            ) : (
              <div className="text-center text-[#111827] p-5">
                <QrCode size={48} className="mx-auto mb-3" />
                <p className="text-sm font-semibold">QR Code ainda nao gerado</p>
                <p className="text-xs text-gray-500 mt-1">Clique em iniciar bridge.</p>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2 text-xs text-gray-400">
            <button
              type="button"
              onClick={iniciarBridge}
              disabled={iniciandoBridge || bridgeStatus?.conectado}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded py-2 text-xs font-bold"
            >
              {bridgeStatus?.conectado ? 'Numero conectado' : iniciandoBridge ? 'Iniciando bridge...' : 'Iniciar bridge e gerar QR Code'}
            </button>
            <div className="bg-[#121214] border border-gray-800 rounded p-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Status bridge</span>
                <strong className={bridgeStatus?.conectado ? 'text-emerald-300' : 'text-amber-300'}>
                  {bridgeStatus?.status || 'desconectado'}
                </strong>
              </div>
              {bridgeStatus?.numeroConectado && (
                <div className="flex justify-between mt-2">
                  <span className="text-gray-500">Numero</span>
                  <span className="text-gray-300">{bridgeStatus.numeroConectado}</span>
                </div>
              )}
              {bridgeStatus?.erro && <p className="text-red-300 mt-2">{bridgeStatus.erro}</p>}
            </div>
            <div className="flex items-start gap-2">
              <Smartphone size={15} className="text-blue-300 mt-0.5 shrink-0" />
              <span>Abra o WhatsApp no celular, acesse aparelhos conectados e leia o QR Code quando o bridge estiver ativo.</span>
            </div>
            <div className="flex items-start gap-2 text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded p-3">
              <ShieldAlert size={15} className="mt-0.5 shrink-0" />
              <span>A API oficial da Meta nao conecta numero por QR Code. Este QR exige um servico bridge de WhatsApp Web; para producao, prefira Cloud API oficial.</span>
            </div>
          </div>
        </div>

        <div className="bg-[#202024] border border-gray-800 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 size={18} className="text-blue-400" />
            <h2 className="text-sm font-bold text-white">Fluxo recomendado para producao</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-[#121214] border border-gray-800 rounded p-3">
              <strong className="block text-white mb-1">1. Meta Business</strong>
              <span className="text-gray-500">Crie ou selecione o Business Manager e a WABA.</span>
            </div>
            <div className="bg-[#121214] border border-gray-800 rounded p-3">
              <strong className="block text-white mb-1">2. Numero e token</strong>
              <span className="text-gray-500">Registre o numero e configure Phone Number ID e Access Token.</span>
            </div>
            <div className="bg-[#121214] border border-gray-800 rounded p-3">
              <strong className="block text-white mb-1">3. Webhook</strong>
              <span className="text-gray-500">Publique HTTPS e assine os eventos de mensagens.</span>
            </div>
          </div>
        </div>
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
            <p className="text-gray-500">Para funcionar fora do localhost, use HTTPS publico e cadastre o mesmo WHATSAPP_VERIFY_TOKEN no painel da Meta.</p>
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
