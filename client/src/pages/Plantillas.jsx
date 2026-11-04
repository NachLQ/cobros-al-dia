import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { Spinner } from '../components/ui';

const VARIABLES = [
  '{{cliente_nombre}}',
  '{{factura_concepto}}',
  '{{importe_pendiente}}',
  '{{fecha_vencimiento}}',
  '{{dias_retraso}}',
  '{{nombre_negocio}}',
];

const EJEMPLO = {
  cliente_nombre: 'Reformas Vidal',
  factura_concepto: 'Reforma landing + SEO local',
  importe_pendiente: '1.850,00 €',
  fecha_vencimiento: '14 de mayo de 2026',
  dias_retraso: '31',
  nombre_negocio: 'Tu Negocio',
};

function render(texto) {
  return (texto || '').replace(/\{\{\s*([\w_]+)\s*\}\}/g, (m, k) => (EJEMPLO[k] !== undefined ? EJEMPLO[k] : m));
}

const TIPOS = [
  { k: 'habitual', l: 'Habitual' },
  { k: 'nuevo', l: 'Nuevo' },
  { k: 'moroso', l: 'Moroso' },
];
const NIVELES = [
  { k: 'amistoso', l: 'Amistoso' },
  { k: 'firme', l: 'Firme' },
  { k: 'serio', l: 'Serio' },
];
const CANALES = [
  { k: 'email', l: 'Email' },
  { k: 'whatsapp', l: 'WhatsApp' },
];

function Selector({ opciones, valor, onChange }) {
  return (
    <div className="flex gap-1">
      {opciones.map((o) => (
        <button
          key={o.k}
          onClick={() => onChange(o.k)}
          className={`flex-1 rounded-lg px-2 py-2 text-sm font-semibold border ${
            valor === o.k ? 'bg-brand-600 text-white border-brand-600' : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export default function Plantillas() {
  const [todas, setTodas] = useState(null);
  const [tipo, setTipo] = useState('habitual');
  const [nivel, setNivel] = useState('amistoso');
  const [canal, setCanal] = useState('email');
  const [asunto, setAsunto] = useState('');
  const [cuerpo, setCuerpo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState('');

  function cargarTodas() {
    return api.plantillas().then(setTodas);
  }
  useEffect(() => {
    cargarTodas();
  }, []);

  const actual = useMemo(
    () => (todas || []).find((p) => p.tipo_cliente === tipo && p.nivel === nivel && p.canal === canal),
    [todas, tipo, nivel, canal]
  );

  useEffect(() => {
    if (actual) {
      setAsunto(actual.asunto || '');
      setCuerpo(actual.cuerpo || '');
      setAviso('');
    }
  }, [actual]);

  async function guardar() {
    if (!actual) return;
    setGuardando(true);
    try {
      await api.actualizarPlantilla(actual.id, { asunto, cuerpo });
      await cargarTodas();
      setAviso('Plantilla guardada ✓');
      setTimeout(() => setAviso(''), 2500);
    } finally {
      setGuardando(false);
    }
  }

  if (!todas) return <Spinner />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Plantillas de recordatorio</h2>
        <p className="text-sm text-slate-500">18 plantillas: 3 tipos de cliente × 3 tonos × 2 canales.</p>
      </div>

      <section className="card p-4 space-y-3">
        <div>
          <label className="label">Tipo de cliente</label>
          <Selector opciones={TIPOS} valor={tipo} onChange={setTipo} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Tono</label>
            <Selector opciones={NIVELES} valor={nivel} onChange={setNivel} />
          </div>
          <div>
            <label className="label">Canal</label>
            <Selector opciones={CANALES} valor={canal} onChange={setCanal} />
          </div>
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Editor */}
        <section className="card p-4 space-y-3">
          <h3 className="font-bold">Editar</h3>
          {canal === 'email' && (
            <div>
              <label className="label">Asunto</label>
              <input className="input" value={asunto} onChange={(e) => setAsunto(e.target.value)} />
            </div>
          )}
          <div>
            <label className="label">Cuerpo del mensaje</label>
            <textarea className="input min-h-[260px]" value={cuerpo} onChange={(e) => setCuerpo(e.target.value)} />
          </div>
          <div>
            <p className="label">Variables disponibles (pulsa para insertar)</p>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCuerpo((c) => c + v)}
                  className="rounded-md bg-slate-100 px-2 py-1 text-xs font-mono text-slate-600 hover:bg-slate-200"
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-primary" onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar plantilla'}
            </button>
            {aviso && <span className="text-sm text-emerald-600 font-medium">{aviso}</span>}
          </div>
        </section>

        {/* Vista previa */}
        <section className="card p-4 space-y-3">
          <h3 className="font-bold">Vista previa</h3>
          <p className="text-xs text-slate-400">Con datos de ejemplo de una factura.</p>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            {canal === 'email' && (
              <p className="text-sm mb-2">
                <span className="text-slate-400">Asunto: </span>
                <b>{render(asunto)}</b>
              </p>
            )}
            <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">{render(cuerpo)}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}
