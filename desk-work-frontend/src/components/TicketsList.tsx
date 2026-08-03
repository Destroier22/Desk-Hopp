import { Building2, Clock, Hash, User } from 'lucide-react';
import type { Ticket } from '../types';
import { formatarDataRelatorio, formatarTempoAcumulado } from '../utils/formatters';

interface TicketsListProps {
  tickets: Ticket[];
  onAbrirDetalhes: (ticket: Ticket) => void;
}

const statusClasses: Record<string, string> = {
  A_FAZER: 'bg-red-500/10 text-red-300 border-red-500/25',
  ATENDENDO: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  PAUSADOS: 'bg-amber-500/10 text-amber-300 border-amber-500/25',
  CONCLUIDO: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
};

const statusLabel: Record<string, string> = {
  A_FAZER: 'A fazer',
  ATENDENDO: 'Atendendo',
  PAUSADOS: 'Pausado',
  CONCLUIDO: 'Concluido',
};

export function TicketsList({ tickets, onAbrirDetalhes }: TicketsListProps) {
  const ticketsOrdenados = [...tickets].sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());

  return (
    <section className="bg-[#202024] border border-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">Tickets</h1>
          <p className="text-xs text-gray-500">Listagem do mais novo ao mais antigo.</p>
        </div>
        <span className="text-xs text-gray-400 bg-[#121214] border border-gray-800 rounded px-3 py-2">
          {ticketsOrdenados.length} tickets
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead className="bg-[#121214] text-[11px] uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Ticket</th>
              <th className="px-4 py-3">Assunto</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Solicitante</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Criado em</th>
              <th className="px-4 py-3">Tempo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {ticketsOrdenados.map(ticket => (
              <tr
                key={ticket.id}
                onClick={() => onAbrirDetalhes(ticket)}
                className="hover:bg-gray-800/40 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold">
                    <Hash size={13} />
                    {ticket.numero}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="block text-sm text-white font-semibold max-w-[260px] truncate">{ticket.assunto}</span>
                  <span className="block text-[11px] text-gray-500 max-w-[260px] truncate">{ticket.descricao || 'Sem descricao'}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Building2 size={13} className="text-blue-400" />
                    <span className="max-w-[180px] truncate">{ticket.empresa?.nome || 'Nao informado'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <User size={13} className="text-emerald-400" />
                    <span className="max-w-[160px] truncate">{ticket.solicitante}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-300">{ticket.categoria?.nome || 'Geral'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex border rounded px-2 py-1 text-[11px] font-semibold ${statusClasses[ticket.status] || 'bg-gray-500/10 text-gray-300 border-gray-500/20'}`}>
                    {statusLabel[ticket.status] || ticket.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{formatarDataRelatorio(ticket.criadoEm)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock size={13} className="text-amber-400" />
                    {formatarTempoAcumulado(ticket.totalSegundos || 0)}
                  </div>
                </td>
              </tr>
            ))}
            {!ticketsOrdenados.length && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-sm text-gray-500">
                  Nenhum ticket encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
