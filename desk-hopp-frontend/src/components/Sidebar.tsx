import { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  Circle,
  LayoutDashboard,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Ticket,
  X,
} from 'lucide-react';
import type { AppView, UsuarioLogado } from '../types';

interface SidebarProps {
  activeView: AppView;
  onSelectView: (view: AppView) => void;
  usuarioLogado: UsuarioLogado;
}

export function Sidebar({ activeView, onSelectView, usuarioLogado }: SidebarProps) {
  const [expandido, setExpandido] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [dashboardsAberto, setDashboardsAberto] = useState(true);
  const [busca, setBusca] = useState('');
  const menuAberto = expandido || menuMobileAberto;

  const submenusDashboard: Array<{ texto: string; view: AppView; termos: string }> = [
    { texto: 'Fluxo de Atendimento', view: 'fluxo-atendimento', termos: 'kanban tickets atendimento chamados fluxo' },
    { texto: 'Relatorios', view: 'relatorios', termos: 'graficos pizza barra linha temporal categorias empresas ultimos 30 dias' },
    { texto: 'Mesas de Trabalho', view: 'mesas-trabalho', termos: 'usuarios operador grupo trabalho produtividade filtro' },
  ];

  const submenusChat: Array<{ texto: string; view: AppView; termos: string }> = [
    { texto: 'Chat Interno', view: 'chat-interno', termos: 'conversas individuais grupos usuarios mensagens administrador' },
    { texto: 'Chat Externo', view: 'chat-externo', termos: 'whatsapp business api cloud externo clientes webhook mensagens' },
    { texto: 'Telefone', view: 'telefone', termos: 'telefone voip ligacao chamada discador ramal' },
  ];

  const tipoUsuario = usuarioLogado.tipoUsuario.toLowerCase();
  const podeConfigurarChatExterno = tipoUsuario.includes('administrador') || tipoUsuario.includes('gestor');
  const podeConfigurarPlataforma = tipoUsuario.includes('administrador') || tipoUsuario.includes('gestor');

  const submenusPlataformaBase: Array<{ texto: string; view: AppView; termos: string }> = [
    { texto: 'Cadastros', view: 'config-cadastros', termos: 'usuarios categorias permissoes cadastro tipo usuario editar excluir adicionar plataforma' },
  ];

  const submenusChatExternoBase: Array<{ texto: string; view: AppView; termos: string }> = [
    { texto: 'Conexao', view: 'config-chat-externo-conectar-numero', termos: 'configuracao whatsapp business conectar numero token webhook cloud api qr code pareamento' },
    { texto: 'Fila de Atendimento', view: 'chat-externo-filas', termos: 'filas atendimento suporte financeiro administrativo atribuir usuarios' },
    { texto: 'Filtro de Atendimento', view: 'chat-externo-filtros', termos: 'filtros resposta automatica atribuir fila mensagens automaticas' },
  ];
  const submenusPlataforma = podeConfigurarPlataforma ? submenusPlataformaBase : [];
  const submenusChatExterno = podeConfigurarChatExterno ? submenusChatExternoBase : [];

  const itensMenu = [
    { icone: Ticket, texto: 'Tickets', termos: 'chamados atendimento kanban fluxo' },
    { icone: BookOpen, texto: 'Base de conhecimento', termos: 'artigos ajuda conhecimento pastas arquivos documentos tutoriais' },
    { icone: Settings, texto: 'Configuracoes', termos: 'preferencias ajustes sistema plataforma cadastros usuarios categorias permissoes chat externo conectar numero whatsapp' },
  ];

  const termoBusca = busca.trim().toLowerCase();
  const dashboardVisivel = !termoBusca || ['dashboards', ...submenusDashboard.map(item => `${item.texto} ${item.termos}`)].join(' ').toLowerCase().includes(termoBusca);
  const chatVisivel = !termoBusca || ['comunicacao chat telefone', ...submenusChat.map(item => `${item.texto} ${item.termos}`)].join(' ').toLowerCase().includes(termoBusca);
  const submenusFiltrados = submenusDashboard.filter(item => !termoBusca || `${item.texto} ${item.termos}`.toLowerCase().includes(termoBusca));
  const submenusChatFiltrados = submenusChat.filter(item => !termoBusca || `${item.texto} ${item.termos}`.toLowerCase().includes(termoBusca));
  const submenusPlataformaFiltrados = submenusPlataforma.filter(item => !termoBusca || `${item.texto} ${item.termos}`.toLowerCase().includes(termoBusca));
  const submenusChatExternoFiltrados = submenusChatExterno.filter(item => !termoBusca || `${item.texto} ${item.termos}`.toLowerCase().includes(termoBusca));
  const configuracoesComResultados = submenusPlataformaFiltrados.length > 0 || submenusChatExternoFiltrados.length > 0;
  const itensFiltrados = itensMenu.filter(item => !termoBusca || `${item.texto} ${item.termos}`.toLowerCase().includes(termoBusca));
  const dashboardAtivo = activeView === 'fluxo-atendimento' || activeView === 'relatorios' || activeView === 'mesas-trabalho';
  const configuracoesAtivas =
    activeView === 'config-cadastros' ||
    activeView === 'config-chat-externo-conectar-numero' ||
    activeView === 'chat-externo-filas' ||
    activeView === 'chat-externo-filtros';
  const baseConhecimentoAtiva = activeView === 'base-conhecimento';

  const selecionarView = (view: AppView) => {
    onSelectView(view);
    setMenuMobileAberto(false);
  };

  return (
    <div
      onMouseEnter={() => setExpandido(true)}
      onMouseLeave={() => setExpandido(false)}
      className={`h-screen bg-[#1e1e24] border-r border-gray-800 text-gray-400 flex flex-col justify-between p-2 relative transition-all duration-300 select-none ${
        menuAberto ? 'w-64' : 'w-16'
      }`}
    >
      <div>
        <div className="flex items-center justify-between h-14 px-2 mb-3">
          {menuAberto ? (
            <span className="text-xl font-bold text-white flex items-center gap-2">
              Desk Hopp <span className="text-xs bg-blue-600 px-1.5 py-0.5 rounded text-white font-normal">helpdesk</span>
            </span>
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm mx-auto">
              H
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuMobileAberto((aberto) => !aberto)}
            className="md:hidden text-gray-300 hover:text-white p-1 rounded hover:bg-gray-800 cursor-pointer"
            aria-label={menuMobileAberto ? 'Fechar menu' : 'Abrir menu'}
          >
            {menuMobileAberto ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuAberto && (
          <div className="px-2 mb-3">
            <div className="flex items-center gap-2 bg-[#121214] border border-gray-800 rounded px-2 py-2 focus-within:border-blue-500">
              <Search size={14} className="text-gray-500 shrink-0" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Pesquisar funcoes..."
                className="w-full bg-transparent text-xs text-white outline-none placeholder:text-gray-600"
              />
            </div>
          </div>
        )}

        <nav className="space-y-1">
          {dashboardVisivel && (
            <div>
              <button
                type="button"
                onClick={() => menuAberto ? setDashboardsAberto(!dashboardsAberto) : selecionarView('fluxo-atendimento')}
                className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                  dashboardAtivo
                    ? 'bg-blue-600 text-white font-medium'
                    : 'hover:bg-gray-800 hover:text-gray-200'
                }`}
                title={!menuAberto ? 'Dashboards' : ''}
              >
                <LayoutDashboard size={20} className="shrink-0" />
                <span className={`text-sm transition-opacity duration-200 flex-1 text-left ${menuAberto ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                  Dashboards
                </span>
                {menuAberto && <ChevronDown size={15} className={`transition-transform ${dashboardsAberto ? 'rotate-180' : ''}`} />}
              </button>

              {menuAberto && (dashboardsAberto || termoBusca) && submenusFiltrados.length > 0 && (
                <div className="mt-1 ml-4 pl-3 border-l border-gray-800 space-y-1">
                  {submenusFiltrados.map((submenu) => (
                    <button
                      key={submenu.view}
                      type="button"
                      onClick={() => selecionarView(submenu.view)}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded text-left text-xs transition-colors ${
                        activeView === submenu.view
                          ? 'bg-blue-500/20 text-blue-200'
                          : 'text-gray-500 hover:bg-gray-800 hover:text-gray-200'
                      }`}
                    >
                      <Circle size={7} className="shrink-0" fill="currentColor" />
                      <span>{submenu.texto}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {itensFiltrados.map((item) => {
            const Icone = item.icone;
            return (
              <div key={item.texto}>
                <button
                  type="button"
                  onClick={() => {
                    if (item.texto === 'Base de conhecimento') selecionarView('base-conhecimento');
                    if (item.texto === 'Configuracoes' && !menuAberto) selecionarView('config-cadastros');
                  }}
                  className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                    (item.texto === 'Configuracoes' && configuracoesAtivas) || (item.texto === 'Base de conhecimento' && baseConhecimentoAtiva)
                      ? 'bg-blue-600 text-white font-medium'
                      : 'hover:bg-gray-800 hover:text-gray-200'
                  }`}
                  title={!menuAberto ? item.texto : ''}
                >
                  <Icone size={20} className="shrink-0" />
                  <span className={`text-sm transition-opacity duration-200 ${menuAberto ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                    {item.texto}
                  </span>
                </button>

                {item.texto === 'Tickets' && chatVisivel && (
                  <div>
                    <button
                      type="button"
                      onClick={() => selecionarView('chat-interno')}
                      className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                        activeView === 'chat-interno' || activeView === 'chat-externo' || activeView === 'telefone'
                          ? 'bg-blue-600 text-white font-medium'
                          : 'hover:bg-gray-800 hover:text-gray-200'
                      }`}
                      title={!menuAberto ? 'Comunicacao' : ''}
                    >
                      <MessageSquare size={20} className="shrink-0" />
                      <span className={`text-sm transition-opacity duration-200 flex-1 text-left ${menuAberto ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
                        Comunicacao
                      </span>
                    </button>

                    {menuAberto && submenusChatFiltrados.length > 0 && (
                      <div className="mt-1 ml-4 pl-3 border-l border-gray-800 space-y-1">
                        {submenusChatFiltrados.map((submenu) => (
                          <button
                            key={submenu.view}
                            type="button"
                            onClick={() => selecionarView(submenu.view)}
                            className={`w-full flex items-center gap-2 px-2 py-2 rounded text-left text-xs transition-colors ${
                              activeView === submenu.view
                                ? 'bg-blue-500/20 text-blue-200'
                                : 'text-gray-500 hover:bg-gray-800 hover:text-gray-200'
                            }`}
                          >
                            <Circle size={7} className="shrink-0" fill="currentColor" />
                            <span>{submenu.texto}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {item.texto === 'Configuracoes' && menuAberto && configuracoesComResultados && (
                  <div className="mt-1 ml-4 pl-3 border-l border-gray-800 space-y-1">
                    {submenusPlataformaFiltrados.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-gray-600 font-bold">
                          Plataforma
                        </div>
                        {submenusPlataformaFiltrados.map((submenu) => (
                          <button
                            key={submenu.view}
                            type="button"
                            onClick={() => selecionarView(submenu.view)}
                            className={`w-full flex items-center gap-2 px-2 py-2 rounded text-left text-xs transition-colors ${
                              activeView === submenu.view
                                ? 'bg-blue-500/20 text-blue-200'
                                : 'text-gray-500 hover:bg-gray-800 hover:text-gray-200'
                            }`}
                          >
                            <Circle size={7} className="shrink-0" fill="currentColor" />
                            <span>{submenu.texto}</span>
                          </button>
                        ))}
                      </>
                    )}
                    {submenusChatExternoFiltrados.length > 0 && (
                      <>
                        <div className="px-2 py-1 text-[10px] uppercase tracking-wide text-gray-600 font-bold">
                          Chat Externo
                        </div>
                        {submenusChatExternoFiltrados.map((submenu) => (
                          <button
                            key={submenu.view}
                            type="button"
                            onClick={() => selecionarView(submenu.view)}
                            className={`w-full flex items-center gap-2 px-2 py-2 rounded text-left text-xs transition-colors ${
                              activeView === submenu.view
                                ? 'bg-blue-500/20 text-blue-200'
                                : 'text-gray-500 hover:bg-gray-800 hover:text-gray-200'
                            }`}
                          >
                            <Circle size={7} className="shrink-0" fill="currentColor" />
                            <span>{submenu.texto}</span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {menuAberto && termoBusca && !dashboardVisivel && !chatVisivel && itensFiltrados.length === 0 && (
            <div className="px-3 py-6 text-xs text-gray-600 text-center">
              Nenhuma funcao encontrada.
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}
