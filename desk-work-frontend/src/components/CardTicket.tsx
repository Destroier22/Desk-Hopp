import { Clock, User } from 'lucide-react';
import type { Ticket } from '../types';
import { formatarTempoAcumulado } from '../utils/formatters';

interface CardTicketProps {
  ticket: Ticket;
  onAbrirDetalhes: (ticket: Ticket) => void;
}

export function CardTicket({ ticket, onAbrirDetalhes }: CardTicketProps) {
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
        <div className="flex items-center gap-1 text-gray-300 truncate max-w-[120px]" title="Responsavel / Solicitante">
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
