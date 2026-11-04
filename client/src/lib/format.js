export const eur = (n) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(n) || 0);

export const fecha = (str) => {
  if (!str) return '—';
  const [y, m, d] = String(str).slice(0, 10).split('-');
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(Number(y), Number(m) - 1, Number(d))
  );
};

export const fechaHora = (str) => {
  if (!str) return '—';
  const d = new Date(str.includes('T') ? str : str.replace(' ', 'T') + 'Z');
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(d);
};

// Texto de vencimiento según días de retraso (negativo = aún no vence).
export const textoVencimiento = (dias, estado) => {
  if (estado === 'pagada') return 'Pagada';
  if (dias > 0) return `Vencida hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  if (dias === 0) return 'Vence hoy';
  return `Vence en ${-dias} ${-dias === 1 ? 'día' : 'días'}`;
};

export const ESTADO_META = {
  pendiente: { label: 'Pendiente', cls: 'bg-slate-100 text-slate-700 border-slate-200' },
  parcial: { label: 'Parcial', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  pagada: { label: 'Pagada', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  vencida: { label: 'Vencida', cls: 'bg-rose-100 text-rose-800 border-rose-200' },
};

export const NIVEL_META = {
  amistoso: { label: 'Amistoso', cls: 'bg-sky-100 text-sky-800 border-sky-200' },
  firme: { label: 'Firme', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  serio: { label: 'Serio', cls: 'bg-rose-100 text-rose-800 border-rose-200' },
};

export const TIPO_CLIENTE_META = {
  habitual: { label: 'Habitual', cls: 'bg-indigo-100 text-indigo-700' },
  nuevo: { label: 'Nuevo', cls: 'bg-teal-100 text-teal-700' },
  moroso: { label: 'Moroso', cls: 'bg-rose-100 text-rose-700' },
};
