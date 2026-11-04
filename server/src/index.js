const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { init, DB_PATH } = require('./db');
const store = require('./store');

init();

// Si la base de datos está vacía, ejecuta el seed automáticamente al arrancar.
const { db } = require('./db');
const hayDatos = db.prepare(`SELECT COUNT(*) c FROM clientes`).get().c > 0;
if (!hayDatos) {
  console.log('Base de datos vacía: ejecutando seed inicial...');
  require('./seed').run();
}

const app = express();
app.use(cors());
app.use(express.json());

// Helper para envolver handlers async/sync con manejo de errores.
const h = (fn) => (req, res) => {
  try {
    const out = fn(req, res);
    if (out !== undefined && !res.headersSent) res.json(out);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
};

const api = express.Router();

// ---- Dashboard ----
api.get('/dashboard', h(() => store.dashboard()));

// ---- Clientes ----
api.get('/clientes', h(() => store.listClientes()));
api.post('/clientes', h((req) => {
  if (!req.body.nombre) throw new Error('El nombre del cliente es obligatorio');
  return store.createCliente(req.body);
}));
api.get('/clientes/:id', h((req) => {
  const c = store.getCliente(Number(req.params.id));
  if (!c) throw new Error('Cliente no encontrado');
  return c;
}));
api.put('/clientes/:id', h((req) => {
  const c = store.updateCliente(Number(req.params.id), req.body);
  if (!c) throw new Error('Cliente no encontrado');
  return c;
}));

// ---- Facturas ----
api.get('/facturas', h((req) => store.listFacturas(req.query)));
api.post('/facturas', h((req) => {
  const b = req.body;
  if (!b.cliente_id) throw new Error('Selecciona un cliente');
  if (!b.concepto) throw new Error('El concepto es obligatorio');
  if (!(Number(b.importe_total) > 0)) throw new Error('El importe debe ser mayor que 0');
  if (!b.fecha_emision || !b.fecha_vencimiento) throw new Error('Las fechas son obligatorias');
  return store.createFactura(b);
}));
api.get('/facturas/:id', h((req) => {
  const f = store.getFactura(Number(req.params.id));
  if (!f) throw new Error('Factura no encontrada');
  return f;
}));
api.put('/facturas/:id', h((req) => {
  const f = store.updateFactura(Number(req.params.id), req.body);
  if (!f) throw new Error('Factura no encontrada');
  return f;
}));
api.get('/facturas/:id/timeline', h((req) => store.getTimeline(Number(req.params.id))));

// ---- Pagos ----
api.get('/facturas/:id/pagos', h((req) => store.listPagos(Number(req.params.id))));
api.post('/facturas/:id/pagos', h((req) => {
  if (!(Number(req.body.importe) > 0)) throw new Error('El importe del pago debe ser mayor que 0');
  const f = store.addPago(Number(req.params.id), req.body);
  if (!f) throw new Error('Factura no encontrada');
  return f;
}));

// ---- Recordatorios ----
api.get('/facturas/:id/recordatorios', h((req) => store.listRecordatorios(Number(req.params.id))));
api.post('/facturas/:id/recordatorios/previsualizar', h((req) => {
  const p = store.previsualizarRecordatorio(Number(req.params.id), req.body || {});
  if (!p) throw new Error('Factura no encontrada');
  return p;
}));
api.post('/facturas/:id/recordatorios/marcar-enviado', h((req) => {
  const r = store.marcarEnviado(Number(req.params.id), req.body || {});
  if (!r) throw new Error('Factura no encontrada');
  return r;
}));

// ---- Plantillas ----
api.get('/plantillas', h((req) => store.listPlantillas(req.query)));
api.put('/plantillas/:id', h((req) => {
  const p = store.updatePlantilla(Number(req.params.id), req.body);
  if (!p) throw new Error('Plantilla no encontrada');
  return p;
}));

app.use('/api', api);

// Servir el frontend compilado si existe (producción).
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n  Cobros al Día — API escuchando en http://localhost:${PORT}`);
  console.log(`  Base de datos: ${DB_PATH}\n`);
});
