import { useState, type FormEvent } from 'react';
import { Edit3, Plus, Save, ShieldCheck, Trash2, Users } from 'lucide-react';
import { api } from '../../services/api';
import type { CategoriaUsuario, UsuarioLogado } from '../../types';

const permissoesDisponiveis = [
  'Visualizar dashboards',
  'Gerenciar tickets',
  'Atender chat interno',
  'Atender chat externo',
  'Configurar chat externo',
  'Gerenciar usuarios',
  'Gerenciar financeiro',
  'Acessar relatorios',
];
const permissaoAdministrarBase = 'Administrar Base de conhecimento';

interface CadastrosConfigProps {
  usuarioLogado: UsuarioLogado;
  usuarios: UsuarioLogado[];
  categoriasUsuario: CategoriaUsuario[];
  onUsuariosChange: (usuarios: UsuarioLogado[]) => void;
  onCategoriasUsuarioChange: (categorias: CategoriaUsuario[]) => void;
}

export function CadastrosConfig({
  usuarioLogado,
  usuarios,
  categoriasUsuario,
  onUsuariosChange,
  onCategoriasUsuarioChange,
}: CadastrosConfigProps) {
  const usuarioAdministrador = usuarioLogado.tipoUsuario.toLowerCase().includes('administrador');
  const permissoesVisiveis = usuarioAdministrador
    ? [...permissoesDisponiveis, permissaoAdministrarBase]
    : permissoesDisponiveis;
  const [usuarioEditandoId, setUsuarioEditandoId] = useState<string | null>(null);
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState(categoriasUsuario[0]?.nome || 'Suporte');
  const [salvandoUsuario, setSalvandoUsuario] = useState(false);

  const [categoriaNome, setCategoriaNome] = useState('');
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<string[]>([]);
  const [categoriaEditandoId, setCategoriaEditandoId] = useState<string | null>(null);

  const limparUsuario = () => {
    setUsuarioEditandoId(null);
    setNomeUsuario('');
    setEmail('');
    setSenha('');
    setTipoUsuario(categoriasUsuario[0]?.nome || 'Suporte');
  };

  const salvarUsuario = async (e: FormEvent) => {
    e.preventDefault();
    if (!nomeUsuario.trim() || !email.trim() || !tipoUsuario) return;
    if (!usuarioEditandoId && !senha.trim()) {
      alert('Informe uma senha inicial para criar o usuario.');
      return;
    }

    try {
      setSalvandoUsuario(true);
      if (usuarioEditandoId) {
        const resposta = await api.put<UsuarioLogado>(`/usuarios/${usuarioEditandoId}`, {
          nomeUsuario: nomeUsuario.trim(),
          email: email.trim().toLowerCase(),
          tipoUsuario,
          senha: senha.trim() || undefined,
        });
        onUsuariosChange(usuarios.map(usuario => usuario.id === usuarioEditandoId ? resposta.data : usuario));
      } else {
        const resposta = await api.post<UsuarioLogado>('/usuarios', {
          nomeUsuario: nomeUsuario.trim(),
          email: email.trim().toLowerCase(),
          senha: senha.trim(),
          tipoUsuario,
        });
        onUsuariosChange([...usuarios, resposta.data]);
      }

      limparUsuario();
    } catch (error) {
      console.error('Erro ao salvar usuario:', error);
      alert('Nao foi possivel salvar o usuario.');
    } finally {
      setSalvandoUsuario(false);
    }
  };

  const editarUsuario = (usuario: UsuarioLogado) => {
    setUsuarioEditandoId(usuario.id);
    setNomeUsuario(usuario.nomeUsuario);
    setEmail(usuario.email);
    setSenha('');
    setTipoUsuario(usuario.tipoUsuario);
  };

  const excluirUsuario = async (usuarioId: string) => {
    try {
      await api.delete(`/usuarios/${usuarioId}`);
      onUsuariosChange(usuarios.filter(usuario => usuario.id !== usuarioId));
    } catch (error) {
      console.error('Erro ao excluir usuario:', error);
      alert('Nao foi possivel excluir o usuario.');
    }
  };

  const alternarPermissao = (permissao: string) => {
    setPermissoesSelecionadas(prev => prev.includes(permissao)
      ? prev.filter(item => item !== permissao)
      : [...prev, permissao]);
  };

  const limparCategoria = () => {
    setCategoriaEditandoId(null);
    setCategoriaNome('');
    setPermissoesSelecionadas([]);
  };

  const salvarCategoria = (e: FormEvent) => {
    e.preventDefault();
    if (!categoriaNome.trim()) return;

    if (categoriaEditandoId) {
      onCategoriasUsuarioChange(categoriasUsuario.map(categoria => categoria.id === categoriaEditandoId
        ? { ...categoria, nome: categoriaNome.trim(), permissoes: permissoesSelecionadas }
        : categoria));
    } else {
      onCategoriasUsuarioChange([
        ...categoriasUsuario,
        {
          id: `categoria-${Date.now()}`,
          nome: categoriaNome.trim(),
          permissoes: permissoesSelecionadas,
        },
      ]);
    }

    limparCategoria();
  };

  const editarCategoria = (categoria: CategoriaUsuario) => {
    setCategoriaEditandoId(categoria.id);
    setCategoriaNome(categoria.nome);
    setPermissoesSelecionadas(categoria.permissoes);
  };

  const excluirCategoria = (categoriaId: string) => {
    onCategoriasUsuarioChange(categoriasUsuario.filter(categoria => categoria.id !== categoriaId));
  };

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white">Cadastros</h1>
        <p className="text-xs text-gray-500">Gerencie usuarios, categorias de usuario e permissoes da plataforma.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="bg-[#202024] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-blue-400" />
            <h2 className="text-sm font-bold text-white">Usuarios</h2>
          </div>

          <form onSubmit={salvarUsuario} className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_180px_220px_auto] gap-3 mb-4">
            <input
              value={nomeUsuario}
              onChange={(e) => setNomeUsuario(e.target.value)}
              placeholder="Nome do usuario"
              className="bg-[#121214] border border-gray-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="bg-[#121214] border border-gray-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
            <input
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder={usuarioEditandoId ? 'Nova senha opcional' : 'Senha inicial'}
              type="password"
              className="bg-[#121214] border border-gray-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            />
            <select
              value={tipoUsuario}
              onChange={(e) => setTipoUsuario(e.target.value)}
              className="bg-[#121214] border border-gray-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            >
              {categoriasUsuario.map(categoria => <option key={categoria.id} value={categoria.nome}>{categoria.nome}</option>)}
            </select>
            <button
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded px-4 py-2 text-sm font-semibold flex items-center justify-center gap-2"
              disabled={salvandoUsuario}
            >
              {usuarioEditandoId ? <Save size={15} /> : <Plus size={15} />}
              {salvandoUsuario ? 'Salvando...' : usuarioEditandoId ? 'Salvar' : 'Criar'}
            </button>
          </form>

          <div className="space-y-2">
            {usuarios.map((usuario) => (
              <div key={usuario.id} className="flex items-center gap-3 bg-[#121214] border border-gray-800 rounded p-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                  {usuario.nomeUsuario.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm text-white font-semibold truncate">{usuario.nomeUsuario}</span>
                  <span className="block text-[11px] text-gray-500 truncate">{usuario.email}</span>
                </div>
                <span className="text-[11px] text-blue-200 bg-blue-600/10 border border-blue-500/20 rounded px-2 py-1">{usuario.tipoUsuario}</span>
                <button type="button" onClick={() => editarUsuario(usuario)} className="text-gray-500 hover:text-blue-300">
                  <Edit3 size={15} />
                </button>
                <button type="button" onClick={() => excluirUsuario(usuario.id)} className="text-gray-500 hover:text-red-300">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {!usuarios.length && <div className="text-xs text-gray-600 text-center py-8">Nenhum usuario cadastrado.</div>}
          </div>
        </div>

        <div className="bg-[#202024] border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={18} className="text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Categorias e permissoes</h2>
          </div>

          <form onSubmit={salvarCategoria} className="space-y-3 mb-4">
            <input
              value={categoriaNome}
              onChange={(e) => setCategoriaNome(e.target.value)}
              placeholder="Nome da categoria"
              className="w-full bg-[#121214] border border-gray-800 rounded px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {permissoesVisiveis.map(permissao => (
                <label key={permissao} className="flex items-center gap-2 text-xs text-gray-300 bg-[#121214] border border-gray-800 rounded p-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permissoesSelecionadas.includes(permissao)}
                    onChange={() => alternarPermissao(permissao)}
                  />
                  <span>{permissao}</span>
                </label>
              ))}
            </div>
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded py-2 text-sm font-semibold flex items-center justify-center gap-2">
              {categoriaEditandoId ? <Save size={15} /> : <Plus size={15} />}
              {categoriaEditandoId ? 'Salvar categoria' : 'Criar categoria'}
            </button>
          </form>

          <div className="space-y-3">
            {categoriasUsuario.map((categoria) => (
              <div key={categoria.id} className="bg-[#121214] border border-gray-800 rounded p-3">
                <div className="flex justify-between gap-3">
                  <h3 className="text-sm font-bold text-white">{categoria.nome}</h3>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => editarCategoria(categoria)} className="text-gray-500 hover:text-emerald-300">
                      <Edit3 size={15} />
                    </button>
                    <button type="button" onClick={() => excluirCategoria(categoria.id)} className="text-gray-500 hover:text-red-300">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {categoria.permissoes.map(permissao => (
                    <span key={permissao} className="text-[10px] text-emerald-200 bg-emerald-600/10 border border-emerald-500/20 rounded px-2 py-1">
                      {permissao}
                    </span>
                  ))}
                  {!categoria.permissoes.length && <span className="text-xs text-gray-600">Sem permissoes atribuidas.</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
