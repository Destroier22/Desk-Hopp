import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import type { TarefaKanban, UsuarioLogado } from '../../types';

export type NovaTarefaForm = Omit<TarefaKanban, 'id' | 'codigo' | 'status' | 'criadoEm' | 'responsavelNome' | 'etiquetas' | 'checklist'> & {
  etiquetasTexto: string;
  checklistTexto: string;
};

interface NovaTarefaModalProps {
  form: NovaTarefaForm;
  usuarios: UsuarioLogado[];
  onChange: (campo: keyof NovaTarefaForm, valor: string) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function NovaTarefaModal({ form, usuarios, onChange, onClose, onSubmit }: NovaTarefaModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#1e1e24] border border-gray-800 rounded-lg w-full max-w-4xl p-6 relative shadow-2xl flex flex-col max-h-[92vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer">
          <X size={20} />
        </button>
        <h2 className="text-lg font-bold text-white mb-1">Nova Tarefa</h2>
        <p className="text-xs text-gray-500 mb-5 border-b border-gray-800 pb-3">
          Configure uma tarefa interna para acompanhar no Kanban junto com os tickets.
        </p>

        <form onSubmit={onSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">TITULO *</label>
                <input
                  value={form.titulo}
                  onChange={(e) => onChange('titulo', e.target.value)}
                  placeholder="Ex: Revisar onboarding do cliente"
                  className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">DESCRICAO</label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => onChange('descricao', e.target.value)}
                  placeholder="Objetivo, contexto, criterio de aceite e qualquer detalhe importante..."
                  rows={5}
                  className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-xs text-white resize-none focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">PROJETO / AREA</label>
                  <input
                    value={form.projeto}
                    onChange={(e) => onChange('projeto', e.target.value)}
                    placeholder="Ex: Portal do cliente"
                    className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">CATEGORIA</label>
                  <select
                    value={form.categoria}
                    onChange={(e) => onChange('categoria', e.target.value)}
                    className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option>Operacional</option>
                    <option>Desenvolvimento</option>
                    <option>Documentacao</option>
                    <option>Financeiro</option>
                    <option>Comercial</option>
                    <option>Melhoria interna</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">CHECKLIST</label>
                <textarea
                  value={form.checklistTexto}
                  onChange={(e) => onChange('checklistTexto', e.target.value)}
                  placeholder="Uma etapa por linha"
                  rows={4}
                  className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-xs text-white resize-none focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">RESPONSAVEL *</label>
                  <select
                    value={form.responsavelId}
                    onChange={(e) => onChange('responsavelId', e.target.value)}
                    className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Selecione...</option>
                    {usuarios.map(usuario => (
                      <option key={usuario.id} value={usuario.id}>{usuario.nomeUsuario}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">SOLICITANTE</label>
                  <input
                    value={form.solicitante}
                    onChange={(e) => onChange('solicitante', e.target.value)}
                    placeholder="Quem pediu a tarefa"
                    className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">PRIORIDADE</label>
                  <select
                    value={form.prioridade}
                    onChange={(e) => onChange('prioridade', e.target.value)}
                    className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    <option>Baixa</option>
                    <option>Media</option>
                    <option>Alta</option>
                    <option>Critica</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">ESTIMATIVA (H)</label>
                  <input
                    value={form.estimativaHoras}
                    onChange={(e) => onChange('estimativaHoras', e.target.value)}
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="2"
                    className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">PRAZO</label>
                  <input
                    value={form.prazo}
                    onChange={(e) => onChange('prazo', e.target.value)}
                    type="date"
                    className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">LEMBRETE</label>
                  <input
                    value={form.lembrete}
                    onChange={(e) => onChange('lembrete', e.target.value)}
                    type="datetime-local"
                    className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">RECORRENCIA</label>
                <select
                  value={form.recorrencia}
                  onChange={(e) => onChange('recorrencia', e.target.value)}
                  className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option>Nao recorrente</option>
                  <option>Diaria</option>
                  <option>Semanal</option>
                  <option>Quinzenal</option>
                  <option>Mensal</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">ETIQUETAS</label>
                <input
                  value={form.etiquetasTexto}
                  onChange={(e) => onChange('etiquetasTexto', e.target.value)}
                  placeholder="urgente, cliente vip, revisao"
                  className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">LINK / REFERENCIA</label>
                <input
                  value={form.linkReferencia}
                  onChange={(e) => onChange('linkReferencia', e.target.value)}
                  placeholder="URL, documento, pasta ou protocolo"
                  className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">OBSERVADORES</label>
                <input
                  value={form.observadores}
                  onChange={(e) => onChange('observadores', e.target.value)}
                  placeholder="Pessoas ou grupos acompanhando"
                  className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs font-semibold cursor-pointer">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold cursor-pointer">
              Criar tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
