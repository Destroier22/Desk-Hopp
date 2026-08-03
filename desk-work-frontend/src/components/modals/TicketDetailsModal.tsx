import { Check, CornerUpLeft, DollarSign, Edit3, MessageSquare, Paperclip, Pause, Play, Save, X } from 'lucide-react';
import type { Categoria, Dispositivo, Ticket } from '../../types';
import { formatarMoeda } from '../../utils/formatters';

interface TicketDetailsModalProps {
  assunto: string;
  categoriaSelecionadaId: string;
  descricao: string;
  dispositivoSelecionadoId: string;
  listaCategorias: Categoria[];
  listaDispositivos: Dispositivo[];
  modoEdicao: boolean;
  solicitante: string;
  ticketSelecionado: Ticket;
  onAbrirCobrancaAvulsa: () => void;
  onAssuntoChange: (valor: string) => void;
  onCategoriaChange: (valor: string) => void;
  onClose: () => void;
  onDescricaoChange: (valor: string) => void;
  onDispositivoChange: (valor: string) => void;
  onImprimirRelatorio: () => void;
  onModoEdicaoChange: (valor: boolean) => void;
  onSalvarEdicao: () => void;
  onSolicitanteChange: (valor: string) => void;
  onTrocarStatus: (id: string, novoStatus: string) => void;
}

export function TicketDetailsModal({
  assunto,
  categoriaSelecionadaId,
  descricao,
  dispositivoSelecionadoId,
  listaCategorias,
  listaDispositivos,
  modoEdicao,
  solicitante,
  ticketSelecionado,
  onAbrirCobrancaAvulsa,
  onAssuntoChange,
  onCategoriaChange,
  onClose,
  onDescricaoChange,
  onDispositivoChange,
  onImprimirRelatorio,
  onModoEdicaoChange,
  onSalvarEdicao,
  onSolicitanteChange,
  onTrocarStatus,
}: TicketDetailsModalProps) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1e1e24] border border-gray-700 rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        <div className="bg-[#25252c] p-4 border-b border-gray-800 flex justify-between items-center">
          <div>
            <span className="text-amber-500 font-bold text-sm">#{ticketSelecionado.numero}</span>
            <span className="text-gray-400 text-xs ml-2">- Empresa vinculada: <strong className="text-white">{ticketSelecionado.empresa.nome}</strong></span>
          </div>
          <div className="flex items-center gap-3">
            {ticketSelecionado.status === 'CONCLUIDO' && (
              <button title="Imprimir relatorio em PDF" onClick={onImprimirRelatorio} className="p-2 rounded text-blue-300 bg-blue-600/10 border border-blue-500/40 hover:bg-blue-600/20 hover:text-blue-200 cursor-pointer transition-all">
                <Paperclip size={16} />
              </button>
            )}
            <button onClick={() => onModoEdicaoChange(!modoEdicao)} className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 cursor-pointer border ${modoEdicao ? 'bg-amber-600/20 text-amber-400 border-amber-500' : 'bg-gray-800 text-gray-300 border-transparent hover:bg-gray-700'}`}>
              <Edit3 size={13} /> {modoEdicao ? 'Sair da Edicao' : 'Editar Dados'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer"><X size={20} /></button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-3 space-y-4 border-r border-gray-800/60 pr-4">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Assunto do Chamado</label>
              <input type="text" value={assunto} onChange={(e) => onAssuntoChange(e.target.value)} disabled={!modoEdicao} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white disabled:opacity-60 disabled:bg-transparent focus:outline-none focus:border-blue-500" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Responsavel / Solicitante</label>
                <input type="text" value={solicitante} onChange={(e) => onSolicitanteChange(e.target.value)} disabled={!modoEdicao} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white disabled:opacity-60 disabled:bg-transparent focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Categoria de Servico</label>
                <select value={categoriaSelecionadaId} onChange={(e) => onCategoriaChange(e.target.value)} disabled={!modoEdicao} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white disabled:opacity-60 disabled:bg-transparent focus:outline-none focus:border-blue-500">
                  {listaCategorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Dispositivo Relacionado</label>
              <select value={dispositivoSelecionadoId} onChange={(e) => onDispositivoChange(e.target.value)} disabled={!modoEdicao} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white disabled:opacity-60 disabled:bg-transparent focus:outline-none focus:border-blue-500">
                <option value="">Nenhum dispositivo associado</option>
                {listaDispositivos.map(disp => <option key={disp.id} value={disp.id}>{disp.nome}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Descricao</label>
              <textarea value={descricao} onChange={(e) => onDescricaoChange(e.target.value)} disabled={!modoEdicao} rows={4} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-xs text-white disabled:opacity-60 disabled:bg-transparent resize-none focus:outline-none focus:border-blue-500" />
            </div>

            {modoEdicao && (
              <button onClick={onSalvarEdicao} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all">
                <Save size={14} /> Salvar Modificacoes do Chamado
              </button>
            )}
          </div>

          <div className="md:col-span-2 flex flex-col justify-between space-y-4">
            <div className="bg-[#121214] p-4 rounded border border-gray-800">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block mb-2">Painel de Operacoes</span>

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
                <span className="text-xs text-gray-400">Cobranca:</span>
                <span className="text-xs text-emerald-300 font-semibold">
                  {ticketSelecionado.valorCobrancaAvulsa ? formatarMoeda(ticketSelecionado.valorCobrancaAvulsa) : 'Sem cobranca'}
                </span>
              </div>

              <button onClick={onAbrirCobrancaAvulsa} className="w-full mb-3 py-2 bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-300 border border-emerald-600/30 font-bold text-xs rounded flex items-center justify-center gap-1.5 cursor-pointer">
                <DollarSign size={13} /> Cobranca avulsa
              </button>

              <div className="grid grid-cols-2 gap-2">
                {(ticketSelecionado.status === 'A_FAZER' || ticketSelecionado.status === 'PAUSADOS') && (
                  <button onClick={() => onTrocarStatus(ticketSelecionado.id, 'ATENDENDO')} className="py-2 bg-green-600 hover:bg-green-500 text-white font-bold text-xs rounded flex items-center justify-center gap-1.5 cursor-pointer col-span-2">
                    <Play size={13} fill="currentColor" /> Iniciar / Retomar
                  </button>
                )}
                {ticketSelecionado.status === 'ATENDENDO' && (
                  <>
                    <button onClick={() => onTrocarStatus(ticketSelecionado.id, 'PAUSADOS')} className="py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold text-xs rounded flex items-center justify-center gap-1.5 cursor-pointer">
                      <Pause size={13} fill="currentColor" /> Pausar
                    </button>
                    <button onClick={() => onTrocarStatus(ticketSelecionado.id, 'CONCLUIDO')} className="py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded flex items-center justify-center gap-1.5 cursor-pointer">
                      <Check size={13} /> Concluir
                    </button>
                  </>
                )}
                {ticketSelecionado.status === 'CONCLUIDO' && (
                  <button onClick={() => onTrocarStatus(ticketSelecionado.id, 'A_FAZER')} className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white font-bold text-xs rounded flex items-center justify-center gap-1.5 cursor-pointer col-span-2">
                    <CornerUpLeft size={13} /> Reabrir Chamado
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 bg-[#121214] p-3 rounded border border-gray-800 flex flex-col overflow-hidden">
              <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider flex items-center gap-1 mb-2">
                <MessageSquare size={11} /> Linha do Tempo Tecnica
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
                      <span className="text-[9px] text-gray-500 block mt-1">Etapa {idx + 1} - Lancamento de {Math.floor(apont.segundosSessao / 60)} min</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-gray-600 block text-center pt-8">Nenhum historico lancado nesta sessao.</span>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
