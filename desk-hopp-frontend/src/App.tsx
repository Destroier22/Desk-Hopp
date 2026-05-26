import { useEffect, useState } from 'react';
import { api } from './services/api'; // Conexão Axios com o Back-end
import { Sidebar } from './components/Sidebar'; // Menu lateral
import { 
  RotateCw, Bell, BellOff, PlusCircle, X, 
  Play, Pause, Check, CornerUpLeft, MessageSquare, Clock 
} from 'lucide-react'; // Ícones operacionais do painel

// --- INTERFACES DO TYPESCRIPT (Contratos de Dados) ---
interface Apontamento {
  id: string;
  texto: string;
  segundosSessao: number;
  criadoEm: string;
}

interface Ticket {
  id: string;
  numero: number;
  assunto: string;
  descricao?: string;
  status: string;
  empresa: { nome: string };
  dispositivo?: { nome: string; tipo: string } | null;
  totalSegundos: number;
  apontamentos: Apontamento[]; 
  criadoEm: string;
  finalizadoEm: string | null; // Data de fechamento vinda da API
}

interface KanbanData {
  aFazer: Ticket[];
  atendendo: Ticket[];
  pausados: Ticket[];
  concluidosDoDia: Ticket[];
}

interface Empresa { id: string; nome: string; }
interface Dispositivo { id: string; nome: string; }
interface Categoria { id: string; nome: string; }

export default function App() {
  // --- ESTADO CENTRAL DO KANBAN ---
  const [kanban, setKanban] = useState<KanbanData>({
    aFazer: [], atendendo: [], pausados: [], concluidosDoDia: [],
  });
  
  // --- ESTADOS DE CONTROLE DE INTERFACE ---
  const [carregando, setCarregando] = useState(false); 
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true); 
  const [modalAberto, setModalAberto] = useState(false); 
  
  // --- ESTADOS PARA O MODAL FLUTUANTE DE APONTAMENTO ---
  const [modalApontamentoAberto, setModalApontamentoAberto] = useState(false);
  const [ticketParaApontar, setTicketParaApontar] = useState<{ id: string; novoStatus: string } | null>(null);
  const [textoApontamento, setTextoApontamento] = useState('');

  // --- ESTADOS DE ALIMENTAÇÃO DOS SELECTS ---
  const [listaEmpresas, setListaEmpresas] = useState<Empresa[]>([]); 
  const [listaDispositivos, setListaDispositivos] = useState<Dispositivo[]>([]); 
  const [listaCategorias, setListaCategorias] = useState<Categoria[]>([]); 

  // --- ESTADOS DOS INPUTS DE NOVO TICKET ---
  const [empresaSelecionadaId, setEmpresaSelecionadaId] = useState('');
  const [dispositivoSelecionadoId, setDispositivoSelecionadoId] = useState('');
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState('');
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');

  // --- FUNÇÃO 1: CARREGAR DADOS DO KANBAN ---
  const carregarTickets = async () => {
    try {
      setCarregando(true);
      const resposta = await api.get('/tickets/kanban');
      setKanban(resposta.data);
    } catch (error) {
      console.error("Erro ao buscar dados do Kanban:", error);
    } finally {
      setCarregando(false);
    }
  };

  // --- FUNÇÃO 2: POPULAR DROPDOWNS DO FORMULÁRIO ---
  const carregarDadosDoFormulario = async () => {
    try {
      const [resEmpresas, resCategorias] = await Promise.all([
        api.get('/empresas'),
        api.get('/categorias')
      ]);
      setListaEmpresas(resEmpresas.data);
      setListaCategorias(resCategorias.data);
    } catch (error) {
      console.error("Erro ao carregar dados do formulário:", error);
    }
  };

  // --- FUNÇÃO 3: CADASTRAR NOVO CHAMADO ---
  const salvarNovoTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assunto || !empresaSelecionadaId || !categoriaSelecionadaId) {
      alert("Por favor, preencha todos os campos obrigatórios (*): Empresa, Categoria e Assunto!");
      return;
    }

    try {
      await api.post('/tickets', {
        assunto,
        descricao,
        empresaId: empresaSelecionadaId,
        dispositivoId: dispositivoSelecionadoId || null,
        categoriaId: categoriaSelecionadaId
      });

      setAssunto('');
      setDescricao('');
      setEmpresaSelecionadaId('');
      setDispositivoSelecionadoId('');
      setCategoriaSelecionadaId('');
      
      setModalAberto(false);
      carregarTickets();
    } catch (error) {
      console.error("Erro ao criar novo ticket:", error);
      alert("Erro ao salvar o ticket.");
    }
  };

  // --- FUNÇÃO 4: INTERCEPTADOR DE STATUS ---
  // Abre o mini-modal se for Pausar ou Concluir para exigir a justificativa técnica
  const manipularMudancaStatus = (id: string, novoStatus: string) => {
    if (novoStatus === 'PAUSADOS' || novoStatus === 'CONCLUIDO') {
      setTicketParaApontar({ id, novoStatus });
      setTextoApontamento('');
      setModalApontamentoAberto(true);
    } else {
      executarTrocaStatus(id, novoStatus, ''); // Play ou Reabrir executam direto
    }
  };

  // --- FUNÇÃO 5: DISPARAR ATUALIZAÇÃO PARA A API (Corrigida Nomenclatura) ---
  const executarTrocaStatus = async (id: string, novoStatus: string, texto: string) => {
    try {
      await api.patch(`/tickets/${id}/status`, { novoStatus, texto });
      setModalApontamentoAberto(false);
      setTicketParaApontar(null);
      setTextoApontamento('');
      carregarTickets(); 
    } catch (error) {
      console.error("Erro ao alterar status do ticket:", error);
      alert("Erro ao processar a mudança no chamado.");
    }
  };

  // Envio da justificativa do mini-modal
  const salvarApontamentoESeguir = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoApontamento.trim()) {
      alert("Por favor, descreva o que foi executado nesta sessão!");
      return;
    }
    if (ticketParaApontar) {
      executarTrocaStatus(ticketParaApontar.id, ticketParaApontar.novoStatus, textoApontamento);
    }
  };

  // --- EFETUADORES (React Lifecycle) ---
  useEffect(() => { carregarTickets(); }, []);
  useEffect(() => { if (modalAberto) carregarDadosDoFormulario(); }, [modalAberto]);

  useEffect(() => {
    const buscarDispositivosDaEmpresa = async () => {
      if (!empresaSelecionadaId) {
        setListaDispositivos([]);
        setDispositivoSelecionadoId('');
        return;
      }
      try {
        const resposta = await api.get(`/empresas/${empresaSelecionadaId}/dispositivos`);
        setListaDispositivos(resposta.data);
        setDispositivoSelecionadoId('');
      } catch (error) {
        console.error("Erro ao buscar dispositivos da empresa:", error);
      }
    };
    buscarDispositivosDaEmpresa();
  }, [empresaSelecionadaId]);

  return (
    <div className="flex min-h-screen bg-[#121214] text-white select-none">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        {/* BARRA SUPERIOR */}
        <header className="mb-6 flex justify-between items-center text-xs text-gray-400">
          <div>
            <span>Dashboards • Tickets • <b className="text-white text-sm">Fluxo de Atendimento</b></span>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={() => setModalAberto(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-2 rounded flex items-center gap-1.5 shadow transition-colors cursor-pointer">
              <PlusCircle size={15} />
              <span>Novo Ticket</span>
            </button>

            <button onClick={carregarTickets} disabled={carregando} className="bg-[#202024] border border-gray-700 text-gray-300 p-2 rounded hover:bg-gray-700 transition-colors cursor-pointer flex items-center justify-center">
              <RotateCw size={15} className={carregando ? 'animate-spin text-blue-400' : ''} />
            </button>

            <button onClick={() => setNotificacoesAtivas(!notificacoesAtivas)} className={`border p-2 rounded transition-colors cursor-pointer flex items-center justify-center ${notificacoesAtivas ? 'bg-blue-600/20 border-blue-500 text-blue-400 hover:bg-blue-600/30' : 'bg-[#202024] border-gray-700 text-gray-500 hover:bg-gray-700'}`}>
              {notificacoesAtivas ? <Bell size={15} /> : <BellOff size={15} />}
            </button>
          </div>
        </header>

        {/* ESTRUTURA GRID DO KANBAN */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div className="bg-[#202024] p-4 rounded-lg border-t-4 border-red-500 flex flex-col min-h-[500px]">
            <h2 className="font-bold text-base mb-4 flex justify-between items-center text-red-400">
              <span>A FAZER</span> <span className="text-xl font-bold text-white">{kanban.aFazer.length}</span>
            </h2>
            <div className="space-y-3 flex-1">
              {kanban.aFazer.map(ticket => <CardTicket key={ticket.id} ticket={ticket} onMudarStatus={manipularMudancaStatus} />)}
            </div>
          </div>

          <div className="bg-[#202024] p-4 rounded-lg border-t-4 border-green-500 flex flex-col min-h-[500px]">
            <h2 className="font-bold text-base mb-4 flex justify-between items-center text-green-400">
              <span>ATENDENDO</span> <span className="text-xl font-bold text-white">{kanban.atendendo.length}</span>
            </h2>
            <div className="space-y-3 flex-1">
              {kanban.atendendo.map(ticket => <CardTicket key={ticket.id} ticket={ticket} onMudarStatus={manipularMudancaStatus} />)}
            </div>
          </div>

          <div className="bg-[#202024] p-4 rounded-lg border-t-4 border-yellow-500 flex flex-col min-h-[500px]">
            <h2 className="font-bold text-base mb-4 flex justify-between items-center text-yellow-400">
              <span>PAUSADOS</span> <span className="text-xl font-bold text-white">{kanban.pausados.length}</span>
            </h2>
            <div className="space-y-3 flex-1">
              {kanban.pausados.map(ticket => <CardTicket key={ticket.id} ticket={ticket} onMudarStatus={manipularMudancaStatus} />)}
            </div>
          </div>

          {/* 📝 CORREÇÃO 1: Nome alterado para "CONCLUÍDOS DO DIA" */}
          <div className="bg-[#202024] p-4 rounded-lg border-t-4 border-blue-400 flex flex-col min-h-[500px]">
            <h2 className="font-bold text-base mb-4 flex justify-between items-center text-blue-400">
              <span>CONCLUÍDOS DO DIA</span> <span className="text-xl font-bold text-white">{kanban.concluidosDoDia.length}</span>
            </h2>
            <div className="space-y-3 flex-1">
              {kanban.concluidosDoDia.map(ticket => <CardTicket key={ticket.id} ticket={ticket} onMudarStatus={manipularMudancaStatus} />)}
            </div>
          </div>

        </div>
      </main>

      {/* --- MODAL 1: ABRIR TICKET --- */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#1e1e24] border border-gray-800 rounded-lg w-full max-w-2xl p-6 relative shadow-2xl flex flex-col max-h-[90vh]">
            <button onClick={() => setModalAberto(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"><X size={20} /></button>
            <h2 className="text-lg font-bold text-white mb-6 border-b border-gray-800 pb-3 flex items-center gap-2">🎫 Ticket</h2>
            <form onSubmit={salvarNovoTicket} className="space-y-5 overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">SOLICITANTE / EMPRESA *</label>
                    <select value={empresaSelecionadaId} onChange={(e) => setEmpresaSelecionadaId(e.target.value)} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none" required>
                      <option value="">Selecione uma Empresa...</option>
                      {listaEmpresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">ASSUNTO *</label>
                    <input type="text" value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder="Assunto do chamado" className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">DESCRIÇÃO</label>
                    <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Insira seu texto aqui..." rows={5} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white resize-none text-xs" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">CATEGORIAS *</label>
                    <select value={categoriaSelecionadaId} onChange={(e) => setCategoriaSelecionadaId(e.target.value)} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none" required>
                      <option value="">Selecione a categoria...</option>
                      {listaCategorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">DISPOSITIVO</label>
                    <select value={dispositivoSelecionadoId} onChange={(e) => setDispositivoSelecionadoId(e.target.value)} disabled={!empresaSelecionadaId} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white disabled:opacity-40">
                      {!empresaSelecionadaId ? <option value="">Aguardando empresa...</option> : (
                        <>
                          <option value="">Selecione o dispositivo...</option>
                          {listaDispositivos.map(disp => <option key={disp.id} value={disp.id}>{disp.nome}</option>)}
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button type="button" onClick={() => setModalAberto(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs font-semibold cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow cursor-pointer">Abrir ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: APONTAMENTO TÉCNICO (FLUTUANTE) --- */}
      {modalApontamentoAberto && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#1e1e24] border-2 border-amber-600/30 rounded-lg w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">📝 Apontamento de Histórico</h3>
            <p className="text-xs text-gray-400 mb-4">Descreva detalhadamente o que foi executado antes de transicionar o status deste chamado.</p>
            <form onSubmit={salvarApontamentoESeguir} className="space-y-4">
              <textarea value={textoApontamento} onChange={(e) => setTextoApontamento(e.target.value)} placeholder="Ex: Efetuado a troca do conector RJ45 defeituoso e testado ping." rows={4} className="w-full bg-[#121214] border border-gray-700 rounded p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none" required autoFocus />
              <div className="flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => { setModalApontamentoAberto(false); setTicketParaApontar(null); }} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded shadow cursor-pointer">Gravar e Alterar Status</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTE INTERNO: CARD INDIVIDUAL DO TICKET ---
// 📝 CORREÇÃO 2: Exibe Aberto em e Fechado em (se houver) empilhados à esquerda
function CardTicket({ ticket, onMudarStatus }: { ticket: Ticket; onMudarStatus: (id: string, novoStatus: string) => void }) {
  
  const formatarTempoAcumulado = (segundosTotais: number) => {
    const horas = Math.floor(segundosTotais / 3600);
    const minutos = Math.floor((segundosTotais % 3600) / 60);
    const segundos = segundosTotais % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  };

  const formatarDataCompleta = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + 
           data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-[#2c2c34] p-4 rounded-md shadow border border-gray-800 flex flex-col justify-between group transition-all duration-200">
      <div>
        <div className="flex justify-between items-start mb-1.5">
          {/* BLOCO DE DATAS ALINHADO À ESQUERDA */}
          <div className="flex flex-col">
            <span className="text-xs font-bold text-yellow-500">
              #{ticket.numero} <span className="text-gray-300 font-normal">- {ticket.empresa.nome}</span>
            </span>
            <span className="text-[10px] text-gray-500 mt-0.5">Aberto em: {formatarDataCompleta(ticket.criadoEm)}</span>
            {ticket.finalizadoEm && (
              <span className="text-[10px] text-emerald-500 font-medium mt-0.5">Fechado em: {formatarDataCompleta(ticket.finalizadoEm)}</span>
            )}
          </div>
          
          {/* CRONÔMETRO NO TOPO DIREITO */}
          <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-[#121214] px-1.5 py-0.5 rounded" title="Tempo total gasto">
            <Clock size={10} className="text-amber-400" />
            <span>{formatarTempoAcumulado(ticket.totalSegundos)}</span>
          </div>
        </div>
        
        <h3 className="text-sm font-medium text-gray-200 mb-3 line-clamp-2 mt-1">{ticket.assunto}</h3>

        {/* TIMELINE / RELATÓRIO DO CHAMADO */}
        {ticket.apontamentos && ticket.apontamentos.length > 0 && (
          <div className="mt-2 mb-3 bg-[#1e1e24] p-2 rounded border border-gray-800 max-h-[110px] overflow-y-auto space-y-2 custom-scrollbar">
            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
              <MessageSquare size={9} /> Linha do Tempo / Histórico:
            </span>
            {ticket.apontamentos.map((apont, idx) => (
              <div key={apont.id} className="text-[10px] text-gray-400 border-l border-gray-700 pl-1.5 pb-0.5">
                <p className="text-gray-300 italic">" {apont.texto} "</p>
                <span className="text-[9px] text-gray-500 font-semibold block mt-0.5">
                  Etapa {idx + 1} • Gasto na sessão: {formatarTempoAcumulado(apont.segundosSessao)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RODAPÉ: Ativo + Ações do mouse (Hover) */}
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800/50 text-[11px] text-gray-400">
        <span className="truncate max-w-[120px]">{ticket.dispositivo ? ticket.dispositivo.nome : "Geral"}</span>
        
        <div className="flex items-center gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
          {ticket.status === 'A_FAZER' && (
            <button onClick={(e) => { e.stopPropagation(); onMudarStatus(ticket.id, 'ATENDENDO'); }} className="p-1 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white rounded transition-colors cursor-pointer" title="Iniciar Atendimento">
              <Play size={11} fill="currentColor" />
            </button>
          )}

          {ticket.status === 'ATENDENDO' && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onMudarStatus(ticket.id, 'PAUSADOS'); }} className="p-1 bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600 hover:text-white rounded transition-colors cursor-pointer" title="Pausar Chamado">
                <Pause size={11} fill="currentColor" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onMudarStatus(ticket.id, 'CONCLUIDO'); }} className="p-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded transition-colors cursor-pointer" title="Concluir Chamado">
                <Check size={11} />
              </button>
            </>
          )}

          {ticket.status === 'PAUSADOS' && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onMudarStatus(ticket.id, 'ATENDENDO'); }} className="p-1 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white rounded transition-colors cursor-pointer" title="Retomar Chamado">
                <Play size={11} fill="currentColor" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); onMudarStatus(ticket.id, 'CONCLUIDO'); }} className="p-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded transition-colors cursor-pointer" title="Concluir Chamado">
                <Check size={11} />
              </button>
            </>
          )}

          {ticket.status === 'CONCLUIDO' && (
            <button onClick={(e) => { e.stopPropagation(); onMudarStatus(ticket.id, 'A_FAZER'); }} className="p-1 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded transition-colors cursor-pointer" title="Reabrir Chamado">
              <CornerUpLeft size={11} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}