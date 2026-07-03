import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import type { Categoria, Dispositivo, Empresa } from '../../types';

interface NovoTicketModalProps {
  assunto: string;
  categoriaSelecionadaId: string;
  descricao: string;
  dispositivoSelecionadoId: string;
  empresaSelecionadaId: string;
  listaCategorias: Categoria[];
  listaDispositivos: Dispositivo[];
  listaEmpresas: Empresa[];
  solicitante: string;
  onAssuntoChange: (valor: string) => void;
  onCategoriaChange: (valor: string) => void;
  onDescricaoChange: (valor: string) => void;
  onDispositivoChange: (valor: string) => void;
  onEmpresaChange: (valor: string) => void;
  onSolicitanteChange: (valor: string) => void;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
}

export function NovoTicketModal({
  assunto,
  categoriaSelecionadaId,
  descricao,
  dispositivoSelecionadoId,
  empresaSelecionadaId,
  listaCategorias,
  listaDispositivos,
  listaEmpresas,
  solicitante,
  onAssuntoChange,
  onCategoriaChange,
  onDescricaoChange,
  onDispositivoChange,
  onEmpresaChange,
  onSolicitanteChange,
  onClose,
  onSubmit,
}: NovoTicketModalProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#1e1e24] border border-gray-800 rounded-lg w-full max-w-2xl p-6 relative shadow-2xl flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer"><X size={20} /></button>
        <h2 className="text-lg font-bold text-white mb-6 border-b border-gray-800 pb-3">Novo Ticket</h2>
        <form onSubmit={onSubmit} className="space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">SOLICITANTE / EMPRESA *</label>
                <select value={empresaSelecionadaId} onChange={(e) => onEmpresaChange(e.target.value)} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none" required>
                  <option value="">Selecione uma Empresa...</option>
                  {listaEmpresas.map(emp => <option key={emp.id} value={emp.id}>{emp.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">RESPONSAVEL / SOLICITANTE NOME *</label>
                <input type="text" value={solicitante} onChange={(e) => onSolicitanteChange(e.target.value)} placeholder="Ex: Joao Silva" className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none" required />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">ASSUNTO *</label>
                <input type="text" value={assunto} onChange={(e) => onAssuntoChange(e.target.value)} placeholder="Assunto do chamado" className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none" required />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">CATEGORIAS *</label>
                <select value={categoriaSelecionadaId} onChange={(e) => onCategoriaChange(e.target.value)} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white focus:outline-none" required>
                  <option value="">Selecione a categoria...</option>
                  {listaCategorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">DISPOSITIVO / ATIVO</label>
                <select value={dispositivoSelecionadoId} onChange={(e) => onDispositivoChange(e.target.value)} disabled={!empresaSelecionadaId} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white disabled:opacity-40 focus:outline-none">
                  <option value="">Selecione o dispositivo...</option>
                  {listaDispositivos.map(disp => <option key={disp.id} value={disp.id}>{disp.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">DESCRICAO INICIAL</label>
                <textarea value={descricao} onChange={(e) => onDescricaoChange(e.target.value)} placeholder="Detalhes preliminares..." rows={3} className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-xs text-white resize-none focus:outline-none" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-800">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs font-semibold cursor-pointer">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold cursor-pointer">Abrir ticket</button>
          </div>
        </form>
      </div>
    </div>
  );
}
