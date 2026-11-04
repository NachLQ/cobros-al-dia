import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Modal } from './ui';

const hoyISO = () => new Date().toISOString().slice(0, 10);
const enDiasISO = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export default function FacturaForm({ open, onClose, onSaved }) {
  const [clientes, setClientes] = useState([]);
  const [nuevoCliente, setNuevoCliente] = useState(false);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    cliente_id: '',
    concepto: '',
    importe_total: '',
    fecha_emision: hoyISO(),
    fecha_vencimiento: enDiasISO(30),
    notas: '',
  });
  const [cli, setCli] = useState({ nombre: '', email: '', telefono: '', tipo_cliente: 'nuevo', notas: '' });

  useEffect(() => {
    if (open) {
      api.clientes().then(setClientes);
      setError('');
      setNuevoCliente(false);
      setForm({ cliente_id: '', concepto: '', importe_total: '', fecha_emision: hoyISO(), fecha_vencimiento: enDiasISO(30), notas: '' });
      setCli({ nombre: '', email: '', telefono: '', tipo_cliente: 'nuevo', notas: '' });
    }
  }, [open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setC = (k) => (e) => setCli((c) => ({ ...c, [k]: e.target.value }));

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      let cliente_id = form.cliente_id;
      if (nuevoCliente) {
        if (!cli.nombre.trim()) throw new Error('Indica el nombre del nuevo cliente');
        const c = await api.crearCliente(cli);
        cliente_id = c.id;
      }
      if (!cliente_id) throw new Error('Selecciona un cliente');
      const f = await api.crearFactura({
        ...form,
        cliente_id: Number(cliente_id),
        importe_total: Number(form.importe_total),
      });
      onSaved && onSaved(f);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar factura">
      <form onSubmit={guardar} className="space-y-4">
        <div>
          <label className="label">Cliente</label>
          {!nuevoCliente ? (
            <div className="flex gap-2">
              <select className="input" value={form.cliente_id} onChange={set('cliente_id')}>
                <option value="">— Selecciona —</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
              <button type="button" className="btn-secondary whitespace-nowrap" onClick={() => setNuevoCliente(true)}>
                + Nuevo
              </button>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl bg-slate-50 p-3 border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Nuevo cliente</span>
                <button type="button" className="text-sm text-brand-600" onClick={() => setNuevoCliente(false)}>
                  Usar existente
                </button>
              </div>
              <input className="input" placeholder="Nombre *" value={cli.nombre} onChange={setC('nombre')} />
              <div className="grid grid-cols-2 gap-2">
                <input className="input" placeholder="Email" value={cli.email} onChange={setC('email')} />
                <input className="input" placeholder="Teléfono" value={cli.telefono} onChange={setC('telefono')} />
              </div>
              <select className="input" value={cli.tipo_cliente} onChange={setC('tipo_cliente')}>
                <option value="habitual">Habitual</option>
                <option value="nuevo">Nuevo</option>
                <option value="moroso">Moroso</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="label">Concepto</label>
          <input className="input" placeholder="Ej. Diseño de logotipo" value={form.concepto} onChange={set('concepto')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Importe total (€)</label>
            <input className="input" type="number" min="0" step="0.01" placeholder="0,00" value={form.importe_total} onChange={set('importe_total')} />
          </div>
          <div>
            <label className="label">Fecha de emisión</label>
            <input className="input" type="date" value={form.fecha_emision} onChange={set('fecha_emision')} />
          </div>
        </div>

        <div>
          <label className="label">Fecha de vencimiento</label>
          <input className="input" type="date" value={form.fecha_vencimiento} onChange={set('fecha_vencimiento')} />
        </div>

        <div>
          <label className="label">Notas (opcional)</label>
          <textarea className="input" rows="2" value={form.notas} onChange={set('notas')} />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button type="button" className="btn-secondary flex-1" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary flex-1" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar factura'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
