import { useMemo, useState } from 'react';
import type { KanbanData } from '../../types';
import { contarPorCampo, listarTicketsKanban } from '../../utils/dashboardMetrics';
import { formatarTempoAcumulado } from '../../utils/formatters';

interface MesasTrabalhoDashboardProps {
  kanban: KanbanData;
}

export function MesasTrabalhoDashboard({ kanban }: MesasTrabalhoDashboardProps) {
  const [filtro, setFiltro] = useState('');
  const tickets = listarTicketsKanban(kanban);

  const usuarios = useMemo(() => {
    const agrupados = new Map<string, { nome: string; grupo: string; total: number; segundos: number; concluidos: number }>();
    tickets.forEach((ticket) => {
      const nome = ticket.operador || 'Sem operador';
      const grupo = nome === 'Sem operador' ? 'Sem grupo' : 'Atendimento';
      const atual = agrupados.get(nome) || { nome, grupo, total: 0, segundos: 0, concluidos: 0 };
      atual.total += 1;
      atual.segundos += ticket.totalSegundos || 0;
      if (ticket.status === 'CONCLUIDO') atual.concluidos += 1;
      agrupados.set(nome, atual);
    });
    return Array.from(agrupados.values()).sort((a, b) => b.total - a.total);
  }, [tickets]);

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const termo = filtro.trim().toLowerCase();
    if (!termo) return true;
    return usuario.nome.toLowerCase().includes(termo) || usuario.grupo.toLowerCase().includes(termo);
  });

  const maiorTotal = Math.max(...usuariosFiltrados.map(usuario => usuario.total), 1);
  const porGrupo = contarPorCampo(
    usuariosFiltrados.map(usuario => ({
      id: usuario.nome,
      numero: 0,
      assunto: '',
      solicitante: '',
      status: usuario.grupo,
      empresaId: '',
      categoriaId: '',
      empresa: { nome: usuario.grupo },
      categoria: { nome: usuario.grupo },
      totalSegundos: usuario.total,
      apontamentos: [],
      criadoEm: new Date().toISOString(),
      finalizadoEm: null,
    })),
    ticket => ticket.status,
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Mesas de Trabalho</h1>
          <p className="text-xs text-gray-500">Indicadores por usuario, com filtro por nome ou grupo de trabalho.</p>
        </div>
        <input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Filtrar por usuario ou grupo..."
          className="w-full md:w-72 bg-[#202024] border border-gray-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-[#202024] border border-gray-800 rounded-lg p-4 lg:col-span-2">
          <h2 className="text-sm font-bold text-gray-200 mb-4">Tickets por usuario</h2>
          <div className="space-y-3">
            {usuariosFiltrados.map((usuario) => (
              <div key={usuario.nome}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{usuario.nome} <span className="text-gray-600">({usuario.grupo})</span></span>
                  <span className="text-gray-300">{usuario.total} tickets</span>
                </div>
                <div className="h-2 bg-[#121214] rounded overflow-hidden">
                  <div className="h-full bg-blue-500 rounded" style={{ width: `${(usuario.total / maiorTotal) * 100}%` }} />
                </div>
              </div>
            ))}
            {!usuariosFiltrados.length && <span className="text-xs text-gray-600">Nenhum usuario encontrado.</span>}
          </div>
        </div>

        <div className="bg-[#202024] border border-gray-800 rounded-lg p-4">
          <h2 className="text-sm font-bold text-gray-200 mb-4">Distribuicao por grupo</h2>
          <div className="space-y-2">
            {porGrupo.map((grupo) => (
              <div key={grupo.nome} className="flex justify-between text-xs">
                <span className="text-gray-400">{grupo.nome}</span>
                <strong className="text-white">{grupo.total}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {usuariosFiltrados.map((usuario) => (
          <div key={usuario.nome} className="bg-[#202024] border border-gray-800 rounded-lg p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">{usuario.nome}</h3>
                <p className="text-[11px] text-gray-500">{usuario.grupo}</p>
              </div>
              <span className="text-xs bg-blue-600/15 text-blue-300 border border-blue-500/30 rounded px-2 py-1">
                {usuario.concluidos} concluidos
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#121214] rounded p-3">
                <span className="block text-gray-500">Tickets</span>
                <strong className="text-lg text-white">{usuario.total}</strong>
              </div>
              <div className="bg-[#121214] rounded p-3">
                <span className="block text-gray-500">Tempo</span>
                <strong className="text-sm text-white">{formatarTempoAcumulado(usuario.segundos)}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
