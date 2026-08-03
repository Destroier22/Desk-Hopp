import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from './services/api';
import { AppHeader } from './components/AppHeader';
import { KanbanBoard } from './components/KanbanBoard';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { TicketsList } from './components/TicketsList';
import { BaseConhecimento } from './components/base/BaseConhecimento';
import { ChatExternoWhatsApp } from './components/chat/ChatExternoWhatsApp';
import { ChatInterno } from './components/chat/ChatInterno';
import { ConectarNumeroWhatsApp } from './components/chat/ConectarNumeroWhatsApp';
import { FilasAtendimentoConfig } from './components/chat/FilasAtendimentoConfig';
import { FiltrosAtendimentoConfig } from './components/chat/FiltrosAtendimentoConfig';
import { CadastrosConfig } from './components/configuracoes/CadastrosConfig';
import { MesasTrabalhoDashboard } from './components/dashboards/MesasTrabalhoDashboard';
import { RelatoriosDashboard } from './components/dashboards/RelatoriosDashboard';
import { ApontamentoModal } from './components/modals/ApontamentoModal';
import { CobrancaModal } from './components/modals/CobrancaModal';
import { NovaTarefaModal, type NovaTarefaForm } from './components/modals/NovaTarefaModal';
import { NovoTicketModal } from './components/modals/NovoTicketModal';
import { TicketDetailsModal } from './components/modals/TicketDetailsModal';
import type {
  Categoria,
  CategoriaUsuario,
  ChatExternoContato,
  Dispositivo,
  Empresa,
  FilaAtendimento,
  FiltroAtendimento,
  ImagemApontamento,
  KanbanData,
  TarefaKanban,
  Ticket,
  UsuarioLogado,
  AppView,
} from './types';
import { escaparHtml, formatarDataRelatorio, formatarMoeda, formatarTempoRelatorio } from './utils/formatters';

const tarefasDemo: TarefaKanban[] = [
  {
    id: 'demo-tarefa-1',
    codigo: 'TAR-0001',
    titulo: 'Revisar permissões dos usuários de suporte',
    descricao: 'Conferir categorias, acessos e permissões antes da apresentação do portfólio.',
    responsavelId: 'demo',
    responsavelNome: 'Eduarda Nunes',
    solicitante: 'Administração',
    prioridade: 'Alta',
    categoria: 'Melhoria interna',
    projeto: 'Desk Work',
    prazo: '2026-07-20',
    estimativaHoras: '2',
    etiquetas: ['permissões', 'usuários'],
    checklist: ['Validar perfis', 'Testar acesso restrito', 'Registrar ajustes'],
    observadores: 'Gestores',
    linkReferencia: '',
    recorrencia: 'Nao recorrente',
    lembrete: '',
    status: 'A_FAZER',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'demo-tarefa-2',
    codigo: 'TAR-0002',
    titulo: 'Montar artigos iniciais da Base de Conhecimento',
    descricao: 'Criar estrutura de pastas e arquivos para procedimentos comuns de atendimento.',
    responsavelId: 'demo',
    responsavelNome: 'Ana Beatriz Lima',
    solicitante: 'Equipe de suporte',
    prioridade: 'Media',
    categoria: 'Documentacao',
    projeto: 'Base de Conhecimento',
    prazo: '2026-07-22',
    estimativaHoras: '3',
    etiquetas: ['documentação', 'base'],
    checklist: ['Criar pasta de processos', 'Criar artigo de atendimento', 'Enviar para aprovação'],
    observadores: 'Suporte',
    linkReferencia: '',
    recorrencia: 'Nao recorrente',
    lembrete: '',
    status: 'ATENDENDO',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'demo-tarefa-3',
    codigo: 'TAR-0003',
    titulo: 'Validar QR Code de conexão WhatsApp',
    descricao: 'Testar fluxo visual de conexão e registrar pontos pendentes para integração real.',
    responsavelId: 'demo',
    responsavelNome: 'Bruno Carvalho',
    solicitante: 'Produto',
    prioridade: 'Critica',
    categoria: 'Desenvolvimento',
    projeto: 'Chat Externo',
    prazo: '2026-07-18',
    estimativaHoras: '4',
    etiquetas: ['whatsapp', 'integração'],
    checklist: ['Abrir tela conexão', 'Validar status', 'Registrar falhas'],
    observadores: 'Administração',
    linkReferencia: '',
    recorrencia: 'Nao recorrente',
    lembrete: '',
    status: 'PAUSADO',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'demo-tarefa-4',
    codigo: 'TAR-0004',
    titulo: 'Conferir listagem de tickets por data',
    descricao: 'Validar ordenação do mais novo ao mais antigo e abertura do detalhe pelo clique.',
    responsavelId: 'demo',
    responsavelNome: 'Camila Rocha',
    solicitante: 'QA',
    prioridade: 'Baixa',
    categoria: 'Operacional',
    projeto: 'Tickets',
    prazo: '2026-07-24',
    estimativaHoras: '1',
    etiquetas: ['qa', 'tickets'],
    checklist: ['Abrir menu Tickets', 'Checar ordem', 'Abrir detalhe'],
    observadores: '',
    linkReferencia: '',
    recorrencia: 'Nao recorrente',
    lembrete: '',
    status: 'CONCLUIDO',
    criadoEm: new Date().toISOString(),
  },
];

export default function App() {
  const [kanban, setKanban] = useState<KanbanData>({
    aFazer: [], atendendo: [], pausados: [], concluidosDoDia: [],
  });

  const [carregando, setCarregando] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalTarefaAberto, setModalTarefaAberto] = useState(false);
  const [notificacoesAtivas, setNotificacoesAtivas] = useState<boolean>(() => {
    const salvo = localStorage.getItem('deskwork:notificacoes');
    return salvo ? JSON.parse(salvo) : true;
  });
  const [autoRefresh, setAutoRefresh] = useState<boolean>(() => {
    const salvo = localStorage.getItem('deskwork:autorefresh');
    return salvo ? JSON.parse(salvo) : false;
  });

  const [ticketSelecionado, setTicketSelecionado] = useState<Ticket | null>(null);
  const [listaTickets, setListaTickets] = useState<Ticket[]>([]);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [modalApontamentoAberto, setModalApontamentoAberto] = useState(false);
  const [ticketParaApontar, setTicketParaApontar] = useState<{ id: string; novoStatus: string } | null>(null);
  const [textoApontamento, setTextoApontamento] = useState('');
  const [imagemApontamento, setImagemApontamento] = useState<ImagemApontamento | null>(null);
  const [modalCobrancaAberto, setModalCobrancaAberto] = useState(false);
  const [valorCobranca, setValorCobranca] = useState('');

  const [listaEmpresas, setListaEmpresas] = useState<Empresa[]>([]);
  const [listaDispositivos, setListaDispositivos] = useState<Dispositivo[]>([]);
  const [listaCategorias, setListaCategorias] = useState<Categoria[]>([]);

  const [empresaSelecionadaId, setEmpresaSelecionadaId] = useState('');
  const [dispositivoSelecionadoId, setDispositivoSelecionadoId] = useState('');
  const [categoriaSelecionadaId, setCategoriaSelecionadaId] = useState('');
  const [assunto, setAssunto] = useState('');
  const [descricao, setDescricao] = useState('');
  const [solicitante, setSolicitante] = useState('');

  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioLogado | null>(() => {
    const salvo = localStorage.getItem('deskwork:usuario');
    return salvo ? JSON.parse(salvo) : null;
  });
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [loginCarregando, setLoginCarregando] = useState(false);
  const [loginErro, setLoginErro] = useState('');
  const [activeView, setActiveView] = useState<AppView>('fluxo-atendimento');
  const [usuarios, setUsuarios] = useState<UsuarioLogado[]>([]);
  const [tarefasKanban, setTarefasKanban] = useState<TarefaKanban[]>(() => {
    const salvo = localStorage.getItem('deskwork:tarefas-kanban');
    if (!salvo) return tarefasDemo;

    const tarefasSalvas = JSON.parse(salvo) as TarefaKanban[];
    const idsSalvos = new Set(tarefasSalvas.map(tarefa => tarefa.id));
    return [...tarefasDemo.filter(tarefa => !idsSalvos.has(tarefa.id)), ...tarefasSalvas];
  });
  const criarFormTarefaInicial = (responsavelId = '', solicitanteNome = ''): NovaTarefaForm => ({
    titulo: '',
    descricao: '',
    responsavelId,
    solicitante: solicitanteNome,
    prioridade: 'Media',
    categoria: 'Operacional',
    projeto: '',
    prazo: '',
    estimativaHoras: '',
    etiquetasTexto: '',
    checklistTexto: '',
    observadores: '',
    linkReferencia: '',
    recorrencia: 'Nao recorrente',
    lembrete: '',
  });
  const [novaTarefa, setNovaTarefa] = useState<NovaTarefaForm>(() => criarFormTarefaInicial());
  const [categoriasUsuario, setCategoriasUsuario] = useState<CategoriaUsuario[]>([
    {
      id: 'administrador',
      nome: 'Administrador',
      permissoes: [
        'Visualizar dashboards',
        'Gerenciar tickets',
        'Atender chat interno',
        'Atender chat externo',
        'Configurar chat externo',
        'Gerenciar usuarios',
        'Gerenciar financeiro',
        'Acessar relatorios',
        'Administrar Base de conhecimento',
      ],
    },
    {
      id: 'gestor',
      nome: 'Gestor',
      permissoes: ['Visualizar dashboards', 'Gerenciar tickets', 'Configurar chat externo', 'Acessar relatorios'],
    },
    {
      id: 'suporte',
      nome: 'Suporte',
      permissoes: ['Visualizar dashboards', 'Gerenciar tickets', 'Atender chat interno', 'Atender chat externo'],
    },
    {
      id: 'financeiro',
      nome: 'Financeiro',
      permissoes: ['Visualizar dashboards', 'Atender chat externo', 'Gerenciar financeiro', 'Acessar relatorios'],
    },
  ]);
  const [contatosExternos, setContatosExternos] = useState<ChatExternoContato[]>([
    { id: 'c1', nome: 'Mariana Costa', telefone: '+55 11 98444-1020', empresa: 'Costa & Lima', ultimaInteracao: 'Hoje' },
    { id: 'c2', nome: 'Financeiro Alfa', telefone: '+55 21 97777-3311', empresa: 'Alfa Servicos', ultimaInteracao: 'Hoje' },
    { id: 'c3', nome: 'Unidade Centro', telefone: '+55 31 96666-0188', empresa: 'Grupo Centro', ultimaInteracao: 'Ontem' },
    { id: 'c4', nome: 'Ricardo Martins', telefone: '+55 11 91234-5544', empresa: 'Martins Contabilidade', ultimaInteracao: '12/07' },
    { id: 'c5', nome: 'Operacao Delta', telefone: '+55 41 98888-4400', empresa: 'Delta Transportes', ultimaInteracao: '08/07' },
  ]);
  const [filasAtendimento, setFilasAtendimento] = useState<FilaAtendimento[]>([
    { id: 'suporte', nome: 'Suporte', descricao: 'Chamados tecnicos e suporte ao usuario', usuariosIds: [] },
    { id: 'financeiro', nome: 'Financeiro', descricao: 'Cobrancas, notas fiscais e faturamento', usuariosIds: [] },
    { id: 'administrativo', nome: 'Administrativo', descricao: 'Solicitacoes administrativas gerais', usuariosIds: [] },
  ]);
  const [filtrosAtendimento, setFiltrosAtendimento] = useState<FiltroAtendimento[]>([
    {
      id: 'filtro-financeiro',
      respostaCliente: 'financeiro',
      mensagemAutomatica: 'Entendi. Vou direcionar seu atendimento para a fila Financeiro.',
      filaId: 'financeiro',
      ativo: true,
    },
    {
      id: 'filtro-suporte',
      respostaCliente: 'erro, acesso, sistema',
      mensagemAutomatica: 'Certo, vou encaminhar para a fila de Suporte.',
      filaId: 'suporte',
      ativo: true,
    },
  ]);

  const carregarTickets = useCallback(async () => {
    try {
      setCarregando(true);
      const [respostaKanban, respostaTickets] = await Promise.all([
        api.get<KanbanData>('/tickets/kanban'),
        api.get<Ticket[]>('/tickets'),
      ]);
      setKanban(respostaKanban.data);
      setListaTickets(respostaTickets.data);

      if (ticketSelecionado) {
        const todos = respostaTickets.data;
        const atualizado = todos.find(t => t.id === ticketSelecionado.id);
        if (atualizado) {
          setTicketSelecionado(prev => prev ? {
            ...prev,
            status: atualizado.status,
            totalSegundos: atualizado.totalSegundos,
            apontamentos: atualizado.apontamentos,
            finalizadoEm: atualizado.finalizadoEm,
            operador: atualizado.operador,
            valorCobrancaAvulsa: atualizado.valorCobrancaAvulsa,
          } : null);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados do Kanban:', error);
    } finally {
      setCarregando(false);
    }
  }, [ticketSelecionado]);

  const carregarDadosDoFormulario = useCallback(async () => {
    try {
      const [resEmpresas, resCategorias] = await Promise.all([
        api.get<Empresa[]>('/empresas'),
        api.get<Categoria[]>('/categorias'),
      ]);
      setListaEmpresas(resEmpresas.data);
      setListaCategorias(resCategorias.data);
    } catch (error) {
      console.error('Erro ao carregar dados do formulario:', error);
    }
  }, []);

  const carregarUsuarios = useCallback(async () => {
    try {
      const resposta = await api.get<UsuarioLogado[]>('/usuarios');
      setUsuarios(resposta.data);
    } catch (error) {
      console.error('Erro ao carregar usuarios:', error);
    }
  }, []);

  const salvarNovoTicket = async (e: FormEvent) => {
    e.preventDefault();
    if (!assunto || !empresaSelecionadaId || !categoriaSelecionadaId || !solicitante) {
      alert('Por favor, preencha todos os campos obrigatorios (*)');
      return;
    }

    try {
      await api.post('/tickets', {
        assunto, descricao, solicitante,
        empresaId: empresaSelecionadaId,
        dispositivoId: dispositivoSelecionadoId || null,
        categoriaId: categoriaSelecionadaId,
        operador: usuarioLogado?.nomeUsuario,
      });
      setAssunto('');
      setDescricao('');
      setEmpresaSelecionadaId('');
      setDispositivoSelecionadoId('');
      setCategoriaSelecionadaId('');
      setSolicitante('');
      setModalAberto(false);
      carregarTickets();
    } catch (error) {
      console.error(error);
    }
  };

  const abrirModalNovaTarefa = () => {
    setNovaTarefa(criarFormTarefaInicial(usuarioLogado?.id || '', usuarioLogado?.nomeUsuario || ''));
    setModalTarefaAberto(true);
  };

  const atualizarNovaTarefa = (campo: keyof NovaTarefaForm, valor: string) => {
    setNovaTarefa(prev => ({ ...prev, [campo]: valor }));
  };

  const salvarNovaTarefa = (e: FormEvent) => {
    e.preventDefault();
    const responsavel = usuarios.find(usuario => usuario.id === novaTarefa.responsavelId) || usuarioLogado;

    if (!novaTarefa.titulo.trim() || !responsavel) {
      alert('Informe o titulo e o responsavel da tarefa.');
      return;
    }

    const tarefa: TarefaKanban = {
      id: `tarefa-${Date.now()}`,
      codigo: `TAR-${String(tarefasKanban.length + 1).padStart(4, '0')}`,
      titulo: novaTarefa.titulo.trim(),
      descricao: novaTarefa.descricao.trim(),
      responsavelId: responsavel.id,
      responsavelNome: responsavel.nomeUsuario,
      solicitante: novaTarefa.solicitante.trim() || usuarioLogado?.nomeUsuario || 'Interno',
      prioridade: novaTarefa.prioridade,
      categoria: novaTarefa.categoria,
      projeto: novaTarefa.projeto.trim(),
      prazo: novaTarefa.prazo,
      estimativaHoras: novaTarefa.estimativaHoras,
      etiquetas: novaTarefa.etiquetasTexto.split(',').map(etiqueta => etiqueta.trim()).filter(Boolean),
      checklist: novaTarefa.checklistTexto.split('\n').map(item => item.trim()).filter(Boolean),
      observadores: novaTarefa.observadores.trim(),
      linkReferencia: novaTarefa.linkReferencia.trim(),
      recorrencia: novaTarefa.recorrencia,
      lembrete: novaTarefa.lembrete,
      status: 'A_FAZER',
      criadoEm: new Date().toISOString(),
    };

    setTarefasKanban(prev => [tarefa, ...prev]);
    setNovaTarefa(criarFormTarefaInicial(usuarioLogado?.id || '', usuarioLogado?.nomeUsuario || ''));
    setModalTarefaAberto(false);
    setActiveView('fluxo-atendimento');
  };

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

  const salvarEdicaoTicket = async () => {
    if (!ticketSelecionado) return;
    try {
      const resposta = await api.put<Ticket>(`/tickets/${ticketSelecionado.id}`, {
        assunto,
        descricao,
        solicitante,
        categoriaId: categoriaSelecionadaId,
        dispositivoId: dispositivoSelecionadoId || null,
      });

      setTicketSelecionado(resposta.data);
      setModoEdicao(false);
      carregarTickets();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar modificacoes.');
    }
  };

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

  const salvarApontamentoESeguir = (e: FormEvent) => {
    e.preventDefault();
    if (!textoApontamento.trim()) return alert('Por favor, informe a justificativa tecnica!');
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

  const salvarCobrancaAvulsa = async (e: FormEvent) => {
    e.preventDefault();
    if (!ticketSelecionado) return;

    const valorNormalizado = valorCobranca.replace(/\./g, '').replace(',', '.').trim();
    const valorNumerico = valorNormalizado ? Number(valorNormalizado) : null;

    if (valorNumerico !== null && (Number.isNaN(valorNumerico) || valorNumerico < 0)) {
      alert('Informe um valor valido para a cobranca avulsa.');
      return;
    }

    try {
      const resposta = await api.put<Ticket>(`/tickets/${ticketSelecionado.id}`, {
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

  const realizarLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginErro('');
    setLoginCarregando(true);

    try {
      const resposta = await api.post<{ usuario: UsuarioLogado }>('/login', {
        email: emailLogin,
        senha: senhaLogin,
      });

      setUsuarioLogado(resposta.data.usuario);
      localStorage.setItem('deskwork:usuario', JSON.stringify(resposta.data.usuario));
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
    localStorage.removeItem('deskwork:usuario');
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

          <footer>Desk Work Helpdesk - relatorio gerado para impressao/salvamento em PDF.</footer>
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

  useEffect(() => {
    if (!autoRefresh) return;
    const timerIntervalo = setInterval(() => {
      carregarTickets();
    }, 5 * 60 * 1000);
    return () => clearInterval(timerIntervalo);
  }, [autoRefresh, carregarTickets]);

  useEffect(() => {
    if (!usuarioLogado) return;
    const timer = window.setTimeout(() => {
      carregarTickets();
      carregarUsuarios();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [usuarioLogado, carregarTickets, carregarUsuarios]);

  useEffect(() => {
    if (!modalAberto) return;
    const timer = window.setTimeout(() => {
      carregarDadosDoFormulario();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [modalAberto, carregarDadosDoFormulario]);

  useEffect(() => {
    const buscarDispositivosDaEmpresa = async () => {
      if (!empresaSelecionadaId) {
        setListaDispositivos([]);
        return;
      }

      try {
        const resposta = await api.get<Dispositivo[]>(`/empresas/${empresaSelecionadaId}/dispositivos`);
        setListaDispositivos(resposta.data);
      } catch (error) {
        console.error(error);
      }
    };
    buscarDispositivosDaEmpresa();
  }, [empresaSelecionadaId]);

  useEffect(() => {
    localStorage.setItem('deskwork:autorefresh', JSON.stringify(autoRefresh));
  }, [autoRefresh]);

  useEffect(() => {
    localStorage.setItem('deskwork:notificacoes', JSON.stringify(notificacoesAtivas));
  }, [notificacoesAtivas]);

  useEffect(() => {
    localStorage.setItem('deskwork:tarefas-kanban', JSON.stringify(tarefasKanban));
  }, [tarefasKanban]);

  useEffect(() => {
    if (!usuarioLogado || filasAtendimento.some(fila => fila.usuariosIds.length > 0)) return;

    const timer = window.setTimeout(() => {
      setFilasAtendimento(prev => prev.map((fila) => {
        const tipo = usuarioLogado.tipoUsuario.toLowerCase();
        const deveAtribuir =
          tipo.includes('administrador') ||
          (tipo.includes('financeiro') && fila.id === 'financeiro') ||
          (tipo.includes('suporte') && fila.id === 'suporte');

        return deveAtribuir ? { ...fila, usuariosIds: [usuarioLogado.id] } : fila;
      }));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [usuarioLogado, filasAtendimento]);

  if (!usuarioLogado) {
    return (
      <LoginScreen
        emailLogin={emailLogin}
        senhaLogin={senhaLogin}
        loginCarregando={loginCarregando}
        loginErro={loginErro}
        onEmailChange={setEmailLogin}
        onSenhaChange={setSenhaLogin}
        onSubmit={realizarLogin}
      />
    );
  }

  const tituloTela = {
    'tickets-list': 'Tickets',
    'fluxo-atendimento': 'Fluxo de Atendimento',
    relatorios: 'Relatorios',
    'mesas-trabalho': 'Mesas de Trabalho',
    'base-conhecimento': 'Base de Conhecimento',
    'chat-interno': 'Chat Interno',
    'chat-externo': 'Chat Externo',
    'chat-externo-filas': 'Fila de Atendimento',
    'chat-externo-filtros': 'Filtro de Atendimento',
    telefone: 'Telefone',
    'config-cadastros': 'Cadastros',
    'config-chat-externo-conectar-numero': 'Conexao',
  }[activeView];
  const tipoUsuarioLogado = usuarioLogado.tipoUsuario.toLowerCase();
  const podeConfigurarChatExterno = tipoUsuarioLogado.includes('administrador') || tipoUsuarioLogado.includes('gestor');
  const podeConfigurarPlataforma = tipoUsuarioLogado.includes('administrador') || tipoUsuarioLogado.includes('gestor');
  const categoriaDoUsuarioLogado = categoriasUsuario.find(categoria => categoria.nome.toLowerCase() === tipoUsuarioLogado);
  const podeAdministrarBaseConhecimento =
    tipoUsuarioLogado.includes('administrador') ||
    Boolean(categoriaDoUsuarioLogado?.permissoes.includes('Administrar Base de conhecimento'));
  const usuariosParaTarefa = [
    usuarioLogado,
    ...usuarios.filter(usuario => usuario.id !== usuarioLogado.id),
  ];

  return (
    <div className="flex min-h-screen bg-[#121214] text-white select-none">
      <Sidebar activeView={activeView} onSelectView={setActiveView} usuarioLogado={usuarioLogado} />

      <main className="flex-1 p-6 overflow-y-auto">
        <AppHeader
          autoRefresh={autoRefresh}
          carregando={carregando}
          notificacoesAtivas={notificacoesAtivas}
          tituloTela={tituloTela}
          usuarioLogado={usuarioLogado}
          onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
          onNovoTicket={() => {
            setModalAberto(true);
            setEmpresaSelecionadaId('');
          }}
          onNovaTarefa={abrirModalNovaTarefa}
          onCarregarTickets={carregarTickets}
          onToggleNotificacoes={() => setNotificacoesAtivas(!notificacoesAtivas)}
          onSair={sairDoSistema}
        />

        {activeView === 'fluxo-atendimento' && (
          <KanbanBoard kanban={kanban} tarefas={tarefasKanban} onAbrirDetalhes={abrirDetalhesTicket} />
        )}
        {activeView === 'tickets-list' && (
          <TicketsList tickets={listaTickets} onAbrirDetalhes={abrirDetalhesTicket} />
        )}
        {activeView === 'relatorios' && (
          <RelatoriosDashboard kanban={kanban} />
        )}
        {activeView === 'mesas-trabalho' && (
          <MesasTrabalhoDashboard kanban={kanban} />
        )}
        {activeView === 'base-conhecimento' && (
          <BaseConhecimento podeAdministrar={podeAdministrarBaseConhecimento} />
        )}
        {activeView === 'chat-interno' && (
          <ChatInterno usuarioLogado={usuarioLogado} usuarios={usuarios} />
        )}
        {activeView === 'telefone' && (
          <div className="bg-[#202024] border border-gray-800 rounded-lg p-6">
            <h1 className="text-xl font-bold text-white">Telefone</h1>
            <p className="text-sm text-gray-500 mt-2">Modulo visual de VoIP sera construido aqui.</p>
          </div>
        )}
        {activeView === 'chat-externo' && (
          <ChatExternoWhatsApp
            usuarioLogado={usuarioLogado}
            contatos={contatosExternos}
            filas={filasAtendimento}
            onAdicionarContato={(contato) => setContatosExternos(prev => [contato, ...prev])}
          />
        )}
        {activeView === 'chat-externo-filas' && podeConfigurarChatExterno && (
          <FilasAtendimentoConfig
            filas={filasAtendimento}
            usuarios={usuarios}
            onFilasChange={setFilasAtendimento}
          />
        )}
        {activeView === 'chat-externo-filtros' && podeConfigurarChatExterno && (
          <FiltrosAtendimentoConfig
            filas={filasAtendimento}
            filtros={filtrosAtendimento}
            onFiltrosChange={setFiltrosAtendimento}
          />
        )}
        {activeView === 'config-chat-externo-conectar-numero' && podeConfigurarChatExterno && (
          <ConectarNumeroWhatsApp />
        )}
        {activeView === 'config-cadastros' && podeConfigurarPlataforma && (
          <CadastrosConfig
            usuarioLogado={usuarioLogado}
            usuarios={usuarios}
            categoriasUsuario={categoriasUsuario}
            onUsuariosChange={setUsuarios}
            onCategoriasUsuarioChange={setCategoriasUsuario}
          />
        )}
        {(activeView === 'chat-externo-filas' || activeView === 'chat-externo-filtros' || activeView === 'config-chat-externo-conectar-numero') && !podeConfigurarChatExterno && (
          <div className="bg-[#202024] border border-gray-800 rounded-lg p-6">
            <h1 className="text-lg font-bold text-white">Acesso restrito</h1>
            <p className="text-sm text-gray-500 mt-2">Somente administradores ou gestores podem acessar as configuracoes do Chat Externo.</p>
          </div>
        )}
        {activeView === 'config-cadastros' && !podeConfigurarPlataforma && (
          <div className="bg-[#202024] border border-gray-800 rounded-lg p-6">
            <h1 className="text-lg font-bold text-white">Acesso restrito</h1>
            <p className="text-sm text-gray-500 mt-2">Somente administradores ou gestores podem gerenciar cadastros e permissoes.</p>
          </div>
        )}
      </main>

      {modalAberto && (
        <NovoTicketModal
          assunto={assunto}
          categoriaSelecionadaId={categoriaSelecionadaId}
          descricao={descricao}
          dispositivoSelecionadoId={dispositivoSelecionadoId}
          empresaSelecionadaId={empresaSelecionadaId}
          listaCategorias={listaCategorias}
          listaDispositivos={listaDispositivos}
          listaEmpresas={listaEmpresas}
          solicitante={solicitante}
          onAssuntoChange={setAssunto}
          onCategoriaChange={setCategoriaSelecionadaId}
          onDescricaoChange={setDescricao}
          onDispositivoChange={setDispositivoSelecionadoId}
          onEmpresaChange={setEmpresaSelecionadaId}
          onSolicitanteChange={setSolicitante}
          onClose={() => setModalAberto(false)}
          onSubmit={salvarNovoTicket}
        />
      )}

      {modalTarefaAberto && (
        <NovaTarefaModal
          form={novaTarefa}
          usuarios={usuariosParaTarefa}
          onChange={atualizarNovaTarefa}
          onClose={() => setModalTarefaAberto(false)}
          onSubmit={salvarNovaTarefa}
        />
      )}

      {ticketSelecionado && (
        <TicketDetailsModal
          assunto={assunto}
          categoriaSelecionadaId={categoriaSelecionadaId}
          descricao={descricao}
          dispositivoSelecionadoId={dispositivoSelecionadoId}
          listaCategorias={listaCategorias}
          listaDispositivos={listaDispositivos}
          modoEdicao={modoEdicao}
          solicitante={solicitante}
          ticketSelecionado={ticketSelecionado}
          onAbrirCobrancaAvulsa={abrirCobrancaAvulsa}
          onAssuntoChange={setAssunto}
          onCategoriaChange={setCategoriaSelecionadaId}
          onClose={fecharDetalhesTicket}
          onDescricaoChange={setDescricao}
          onDispositivoChange={setDispositivoSelecionadoId}
          onImprimirRelatorio={imprimirRelatorioTicket}
          onModoEdicaoChange={setModoEdicao}
          onSalvarEdicao={salvarEdicaoTicket}
          onSolicitanteChange={setSolicitante}
          onTrocarStatus={manipularMudancaStatus}
        />
      )}

      {modalApontamentoAberto && (
        <ApontamentoModal
          imagemApontamento={imagemApontamento}
          textoApontamento={textoApontamento}
          onCancelar={() => {
            setModalApontamentoAberto(false);
            setTicketParaApontar(null);
          }}
          onImagemChange={selecionarImagemApontamento}
          onImagemRemover={() => setImagemApontamento(null)}
          onSubmit={salvarApontamentoESeguir}
          onTextoChange={setTextoApontamento}
        />
      )}

      {modalCobrancaAberto && ticketSelecionado && (
        <CobrancaModal
          valorCobranca={valorCobranca}
          onClose={() => setModalCobrancaAberto(false)}
          onSubmit={salvarCobrancaAvulsa}
          onValorChange={setValorCobranca}
        />
      )}
    </div>
  );
}
