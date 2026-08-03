import { useMemo, useState, type FormEvent } from 'react';
import { MessageSquarePlus, Search, Send, Users, UserRoundPlus } from 'lucide-react';
import type { UsuarioLogado } from '../../types';

type ConversaTipo = 'individual' | 'grupo';

interface Conversa {
  id: string;
  tipo: ConversaTipo;
  nome: string;
  participantes: UsuarioLogado[];
  mensagens: Array<{
    autor: string;
    texto: string;
    horario: string;
  }>;
}

interface ChatInternoProps {
  usuarioLogado: UsuarioLogado;
  usuarios: UsuarioLogado[];
}

export function ChatInterno({ usuarioLogado, usuarios }: ChatInternoProps) {
  const [busca, setBusca] = useState('');
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [conversaAtivaId, setConversaAtivaId] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [nomeGrupo, setNomeGrupo] = useState('');
  const [participantesGrupo, setParticipantesGrupo] = useState<string[]>([]);
  const podeCriarGrupo = usuarioLogado.tipoUsuario === 'Administrador';

  const usuariosDisponiveis = useMemo(
    () => usuarios.filter(usuario => usuario.id !== usuarioLogado.id),
    [usuarioLogado.id, usuarios],
  );

  const usuariosFiltrados = usuariosDisponiveis.filter((usuario) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;
    return `${usuario.nomeUsuario} ${usuario.email} ${usuario.tipoUsuario}`.toLowerCase().includes(termo);
  });

  const conversaAtiva = conversas.find(conversa => conversa.id === conversaAtivaId);

  const iniciarConversaIndividual = (usuario: UsuarioLogado) => {
    const conversaExistente = conversas.find(conversa => conversa.tipo === 'individual' && conversa.participantes.some(participante => participante.id === usuario.id));
    if (conversaExistente) {
      setConversaAtivaId(conversaExistente.id);
      return;
    }

    const novaConversa: Conversa = {
      id: `individual-${usuario.id}`,
      tipo: 'individual',
      nome: usuario.nomeUsuario,
      participantes: [usuarioLogado, usuario],
      mensagens: [
        {
          autor: 'Sistema',
          texto: `Conversa iniciada com ${usuario.nomeUsuario}.`,
          horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };
    setConversas(prev => [novaConversa, ...prev]);
    setConversaAtivaId(novaConversa.id);
  };

  const alternarParticipanteGrupo = (usuarioId: string) => {
    setParticipantesGrupo(prev => prev.includes(usuarioId)
      ? prev.filter(id => id !== usuarioId)
      : [...prev, usuarioId]);
  };

  const criarGrupo = (e: FormEvent) => {
    e.preventDefault();
    if (!podeCriarGrupo || !nomeGrupo.trim() || participantesGrupo.length === 0) return;

    const participantesSelecionados = usuariosDisponiveis.filter(usuario => participantesGrupo.includes(usuario.id));
    const novaConversa: Conversa = {
      id: `grupo-${Date.now()}`,
      tipo: 'grupo',
      nome: nomeGrupo.trim(),
      participantes: [usuarioLogado, ...participantesSelecionados],
      mensagens: [
        {
          autor: 'Sistema',
          texto: `Grupo criado por ${usuarioLogado.nomeUsuario}.`,
          horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
    };

    setConversas(prev => [novaConversa, ...prev]);
    setConversaAtivaId(novaConversa.id);
    setNomeGrupo('');
    setParticipantesGrupo([]);
  };

  const enviarMensagem = (e: FormEvent) => {
    e.preventDefault();
    if (!conversaAtiva || !mensagem.trim()) return;

    setConversas(prev => prev.map(conversa => conversa.id === conversaAtiva.id
      ? {
        ...conversa,
        mensagens: [
          ...conversa.mensagens,
          {
            autor: usuarioLogado.nomeUsuario,
            texto: mensagem.trim(),
            horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          },
        ],
      }
      : conversa));
    setMensagem('');
  };

  return (
    <section className="grid grid-cols-1 xl:grid-cols-[320px_1fr_320px] gap-4 min-h-[calc(100vh-120px)]">
      <aside className="bg-[#202024] border border-gray-800 rounded-lg p-4 flex flex-col min-h-[620px]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold text-white">Chat Interno</h1>
            <p className="text-[11px] text-gray-500">Conversas individuais e grupos.</p>
          </div>
          <MessageSquarePlus size={20} className="text-blue-400" />
        </div>

        <div className="flex items-center gap-2 bg-[#121214] border border-gray-800 rounded px-2 py-2 mb-4 focus-within:border-blue-500">
          <Search size={14} className="text-gray-500" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar usuarios..."
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-gray-600"
          />
        </div>

        <div className="space-y-2 overflow-y-auto pr-1">
          {usuariosFiltrados.map(usuario => (
            <button
              key={usuario.id}
              type="button"
              onClick={() => iniciarConversaIndividual(usuario)}
              className="w-full text-left p-3 rounded border border-gray-800 bg-[#121214] hover:border-blue-500/50 hover:bg-gray-800 transition-colors"
            >
              <span className="block text-sm text-white font-semibold">{usuario.nomeUsuario}</span>
              <span className="block text-[11px] text-gray-500">{usuario.tipoUsuario}</span>
              <span className="block text-[10px] text-gray-600 truncate">{usuario.email}</span>
            </button>
          ))}
          {!usuariosFiltrados.length && (
            <div className="text-xs text-gray-600 text-center py-8">Nenhum usuario encontrado.</div>
          )}
        </div>
      </aside>

      <main className="bg-[#202024] border border-gray-800 rounded-lg flex flex-col min-h-[620px] overflow-hidden">
        {conversaAtiva ? (
          <>
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">{conversaAtiva.nome}</h2>
                <p className="text-[11px] text-gray-500">
                  {conversaAtiva.tipo === 'grupo' ? 'Grupo' : 'Conversa individual'} - {conversaAtiva.participantes.length} participante(s)
                </p>
              </div>
              <span className="text-[11px] text-blue-300 bg-blue-600/10 border border-blue-500/30 rounded px-2 py-1">
                {conversaAtiva.tipo === 'grupo' ? 'Grupo' : 'Individual'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {conversaAtiva.mensagens.map((msg, index) => {
                const minhaMensagem = msg.autor === usuarioLogado.nomeUsuario;
                return (
                  <div key={`${msg.horario}-${index}`} className={`flex ${minhaMensagem ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg px-3 py-2 text-sm ${minhaMensagem ? 'bg-blue-600 text-white' : 'bg-[#121214] text-gray-200 border border-gray-800'}`}>
                      <div className="flex justify-between gap-4 text-[10px] opacity-70 mb-1">
                        <span>{msg.autor}</span>
                        <span>{msg.horario}</span>
                      </div>
                      <p>{msg.texto}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <form onSubmit={enviarMensagem} className="p-4 border-t border-gray-800 flex gap-2">
              <input
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Digite uma mensagem..."
                className="flex-1 bg-[#121214] border border-gray-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white rounded px-4 flex items-center gap-2 text-sm font-semibold">
                <Send size={15} /> Enviar
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-6">
            <div>
              <Users size={42} className="mx-auto mb-3 text-gray-600" />
              <h2 className="text-lg font-bold text-white">Selecione ou inicie uma conversa</h2>
              <p className="text-xs text-gray-500 mt-1">Escolha um usuario na lista ou crie um grupo para comecar.</p>
            </div>
          </div>
        )}
      </main>

      <aside className="bg-[#202024] border border-gray-800 rounded-lg p-4 min-h-[620px]">
        <div className="flex items-center gap-2 mb-4">
          <UserRoundPlus size={18} className="text-emerald-400" />
          <h2 className="text-sm font-bold text-white">Grupos</h2>
        </div>

        {podeCriarGrupo ? (
          <form onSubmit={criarGrupo} className="space-y-3">
            <div>
              <label className="block text-[11px] text-gray-500 font-bold uppercase mb-1">Nome do grupo</label>
              <input
                value={nomeGrupo}
                onChange={(e) => setNomeGrupo(e.target.value)}
                placeholder="Ex: Suporte Nivel 1"
                className="w-full bg-[#121214] border border-gray-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <span className="block text-[11px] text-gray-500 font-bold uppercase mb-2">Participantes</span>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {usuariosDisponiveis.map(usuario => (
                  <label key={usuario.id} className="flex items-center gap-2 text-xs text-gray-300 bg-[#121214] border border-gray-800 rounded p-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={participantesGrupo.includes(usuario.id)}
                      onChange={() => alternarParticipanteGrupo(usuario.id)}
                    />
                    <span className="truncate">{usuario.nomeUsuario}</span>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded py-2 text-xs font-bold">
              Criar grupo
            </button>
          </form>
        ) : (
          <div className="text-xs text-gray-500 bg-[#121214] border border-gray-800 rounded p-3">
            Apenas administradores podem criar grupos. Voce ainda pode iniciar conversas individuais e participar de grupos criados.
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-gray-800">
          <h3 className="text-[11px] font-bold text-gray-500 uppercase mb-2">Conversas iniciadas</h3>
          <div className="space-y-2">
            {conversas.map(conversa => (
              <button
                key={conversa.id}
                type="button"
                onClick={() => setConversaAtivaId(conversa.id)}
                className={`w-full text-left rounded p-2 text-xs border transition-colors ${
                  conversaAtivaId === conversa.id
                    ? 'border-blue-500 bg-blue-600/10 text-blue-200'
                    : 'border-gray-800 bg-[#121214] text-gray-400 hover:border-gray-700'
                }`}
              >
                <span className="block font-semibold truncate">{conversa.nome}</span>
                <span className="block text-[10px] text-gray-600">{conversa.tipo === 'grupo' ? 'Grupo' : 'Individual'}</span>
              </button>
            ))}
            {!conversas.length && <span className="text-xs text-gray-600">Nenhuma conversa iniciada.</span>}
          </div>
        </div>
      </aside>
    </section>
  );
}
