import { Bell, BellOff, LogOut, PlusCircle, RefreshCw, RotateCw, User } from 'lucide-react';
import type { UsuarioLogado } from '../types';

interface AppHeaderProps {
  autoRefresh: boolean;
  carregando: boolean;
  notificacoesAtivas: boolean;
  tituloTela: string;
  usuarioLogado: UsuarioLogado;
  onToggleAutoRefresh: () => void;
  onNovoTicket: () => void;
  onNovaTarefa: () => void;
  onCarregarTickets: () => void;
  onToggleNotificacoes: () => void;
  onSair: () => void;
}

export function AppHeader({
  autoRefresh,
  carregando,
  notificacoesAtivas,
  tituloTela,
  usuarioLogado,
  onToggleAutoRefresh,
  onNovoTicket,
  onNovaTarefa,
  onCarregarTickets,
  onToggleNotificacoes,
  onSair,
}: AppHeaderProps) {
  return (
    <header className="mb-6 flex justify-between items-center text-xs text-gray-400">
      <div><span>Dashboards - <b className="text-white text-sm">{tituloTela}</b></span></div>
      <div className="flex items-center gap-3">
        <button onClick={onToggleAutoRefresh} className={`flex items-center gap-2 px-3 py-2 rounded font-semibold text-xs border cursor-pointer transition-all ${autoRefresh ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500' : 'bg-[#202024] border-gray-700'}`}>
          <RefreshCw size={14} className={`${autoRefresh ? 'animate-spin' : ''}`} />
          <span>Auto-Refresh: <strong>{autoRefresh ? 'LIGADO' : 'DESLIGADO'}</strong></span>
        </button>
        <button onClick={onNovoTicket} className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs px-3 py-2 rounded flex items-center gap-1.5 shadow cursor-pointer">
          <PlusCircle size={15} /><span>Novo Ticket</span>
        </button>
        <button onClick={onNovaTarefa} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-3 py-2 rounded flex items-center gap-1.5 shadow cursor-pointer">
          <PlusCircle size={15} /><span>Nova Tarefa</span>
        </button>
        <button onClick={onCarregarTickets} disabled={carregando} className="bg-[#202024] border border-gray-700 text-gray-300 p-2 rounded hover:bg-gray-700 cursor-pointer">
          <RotateCw size={15} className={carregando ? 'animate-spin text-blue-400' : ''} />
        </button>
        <button onClick={onToggleNotificacoes} className={`border p-2 rounded cursor-pointer ${notificacoesAtivas ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-[#202024] border-gray-700 text-gray-500'}`}>
          {notificacoesAtivas ? <Bell size={15} /> : <BellOff size={15} />}
        </button>
        <div className="hidden lg:flex items-center gap-2 bg-[#202024] border border-gray-700 rounded px-3 py-1.5">
          <User size={14} className="text-blue-400" />
          <div className="leading-tight">
            <div className="text-[11px] text-white font-semibold">{usuarioLogado.nomeUsuario}</div>
            <div className="text-[10px] text-gray-500">{usuarioLogado.tipoUsuario}</div>
          </div>
        </div>
        <button onClick={onSair} className="border border-gray-700 bg-[#202024] text-gray-300 p-2 rounded hover:bg-gray-700 cursor-pointer" title="Sair">
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
