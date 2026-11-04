import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { eur, fecha, fechaHora, textoVencimiento } from '../lib/format';
import { EstadoBadge, NivelBadge, TipoClienteBadge, Modal, Spinner } from '../components/ui';

const hoyISO = () => new Date().toISOString().slice(0, 10);

const ICONO_EVENTO = {
  creacion: '📄',
  pago: '💶',
  cambio_estado: '🔄',
  recordatorio: '🔔',
  edicion: '✏️',
};

export default function FacturaDetalle() {
  const { id } = useParams();
  const [factura, setFactura] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [pagoOpen, setPagoOpen] = useState(false);
  const [recOpen, setRecOpen] = useState(false);

  function recargar() {
    api.factura(id).then(setFactura);
    api.timeline(id).then(setTimeline);
  }
  useEffect(() => {
    recargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!factura) return <Spinner />;
  const f = factura;
  const c = f.cliente || {};

  return (
    <div className="space-y-4">
      <Link to="/facturas" className="text-sm text-brand-600">‹ Volver a facturas</Link>

      {/* Cabecera */}
      <section className="card p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold">{c.nombre}</h2>
              <TipoClienteBadge tipo={c.tipo_cliente} />
            </div>
            <p className="text-slate-600">{f.concepto}</p>
            <p className="text-xs text-slate-400 mt-1">
              {c.email || 'sin email'} · {c.telefono || 'sin teléfono'}
            </p>
          </div>
          <EstadoBadge estado={f.estado} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs text-slate-500">Total</p>
            <p className="font-bold">{eur(f.importe_total)}</p>
          </div>
          <div className="rounded-xl bg-emerald-50 p-3">
            <p className="text-xs text-slate-500">Pagado</p>
            <p className="font-bold text-emerald-600">{eur(f.importe_pagado)}</p>
          </div>
          <div className="rounded-xl bg-rose-50 p-3">
            <p className="text-xs text-slate-500">Pendiente</p>
            <p className="font-bold text-rose-600">{eur(f.importe_pendiente)}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
          <span>Emitida: <b className="text-slate-700">{fecha(f.fecha_emision)}</b></span>
          <span>Vence: <b className="text-slate-700">{fecha(f.fecha_vencimiento)}</b></span>
          <span className={f.dias_retraso > 0 && f.estado !== 'pagada' ? 'text-rose-500 font-medium' : ''}>
            {textoVencimiento(f.dias_retraso, f.estado)}
          </span>
        </div>
        {f.estado !== 'pagada' && (
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            Recordatorio sugerido: <NivelBadge nivel={f.nivel_sugerido} />
          </div>
        )}
        {f.notas && <p className="mt-3 text-sm text-slate-500 bg-slate-50 rounded-xl p-3">{f.notas}</p>}

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            className="btn-primary btn-lg flex-1"
            onClick={() => setPagoOpen(true)}
            disabled={f.estado === 'pagada'}
          >
            💶 Registrar pago
          </button>
          <button
            className="btn-secondary btn-lg flex-1"
            onClick={() => setRecOpen(true)}
            disabled={f.estado === 'pagada'}
          >
            🔔 Preparar recordatorio
          </button>
        </div>
      </section>

      {/* Timeline */}
      <section className="card p-5">
        <h3 className="font-bold mb-4">Historial de la factura</h3>
        <ol className="relative border-l-2 border-slate-100 ml-3 space-y-5">
          {[...timeline].reverse().map((e) => (
            <li key={e.id} className="ml-5">
              <span className="absolute -left-[14px] grid h-7 w-7 place-items-center rounded-full bg-white border-2 border-slate-100 text-sm">
                {ICONO_EVENTO[e.tipo] || '•'}
              </span>
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold text-sm">{e.titulo}</p>
                <span className="text-xs text-slate-400 shrink-0">{fechaHora(e.fecha)}</span>
              </div>
              {e.descripcion && <p className="text-sm text-slate-500">{e.descripcion}</p>}
            </li>
          ))}
        </ol>
      </section>

      <PagoModal
        open={pagoOpen}
        onClose={() => setPagoOpen(false)}
        factura={f}
        onSaved={() => { setPagoOpen(false); recargar(); }}
      />
      <RecordatorioModal
        open={recOpen}
        onClose={() => setRecOpen(false)}
        factura={f}
        onSent={() => { setRecOpen(false); recargar(); }}
      />
    </div>
  );
}

// ---------------- Modal de pago ----------------
function PagoModal({ open, onClose, factura, onSaved }) {
  const [importe, setImporte] = useState('');
  const [fechaPago, setFechaPago] = useState(hoyISO());
  const [metodo, setMetodo] = useState('transferencia');
  const [nota, setNota] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (open) {
      setImporte(factura.importe_pendiente ? String(factura.importe_pendiente) : '');
      setFechaPago(hoyISO());
      setMetodo('transferencia');
      setNota('');
      setError('');
    }
  }, [open, factura]);

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      await api.crearPago(factura.id, {
        importe: Number(importe),
        fecha_pago: fechaPago,
        metodo_pago: metodo,
        nota,
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar pago">
      <form onSubmit={guardar} className="space-y-4">
        <p className="text-sm text-slate-500">
          Pendiente actual: <b className="text-slate-700">{eur(factura.importe_pendiente)}</b>
        </p>
        <div>
          <label className="label">Importe (€)</label>
          <input className="input" type="number" min="0" step="0.01" value={importe} onChange={(e) => setImporte(e.target.value)} autoFocus />
          <button type="button" className="mt-1 text-sm text-brand-600" onClick={() => setImporte(String(factura.importe_pendiente))}>
            Pago completo ({eur(factura.importe_pendiente)})
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Fecha</label>
            <input className="input" type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
          </div>
          <div>
            <label className="label">Método</label>
            <select className="input" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              <option value="transferencia">Transferencia</option>
              <option value="bizum">Bizum</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>
        <div>
          <label className="label">Nota (opcional)</label>
          <input className="input" value={nota} onChange={(e) => setNota(e.target.value)} />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary flex-1" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar pago'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------- Modal de recordatorio ----------------
function RecordatorioModal({ open, onClose, factura, onSent }) {
  const [nivel, setNivel] = useState('amistoso');
  const [canal, setCanal] = useState('email');
  const [asunto, setAsunto] = useState('');
  const [contenido, setContenido] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  // Carga la previsualización cada vez que cambian nivel/canal.
  useEffect(() => {
    if (!open) return;
    setCargando(true);
    setError('');
    api
      .previsualizar(factura.id, { nivel, canal })
      .then((p) => {
        setAsunto(p.asunto || '');
        setContenido(p.contenido || '');
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nivel, canal]);

  // Al abrir, parte del nivel sugerido.
  useEffect(() => {
    if (open) {
      setNivel(factura.nivel_sugerido || 'amistoso');
      setCanal('email');
    }
  }, [open, factura]);

  async function marcar() {
    setEnviando(true);
    setError('');
    try {
      await api.marcarEnviado(factura.id, { nivel, canal, asunto, contenido });
      onSent();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const NIVELES = [
    { k: 'amistoso', l: 'Amistoso' },
    { k: 'firme', l: 'Firme' },
    { k: 'serio', l: 'Serio' },
  ];
  const CANALES = [
    { k: 'email', l: 'Email' },
    { k: 'whatsapp', l: 'WhatsApp' },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Preparar recordatorio" maxWidth="max-w-xl">
      <div className="space-y-4">
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-sm text-amber-800">
          Envío <b>simulado</b>: no se manda nada real. Al marcar como enviado, queda registrado en el historial.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Tono</label>
            <div className="flex gap-1">
              {NIVELES.map((n) => (
                <button
                  key={n.k}
                  onClick={() => setNivel(n.k)}
                  className={`flex-1 rounded-lg px-2 py-2 text-sm font-semibold border ${
                    nivel === n.k ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  {n.l}
                </button>
              ))}
            </div>
            {factura.nivel_sugerido && (
              <p className="mt-1 text-xs text-slate-400">Sugerido: {factura.nivel_sugerido_label}</p>
            )}
          </div>
          <div>
            <label className="label">Canal</label>
            <div className="flex gap-1">
              {CANALES.map((c) => (
                <button
                  key={c.k}
                  onClick={() => setCanal(c.k)}
                  className={`flex-1 rounded-lg px-2 py-2 text-sm font-semibold border ${
                    canal === c.k ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  {c.l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {canal === 'email' && (
          <div>
            <label className="label">Asunto</label>
            <input className="input" value={asunto} onChange={(e) => setAsunto(e.target.value)} />
          </div>
        )}
        <div>
          <label className="label">Mensaje {cargando && <span className="text-slate-400">(generando…)</span>}</label>
          <textarea className="input font-[inherit] min-h-[200px]" value={contenido} onChange={(e) => setContenido(e.target.value)} />
          <p className="mt-1 text-xs text-slate-400">
            Para: {canal === 'email' ? (factura.cliente?.email || 'sin email') : (factura.cliente?.telefono || 'sin teléfono')}
          </p>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary flex-1" onClick={marcar} disabled={enviando || cargando}>
            {enviando ? 'Registrando…' : 'Marcar como enviado'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
