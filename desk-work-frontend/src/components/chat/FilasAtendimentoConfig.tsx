import { useState, type FormEvent } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import type { FilaAtendimento, UsuarioLogado } from '../../types';

interface FilasAtendimentoConfigProps {
  filas: FilaAtendimento[];
  usuarios: UsuarioLogado[];
  onFilasChange: (filas: FilaAtendimento[]) => void;
}

export function FilasAtendimentoConfig({ filas, usuarios, onFilasChange }: FilasAtendimentoConfigProps) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  const criarFila = (e: FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    onFilasChange([
      ...filas,
      {
        id: `fila-${Date.now()}`,
        nome: nome.trim(),
        descricao: descricao.trim() || 'Fila de atendimento',
        usuariosIds: [],
      },
    ]);
    setNome('');
    setDescricao('');
  };

  const alternarUsuario = (filaId: string, usuarioId: string) => {
    onFilasChange(filas.map((fila) => {
      if (fila.id !== filaId) return fila;
      const existe = fila.usuariosIds.includes(usuarioId);
      return {
        ...fila,
        usuariosIds: existe
          ? fila.usuariosIds.filter(id => id !== usuarioId)
          : [...fila.usuariosIds, usuarioId],
      };
    }));
  };

  const removerFila = (filaId: string) => {
    onFilasChange(filas.filter(fila => fila.id !== filaId));
  };

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Filas de Atendimento</h1>
        <p className="text-xs text-gray-500">Crie filas como Suporte, Financeiro e Administrativo, e atribua usuarios a cada uma.</p>
      </div>

      <form onSubmit={criarFila} className="bg-[#202024] border border-gray-800 rounded-lg p-4 grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-3">
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome da fila"
          className="bg-[#121214] border border-gray-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
        />
        <input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Descricao"
          className="bg-[#121214] border border-gray-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
        />
        <button className="bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-2 text-sm font-semibold flex items-center justify-center gap-2">
          <Plus size={16} /> Criar fila
        </button>
      </form>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {filas.map((fila) => (
          <div key={fila.id} className="bg-[#202024] border border-gray-800 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-white">{fila.nome}</h2>
                <p className="text-xs text-gray-500">{fila.descricao}</p>
              </div>
              <button onClick={() => removerFila(fila.id)} className="text-gray-500 hover:text-red-300">
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-gray-500 uppercase font-bold mb-2">
              <Users size={14} /> Usuarios da fila
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {usuarios.map((usuario) => (
                <label key={usuario.id} className="flex items-center gap-2 bg-[#121214] border border-gray-800 rounded p-2 text-xs text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fila.usuariosIds.includes(usuario.id)}
                    onChange={() => alternarUsuario(fila.id, usuario.id)}
                  />
                  <span className="truncate">{usuario.nomeUsuario}</span>
                  <span className="ml-auto text-[10px] text-gray-600">{usuario.tipoUsuario}</span>
                </label>
              ))}
              {!usuarios.length && <span className="text-xs text-gray-600">Nenhum usuario carregado.</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
