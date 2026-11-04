import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { eur, fecha, textoVencimiento } from '../lib/format';
import { EstadoBadge, NivelBadge, TipoClienteBadge, Spinner, Empty } from '../components/ui';

const FILTROS_RAPIDOS = [
  { key: '', label: 'Todas' },
  { key: 'accion_hoy', label: 'Acción hoy' },
  { key: 'vencidas', label: 'Vencidas' },
  { key: 'proximas', label: 'Próximas a vencer' },
  { key: 'parciales', label: 'Parciales' },
  { key: 'pagadas', label: 'Pagadas' },
];

export default function Facturas({ onNueva }) {
  const [facturas, setFacturas] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState('');
  const [cliente_id, setClienteId] = useState('');
  const [tipo_cliente, setTipoCliente] = useState('');

  function cargar() {
    api.facturas({ q, filtro, cliente_id, tipo_cliente }).then(setFacturas);
  }

  useEffect(() => {
    api.clientes().then(setClientes);
  }, []);
  useEffect(() => {
    const t = setTimeout(cargar, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filtro, cliente_id, tipo_cliente]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Facturas</h2>
        <button className="btn-primary sm:hidden" onClick={onNueva}>+ Nueva</button>
      </div>

      <input
        className="input"
        placeholder="Buscar por cliente o concepto…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTROS_RAPIDOS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold border transition ${
              filtro === f.key
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select className="input" value={cliente_id} onChange={(e) => setClienteId(e.target.value)}>
          <option value="">Todos los clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <select className="input" value={tipo_cliente} onChange={(e) => setTipoCliente(e.target.value)}>
          <option value="">Todos los tipos</option>
          <option value="habitual">Habitual</option>
          <option value="nuevo">Nuevo</option>
          <option value="moroso">Moroso</option>
        </select>
      </div>

      {!facturas ? (
        <Spinner />
      ) : facturas.length === 0 ? (
        <Empty>No hay facturas con estos filtros.</Empty>
      ) : (
        <ul className="space-y-2">
          {facturas.map((f) => (
            <li key={f.id} className="card">
              <Link to={`/facturas/${f.id}`} className="block p-4 hover:bg-slate-50 rounded-2xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{f.cliente_nombre}</span>
                      <TipoClienteBadge tipo={f.tipo_cliente} />
                      <EstadoBadge estado={f.estado} />
                    </div>
                    <p className="text-sm text-slate-500 truncate">{f.concepto}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Emitida {fecha(f.fecha_emision)} · Vence {fecha(f.fecha_vencimiento)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold">{eur(f.importe_pendiente)}</p>
                    {f.importe_pagado > 0 && f.estado !== 'pagada' && (
                      <p className="text-xs text-slate-400">de {eur(f.importe_total)}</p>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-xs ${f.dias_retraso > 0 && f.estado !== 'pagada' ? 'text-rose-500 font-medium' : 'text-slate-400'}`}>
                    {textoVencimiento(f.dias_retraso, f.estado)}
                  </span>
                  {f.estado !== 'pagada' && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      Recordatorio: <NivelBadge nivel={f.nivel_sugerido} />
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
