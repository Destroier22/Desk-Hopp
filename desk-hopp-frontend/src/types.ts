export interface Apontamento {
  id: string;
  texto: string;
  segundosSessao: number;
  criadoEm: string;
  imagemBase64?: string | null;
  imagemNome?: string | null;
  imagemTipo?: string | null;
}

export interface Ticket {
  id: string;
  numero: number;
  assunto: string;
  descricao?: string;
  solicitante: string;
  operador?: string | null;
  status: string;
  empresaId: string;
  categoriaId: string;
  dispositivoId?: string | null;
  empresa: { nome: string };
  categoria: { nome: string };
  dispositivo?: { nome: string; tipo: string } | null;
  totalSegundos: number;
  valorCobrancaAvulsa?: number | null;
  apontamentos: Apontamento[];
  criadoEm: string;
  finalizadoEm: string | null;
}

export interface KanbanData {
  aFazer: Ticket[];
  atendendo: Ticket[];
  pausados: Ticket[];
  concluidosDoDia: Ticket[];
}

export type TarefaStatus = 'A_FAZER' | 'ATENDENDO' | 'PAUSADO' | 'CONCLUIDO';

export interface TarefaKanban {
  id: string;
  codigo: string;
  titulo: string;
  descricao: string;
  responsavelId: string;
  responsavelNome: string;
  solicitante: string;
  prioridade: 'Baixa' | 'Media' | 'Alta' | 'Critica';
  categoria: string;
  projeto: string;
  prazo: string;
  estimativaHoras: string;
  etiquetas: string[];
  checklist: string[];
  observadores: string;
  linkReferencia: string;
  recorrencia: string;
  lembrete: string;
  status: TarefaStatus;
  criadoEm: string;
}

export interface Empresa {
  id: string;
  nome: string;
}

export interface Dispositivo {
  id: string;
  nome: string;
}

export interface Categoria {
  id: string;
  nome: string;
}

export interface UsuarioLogado {
  id: string;
  nomeUsuario: string;
  email: string;
  tipoUsuario: string;
}

export interface ImagemApontamento {
  base64: string;
  nome: string;
  tipo: string;
}

export interface ChatExternoContato {
  id: string;
  nome: string;
  telefone: string;
  empresa: string;
  ultimaInteracao: string;
}

export interface FilaAtendimento {
  id: string;
  nome: string;
  descricao: string;
  usuariosIds: string[];
}

export interface FiltroAtendimento {
  id: string;
  respostaCliente: string;
  mensagemAutomatica: string;
  filaId: string;
  ativo: boolean;
}

export interface CategoriaUsuario {
  id: string;
  nome: string;
  permissoes: string[];
}

export interface BaseConhecimentoItem {
  id: string;
  tipo: 'pasta' | 'arquivo';
  nome: string;
  parentId: string | null;
  conteudo?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export type AppView =
  | 'fluxo-atendimento'
  | 'relatorios'
  | 'mesas-trabalho'
  | 'base-conhecimento'
  | 'chat-interno'
  | 'chat-externo'
  | 'chat-externo-filas'
  | 'chat-externo-filtros'
  | 'telefone'
  | 'config-cadastros'
  | 'config-chat-externo-conectar-numero';
