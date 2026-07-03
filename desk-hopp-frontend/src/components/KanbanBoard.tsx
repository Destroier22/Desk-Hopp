import type { KanbanData, Ticket } from '../types';
import { CardTicket } from './CardTicket';

interface KanbanBoardProps {
  kanban: KanbanData;
  onAbrirDetalhes: (ticket: Ticket) => void;
}

export function KanbanBoard({ kanban, onAbrirDetalhes }: KanbanBoardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-[#202024] p-4 rounded-lg border-t-4 border-red-500 flex flex-col min-h-[500px]">
        <h2 className="font-bold text-base mb-4 flex justify-between items-center text-red-400"><span>A FAZER</span> <span className="text-xl text-white">{kanban.aFazer.length}</span></h2>
        <div className="space-y-3 flex-1">
          {kanban.aFazer.map(ticket => <CardTicket key={ticket.id} ticket={ticket} onAbrirDetalhes={onAbrirDetalhes} />)}
        </div>
      </div>
      <div className="bg-[#202024] p-4 rounded-lg border-t-4 border-green-500 flex flex-col min-h-[500px]">
        <h2 className="font-bold text-base mb-4 flex justify-between items-center text-green-400"><span>ATENDENDO</span> <span className="text-xl text-white">{kanban.atendendo.length}</span></h2>
        <div className="space-y-3 flex-1">
          {kanban.atendendo.map(ticket => <CardTicket key={ticket.id} ticket={ticket} onAbrirDetalhes={onAbrirDetalhes} />)}
        </div>
      </div>
      <div className="bg-[#202024] p-4 rounded-lg border-t-4 border-yellow-500 flex flex-col min-h-[500px]">
        <h2 className="font-bold text-base mb-4 flex justify-between items-center text-yellow-400"><span>PAUSADOS</span> <span className="text-xl text-white">{kanban.pausados.length}</span></h2>
        <div className="space-y-3 flex-1">
          {kanban.pausados.map(ticket => <CardTicket key={ticket.id} ticket={ticket} onAbrirDetalhes={onAbrirDetalhes} />)}
        </div>
      </div>
      <div className="bg-[#202024] p-4 rounded-lg border-t-4 border-blue-400 flex flex-col min-h-[500px]">
        <h2 className="font-bold text-base mb-4 flex justify-between items-center text-blue-400"><span>CONCLUIDOS DO DIA</span> <span className="text-xl text-white">{kanban.concluidosDoDia.length}</span></h2>
        <div className="space-y-3 flex-1">
          {kanban.concluidosDoDia.map(ticket => <CardTicket key={ticket.id} ticket={ticket} onAbrirDetalhes={onAbrirDetalhes} />)}
        </div>
      </div>
    </div>
  );
}
