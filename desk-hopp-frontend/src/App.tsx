import { useEffect, useState } from 'react';
import { api } from './services/api';
import { Sidebar } from './components/Sidebar';
import { RotateCw, Bell, BellOff, PlusCircle, X } from 'lucide-react';

interface Ticket {
  id: string;
  numero: number;
  assunto: string;
  descricao?: string;
  status: string;
  empresa: { nome: string };
  dispositivo?: { nome: string; tipo: string } | null;
}

interface KanbanData {
  aFazer: Ticket[];
  atendendo: Ticket[];
  pausados: Ticket[];
  concluidosDoDia: Ticket[];
}

// Interfaces para os seletores dinâmicos
interface Empresa { id: string; nome: string; }
interface Dispositivo { id: string; nome: string; }
interface Categoria { id: string; nome: string; }

export default function App() {
  const [kanban, setKanban] = useState<KanbanData>({
    aFazer: [], atendendo: [], pausados: [], concluidosDoDia: [],
  });
  
  const [carregando, setCarregando] = useState(false);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState(true);

  // Estados de controle do Modal
  const [modalAberto, setModalAberto] = useState(false);
  
  // Listas vindas do Back-end
  const [listaEmpresas, setListaEmpresas] = useState<Empresa[]>([]);
  const [listaDispositivos, setListaDispositivos] = useState<Dispositivo[]>([]);
  const [listaCategorias, setListaCategorias] = useState<Categoria[]>([]);

  // Dados digitados/selecionados no formulário
  const [empresaSelecionadaId, setEmpresaSelecionadaId] = useState('');
  const [dispositivoSelecionadoId, setDispositivoSelecionadoId] = useState('');
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState('');
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');

  // Carrega os dados iniciais do Kanban
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

  // Carrega Empresas e Categorias assim que o Modal Abre
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

  useEffect(() => { 
    carregarTickets(); 
  }, []);

  useEffect(() => {
    if (modalAberto) {
      carregarDadosDoFormulario();
    }
  }, [modalAberto]);

  // 🔥 Efeito Mágico: Monitora a empresa escolhida. Se mudar, busca apenas os dispositivos dela!
  useEffect(() => {
    const buscarDispositivosDaEmpresa = async () => {
      if (!empresaSelecionadaId) {
        setListaDispositivos([]); // Limpa se não houver empresa
        setDispositivoSelecionadoId('');
        return;
      }
      try {
        const resposta = await api.get(`/empresas/${empresaSelecionadaId}/dispositivos`);
        setListaDispositivos(resposta.data);
        setDispositivoSelecionadoId(''); // reseta a seleção anterior
      } catch (error) {
        console.error("Erro ao buscar dispositivos da empresa:", error);
      }
    };

    buscarDispositivosDaEmpresa();
  }, [empresaSelecionadaId]);

  // Envia o Ticket preenchido para o Back-end
  const salvarNovoTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assunto || !empresaSelecionadaId) {
      alert("Por favor, preencha os campos obrigatórios (*)");
      return;
    }

    try {
      await api.post('/tickets', {
        assunto,
        descricao,
        empresaId: empresaSelecionadaId, // enviando a relação correta por ID
        dispositivoId: dispositivoSelecionadoId || null,
        categoriaId: categoriaSelecionadaId || null
      });

      // Limpa os estados
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

  return (
    <div className="flex min-h-screen bg-[#121214] text-white">
      <Sidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        <header className="mb-6 flex justify-between items-center text-xs text-gray-400">
          <div>
            <span>Dashboards • Tickets • <b className="text-white text-sm">Fluxo de Atendimento</b></span>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setModalAberto(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-2 rounded flex items-center gap-1.5 shadow transition-colors cursor-pointer"
            >
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

        {/* Kanban Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* A FAZER */}
          <div className="bg-[#202024] p-4 rounded-lg border-t-4 border-red-500 flex flex-col min-h-[500px]">
            <h2 className="font-bold text-base mb-4 flex justify-between items-center text-red-400">
              <span>A FAZER</span> <span className="text-xl font-bold text-white">{kanban.aFazer.length}</span>
            </h2>
            <div className="space-y-3 flex-1">{kanban.aFazer.map(ticket => <CardTicket key={ticket.id} ticket={ticket} />)}</div>
          </div>
          {/* ATENDENDO */}
          <div className="bg-[#202024] p-4 rounded-lg border-t-4 border-green-500 flex flex-col min-h-[500px]">
            <h2 className="font-bold text-base mb-4 flex justify-between items-center text-green-400">
              <span>ATENDENDO</span> <span className="text-xl font-bold text-white">{kanban.atendendo.length}</span>
            </h2>
            <div className="space-y-3 flex-1">{kanban.atendendo.map(ticket => <CardTicket key={ticket.id} ticket={ticket} />)}</div>
          </div>
          {/* PAUSADOS */}
          <div className="bg-[#202024] p-4 rounded-lg border-t-4 border-yellow-500 flex flex-col min-h-[500px]">
            <h2 className="font-bold text-base mb-4 flex justify-between items-center text-yellow-400">
              <span>PAUSADOS</span> <span className="text-xl font-bold text-white">{kanban.pausados.length}</span>
            </h2>
            <div className="space-y-3 flex-1">{kanban.pausados.map(ticket => <CardTicket key={ticket.id} ticket={ticket} />)}</div>
          </div>
          {/* CONCLUÍDOS */}
          <div className="bg-[#202024] p-4 rounded-lg border-t-4 border-blue-400 flex flex-col min-h-[500px]">
            <h2 className="font-bold text-base mb-4 flex justify-between items-center text-blue-400">
              <span>ÚLTIMA INTERAÇÃO CLIENTE</span> <span className="text-xl font-bold text-white">{kanban.concluidosDoDia.length}</span>
            </h2>
            <div className="space-y-3 flex-1">{kanban.concluidosDoDia.map(ticket => <CardTicket key={ticket.id} ticket={ticket} />)}</div>
          </div>
        </div>
      </main>

      {/* --- DESIGN DO MODAL BASEADO NO MILVUS --- */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#1e1e24] border border-gray-800 rounded-lg w-full max-w-2xl p-6 relative shadow-2xl flex flex-col max-h-[90vh]">
            
            <button onClick={() => setModalAberto(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer">
              <X size={20} />
            </button>

            <h2 className="text-lg font-bold text-white mb-6 border-b border-gray-800 pb-3 flex items-center gap-2">
              🎫 Ticket
            </h2>

            <form onSubmit={salvarNovoTicket} className="space-y-5 overflow-y-auto flex-1 pr-1">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lado Esquerdo do Painel */}
                <div className="space-y-4">
                  {/* Solicitante (Empresas) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">SOLICITANTE / EMPRESA *</label>
                    <select
                      value={empresaSelecionadaId}
                      onChange={(e) => setEmpresaSelecionadaId(e.target.value)}
                      className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      required
                    >
                      <option value="">Selecione ou Pesquise uma Empresa...</option>
                      {listaEmpresas.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Assunto */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">ASSUNTO *</label>
                    <input 
                      type="text" 
                      value={assunto}
                      onChange={(e) => setAssunto(e.target.value)}
                      placeholder="Assunto do chamado"
                      className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">DESCRIÇÃO</label>
                    <textarea 
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Insira seu texto aqui..."
                      rows={5}
                      className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500 resize-none text-xs"
                    />
                  </div>
                </div>

                {/* Lado Direito do Painel */}
                <div className="space-y-4">
                  {/* Categorias (Dinâmico do Banco) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">CATEGORIAS</label>
                    <select
                      value={categoriaSelecionadaId}
                      onChange={(e) => setCategoriaSelecionadaId(e.target.value)}
                      className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Selecione a categoria...</option>
                      {listaCategorias.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.nome}</option>
                      ))}
                    </select>
                  </div>

                  {/* Dispositivo (Inteligente - Bloqueado até escolher a Empresa) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">DISPOSITIVO</label>
                    <select
                      value={dispositivoSelecionadoId}
                      onChange={(e) => setDispositivoSelecionadoId(e.target.value)}
                      disabled={!empresaSelecionadaId}
                      className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {!empresaSelecionadaId ? (
                        <option value="">Aguardando seleção de empresa...</option>
                      ) : (
                        <>
                          <option value="">Selecione o dispositivo...</option>
                          {listaDispositivos.map(disp => (
                            <option key={disp.id} value={disp.id}>{disp.nome}</option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Rodapé do Modal */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button 
                  type="button" 
                  onClick={() => setModalAberto(false)} 
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold shadow cursor-pointer"
                >
                  Abrir ticket
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CardTicket({ ticket }: { ticket: Ticket }) {
  return (
    <div className="bg-[#2c2c34] p-4 rounded-md shadow hover:bg-[#32323c] transition-colors cursor-pointer border border-gray-800 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-yellow-500">
            #{ticket.numero} <span className="text-gray-300 font-normal">- {ticket.empresa.nome}</span>
          </span>
        </div>
        <h3 className="text-sm font-medium text-gray-200 mb-2 line-clamp-2">{ticket.assunto}</h3>
      </div>
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800/50 text-[11px] text-gray-400">
        <span>{ticket.dispositivo ? ticket.dispositivo.nome : "Geral"}</span>
        <span>25/05/2026</span>
      </div>
    </div>
  );
}