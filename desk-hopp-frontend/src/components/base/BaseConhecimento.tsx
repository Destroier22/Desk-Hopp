import { useMemo, useState, type FormEvent } from 'react';
import { FileText, Folder, FolderOpen, Plus, Save, Search, Trash2, X } from 'lucide-react';
import type { BaseConhecimentoItem } from '../../types';

const raizId = 'raiz';

const itensIniciais: BaseConhecimentoItem[] = [
  {
    id: raizId,
    tipo: 'pasta',
    nome: 'Base de Conhecimento',
    parentId: null,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 'pasta-processos',
    tipo: 'pasta',
    nome: 'Processos internos',
    parentId: raizId,
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 'arquivo-boas-vindas',
    tipo: 'arquivo',
    nome: 'Como usar a base de conhecimento',
    parentId: raizId,
    conteudo: 'Crie pastas para organizar procedimentos, tutoriais, respostas prontas e documentos internos.',
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString(),
  },
];

interface BaseConhecimentoProps {
  podeAdministrar: boolean;
}

export function BaseConhecimento({ podeAdministrar }: BaseConhecimentoProps) {
  const [itens, setItens] = useState<BaseConhecimentoItem[]>(() => {
    const salvo = localStorage.getItem('deskhopp:base-conhecimento');
    return salvo ? JSON.parse(salvo) : itensIniciais;
  });
  const [pastaAtualId, setPastaAtualId] = useState(raizId);
  const [arquivoAbertoId, setArquivoAbertoId] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [modalTipo, setModalTipo] = useState<'pasta' | 'arquivo' | null>(null);
  const [nomeItem, setNomeItem] = useState('');
  const [conteudoArquivo, setConteudoArquivo] = useState('');

  const salvarItens = (novosItens: BaseConhecimentoItem[]) => {
    setItens(novosItens);
    localStorage.setItem('deskhopp:base-conhecimento', JSON.stringify(novosItens));
  };

  const pastaAtual = itens.find(item => item.id === pastaAtualId) || itens[0];
  const arquivoAberto = itens.find(item => item.id === arquivoAbertoId && item.tipo === 'arquivo');
  const termoBusca = busca.trim().toLowerCase();

  const filhosDaPasta = useMemo(() => itens
    .filter(item => item.parentId === pastaAtualId)
    .filter(item => !termoBusca || `${item.nome} ${item.conteudo || ''}`.toLowerCase().includes(termoBusca))
    .sort((a, b) => {
      if (a.tipo !== b.tipo) return a.tipo === 'pasta' ? -1 : 1;
      return a.nome.localeCompare(b.nome);
    }), [itens, pastaAtualId, termoBusca]);

  const pastas = itens.filter(item => item.tipo === 'pasta');

  const abrirModal = (tipo: 'pasta' | 'arquivo') => {
    setModalTipo(tipo);
    setNomeItem('');
    setConteudoArquivo('');
  };

  const criarItem = (e: FormEvent) => {
    e.preventDefault();
    if (!modalTipo || !nomeItem.trim()) return;

    const agora = new Date().toISOString();
    const novoItem: BaseConhecimentoItem = {
      id: `${modalTipo}-${Date.now()}`,
      tipo: modalTipo,
      nome: nomeItem.trim(),
      parentId: pastaAtualId,
      conteudo: modalTipo === 'arquivo' ? conteudoArquivo.trim() : undefined,
      criadoEm: agora,
      atualizadoEm: agora,
    };

    salvarItens([...itens, novoItem]);
    if (modalTipo === 'arquivo') setArquivoAbertoId(novoItem.id);
    setModalTipo(null);
  };

  const salvarArquivoAberto = () => {
    if (!arquivoAberto) return;
    salvarItens(itens.map(item => item.id === arquivoAberto.id
      ? { ...item, conteudo: conteudoArquivo, atualizadoEm: new Date().toISOString() }
      : item));
  };

  const abrirArquivo = (arquivo: BaseConhecimentoItem) => {
    setArquivoAbertoId(arquivo.id);
    setConteudoArquivo(arquivo.conteudo || '');
  };

  const coletarIdsParaExcluir = (itemId: string): string[] => {
    const filhos = itens.filter(item => item.parentId === itemId);
    return [itemId, ...filhos.flatMap(filho => coletarIdsParaExcluir(filho.id))];
  };

  const excluirItem = (item: BaseConhecimentoItem) => {
    if (!podeAdministrar || item.id === raizId) return;

    const mensagem = item.tipo === 'pasta'
      ? `Excluir a pasta "${item.nome}" e todos os itens dentro dela?`
      : `Excluir o arquivo "${item.nome}"?`;

    if (!window.confirm(mensagem)) return;

    const idsParaExcluir = coletarIdsParaExcluir(item.id);
    salvarItens(itens.filter(itemAtual => !idsParaExcluir.includes(itemAtual.id)));

    if (idsParaExcluir.includes(pastaAtualId)) {
      setPastaAtualId(item.parentId || raizId);
    }
    if (arquivoAbertoId && idsParaExcluir.includes(arquivoAbertoId)) {
      setArquivoAbertoId(null);
      setConteudoArquivo('');
    }
  };

  return (
    <section className="h-[calc(100vh-120px)] min-h-[620px] grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
      <aside className="bg-[#1e1e24] border border-gray-800 rounded-lg flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-lg font-bold text-white">Base de Conhecimento</h1>
          <p className="text-xs text-gray-500 mt-1">Organize documentos por pastas e arquivos.</p>
        </div>

        <div className="p-3">
          <div className="flex items-center gap-2 bg-[#121214] border border-gray-800 rounded px-2 py-2 focus-within:border-blue-500">
            <Search size={14} className="text-gray-500 shrink-0" />
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Pesquisar arquivos..."
              className="w-full bg-transparent text-xs text-white outline-none placeholder:text-gray-600"
            />
          </div>
        </div>

        <div className="px-3 pb-3 space-y-1 overflow-y-auto">
          {pastas.map((pasta) => {
            const ativa = pasta.id === pastaAtualId;
            const Icone = ativa ? FolderOpen : Folder;
            return (
              <button
                key={pasta.id}
                type="button"
                onClick={() => {
                  setPastaAtualId(pasta.id);
                  setArquivoAbertoId(null);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left text-xs transition-colors ${
                  ativa ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icone size={15} className="shrink-0" />
                <span className="truncate">{pasta.nome}</span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="bg-[#1e1e24] border border-gray-800 rounded-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-white font-bold">
              <FolderOpen size={18} className="text-blue-400" />
              {pastaAtual?.nome}
            </div>
            <span className="text-xs text-gray-500">{filhosDaPasta.length} itens nesta pasta</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => abrirModal('pasta')} className="bg-[#202024] border border-gray-700 hover:border-blue-500 text-gray-200 px-3 py-2 rounded text-xs font-semibold flex items-center gap-2">
              <Plus size={14} />
              Nova pasta
            </button>
            <button onClick={() => abrirModal('arquivo')} className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded text-xs font-semibold flex items-center gap-2">
              <Plus size={14} />
              Novo arquivo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] min-h-0 flex-1">
          <div className="border-r border-gray-800 p-4 overflow-y-auto">
            <div className="grid grid-cols-1 gap-2">
              {filhosDaPasta.map(item => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded border p-3 text-left transition-colors ${
                    arquivoAbertoId === item.id
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-[#202024] border-gray-800 text-gray-300 hover:border-gray-600'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => item.tipo === 'pasta' ? setPastaAtualId(item.id) : abrirArquivo(item)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  >
                    <div className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${item.tipo === 'pasta' ? 'bg-blue-600/15 text-blue-300' : 'bg-emerald-600/15 text-emerald-300'}`}>
                      {item.tipo === 'pasta' ? <Folder size={18} /> : <FileText size={18} />}
                    </div>
                    <div className="min-w-0">
                      <span className="block text-sm font-semibold truncate">{item.nome}</span>
                      <span className="block text-[11px] text-gray-500">{item.tipo === 'pasta' ? 'Pasta' : 'Arquivo'}</span>
                    </div>
                  </button>
                  {podeAdministrar && (
                    <button
                      type="button"
                      onClick={() => excluirItem(item)}
                      className="w-8 h-8 rounded border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200 flex items-center justify-center shrink-0"
                      title={`Excluir ${item.tipo}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              {!filhosDaPasta.length && (
                <div className="border border-dashed border-gray-800 rounded-lg p-8 text-center text-sm text-gray-500">
                  Esta pasta ainda esta vazia.
                </div>
              )}
            </div>
          </div>

          <div className="p-4 overflow-y-auto">
            {arquivoAberto ? (
              <div className="h-full flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold text-white">{arquivoAberto.nome}</h2>
                    <p className="text-xs text-gray-500">Edite o conteudo deste arquivo.</p>
                  </div>
                  <button onClick={salvarArquivoAberto} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded text-xs font-semibold flex items-center gap-2">
                    <Save size={14} />
                    Salvar
                  </button>
                </div>
                <textarea
                  value={conteudoArquivo}
                  onChange={(e) => setConteudoArquivo(e.target.value)}
                  className="flex-1 min-h-[420px] bg-[#121214] border border-gray-800 rounded p-4 text-sm text-gray-200 resize-none outline-none focus:border-blue-500"
                  placeholder="Escreva o conteudo do artigo, procedimento ou tutorial..."
                />
              </div>
            ) : (
              <div className="h-full min-h-[420px] flex flex-col items-center justify-center text-center text-gray-500">
                <FileText size={42} className="text-gray-700 mb-3" />
                <h2 className="text-sm font-bold text-gray-300">Selecione um arquivo</h2>
                <p className="text-xs mt-1 max-w-sm">Abra um arquivo da lista ou crie um novo documento dentro da pasta atual.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalTipo && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <form onSubmit={criarItem} className="bg-[#1e1e24] border border-gray-800 rounded-lg w-full max-w-lg p-5 relative shadow-2xl">
            <button type="button" onClick={() => setModalTipo(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X size={18} />
            </button>
            <h2 className="text-lg font-bold text-white mb-4">{modalTipo === 'pasta' ? 'Nova pasta' : 'Novo arquivo'}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">NOME *</label>
                <input
                  value={nomeItem}
                  onChange={(e) => setNomeItem(e.target.value)}
                  className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white outline-none focus:border-blue-500"
                  placeholder={modalTipo === 'pasta' ? 'Ex: Procedimentos' : 'Ex: Reiniciar servico do agente'}
                  required
                />
              </div>
              {modalTipo === 'arquivo' && (
                <div>
                  <label className="block text-xs text-gray-400 mb-1">CONTEUDO INICIAL</label>
                  <textarea
                    value={conteudoArquivo}
                    onChange={(e) => setConteudoArquivo(e.target.value)}
                    rows={5}
                    className="w-full bg-[#121214] border border-gray-700 rounded p-2 text-sm text-white resize-none outline-none focus:border-blue-500"
                    placeholder="Escreva um resumo inicial..."
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-800">
              <button type="button" onClick={() => setModalTipo(null)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs font-semibold">
                Cancelar
              </button>
              <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold">
                Criar
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
