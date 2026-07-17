import { useMemo, useState, type FormEvent, type MouseEvent } from 'react';
import {
  CheckCheck,
  Mic,
  MoreVertical,
  Paperclip,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  Smile,
  Star,
  Tag,
  User,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { ChatExternoContato, FilaAtendimento, UsuarioLogado } from '../../types';

interface MensagemExterna {
  id: string;
  autor: 'cliente' | 'atendente';
  texto: string;
  horario: string;
  status?: 'enviado' | 'lido';
}

interface ConversaExterna {
  id: string;
  nome: string;
  telefone: string;
  canal: string;
  etiqueta: string;
  prioridade: 'Normal' | 'Alta';
  responsavel: string;
  ultimaMensagem: string;
  horario: string;
  naoLidas: number;
  fila: 'abertos' | 'aguardando';
  filaId: string;
  iniciadoPorUsuarioId: string;
  mensagens: MensagemExterna[];
}

const criarConversasIniciais = (usuarioLogado: UsuarioLogado): ConversaExterna[] => [
  {
    id: '1',
    nome: 'Mariana Costa',
    telefone: '+55 11 98444-1020',
    canal: 'WhatsApp Business',
    etiqueta: 'Novo chamado',
    prioridade: 'Alta',
    responsavel: 'Sem operador',
    ultimaMensagem: 'Bom dia, preciso de ajuda com o acesso ao sistema.',
    horario: '09:42',
    naoLidas: 2,
    fila: 'abertos',
    filaId: 'suporte',
    iniciadoPorUsuarioId: usuarioLogado.id,
    mensagens: [
      { id: 'm1', autor: 'cliente', texto: 'Bom dia, preciso de ajuda com o acesso ao sistema.', horario: '09:40' },
      { id: 'm2', autor: 'cliente', texto: 'Aparece uma mensagem de senha expirada.', horario: '09:42' },
    ],
  },
  {
    id: '2',
    nome: 'Financeiro Alfa',
    telefone: '+55 21 97777-3311',
    canal: 'WhatsApp Business',
    etiqueta: 'Financeiro',
    prioridade: 'Normal',
    responsavel: 'Administrador Teste',
    ultimaMensagem: 'Consegue verificar a cobranca avulsa?',
    horario: '08:15',
    naoLidas: 0,
    fila: 'aguardando',
    filaId: 'financeiro',
    iniciadoPorUsuarioId: 'outro-usuario',
    mensagens: [
      { id: 'm1', autor: 'cliente', texto: 'Consegue verificar a cobranca avulsa?', horario: '08:15' },
      { id: 'm2', autor: 'atendente', texto: 'Claro, vou conferir e retorno por aqui.', horario: '08:18', status: 'lido' },
    ],
  },
  {
    id: '3',
    nome: 'Unidade Centro',
    telefone: '+55 31 96666-0188',
    canal: 'WhatsApp Business',
    etiqueta: 'Infraestrutura',
    prioridade: 'Normal',
    responsavel: 'Suporte',
    ultimaMensagem: 'O link voltou, obrigado!',
    horario: 'Ontem',
    naoLidas: 0,
    fila: 'abertos',
    filaId: 'administrativo',
    iniciadoPorUsuarioId: usuarioLogado.id,
    mensagens: [
      { id: 'm1', autor: 'cliente', texto: 'O link voltou, obrigado!', horario: 'Ontem' },
      { id: 'm2', autor: 'atendente', texto: 'Perfeito. Vou manter o chamado em observacao.', horario: 'Ontem', status: 'lido' },
    ],
  },
];

type AbaChatExterno = 'abertos' | 'aguardando' | 'contatos';

interface ChatExternoWhatsAppProps {
  usuarioLogado: UsuarioLogado;
  contatos: ChatExternoContato[];
  filas: FilaAtendimento[];
  onAdicionarContato: (contato: ChatExternoContato) => void;
}

export function ChatExternoWhatsApp({
  usuarioLogado,
  contatos,
  filas,
  onAdicionarContato,
}: ChatExternoWhatsAppProps) {
  const conversasBase = useMemo(() => criarConversasIniciais(usuarioLogado), [usuarioLogado]);
  const [conversas, setConversas] = useState(conversasBase);
  const [conversaAtivaId, setConversaAtivaId] = useState(conversasBase[0]?.id || '');
  const [busca, setBusca] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [abaSelecionada, setAbaSelecionada] = useState<AbaChatExterno>('abertos');
  const [somAbertosAtivo, setSomAbertosAtivo] = useState(true);
  const [somAguardandoAtivo, setSomAguardandoAtivo] = useState(true);
  const [modalContatoAberto, setModalContatoAberto] = useState(false);
  const [novoContatoNome, setNovoContatoNome] = useState('');
  const [novoContatoTelefone, setNovoContatoTelefone] = useState('');
  const [novoContatoEmpresa, setNovoContatoEmpresa] = useState('');

  const filasDoUsuario = filas.filter(fila => fila.usuariosIds.includes(usuarioLogado.id));
  const filasDoUsuarioIds = filasDoUsuario.map(fila => fila.id);
  const conversasAbertas = conversas.filter(conversa => conversa.fila === 'abertos' && conversa.iniciadoPorUsuarioId === usuarioLogado.id);
  const conversasAguardando = conversas.filter(conversa => conversa.fila === 'aguardando' && filasDoUsuarioIds.includes(conversa.filaId));

  const conversasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const origem = abaSelecionada === 'aguardando' ? conversasAguardando : conversasAbertas;
    if (!termo) return origem;
    return origem.filter(conversa => `${conversa.nome} ${conversa.telefone} ${conversa.etiqueta} ${conversa.ultimaMensagem}`.toLowerCase().includes(termo));
  }, [abaSelecionada, busca, conversasAbertas, conversasAguardando]);

  const contatosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return contatos;
    return contatos.filter(contato => `${contato.nome} ${contato.telefone} ${contato.empresa}`.toLowerCase().includes(termo));
  }, [busca, contatos]);

  const conversaAtiva = conversas.find(conversa => conversa.id === conversaAtivaId) || conversas[0];

  const selecionarAba = (aba: AbaChatExterno) => {
    setAbaSelecionada(aba);
    setBusca('');

    if (aba === 'abertos') {
      setConversaAtivaId(conversasAbertas[0]?.id || '');
    }
    if (aba === 'aguardando') {
      setConversaAtivaId(conversasAguardando[0]?.id || '');
    }
  };

  const enviarMensagem = (e: FormEvent) => {
    e.preventDefault();
    if (!conversaAtiva || !mensagem.trim()) return;

    const novaMensagem: MensagemExterna = {
      id: `msg-${Date.now()}`,
      autor: 'atendente',
      texto: mensagem.trim(),
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      status: 'enviado',
    };

    setConversas(prev => prev.map(conversa => conversa.id === conversaAtiva.id
      ? {
        ...conversa,
        mensagens: [...conversa.mensagens, novaMensagem],
        ultimaMensagem: novaMensagem.texto,
        horario: novaMensagem.horario,
        naoLidas: 0,
      }
      : conversa));
    setMensagem('');
  };

  const adicionarContato = (e: FormEvent) => {
    e.preventDefault();
    if (!novoContatoNome.trim() || !novoContatoTelefone.trim()) return;

    onAdicionarContato({
      id: `contato-${Date.now()}`,
      nome: novoContatoNome.trim(),
      telefone: novoContatoTelefone.trim(),
      empresa: novoContatoEmpresa.trim() || 'Nao informado',
      ultimaInteracao: 'Agora',
    });
    setNovoContatoNome('');
    setNovoContatoTelefone('');
    setNovoContatoEmpresa('');
    setModalContatoAberto(false);
  };

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[430px_1fr] min-h-[calc(100vh-96px)] rounded-lg overflow-hidden border border-gray-800 bg-[#0f171d] shadow-2xl">
      <aside className="bg-[#101820] border-r border-gray-800 overflow-hidden flex flex-col min-h-[720px]">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-2xl font-bold text-white">Atendimentos</h1>
            <button className="w-10 h-10 rounded-lg bg-[#1b2530] border border-gray-800 text-gray-300 flex items-center justify-center hover:bg-[#243142]">
              <SlidersHorizontal size={18} />
            </button>
          </div>

          <div className="flex items-center gap-3 bg-[#1b2530] border border-gray-800 rounded-2xl px-4 py-3 focus-within:border-blue-500">
            <Search size={20} className="text-gray-500 shrink-0" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={abaSelecionada === 'contatos' ? 'Buscar contatos...' : 'Buscar conversas ou contatos...'}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-400"
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <AbaBotao
              ativa={abaSelecionada === 'abertos'}
              label="Abertos"
              total={conversasAbertas.length}
              onClick={() => selecionarAba('abertos')}
              somAtivo={somAbertosAtivo}
              onSomClick={(e) => {
                e.stopPropagation();
                setSomAbertosAtivo((ativo) => !ativo);
              }}
            />
            <AbaBotao
              ativa={abaSelecionada === 'aguardando'}
              label="Aguardando"
              total={conversasAguardando.length}
              onClick={() => selecionarAba('aguardando')}
              somAtivo={somAguardandoAtivo}
              onSomClick={(e) => {
                e.stopPropagation();
                setSomAguardandoAtivo((ativo) => !ativo);
              }}
            />
            <button
              type="button"
              onClick={() => selecionarAba('contatos')}
              className={`rounded border px-2 py-2 text-left transition-colors ${
                abaSelecionada === 'contatos'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                  : 'bg-[#121214] border-gray-800 text-gray-500 hover:border-gray-700'
              }`}
            >
              <span className="flex items-center justify-between gap-1 text-[11px] font-semibold">
                Contatos
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalContatoAberto(true);
                    setAbaSelecionada('contatos');
                  }}
                  className="p-0.5 text-emerald-300 hover:text-emerald-200"
                  title="Adicionar contato"
                >
                  <Plus size={13} />
                </button>
              </span>
              <strong className="text-sm text-white">{contatos.length}</strong>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {abaSelecionada === 'contatos' ? (
            contatosFiltrados.map(contato => (
              <button
                key={contato.id}
                type="button"
                className="w-full text-left px-6 py-4 border-b border-gray-800/70 transition-colors hover:bg-[#17212b]"
              >
                <div className="flex items-start gap-3">
                  <Avatar nome={contato.nome} />
                  <div className="min-w-0 flex-1">
                    <span className="block font-semibold text-sm text-white truncate">{contato.nome}</span>
                    <span className="block text-[10px] text-gray-500">{contato.telefone}</span>
                    <span className="block text-[10px] text-gray-600 truncate">{contato.empresa}</span>
                  </div>
                  <span className="text-[10px] text-gray-600">{contato.ultimaInteracao}</span>
                </div>
              </button>
            ))
          ) : (
            conversasFiltradas.map(conversa => (
              <button
                key={conversa.id}
                type="button"
                onClick={() => setConversaAtivaId(conversa.id)}
                className={`w-full text-left px-6 py-4 border-b border-gray-800/70 transition-colors relative ${
                  conversaAtiva?.id === conversa.id ? 'bg-[#1a2530]' : 'hover:bg-[#17212b]'
                }`}
              >
                {conversaAtiva?.id === conversa.id && <span className="absolute left-0 top-0 h-full w-1 bg-emerald-500" />}
                <div className="flex gap-3">
                  <Avatar nome={conversa.nome} online={conversa.fila === 'abertos'} alerta={conversa.fila === 'aguardando'} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white truncate">{conversa.nome}</span>
                          {conversa.prioridade === 'Alta' && <Star size={12} className="text-amber-400" fill="currentColor" />}
                        </div>
                        <p className="mt-1 text-xs text-gray-400 truncate">{conversa.ultimaMensagem}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-[11px] text-gray-400">{conversa.horario}</span>
                        {conversa.naoLidas > 0 ? (
                          <span className="inline-flex mt-2 bg-blue-600 text-white text-xs rounded-full min-w-6 h-6 items-center justify-center">
                            {conversa.naoLidas}
                          </span>
                        ) : (
                          <CheckCheck size={16} className="mt-2 ml-auto text-emerald-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
          {abaSelecionada !== 'contatos' && conversasFiltradas.length === 0 && (
            <div className="text-xs text-gray-600 text-center py-10">
              {abaSelecionada === 'aguardando'
                ? 'Nenhum atendimento aguardando nas suas filas.'
                : 'Nenhum atendimento aberto por voce.'}
            </div>
          )}
          {abaSelecionada === 'contatos' && contatosFiltrados.length === 0 && (
            <div className="text-xs text-gray-600 text-center py-10">Nenhum contato encontrado.</div>
          )}
        </div>
      </aside>

      <main className="bg-[#0f171d] overflow-hidden flex flex-col min-h-[720px]">
        {conversaAtiva && (
          <>
            <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between bg-[#101820]">
              <div className="flex items-center gap-3">
                <Avatar nome={conversaAtiva.nome} online />
                <div>
                  <h2 className="text-lg font-bold text-white">{conversaAtiva.nome}</h2>
                  <p className="text-sm text-emerald-400">Online</p>
                </div>
              </div>
              <div className="flex items-center gap-5 text-gray-200">
                <button className="p-1 rounded hover:text-blue-300" title="Etiqueta"><Tag size={20} /></button>
                <button className="p-1 rounded hover:text-blue-300" title="Contato"><User size={20} /></button>
                <button className="p-1 rounded hover:text-blue-300" title="Favorito"><Star size={21} /></button>
                <button className="p-1 rounded hover:text-blue-300" title="Mais opcoes"><MoreVertical size={22} /></button>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto px-10 py-7"
              style={{
                backgroundColor: '#101820',
                backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(255,255,255,0.035) 1px, transparent 1.5px), radial-gradient(circle at 70px 70px, rgba(37,99,235,0.045) 1px, transparent 1.5px)',
                backgroundSize: '90px 90px',
              }}
            >
              <div className="flex justify-center mb-6">
                <span className="bg-[#1b2530] border border-gray-800 text-gray-200 text-sm px-5 py-2 rounded-full shadow">Hoje</span>
              </div>

              <div className="space-y-6">
                {conversaAtiva.mensagens.map(msg => {
                  const minhaMensagem = msg.autor === 'atendente';
                  return (
                    <div key={msg.id} className={`flex ${minhaMensagem ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[62%] px-5 py-3 shadow text-base leading-relaxed ${
                        minhaMensagem
                          ? 'bg-gradient-to-br from-emerald-700 to-emerald-900 text-white rounded-2xl rounded-br-sm'
                          : 'bg-[#202a35] border border-gray-800 text-gray-100 rounded-2xl rounded-bl-sm'
                      }`}
                      >
                        <p>{msg.texto}</p>
                        <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${minhaMensagem ? 'text-blue-100' : 'text-gray-500'}`}>
                          <span>{msg.horario}</span>
                          {minhaMensagem && <CheckCheck size={12} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <form onSubmit={enviarMensagem} className="px-6 py-5 bg-[#101820] flex items-center gap-3">
              <div className="flex-1 bg-[#1b2530] border border-gray-800 rounded-full px-4 py-3 flex items-center gap-3 shadow-lg">
              <button type="button" className="p-1 text-gray-400 hover:text-gray-200"><Smile size={22} /></button>
              <button type="button" className="p-1 text-gray-400 hover:text-gray-200"><Paperclip size={22} /></button>
              <input
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-transparent text-base text-white outline-none placeholder:text-gray-500"
              />
              <button type="button" className="p-1 text-gray-400 hover:text-gray-200"><Mic size={21} /></button>
              </div>
              <button type="submit" className="w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg">
                <Send size={24} />
              </button>
            </form>
          </>
        )}
      </main>

      {modalContatoAberto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#202024] border border-gray-800 rounded-lg p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Adicionar contato</h2>
              <button onClick={() => setModalContatoAberto(false)} className="text-gray-500 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={adicionarContato} className="space-y-3">
              <input
                value={novoContatoNome}
                onChange={(e) => setNovoContatoNome(e.target.value)}
                placeholder="Nome do contato"
                className="w-full bg-[#121214] border border-gray-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              />
              <input
                value={novoContatoTelefone}
                onChange={(e) => setNovoContatoTelefone(e.target.value)}
                placeholder="Telefone com DDI e DDD"
                className="w-full bg-[#121214] border border-gray-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              />
              <input
                value={novoContatoEmpresa}
                onChange={(e) => setNovoContatoEmpresa(e.target.value)}
                placeholder="Empresa"
                className="w-full bg-[#121214] border border-gray-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              />
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded py-2 text-sm font-semibold">
                Salvar contato
              </button>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function AbaBotao({
  ativa,
  label,
  total,
  somAtivo,
  onClick,
  onSomClick,
}: {
  ativa: boolean;
  label: string;
  total: number;
  somAtivo: boolean;
  onClick: () => void;
  onSomClick: (e: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded border px-2 py-2 text-left transition-colors ${
        ativa
          ? 'bg-blue-600/20 border-blue-500 text-blue-200'
          : 'bg-[#121214] border-gray-800 text-gray-500 hover:border-gray-700'
      }`}
    >
      <span className="flex items-center justify-between gap-1 text-[11px] font-semibold">
        {label}
        <button
          type="button"
          onClick={onSomClick}
          className={`p-0.5 rounded ${somAtivo ? 'text-emerald-300' : 'text-gray-600'}`}
          title={somAtivo ? `Notificacao sonora de ${label.toLowerCase()} ativa` : `Notificacao sonora de ${label.toLowerCase()} inativa`}
        >
          {somAtivo ? <Volume2 size={13} /> : <VolumeX size={13} />}
        </button>
      </span>
      <strong className="text-sm text-white">{total}</strong>
    </button>
  );
}

function Avatar({ nome, online, alerta }: { nome: string; online?: boolean; alerta?: boolean }) {
  const partes = nome.split(' ').filter(Boolean);
  const iniciais = partes.length > 1
    ? `${partes[0][0]}${partes[partes.length - 1][0]}`
    : nome.slice(0, 2);
  const cores = [
    'from-blue-500 to-blue-700',
    'from-emerald-500 to-emerald-700',
    'from-sky-500 to-indigo-700',
    'from-violet-500 to-blue-700',
  ];
  const cor = cores[nome.length % cores.length];

  return (
    <div className={`relative w-12 h-12 rounded-full bg-gradient-to-br ${cor} flex items-center justify-center text-white font-semibold shrink-0 shadow`}>
      <span>{iniciais.toUpperCase()}</span>
      {(online || alerta) && (
        <span className={`absolute -right-0.5 bottom-0 w-4 h-4 rounded-full border-2 border-[#101820] ${alerta ? 'bg-amber-400' : 'bg-emerald-500'}`} />
      )}
    </div>
  );
}
