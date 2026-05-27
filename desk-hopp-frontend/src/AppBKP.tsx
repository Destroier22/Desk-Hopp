import { useEffect, useState, useCallback } from 'react';
import { api } from './services/api'; // Conexão Axios com o Back-end
import { Sidebar } from './components/Sidebar'; // Menu lateral
import { 
  RotateCw, Bell, BellOff, PlusCircle, X, 
  Play, Pause, Check, CornerUpLeft, MessageSquare, Clock,
  RefreshCw, User, Edit3, Save
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
  solicitante: string; 
  status: string;
  empresaId: string;
  categoriaId: string;
  dispositivoId?: string | null;
  empresa: { nome: string };
  categoria: { nome: string }; 
  dispositivo?: { nome: string; tipo: string } | null;
  totalSegundos: number;
  apontamentos: Apontamento[]; 
  criadoEm: string;
  finalizadoEm: string | null;
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
  const [modalAberto, setModalAberto] = useState(false); 

  // 💾 [INTEGRAÇÃO LOCALSTORAGE]: Lê a preferência salva de notificações (padrão true se não houver)
  const [notificacoesAtivas, setNotificacoesAtivas] = useState<boolean>(() => {
    const salvo = localStorage.getItem('deskhopp:notificacoes');
    return salvo ? JSON.parse(salvo) : true;
  }); 

  // 💾 [INTEGRAÇÃO LOCALSTORAGE]: Lê a preferência salva de auto-refresh (padrão false se não houver)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(() => {
    const salvo = localStorage.getItem('deskhopp:autorefresh');
    return salvo ? JSON.parse(salvo) : false;
  });

  // --- ESTADOS DO MODAL DE DETALHES FLUTUANTE ---
  const [ticketSelecionado, setTicketSelecionado] = useState<Ticket | null>(null);
  const [modoEdicao, setModoEdicao] = useState(false);

  // --- ESTADOS PARA O MODAL DE JUSTIFICATIVA TÉCNICA ---
  const [modalApontamentoAberto, setModalApontamentoAberto] = useState(false);
  const [ticketParaApontar, setTicketParaApontar] = useState<{ id: string; novoStatus: string } | null>(null);
  const [textoApontamento, setTextoApontamento] = useState('');

  // --- ESTADOS DE ALIMENTAÇÃO DOS SELECTS ---
  const [listaEmpresas, setListaEmpresas] = useState<Empresa[]>([]); 
  const [listaDispositivos, setListaDispositivos] = useState<Dispositivo[]>([]); 
  const [listaCategorias, setListaCategorias] = useState<Categoria[]>([]); 

  // --- ESTADOS DOS INPUTS DE CADASTRO / EDIÇÃO ---
  const [empresaSelecionadaId, setEmpresaSelecionadaId] = useState('');
  const [dispositivoSelecionadoId, setDispositivoSelecionadoId] = useState('');
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState('');
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [solicitante, setSolicitante] = useState(''); 

  // --- FUNÇÃO 1: CARREGAR DADOS DO KANBAN ---
  const carregarTickets = useCallback(async () => {
    try {
      setCarregando(true);
      const resposta = await api.get('/tickets/kanban');
      setKanban(resposta.data);
      
      // Sincroniza apenas o status e apontamentos em tempo real para não quebrar a digitação do usuário
      if (ticketSelecionado) {
        const todos = [...resposta.data.aFazer, ...resposta.data.atendendo, ...resposta.data.pausados, ...resposta.data.concluidosDoDia];
        const atualizado = todos.find(t => t.id === ticketSelecionado.id);
        if (atualizado) {
          setTicketSelecionado(prev => prev ? { 
            ...prev, 
            status: atualizado.status, 
            totalSegundos: atualizado.totalSegundos, 
            apontamentos: atualizado.apontamentos 
          } : null);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar dados do Kanban:", error);
    } finally {
      setCarregando(false);
    }
  }, [ticketSelecionado]);

  // --- EFETUADOR DO REFRESH AUTOMÁTICO (5 MINUTOS) ---
  useEffect(() => {
    if (!autoRefresh) return;
    const timerIntervalo = setInterval(() => {
      carregarTickets();
    }, 5 * 60 * 1000);
    return () => clearInterval(timerIntervalo);
  }, [autoRefresh, carregarTickets]);

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
    if (!assunto || !empresaSelecionadaId || !categoriaSelecionadaId || !solicitante) {
      alert("Por favor, preencha todos os campos obrigatórios (*)");
      return;
    }
    try {
      await api.post('/tickets', {
        assunto, descricao, solicitante,
        empresaId: empresaSelecionadaId,
        dispositivoId: dispositivoSelecionadoId || null,
        categoriaId: categoriaSelecionadaId
      });
      setAssunto(''); setDescricao(''); setEmpresaSelecionadaId(''); setDispositivoSelecionadoId(''); setCategoriaSelecionadaId(''); setSolicitante('');
      setModalAberto(false);
      carregarTickets();
    } catch (error) {
      console.error(error);
    }
  };

  // --- FUNÇÃO 4: GERENCIAMENTO DE ABERTURA DO MODAL DETALHADO ---
  const abrirDetalhesTicket = async (ticket: Ticket) => {
    setTicketSelecionado(ticket);
    setAssunto(ticket.assunto);
    setDescricao(ticket.descricao || '');
    setSolicitante(ticket.solicitante);
    setCategoriaSelecionadaId(ticket.categoriaId);
    setEmpresaSelecionadaId(ticket.empresaId); 
    setDispositivoSelecionadoId(ticket.dispositivoId || '');
    setModoEdicao(false);
    await carregarDadosDoFormulario();
  };

  // --- FUNÇÃO 5: COMPORTAMENTO DE FECHAMENTO SEGURO ---
  const fecharDetalhesTicket = () => {
    setTicketSelecionado(null);
    setModoEdicao(false);
    setAssunto('');
    setDescricao('');
    setSolicitante('');
    setCategoriaSelecionadaId('');
    setEmpresaSelecionadaId('');
    setDispositivoSelecionadoId('');
  };

  // --- FUNÇÃO 6: SALVAR EDIÇÃO REALIZADA DENTRO DO MODAL ---
  const salvarEdicaoTicket = async () => {
    if (!ticketSelecionado) return;
    try {
      const resposta = await api.put(`/tickets/${ticketSelecionado.id}`, {
        assunto,
        descricao,
        solicitante,
        categoriaId: categoriaSelecionadaId,
        dispositivoId: dispositivoSelecionadoId || null
      });
      
      setTicketSelecionado(resposta.data);
      setModoEdicao(false);
      carregarTickets();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar modificações.");
    }
  };

  // --- FUNÇÃO 7: INTERCEPTADOR DE MUDANÇA DE STATUS ---
  const manipularMudancaStatus = (id: string, novoStatus: string) => {
    if (novoStatus === 'PAUSADOS' || novoStatus === 'CONCLUIDO') {
      setTicketParaApontar({ id, novoStatus });
      setTextoApontamento('');
      setModalApontamentoAberto(true);
    } else {
      executarTrocaStatus(id, novoStatus, ''); 
    }
  };

  const executarTrocaStatus = async (id: string, novoStatus: string, texto: string) => {
    try {
      await api.patch(`/tickets/${id}/status`, { novoStatus, texto });
      setModalApontamentoAberto(false);
      setTicketParaApontar(null);
      setTextoApontamento('');
      carregarTickets(); 
    } catch (error) {
      console.error(error);
    }
  };

  const salvarApontamentoESeguir = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textoApontamento.trim()) return alert("Por favor, informe a justificativa técnica!");
    if (ticketParaApontar) executarTrocaStatus(ticketParaApontar.id, ticketParaApontar.novoStatus, textoApontamento);
  };

  // --- LIFECYCLE MONITORING EFFECTS ---
  useEffect(() => { carregarTickets(); }, []); 
  useEffect(() => { if (modalAberto) carregarDadosDoFormulario(); }, [modalAberto]);

  useEffect(() => {
    const buscarDispositivosDaEmpresa = async () => {
      if (!empresaSelecionadaId) { setListaDispositivos([]); return; }
      try {
        const resposta = await api.get(`/empresas/${empresaSelecionadaId}/dispositivos`);
        setListaDispositivos(resposta.data);
      } catch (error) {
        console.error(error);
      }
    };
    buscarDispositivosDaEmpresa();
  }, [empresaSelecionadaId]);

  // 💾 [EFEITO LOCALSTORAGE]: Grava mudanças do Auto-Refresh no navegador
  useEffect(() => {
    localStorage.setItem('deskhopp:autorefresh', JSON.stringify(autoRefresh));
  }, [autoRefresh]);

  // 💾 [EFEITO LOCALSTORAGE]: Grava mudanças das Notificações no navegador
  useEffect(() => {
    localStorage.setItem('deskhopp:notificacoes', JSON.stringify(notificacoesAtivas));
  }, [notificacoesAtivas]);

  return (
    <div className="flex min-h-screen bg-[#121214] text-white select-none">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        {/* BARRA SUPERIOR */}
        <header className="mb-6 flex justify-between items-center text-xs text-gray-400">
          <div><span>Dashboards • Tickets • <b className="text-white text-sm">Fluxo de Atendimento</b></span></div>
          <div className="flex items-center gap-3">
            <button onClick={() => setAutoRefresh(!autoRefresh)} className={`flex items-center gap-2 px-3 py-2 rounded font-semibold text-xs border cursor-pointer transition-all ${autoRefresh ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500' : 'bg-[#202024] border-gray-700'}`}>
              <RefreshCw size={14} className={`${autoRefresh ? 'animate-spin' : ''}`} />
              <span>Auto-Refresh: <strong>{autoRefresh ? "LIGADO" : "DESLIGADO"}</strong></span>
            </button>
            <button onClick={() => { setModalAberto(true); setEmpresaSelecionadaId(''); }} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-2 rounded flex items-center gap-1.5 shadow cursor-pointer">
              <PlusCircle size={15} /><span>Novo Ticket</span>
            </button>
            <button onClick={carregarTickets} disabled={carregando} className="bg-[#202024] border border-gray-700 text-gray-300 p-2 rounded hover:bg-gray-700 cursor-pointer">
              <RotateCw size={15} className={carregando ? 'animate-spin text-blue-400' : ''} />
            </button>
            <button onClick={() => setNotificacoesAtivas(!notificacoesAtivas)} className={`border p-2 rounded cursor-pointer ${notificacoesAtivas ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#202024] border-gray-700 text-gray-500'}`}>
              {notificacoesAtivas ? <Bell size={15} /> : <BellOff size={15} />}
            </button>
          </div>
        </header>

        {/* ESTRUTURA GRID DO KANBAN */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#202024] p-4 rounded-lg border-t-4 border-red-500 flex flex-col min-h-[500px]">
            <h2 className="font-bold text-base mb-4 flex justify-between items-center text-red-400"><span>A FAZER</span> <span className="text-xl text-white">{kanban.aFazer.length}</span></h2>
            <div className="space-y-3 flex-1">
              {kanban.aFazer.map(ticket => <CardTicket key={ticket.id} ticket={ticket} onAbrirDetalhes={abrirDetalhesTicket} />)}
            </div>
          </div>
          <div className="bg-[#202024] p-4 rounded-lg border-t-4 border-green-500 flex flex-col min-h-[500px]">
            <h2 className="font-bold text-base mb-4 flex justify-between items-center text-green-400"><span>ATENDENDO</span> <span className="text-xl text-white">{kanban.atendendo.length}</span></h2>
            <div className="space-y-3 flex-1">
              {kanban.atendendo.map(ticket => <CardTicket key={ticket.id} ticket={ticket} onAbrirDetalhes={abrirDetalhesTicket} />)}
            </div>
          </div>
          <div className="bg-[#202024] p-4 rounded-lg border-t-4 border-yellow-500 flex flex-col min-h-[500px]">
            <h2 className="font-bold text-base mb-4 flex justify-between items-center text-yellow-400"><span>PAUSADOS</span> <span className="text-xl text-white">{kanban.pausados.length}</span></h2>
            <div className="space-y-3 flex-1">
              {kanban.pausados.map(ticket => <CardTicket key={ticket.id} ticket={ticket} onAbrirDetalhes={abrirDetalhesTicket} />)}
            </div>
          </div>
          <div className="bg-[#202024] p-4 rounded-lg border-t-4 border-blue-400 flex flex-col min-h-[500px]">
            <h2 className="font-bold text-base mb-4 flex justify-between items-center text-blue-400"><span>CONCLUÍDOS DO DIA</span> <span className="text-xl text-white">{kanban.concluidosDoDia.length}</span></h2>
            <div className="space-y-3 flex-1">
              {kanban.concluidosDoDia.map(ticket => <CardTicket key={ticket.id} ticket={ticket} onAbrirDetalhes={abrirDetalhesTicket} />)}
            </div>
          </div>
        </div>
      </main>

      {/* --- MODAL 1: CRIAÇÃO DE NOVO CHAMADO --- */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#1e1e24] border border-gray-800 rounded-lg w-full max-w-2xl p-6 relative shadow-2xl flex flex-col max-h-[90vh]">
            <button onClick={() => setModalAberto(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"><X size={20} /></button>
            <h2 className="text-lg font-bold text-white mb-6 border-b border-gray-800 pb-3">🎫 Novo Ticket</h2>
            <form onSubmit={salvarNovoTicket} className="space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">SOLICITANTE / EMPRESA *</label>
                    <select value={empresaSelecionadaId} onChange={(e) => setEmpresaSelecionadaId(e.target.value)} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none" required>
                      <option value="">Selecione uma Empresa...</option>
                      {listaEmpresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">RESPONSÁVEL / SOLICITANTE NOME *</label>
                    <input type="text" value={solicitante} onChange={(e) => setSolicitante(e.target.value)} placeholder="Ex: João Silva" className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">ASSUNTO *</label>
                    <input type="text" value={assunto} onChange={(e) => setAssunto(e.target.value)} placeholder="Assunto do chamado" className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none" required />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">CATEGORIAS *</label>
                    <select value={categoriaSelecionadaId} onChange={(e) => setCategoriaSelecionadaId(e.target.value)} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none" required>
                      <option value="">Selecione a categoria...</option>
                      {listaCategorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">DISPOSITIVO / ATIVO</label>
                    <select value={dispositivoSelecionadoId} onChange={(e) => setDispositivoSelecionadoId(e.target.value)} disabled={!empresaSelecionadaId} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white disabled:opacity-40 focus:outline-none">
                      <option value="">Selecione o dispositivo...</option>
                      {listaDispositivos.map(disp => <option key={disp.id} value={disp.id}>{disp.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">DESCRIÇÃO INICIAL</label>
                    <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Detalhes preliminares..." rows={3} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-xs text-white resize-none focus:outline-none" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
                <button type="button" onClick={() => setModalAberto(false)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs font-semibold cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold cursor-pointer">Abrir ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: JANELA FLUTUANTE DE DETALHES --- */}
      {ticketSelecionado && (
        <div 
          onClick={fecharDetalhesTicket} 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-[#1e1e24] border border-gray-700 rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* CABEÇALHO */}
            <div className="bg-[#25252c] p-4 border-b border-gray-800 flex justify-between items-center">
              <div>
                <span className="text-amber-500 font-bold text-sm">#{ticketSelecionado.numero}</span>
                <span className="text-gray-400 text-xs ml-2">• Empresa vinculada: <strong className="text-white">{ticketSelecionado.empresa.nome}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setModoEdicao(!modoEdicao)} className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer border ${modoEdicao ? 'bg-amber-600/20 text-amber-400 border-amber-500' : 'bg-gray-800 text-gray-300 border-transparent hover:bg-gray-700'}`}>
                  <Edit3 size={13} /> {modoEdicao ? "Sair da Edição" : "Editar Dados"}
                </button>
                <button onClick={fecharDetalhesTicket} className="text-gray-400 hover:text-white cursor-pointer"><X size={20} /></button>
              </div>
            </div>

            {/* CORPO DE INFORMAÇÕES INTERNAS */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-5 gap-6">
              
              {/* BLOCO FORMULÁRIO */}
              <div className="md:col-span-3 space-y-4 border-r border-gray-800/60 pr-4">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Assunto do Chamado</label>
                  <input type="text" value={assunto} onChange={(e) => setAssunto(e.target.value)} disabled={!modoEdicao} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white disabled:opacity-60 disabled:bg-transparent focus:outline-none focus:border-blue-500" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Responsável / Solicitante</label>
                    <input type="text" value={solicitante} onChange={(e) => setSolicitante(e.target.value)} disabled={!modoEdicao} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white disabled:opacity-60 disabled:bg-transparent focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Categoria de Serviço</label>
                    <select value={categoriaSelecionadaId} onChange={(e) => setCategoriaSelecionadaId(e.target.value)} disabled={!modoEdicao} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white disabled:opacity-60 disabled:bg-transparent focus:outline-none focus:border-blue-500">
                      {listaCategorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Dispositivo Relacionado</label>
                  <select value={dispositivoSelecionadoId} onChange={(e) => setDispositivoSelecionadoId(e.target.value)} disabled={!modoEdicao} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white disabled:opacity-60 disabled:bg-transparent focus:outline-none focus:border-blue-500">
                    <option value="">Nenhum dispositivo associado</option>
                    {listaDispositivos.map(disp => <option key={disp.id} value={disp.id}>{disp.nome}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Descrição</label>
                  <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} disabled={!modoEdicao} rows={4} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-xs text-white disabled:opacity-60 disabled:bg-transparent resize-none focus:outline-none focus:border-blue-500" />
                </div>

                {modoEdicao && (
                  <button onClick={salvarEdicaoTicket} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all">
                    <Save size={14} /> Salvar Modificações do Chamado
                  </button>
                )}
              </div>

              {/* PAINEL OPERACIONAL */}
              <div className="md:col-span-2 flex flex-col justify-between space-y-4">
                <div className="bg-[#121214] p-4 rounded border border-gray-800">
                  <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-2">Painel de Operações</span>
                  
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400">Status Atual:</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${ticketSelecionado.status === 'ATENDENDO' ? 'bg-green-500/20 text-green-400' : ticketSelecionado.status === 'PAUSADOS' ? 'bg-yellow-500/20 text-yellow-400' : ticketSelecionado.status === 'CONCLUIDO' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                      {ticketSelecionado.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {(ticketSelecionado.status === 'A_FAZER' || ticketSelecionado.status === 'PAUSADOS') && (
                      <button onClick={() => manipularMudancaStatus(ticketSelecionado.id, 'ATENDENDO')} className="py-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded flex items-center justify-center gap-1.5 cursor-pointer col-span-2">
                        <Play size={13} fill="currentColor" /> Iniciar / Retomar
                      </button>
                    )}
                    {ticketSelecionado.status === 'ATENDENDO' && (
                      <>
                        <button onClick={() => manipularMudancaStatus(ticketSelecionado.id, 'PAUSADOS')} className="py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-xs rounded flex items-center justify-center gap-1.5 cursor-pointer">
                          <Pause size={13} fill="currentColor" /> Pausar
                        </button>
                        <button onClick={() => manipularMudancaStatus(ticketSelecionado.id, 'CONCLUIDO')} className="py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded flex items-center justify-center gap-1.5 cursor-pointer">
                          <Check size={13} /> Concluir
                        </button>
                      </>
                    )}
                    {ticketSelecionado.status === 'CONCLUIDO' && (
                      <button onClick={() => manipularMudancaStatus(ticketSelecionado.id, 'A_FAZER')} className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xs rounded flex items-center justify-center gap-1.5 cursor-pointer col-span-2">
                        <CornerUpLeft size={13} /> Reabrir Chamado
                      </button>
                    )}
                  </div>
                </div>

                {/* TIMELINE */}
                <div className="flex-1 bg-[#121214] p-3 rounded border border-gray-800 flex flex-col overflow-hidden">
                  <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider flex items-center gap-1 mb-2">
                    <MessageSquare size={11} /> Linha do Tempo Técnica
                  </span>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[220px]">
                    {ticketSelecionado.apontamentos && ticketSelecionado.apontamentos.length > 0 ? (
                      ticketSelecionado.apontamentos.map((apont, idx) => (
                        <div key={apont.id} className="text-[11px] border-l-2 border-gray-700 pl-2">
                          <p className="text-gray-300 italic">"{apont.texto}"</p>
                          <span className="text-[9px] text-gray-500 block mt-1">Etapa {idx+1} • Lançamento de {Math.floor(apont.segundosSessao / 60)} min</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-gray-600 block text-center pt-8">Nenhum histórico lançado nesta sessão.</span>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- MODAL 4: MINI-JUSTIFICATIVA OBRIGATÓRIA --- */}
      {modalApontamentoAberto && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#1e1e24] border-2 border-amber-600/30 rounded-lg w-full max-w-md p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">📝 Justificativa Técnica</h3>
            <form onSubmit={salvarApontamentoESeguir} className="space-y-4">
              <textarea value={textoApontamento} onChange={(e) => setTextoApontamento(e.target.value)} placeholder="O que você realizou nesta etapa de atendimento?" rows={4} className="w-full bg-[#121214] border border-gray-700 rounded p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none" required autoFocus />
              <div className="flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => { setModalApontamentoAberto(false); setTicketParaApontar(null); }} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded cursor-pointer">Gravar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// --- SUB-COMPONENTE INTERNO: CARD INDIVIDUAL DE EXIBIÇÃO NO KANBAN ---
function CardTicket({ ticket, onAbrirDetalhes }: { ticket: Ticket; onAbrirDetalhes: (ticket: Ticket) => void }) {
  
  const formatarTempoAcumulado = (segundosTotais: number) => {
    const horas = Math.floor(segundosTotais / 3600);
    const minutos = Math.floor((segundosTotais % 3600) / 60);
    const segundos = segundosTotais % 60;
    return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      onClick={(e) => {
        e.stopPropagation(); 
        onAbrirDetalhes(ticket);
      }} 
      className="bg-[#2c2c34] p-3.5 rounded-md shadow border border-gray-800/80 hover:border-gray-600 cursor-pointer transition-all duration-150 flex flex-col gap-2 group"
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-yellow-500">#{ticket.numero}</span>
          <span className="text-[11px] font-semibold text-gray-100">{ticket.empresa.nome}</span>
        </div>
        
        <div className="flex items-center gap-1 text-[10px] text-gray-400 bg-[#121214] px-1.5 py-0.5 rounded font-mono">
          <Clock size={10} className={ticket.status === 'ATENDENDO' ? 'text-green-400 animate-pulse' : 'text-amber-400'} />
          <span>{formatarTempoAcumulado(ticket.totalSegundos)}</span>
        </div>
      </div>

      <h3 className="text-xs font-medium text-gray-300 line-clamp-2 leading-relaxed">{ticket.assunto}</h3>

      <div className="flex justify-between items-center pt-2 mt-1 border-t border-gray-800/60 text-[10px] text-gray-400">
        <div className="flex items-center gap-1 text-gray-300 truncate max-w-[120px]" title="Responsável / Solicitante">
          <User size={10} className="text-blue-400 flex-shrink-0" />
          <span className="truncate">{ticket.solicitante}</span>
        </div>
        <span className="bg-[#121214] text-gray-400 px-1.5 py-0.5 rounded text-[9px] font-medium tracking-wide max-w-[90px] truncate">
          {ticket.categoria?.nome || 'Geral'}
        </span>
      </div>
    </div>
  );
}