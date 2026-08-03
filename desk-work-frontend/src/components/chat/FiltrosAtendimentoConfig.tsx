import { useState, type FormEvent } from 'react';
import { Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import type { FilaAtendimento, FiltroAtendimento } from '../../types';

interface FiltrosAtendimentoConfigProps {
  filas: FilaAtendimento[];
  filtros: FiltroAtendimento[];
  onFiltrosChange: (filtros: FiltroAtendimento[]) => void;
}

export function FiltrosAtendimentoConfig({ filas, filtros, onFiltrosChange }: FiltrosAtendimentoConfigProps) {
  const [respostaCliente, setRespostaCliente] = useState('');
  const [mensagemAutomatica, setMensagemAutomatica] = useState('');
  const [filaId, setFilaId] = useState(filas[0]?.id || '');

  const criarFiltro = (e: FormEvent) => {
    e.preventDefault();
    if (!respostaCliente.trim() || !filaId) return;

    onFiltrosChange([
      ...filtros,
      {
        id: `filtro-${Date.now()}`,
        respostaCliente: respostaCliente.trim(),
        mensagemAutomatica: mensagemAutomatica.trim() || 'Obrigado. Vou direcionar seu atendimento para a fila correta.',
        filaId,
        ativo: true,
      },
    ]);
    setRespostaCliente('');
    setMensagemAutomatica('');
  };

  const alternarFiltro = (id: string) => {
    onFiltrosChange(filtros.map(filtro => filtro.id === id ? { ...filtro, ativo: !filtro.ativo } : filtro));
  };

  const removerFiltro = (id: string) => {
    onFiltrosChange(filtros.filter(filtro => filtro.id !== id));
  };

  const nomeFila = (id: string) => filas.find(fila => fila.id === id)?.nome || 'Fila removida';

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Filtro de Atendimento</h1>
        <p className="text-xs text-gray-500">Configure respostas/palavras-chave para enviar mensagens automaticas e atribuir o atendimento a uma fila.</p>
      </div>

      <form onSubmit={criarFiltro} className="bg-[#202024] border border-gray-800 rounded-lg p-4 grid grid-cols-1 xl:grid-cols-[1fr_1fr_220px_auto] gap-3">
        <input
          value={respostaCliente}
          onChange={(e) => setRespostaCliente(e.target.value)}
          placeholder="Resposta ou palavra-chave do cliente. Ex: financeiro"
          className="bg-[#121214] border border-gray-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
        />
        <input
          value={mensagemAutomatica}
          onChange={(e) => setMensagemAutomatica(e.target.value)}
          placeholder="Mensagem automatica"
          className="bg-[#121214] border border-gray-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
        />
        <select
          value={filaId}
          onChange={(e) => setFilaId(e.target.value)}
          className="bg-[#121214] border border-gray-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
        >
          {filas.map(fila => <option key={fila.id} value={fila.id}>{fila.nome}</option>)}
        </select>
        <button className="bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2 text-sm font-semibold flex items-center justify-center gap-2">
          <Plus size={16} /> Criar filtro
        </button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtros.map((filtro) => (
          <div key={filtro.id} className="bg-[#202024] border border-gray-800 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white">Se cliente responder: "{filtro.respostaCliente}"</h2>
                <p className="text-xs text-gray-500 mt-1">Direciona para: <strong className="text-blue-300">{nomeFila(filtro.filaId)}</strong></p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => alternarFiltro(filtro.id)} className={filtro.ativo ? 'text-emerald-300' : 'text-gray-600'}>
                  {filtro.ativo ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                </button>
                <button onClick={() => removerFiltro(filtro.id)} className="text-gray-500 hover:text-red-300">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="mt-3 bg-[#121214] border border-gray-800 rounded p-3 text-xs text-gray-300">
              {filtro.mensagemAutomatica}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
