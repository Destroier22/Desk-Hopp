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

export type AppView = 'fluxo-atendimento' | 'relatorios' | 'mesas-trabalho' | 'chat-interno' | 'chat-externo';
