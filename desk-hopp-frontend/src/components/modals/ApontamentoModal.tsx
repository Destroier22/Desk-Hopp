import type { FormEvent } from 'react';
import { Image, X } from 'lucide-react';
import type { ImagemApontamento } from '../../types';

interface ApontamentoModalProps {
  imagemApontamento: ImagemApontamento | null;
  textoApontamento: string;
  onCancelar: () => void;
  onImagemChange: (arquivo?: File) => void;
  onImagemRemover: () => void;
  onSubmit: (e: FormEvent) => void;
  onTextoChange: (valor: string) => void;
}

export function ApontamentoModal({
  imagemApontamento,
  textoApontamento,
  onCancelar,
  onImagemChange,
  onImagemRemover,
  onSubmit,
  onTextoChange,
}: ApontamentoModalProps) {
  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-[#1e1e24] border-2 border-amber-600/30 rounded-lg w-full max-w-md p-5 shadow-2xl">
        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-2">Justificativa Tecnica</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <textarea value={textoApontamento} onChange={(e) => onTextoChange(e.target.value)} placeholder="O que voce realizou nesta etapa de atendimento?" rows={4} className="w-full bg-[#121214] border border-gray-700 rounded p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none" required autoFocus />
          <label className="flex items-center justify-center gap-2 border border-dashed border-gray-700 rounded p-3 text-xs text-gray-400 hover:border-amber-500 hover:text-amber-300 cursor-pointer">
            <Image size={15} />
            {imagemApontamento ? imagemApontamento.nome : 'Adicionar imagem opcional'}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onImagemChange(e.target.files?.[0])} />
          </label>
          {imagemApontamento && (
            <div className="relative">
              <img src={imagemApontamento.base64} alt={imagemApontamento.nome} className="max-h-36 w-full object-cover rounded border border-gray-700" />
              <button type="button" onClick={onImagemRemover} className="absolute top-2 right-2 bg-black/70 text-white rounded p-1">
                <X size={14} />
              </button>
            </div>
          )}
          <div className="flex justify-end gap-2 text-xs">
            <button type="button" onClick={onCancelar} className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded cursor-pointer">Cancelar</button>
            <button type="submit" className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded cursor-pointer">Gravar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
