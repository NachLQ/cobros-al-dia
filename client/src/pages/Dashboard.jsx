import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { eur, textoVencimiento } from '../lib/format';
import { Spinner, EstadoBadge, NivelBadge, TipoClienteBadge } from '../components/ui';

function Kpi({ label, valor, sub, tono = 'slate' }) {
  const tonos = {
    slate: 'text-slate-800',
    rose: 'text-rose-600',
    amber: 'text-amber-600',
    emerald: 'text-emerald-600',
  };
  return (
    <div className="card p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold ${tonos[tono]}`}>{valor}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export default function Dashboard({ onNueva }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.dashboard().then(setData);
  }, []);

  if (!data) return <Spinner />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Tu panel de cobros</h2>
        <p className="text-sm text-slate-500">De un vistazo: cuánto te deben, quién y qué reclamar hoy.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi label="Te deben" valor={eur(data.total_pendiente)} sub={`${data.n_pendientes + data.n_vencidas} facturas abiertas`} />
        <Kpi label="Vencido" valor={eur(data.total_vencido)} sub={`${data.n_vencidas} facturas vencidas`} tono="rose" />
        <Kpi label="Próximo a vencer" valor={eur(data.total_proximo_mes)} sub="este mes" tono="amber" />
        <Kpi label="Cobrado este mes" valor={eur(data.cobrado_mes)} tono="emerald" />
      </div>

      {/* Acción hoy */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-amber-50">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔔</span>
            <h3 className="font-bold">Acción hoy</h3>
          </div>
          <span className="text-sm text-slate-500">{data.accion_hoy.length} pendientes</span>
        </div>
        {data.accion_hoy.length === 0 ? (
          <div className="p-6 text-center text-slate-400">¡Todo al día! No hay nada que reclamar hoy.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.accion_hoy.map((f) => (
              <li key={f.id}>
                <Link to={`/facturas/${f.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{f.cliente_nombre}</span>
                      <TipoClienteBadge tipo={f.tipo_cliente} />
                    </div>
                    <p className="text-sm text-slate-500 truncate">{f.concepto}</p>
                    <p className="text-xs text-slate-400">{textoVencimiento(f.dias_retraso, f.estado)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">{eur(f.importe_pendiente)}</p>
                    <div className="mt-1 flex items-center gap-1 justify-end">
                      <NivelBadge nivel={f.nivel_sugerido} />
                    </div>
                  </div>
                  <span className="text-slate-300 text-xl">›</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Total por cliente */}
      <section className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-bold">Te deben, por cliente</h3>
        </div>
        {data.por_cliente.length === 0 ? (
          <div className="p-6 text-center text-slate-400">No hay deuda pendiente.</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.por_cliente.map((c) => (
              <li key={c.cliente_id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{c.cliente_nombre}</span>
                    <TipoClienteBadge tipo={c.tipo_cliente} />
                  </div>
                  <p className="text-xs text-slate-400">
                    {c.n} {c.n === 1 ? 'factura' : 'facturas'}
                    {c.vencido > 0 && <span className="text-rose-500"> · {eur(c.vencido)} vencido</span>}
                  </p>
                </div>
                <p className="font-bold">{eur(c.total)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="text-center">
        <button className="btn-secondary" onClick={onNueva}>+ Registrar otra factura</button>
      </div>
    </div>
  );
}
