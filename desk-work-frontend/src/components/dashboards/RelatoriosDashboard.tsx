import type { KanbanData } from '../../types';
import { contarPorCampo, criarFluxoTemporal, filtrarUltimosDias, listarTicketsKanban } from '../../utils/dashboardMetrics';

interface RelatoriosDashboardProps {
  kanban: KanbanData;
}

export function RelatoriosDashboard({ kanban }: RelatoriosDashboardProps) {
  const tickets30Dias = filtrarUltimosDias(listarTicketsKanban(kanban), 30);
  const porStatus = contarPorCampo(tickets30Dias, ticket => ticket.status);
  const topCategorias = contarPorCampo(tickets30Dias, ticket => ticket.categoria?.nome).slice(0, 5);
  const topEmpresas = contarPorCampo(tickets30Dias, ticket => ticket.empresa?.nome).slice(0, 5);
  const fluxoTemporal = criarFluxoTemporal(tickets30Dias, 30);
  const maiorStatus = Math.max(...porStatus.map(item => item.total), 1);
  const maiorTemporal = Math.max(...fluxoTemporal.map(item => item.total), 1);
  const total = tickets30Dias.length || 1;

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Relatorios</h1>
        <p className="text-xs text-gray-500">Visao dos ultimos 30 dias do fluxo de trabalho, categorias e empresas.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-[#202024] border border-gray-800 rounded-lg p-4">
          <h2 className="text-sm font-bold text-gray-200 mb-4">Grafico de pizza por status</h2>
          <div className="flex items-center gap-5">
            <div
              className="w-32 h-32 rounded-full border border-gray-700"
              style={{
                background: `conic-gradient(#22c55e 0 ${((porStatus[0]?.total || 0) / total) * 100}%, #3b82f6 0 ${(((porStatus[0]?.total || 0) + (porStatus[1]?.total || 0)) / total) * 100}%, #eab308 0 ${(((porStatus[0]?.total || 0) + (porStatus[1]?.total || 0) + (porStatus[2]?.total || 0)) / total) * 100}%, #ef4444 0)`,
              }}
            />
            <div className="space-y-2 flex-1">
              {porStatus.length ? porStatus.map((item) => (
                <div key={item.nome} className="flex justify-between text-xs">
                  <span className="text-gray-400">{item.nome.replace('_', ' ')}</span>
                  <strong className="text-white">{item.total}</strong>
                </div>
              )) : <span className="text-xs text-gray-600">Sem tickets no periodo.</span>}
            </div>
          </div>
        </div>

        <div className="bg-[#202024] border border-gray-800 rounded-lg p-4 xl:col-span-2">
          <h2 className="text-sm font-bold text-gray-200 mb-4">Grafico de barras por status</h2>
          <div className="space-y-3">
            {porStatus.map(item => (
              <div key={item.nome}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{item.nome.replace('_', ' ')}</span>
                  <span className="text-gray-300">{item.total}</span>
                </div>
                <div className="h-2 bg-[#121214] rounded overflow-hidden">
                  <div className="h-full bg-blue-500 rounded" style={{ width: `${(item.total / maiorStatus) * 100}%` }} />
                </div>
              </div>
            ))}
            {!porStatus.length && <span className="text-xs text-gray-600">Sem dados para exibir.</span>}
          </div>
        </div>
      </div>

      <div className="bg-[#202024] border border-gray-800 rounded-lg p-4">
        <h2 className="text-sm font-bold text-gray-200 mb-4">Linha temporal do fluxo de trabalho</h2>
        <div className="flex items-end gap-1 h-36 border-b border-gray-800 pb-2">
          {fluxoTemporal.map((ponto) => (
            <div key={ponto.chave} className="flex-1 flex flex-col items-center justify-end gap-1" title={`${ponto.label}: ${ponto.total}`}>
              <div className="w-full bg-emerald-500/80 rounded-t min-h-[3px]" style={{ height: `${Math.max((ponto.total / maiorTemporal) * 100, 3)}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-gray-600">
          <span>{fluxoTemporal[0]?.label}</span>
          <span>{fluxoTemporal[fluxoTemporal.length - 1]?.label}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RankingCard titulo="5 categorias de chamado mais abertas" dados={topCategorias} />
        <RankingCard titulo="5 empresas que mais chamam" dados={topEmpresas} />
      </div>
    </section>
  );
}

function RankingCard({ titulo, dados }: { titulo: string; dados: { nome: string; total: number }[] }) {
  const maior = Math.max(...dados.map(item => item.total), 1);

  return (
    <div className="bg-[#202024] border border-gray-800 rounded-lg p-4">
      <h2 className="text-sm font-bold text-gray-200 mb-4">{titulo}</h2>
      <div className="space-y-3">
        {dados.map((item, index) => (
          <div key={item.nome}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">{index + 1}. {item.nome}</span>
              <span className="text-gray-300">{item.total}</span>
            </div>
            <div className="h-2 bg-[#121214] rounded overflow-hidden">
              <div className="h-full bg-amber-500 rounded" style={{ width: `${(item.total / maior) * 100}%` }} />
            </div>
          </div>
        ))}
        {!dados.length && <span className="text-xs text-gray-600">Sem dados para exibir.</span>}
      </div>
    </div>
  );
}
