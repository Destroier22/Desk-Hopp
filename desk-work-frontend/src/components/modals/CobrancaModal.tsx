import type { FormEvent } from 'react';
import { DollarSign } from 'lucide-react';

interface CobrancaModalProps {
  valorCobranca: string;
  onClose: () => void;
  onSubmit: (e: FormEvent) => void;
  onValorChange: (valor: string) => void;
}

export function CobrancaModal({
  valorCobranca,
  onClose,
  onSubmit,
  onValorChange,
}: CobrancaModalProps) {
  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#1e1e24] border border-emerald-600/30 rounded-lg w-full max-w-sm p-5 shadow-2xl">
        <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider mb-4 flex items-center gap-2">
          <DollarSign size={16} /> Cobranca avulsa
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Valor em R$</label>
            <input value={valorCobranca} onChange={(e) => onValorChange(e.target.value)} placeholder="Ex: 150,00" className="w-full bg-[#121214] border border-gray-700 rounded p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500" autoFocus />
          </div>
          <div className="flex justify-end gap-2 text-xs">
            <button type="button" onClick={onClose} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded cursor-pointer">Cancelar</button>
            <button type="submit" className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded cursor-pointer">Salvar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
