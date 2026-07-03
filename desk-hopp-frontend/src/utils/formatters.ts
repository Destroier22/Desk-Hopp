export const formatarTempoAcumulado = (segundosTotais: number) => {
  const horas = Math.floor(segundosTotais / 3600);
  const minutos = Math.floor((segundosTotais % 3600) / 60);
  const segundos = segundosTotais % 60;
  return `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
};

export const formatarTempoRelatorio = (segundosTotais: number) => {
  const horas = Math.floor(segundosTotais / 3600);
  const minutos = Math.floor((segundosTotais % 3600) / 60);
  const segundos = segundosTotais % 60;
  return `${formatarTempoAcumulado(segundosTotais)} (${horas}h ${minutos}min ${segundos}s)`;
};

export const formatarDataRelatorio = (data?: string | null) => {
  if (!data) return 'Nao informado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(data));
};

export const formatarMoeda = (valor?: number | null) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
}).format(valor || 0);

export const escaparHtml = (valor?: string | number | null) => String(valor ?? 'Nao informado')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');
