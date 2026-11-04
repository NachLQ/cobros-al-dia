import { ESTADO_META, NIVEL_META, TIPO_CLIENTE_META } from '../lib/format';

export function Badge({ children, cls }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {children}
    </span>
  );
}

export function EstadoBadge({ estado }) {
  const m = ESTADO_META[estado] || ESTADO_META.pendiente;
  return <Badge cls={m.cls}>{m.label}</Badge>;
}

export function NivelBadge({ nivel }) {
  if (!nivel) return <Badge cls="bg-slate-100 text-slate-500 border-slate-200">Aún no toca</Badge>;
  const m = NIVEL_META[nivel];
  return <Badge cls={m.cls}>{m.label}</Badge>;
}

export function TipoClienteBadge({ tipo }) {
  const m = TIPO_CLIENTE_META[tipo] || TIPO_CLIENTE_META.nuevo;
  return <span className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${m.cls}`}>{m.label}</span>;
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className={`relative z-50 w-full ${maxWidth} card rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Spinner({ label = 'Cargando…' }) {
  return <div className="py-16 text-center text-slate-400">{label}</div>;
}

export function Empty({ children }) {
  return <div className="py-12 text-center text-slate-400">{children}</div>;
}
