import { CalendarDays, CheckSquare, Link2, Tag, Timer, User } from 'lucide-react';
import type { TarefaKanban } from '../types';

interface CardTarefaProps {
  tarefa: TarefaKanban;
}

const prioridadeClasses: Record<TarefaKanban['prioridade'], string> = {
  Baixa: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
  Media: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
  Alta: 'text-orange-300 bg-orange-500/10 border-orange-500/20',
  Critica: 'text-red-300 bg-red-500/10 border-red-500/20',
};

const cardPrioridadeClasses: Record<TarefaKanban['prioridade'], string> = {
  Baixa: 'bg-sky-950/20 border-sky-500/30 hover:border-sky-400/70',
  Media: 'bg-amber-950/20 border-amber-500/30 hover:border-amber-400/70',
  Alta: 'bg-orange-950/25 border-orange-500/35 hover:border-orange-400/75',
  Critica: 'bg-red-950/30 border-red-500/45 hover:border-red-400/80',
};

const codigoPrioridadeClasses: Record<TarefaKanban['prioridade'], string> = {
  Baixa: 'text-sky-300',
  Media: 'text-amber-300',
  Alta: 'text-orange-300',
  Critica: 'text-red-300',
};

export function CardTarefa({ tarefa }: CardTarefaProps) {
  const checklistConcluido = tarefa.checklist.filter(item => item.trim()).length;

  return (
    <div className={`p-3.5 rounded-md shadow border transition-all duration-150 flex flex-col gap-2 ${cardPrioridadeClasses[tarefa.prioridade]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className={`text-[10px] font-bold ${codigoPrioridadeClasses[tarefa.prioridade]}`}>{tarefa.codigo}</span>
          <h3 className="text-xs font-semibold text-gray-100 line-clamp-2 leading-relaxed">{tarefa.titulo}</h3>
        </div>
        <span className={`text-[9px] font-bold px-2 py-1 rounded border ${prioridadeClasses[tarefa.prioridade]}`}>
          {tarefa.prioridade}
        </span>
      </div>

      {tarefa.descricao && (
        <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{tarefa.descricao}</p>
      )}

      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
        <div className="flex items-center gap-1 min-w-0">
          <User size={10} className="text-emerald-400 shrink-0" />
          <span className="truncate">{tarefa.responsavelNome}</span>
        </div>
        <div className="flex items-center gap-1 min-w-0">
          <CalendarDays size={10} className="text-blue-400 shrink-0" />
          <span className="truncate">{tarefa.prazo || 'Sem prazo'}</span>
        </div>
        <div className="flex items-center gap-1 min-w-0">
          <Timer size={10} className="text-amber-400 shrink-0" />
          <span className="truncate">{tarefa.estimativaHoras || 'Sem estimativa'}h</span>
        </div>
        <div className="flex items-center gap-1 min-w-0">
          <CheckSquare size={10} className="text-indigo-300 shrink-0" />
          <span className="truncate">{checklistConcluido} itens</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-800/70">
        {tarefa.categoria && (
          <span className="text-[9px] text-gray-300 bg-[#121214] rounded px-1.5 py-0.5">{tarefa.categoria}</span>
        )}
        {tarefa.projeto && (
          <span className="text-[9px] text-purple-200 bg-purple-500/10 rounded px-1.5 py-0.5">{tarefa.projeto}</span>
        )}
        {tarefa.etiquetas.slice(0, 3).map(etiqueta => (
          <span key={etiqueta} className="flex items-center gap-1 text-[9px] text-gray-400 bg-[#121214] rounded px-1.5 py-0.5">
            <Tag size={8} />
            {etiqueta}
          </span>
        ))}
        {tarefa.linkReferencia && (
          <span className="flex items-center gap-1 text-[9px] text-blue-300 bg-blue-500/10 rounded px-1.5 py-0.5">
            <Link2 size={8} />
            link
          </span>
        )}
      </div>
    </div>
  );
}
