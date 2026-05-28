import { useEffect, useState, useCallback } from 'react';
import { api } from './services/api'; // Conexão Axios com o Back-end
import { Sidebar } from './components/Sidebar'; // Menu lateral
import {
  RotateCw, Bell, BellOff, PlusCircle, X,
  Play, Pause, Check, CornerUpLeft, MessageSquare, Clock,
  RefreshCw, User, Edit3, Save, Paperclip, LogIn, Mail, Lock, LogOut, Image, DollarSign
} from 'lucide-react'; // Ícones operacionais do painel


// --- INTERFACES DO TYPESCRIPT (Contratos de Dados) ---
interface Apontamento {
  id: string;
  texto: string;
  segundosSessao: number;
  criadoEm: string;
  imagemBase64?: string | null;
  imagemNome?: string | null;
  imagemTipo?: string | null;
}

interface Ticket {
  id: string;
  numero: number;
  assunto: string;
  descricao?: string;
  solicitante: string;
  operador?: string | null;
  status: string;
  empresaId: string;
  categoriaId: string;
  dispositivoId?: string | null;
  empresa: { nome: string };
  categoria: { nome: string };
  dispositivo?: { nome: string; tipo: string } | null;
  totalSegundos: number;
  valorCobrancaAvulsa?: number | null;
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
interface UsuarioLogado { id: string; nomeUsuario: string; email: string; tipoUsuario: string; }

const formatarTempoAcumulado = (segundosTotais: number) => {
  const horas = Math.floor(segundosTotais / 3600);
  const minutos = Math.floor((segundosTotais % 3600) / 60);
  const segundos = segundosTotais % 60;
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
};

const formatarTempoRelatorio = (segundosTotais: number) => {
  const horas = Math.floor(segundosTotais / 3600);
  const minutos = Math.floor((segundosTotais % 3600) / 60);
  const segundos = segundosTotais % 60;
  return `${formatarTempoAcumulado(segundosTotais)} (${horas}h ${minutos}min ${segundos}s)`;
};

const formatarDataRelatorio = (data?: string | null) => {
  if (!data) return 'Nao informado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data));
};

const formatarMoeda = (valor?: number | null) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(valor || 0);

const escaparHtml = (valor?: string | number | null) => String(valor ?? 'Nao informado')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

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
  const [imagemApontamento, setImagemApontamento] = useState<{ base64: string; nome: string; tipo: string } | null>(null);
  const [modalCobrancaAberto, setModalCobrancaAberto] = useState(false);
  const [valorCobranca, setValorCobranca] = useState('');

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

  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogado | null>(() => {
    const salvo = localStorage.getItem('deskhopp:usuario');
    return salvo ? JSON.parse(salvo) : null;
  });
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [loginCarregando, setLoginCarregando] = useState(false);
  const [loginErro, setLoginErro] = useState('');

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
            apontamentos: atualizado.apontamentos,
            finalizadoEm: atualizado.finalizadoEm,
            operador: atualizado.operador,
            valorCobrancaAvulsa: atualizado.valorCobrancaAvulsa
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
        categoriaId: categoriaSelecionadaId,
        operador: usuarioLogado?.nomeUsuario
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
      setImagemApontamento(null);
      setModalApontamentoAberto(true);
    } else {
      executarTrocaStatus(id, novoStatus, '');
    }
  };

  const executarTrocaStatus = async (id: string, novoStatus: string, texto: string) => {
    try {
      await api.patch(`/tickets/${id}/status`, {
        novoStatus,
        texto,
        operador: usuarioLogado?.nomeUsuario,
        imagemBase64: imagemApontamento?.base64,
        imagemNome: imagemApontamento?.nome,
        imagemTipo: imagemApontamento?.tipo,
      });
      setModalApontamentoAberto(false);
      setTicketParaApontar(null);
      setTextoApontamento('');
      setImagemApontamento(null);
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

  const selecionarImagemApontamento = (arquivo?: File) => {
    if (!arquivo) {
      setImagemApontamento(null);
      return;
    }

    if (!arquivo.type.startsWith('image/')) {
      alert('Selecione apenas arquivos de imagem.');
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => {
      setImagemApontamento({
        base64: String(leitor.result),
        nome: arquivo.name,
        tipo: arquivo.type,
      });
    };
    leitor.readAsDataURL(arquivo);
  };

  const abrirCobrancaAvulsa = () => {
    setValorCobranca(ticketSelecionado?.valorCobrancaAvulsa ? String(ticketSelecionado.valorCobrancaAvulsa) : '');
    setModalCobrancaAberto(true);
  };

  const salvarCobrancaAvulsa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSelecionado) return;

    const valorNormalizado = valorCobranca.replace(/\./g, '').replace(',', '.').trim();
    const valorNumerico = valorNormalizado ? Number(valorNormalizado) : null;

    if (valorNumerico !== null && (Number.isNaN(valorNumerico) || valorNumerico < 0)) {
      alert('Informe um valor valido para a cobranca avulsa.');
      return;
    }

    try {
      const resposta = await api.put(`/tickets/${ticketSelecionado.id}`, {
        assunto: ticketSelecionado.assunto,
        descricao: ticketSelecionado.descricao || '',
        solicitante: ticketSelecionado.solicitante,
        categoriaId: ticketSelecionado.categoriaId,
        dispositivoId: ticketSelecionado.dispositivoId || null,
        valorCobrancaAvulsa: valorNumerico,
      });

      setTicketSelecionado(resposta.data);
      setModalCobrancaAberto(false);
      carregarTickets();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar cobranca avulsa.');
    }
  };

  const realizarLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErro('');
    setLoginCarregando(true);

    try {
      const resposta = await api.post('/login', {
        email: emailLogin,
        senha: senhaLogin,
      });

      setUsuarioLogado(resposta.data.usuario);
      localStorage.setItem('deskhopp:usuario', JSON.stringify(resposta.data.usuario));
      setSenhaLogin('');
    } catch (error) {
      console.error(error);
      setLoginErro('E-mail ou senha invalidos.');
    } finally {
      setLoginCarregando(false);
    }
  };

  const sairDoSistema = () => {
    setUsuarioLogado(null);
    localStorage.removeItem('deskhopp:usuario');
    fecharDetalhesTicket();
  };

  const imprimirRelatorioTicket = () => {
    if (!ticketSelecionado || ticketSelecionado.status !== 'CONCLUIDO') return;

    const apontamentosHtml = ticketSelecionado.apontamentos?.length
      ? ticketSelecionado.apontamentos.map((apont, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${escaparHtml(apont.texto)}</td>
            <td>${formatarTempoRelatorio(apont.segundosSessao)}</td>
            <td>${formatarDataRelatorio(apont.criadoEm)}</td>
          </tr>
        `).join('')
      : '<tr><td colspan="4">Nenhum apontamento registrado.</td></tr>';

    const janelaRelatorio = window.open('', '_blank', 'width=900,height=700');
    if (!janelaRelatorio) {
      alert('Nao foi possivel abrir a janela de impressao. Verifique o bloqueador de pop-ups do navegador.');
      return;
    }

    janelaRelatorio.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Relatorio do Ticket #${escaparHtml(ticketSelecionado.numero)}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 32px; color: #111827; font-family: Arial, sans-serif; background: #ffffff; }
            header { border-bottom: 3px solid #2563eb; margin-bottom: 24px; padding-bottom: 16px; }
            h1 { margin: 0 0 6px; font-size: 24px; color: #111827; }
            h2 { margin: 26px 0 10px; font-size: 15px; color: #1f2937; text-transform: uppercase; letter-spacing: .04em; }
            p { margin: 6px 0; line-height: 1.45; }
            .muted { color: #6b7280; font-size: 12px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; }
            .box { border: 1px solid #d1d5db; border-radius: 6px; padding: 12px; background: #f9fafb; }
            .label { display: block; margin-bottom: 4px; color: #6b7280; font-size: 11px; font-weight: 700; text-transform: uppercase; }
            .value { font-size: 14px; font-weight: 600; }
            .wide { grid-column: 1 / -1; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #e5e7eb; font-size: 11px; text-transform: uppercase; }
            footer { margin-top: 28px; color: #6b7280; font-size: 11px; border-top: 1px solid #e5e7eb; padding-top: 12px; }
            @media print { body { padding: 20mm; } button { display: none; } }
          </style>
        </head>
        <body>
          <header>
            <h1>Relatorio do Ticket #${escaparHtml(ticketSelecionado.numero)}</h1>
            <p class="muted">Gerado em ${formatarDataRelatorio(new Date().toISOString())}</p>
          </header>

          <section class="grid">
            <div class="box"><span class="label">Empresa</span><span class="value">${escaparHtml(ticketSelecionado.empresa?.nome)}</span></div>
            <div class="box"><span class="label">Solicitante</span><span class="value">${escaparHtml(solicitante || ticketSelecionado.solicitante)}</span></div>
            <div class="box"><span class="label">Status</span><span class="value">${escaparHtml(ticketSelecionado.status.replace('_', ' '))}</span></div>
            <div class="box"><span class="label">Operador</span><span class="value">${escaparHtml(ticketSelecionado.operador || 'Sem operador')}</span></div>
            <div class="box"><span class="label">Cobranca avulsa</span><span class="value">${escaparHtml(formatarMoeda(ticketSelecionado.valorCobrancaAvulsa))}</span></div>
            <div class="box"><span class="label">Tempo gasto</span><span class="value">${escaparHtml(formatarTempoRelatorio(ticketSelecionado.totalSegundos))}</span></div>
            <div class="box"><span class="label">Abertura</span><span class="value">${formatarDataRelatorio(ticketSelecionado.criadoEm)}</span></div>
            <div class="box"><span class="label">Finalizacao</span><span class="value">${formatarDataRelatorio(ticketSelecionado.finalizadoEm)}</span></div>
            <div class="box"><span class="label">Categoria</span><span class="value">${escaparHtml(ticketSelecionado.categoria?.nome)}</span></div>
            <div class="box"><span class="label">Dispositivo</span><span class="value">${escaparHtml(ticketSelecionado.dispositivo?.nome || 'Nenhum dispositivo associado')}</span></div>
            <div class="box wide"><span class="label">Assunto</span><span class="value">${escaparHtml(assunto || ticketSelecionado.assunto)}</span></div>
            <div class="box wide"><span class="label">Descricao</span><p>${escaparHtml(descricao || ticketSelecionado.descricao || 'Sem descricao informada.')}</p></div>
          </section>

          <section>
            <h2>O que foi feito</h2>
            <table>
              <thead>
                <tr>
                  <th>Etapa</th>
                  <th>Apontamento tecnico</th>
                  <th>Tempo da etapa</th>
                  <th>Registro</th>
                </tr>
              </thead>
              <tbody>${apontamentosHtml}</tbody>
            </table>
          </section>

          <footer>Desk-Hopp Helpdesk - relatorio gerado para impressao/salvamento em PDF.</footer>
          <script>
            window.onload = function () {
              window.focus();
              setTimeout(function () { window.print(); }, 250);
            };
          </script>
        </body>
      </html>
    `);
    janelaRelatorio.document.close();
  };

  // --- LIFECYCLE MONITORING EFFECTS ---
  useEffect(() => { if (usuarioLogado) carregarTickets(); }, [usuarioLogado]);
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

  if (!usuarioLogado) {
    return (
      <div className="min-h-screen bg-[#121214] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#1e1e24] border border-gray-800 rounded-lg p-6 shadow-2xl">
          <div className="mb-7 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg">H</div>
            <h1 className="text-2xl font-bold tracking-wide">Desk Hopp</h1>
            <p className="text-xs text-gray-500 mt-1">Acesso ao helpdesk</p>
          </div>

          <form onSubmit={realizarLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">E-mail</label>
              <div className="flex items-center gap-2 bg-[#121214] border border-gray-700 rounded px-3 focus-within:border-blue-500">
                <Mail size={15} className="text-gray-500" />
                <input
                  type="email"
                  value={emailLogin}
                  onChange={(e) => setEmailLogin(e.target.value)}
                  className="w-full bg-transparent py-2.5 text-sm text-white outline-none"
                  placeholder="usuario@empresa.com"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Senha</label>
              <div className="flex items-center gap-2 bg-[#121214] border border-gray-700 rounded px-3 focus-within:border-blue-500">
                <Lock size={15} className="text-gray-500" />
                <input
                  type="password"
                  value={senhaLogin}
                  onChange={(e) => setSenhaLogin(e.target.value)}
                  className="w-full bg-transparent py-2.5 text-sm text-white outline-none"
                  placeholder="Digite sua senha"
                  required
                />
              </div>
            </div>

            {loginErro && (
              <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded p-2">
                {loginErro}
              </div>
            )}

            <button
              type="submit"
              disabled={loginCarregando}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-sm rounded flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <LogIn size={16} />
              {loginCarregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="mt-5 text-[11px] text-gray-500 border-t border-gray-800 pt-4">
            Teste: admin@deskhopp.local / 123456
          </div>
        </div>
      </div>
    );
  }

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
            <div className="hidden lg:flex items-center gap-2 bg-[#202024] border border-gray-700 rounded px-3 py-1.5">
              <User size={14} className="text-blue-400" />
              <div className="leading-tight">
                <div className="text-[11px] text-white font-semibold">{usuarioLogado.nomeUsuario}</div>
                <div className="text-[10px] text-gray-500">{usuarioLogado.tipoUsuario}</div>
              </div>
            </div>
            <button onClick={sairDoSistema} className="border border-gray-700 bg-[#202024] text-gray-300 p-2 rounded hover:bg-gray-700 cursor-pointer" title="Sair">
              <LogOut size={15} />
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
                {ticketSelecionado.status === 'CONCLUIDO' && (
                  <button title="Imprimir relatorio em PDF" onClick={imprimirRelatorioTicket} className="p-2 rounded text-blue-300 bg-blue-600/10 border border-blue-500/40 hover:bg-blue-600/20 hover:text-blue-200 cursor-pointer transition-all">
                    <Paperclip size={16} />
                  </button>
                )}
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

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400">Operador:</span>
                    <span className="text-xs text-white font-semibold truncate max-w-[130px]">
                      {ticketSelecionado.operador || 'Sem operador'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400">Cobrança:</span>
                    <span className="text-xs text-emerald-300 font-semibold">
                      {ticketSelecionado.valorCobrancaAvulsa ? formatarMoeda(ticketSelecionado.valorCobrancaAvulsa) : 'Sem cobrança'}
                    </span>
                  </div>

                  <button onClick={abrirCobrancaAvulsa} className="w-full mb-3 py-2 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-600/30 font-bold text-xs rounded flex items-center justify-center gap-1.5 cursor-pointer">
                    <DollarSign size={13} /> Cobrança avulsa
                  </button>

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
                          {apont.imagemBase64 && (
                            <a href={apont.imagemBase64} target="_blank" rel="noreferrer" className="block mt-2">
                              <img src={apont.imagemBase64} alt={apont.imagemNome || 'Imagem do apontamento'} className="max-h-28 w-full object-cover rounded border border-gray-700" />
                            </a>
                          )}
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
              <label className="flex items-center justify-center gap-2 border border-dashed border-gray-700 rounded p-3 text-xs text-gray-400 hover:border-amber-500 hover:text-amber-300 cursor-pointer">
                <Image size={15} />
                {imagemApontamento ? imagemApontamento.nome : 'Adicionar imagem opcional'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => selecionarImagemApontamento(e.target.files?.[0])} />
              </label>
              {imagemApontamento && (
                <div className="relative">
                  <img src={imagemApontamento.base64} alt={imagemApontamento.nome} className="max-h-36 w-full object-cover rounded border border-gray-700" />
                  <button type="button" onClick={() => setImagemApontamento(null)} className="absolute top-2 right-2 bg-black/70 text-white rounded p-1">
                    <X size={14} />
                  </button>
                </div>
              )}
              <div className="flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => { setModalApontamentoAberto(false); setTicketParaApontar(null); }} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded cursor-pointer">Gravar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalCobrancaAberto && ticketSelecionado && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#1e1e24] border border-emerald-600/30 rounded-lg w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <DollarSign size={16} /> Cobrança avulsa
            </h3>
            <form onSubmit={salvarCobrancaAvulsa} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Valor em R$</label>
                <input value={valorCobranca} onChange={(e) => setValorCobranca(e.target.value)} placeholder="Ex: 150,00" className="w-full bg-[#121214] border border-gray-700 rounded p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" autoFocus />
              </div>
              <div className="flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setModalCobrancaAberto(false)} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded cursor-pointer">Cancelar</button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded cursor-pointer">Salvar</button>
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

      <div className="flex items-center gap-1 text-[10px] text-gray-400">
        <User size={10} className="text-emerald-400 flex-shrink-0" />
        <span className="truncate">Operador: {ticket.operador || 'Sem operador'}</span>
      </div>

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
