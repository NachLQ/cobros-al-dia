const { db } = require('./db');
const L = require('./logic');

// ---------- Eventos timeline ----------
function addEvento(factura_id, tipo, titulo, descripcion = null, metadata = null) {
  db.prepare(
    `INSERT INTO eventos_timeline (factura_id, tipo, titulo, descripcion, metadata_json)
     VALUES (?, ?, ?, ?, ?)`
  ).run(factura_id, tipo, titulo, descripcion, metadata ? JSON.stringify(metadata) : null);
}

function getTimeline(factura_id) {
  return db
    .prepare(`SELECT * FROM eventos_timeline WHERE factura_id = ? ORDER BY datetime(fecha) ASC, id ASC`)
    .all(factura_id)
    .map((e) => ({ ...e, metadata: e.metadata_json ? JSON.parse(e.metadata_json) : null }));
}

// ---------- Clientes ----------
function listClientes() {
  return db.prepare(`SELECT * FROM clientes ORDER BY nombre COLLATE NOCASE`).all();
}
function getCliente(id) {
  return db.prepare(`SELECT * FROM clientes WHERE id = ?`).get(id);
}
function createCliente(d) {
  const info = db
    .prepare(
      `INSERT INTO clientes (nombre, email, telefono, tipo_cliente, notas)
       VALUES (@nombre, @email, @telefono, @tipo_cliente, @notas)`
    )
    .run({
      nombre: d.nombre,
      email: d.email || null,
      telefono: d.telefono || null,
      tipo_cliente: d.tipo_cliente || 'nuevo',
      notas: d.notas || null,
    });
  return getCliente(info.lastInsertRowid);
}
function updateCliente(id, d) {
  const c = getCliente(id);
  if (!c) return null;
  db.prepare(
    `UPDATE clientes SET nombre=@nombre, email=@email, telefono=@telefono,
       tipo_cliente=@tipo_cliente, notas=@notas, updated_at=datetime('now') WHERE id=@id`
  ).run({
    id,
    nombre: d.nombre ?? c.nombre,
    email: d.email ?? c.email,
    telefono: d.telefono ?? c.telefono,
    tipo_cliente: d.tipo_cliente ?? c.tipo_cliente,
    notas: d.notas ?? c.notas,
  });
  return getCliente(id);
}

// ---------- Facturas ----------
function recomputeFactura(id) {
  const f = db.prepare(`SELECT * FROM facturas WHERE id = ?`).get(id);
  if (!f) return null;
  const pagado = db.prepare(`SELECT COALESCE(SUM(importe),0) s FROM pagos WHERE factura_id = ?`).get(id).s;
  const { importe_pendiente, estado } = L.calcularEstado(f.importe_total, pagado, f.fecha_vencimiento);
  db.prepare(
    `UPDATE facturas SET importe_pagado=?, importe_pendiente=?, estado=?, updated_at=datetime('now') WHERE id=?`
  ).run(L.round2(pagado), importe_pendiente, estado, id);
  return db.prepare(`SELECT * FROM facturas WHERE id = ?`).get(id);
}

// Recalcula estado de todas (por si cambió el día y alguna pasó a vencida).
function recomputeTodas() {
  const ids = db.prepare(`SELECT id FROM facturas`).all().map((r) => r.id);
  ids.forEach(recomputeFactura);
}

function recordatorioNivelEnviado(factura_id, nivel) {
  return !!db
    .prepare(
      `SELECT 1 FROM recordatorios WHERE factura_id=? AND nivel=? AND estado='marcado_como_enviado' LIMIT 1`
    )
    .get(factura_id, nivel);
}

function enrichFactura(f) {
  const cliente = getCliente(f.cliente_id);
  const dr = L.diasRetraso(f.fecha_vencimiento);
  const nivel = L.nivelSugerido(f.fecha_vencimiento);
  const pagada = f.estado === 'pagada';
  // Acción hoy: vencida sin recordatorio del nivel actual enviado,
  // o próxima a vencer en <=3 días sin pagar.
  let accion_hoy = false;
  if (!pagada) {
    if (nivel && !recordatorioNivelEnviado(f.id, nivel)) accion_hoy = true;
    else if (nivel === null && dr >= -3) accion_hoy = true;
  }
  return {
    ...f,
    cliente,
    cliente_nombre: cliente ? cliente.nombre : null,
    tipo_cliente: cliente ? cliente.tipo_cliente : null,
    dias_retraso: dr, // negativo = aún no vence
    nivel_sugerido: nivel, // 'amistoso'|'firme'|'serio'|null
    nivel_sugerido_label: nivel ? L.etiquetaNivel(nivel) : (pagada ? '—' : 'Aún no toca'),
    accion_hoy,
  };
}

function listFacturas(filtros = {}) {
  let rows = db.prepare(`SELECT * FROM facturas ORDER BY date(fecha_vencimiento) ASC, id ASC`).all();
  let out = rows.map(enrichFactura);
  const { q, estado, cliente_id, tipo_cliente, filtro } = filtros;
  if (q) {
    const s = q.toLowerCase();
    out = out.filter(
      (f) =>
        (f.concepto || '').toLowerCase().includes(s) ||
        (f.cliente_nombre || '').toLowerCase().includes(s)
    );
  }
  if (estado) out = out.filter((f) => f.estado === estado);
  if (cliente_id) out = out.filter((f) => f.cliente_id === Number(cliente_id));
  if (tipo_cliente) out = out.filter((f) => f.tipo_cliente === tipo_cliente);
  if (filtro === 'vencidas') out = out.filter((f) => f.estado === 'vencida');
  if (filtro === 'parciales') out = out.filter((f) => f.estado === 'parcial');
  if (filtro === 'pagadas') out = out.filter((f) => f.estado === 'pagada');
  if (filtro === 'proximas')
    out = out.filter((f) => f.estado !== 'pagada' && f.dias_retraso < 0 && f.dias_retraso >= -7);
  if (filtro === 'accion_hoy') out = out.filter((f) => f.accion_hoy);
  return out;
}

function getFactura(id) {
  const f = db.prepare(`SELECT * FROM facturas WHERE id = ?`).get(id);
  return f ? enrichFactura(f) : null;
}

function createFactura(d) {
  const total = L.round2(d.importe_total);
  const info = db
    .prepare(
      `INSERT INTO facturas (cliente_id, concepto, importe_total, importe_pagado, importe_pendiente,
        fecha_emision, fecha_vencimiento, estado, notas)
       VALUES (@cliente_id, @concepto, @importe_total, 0, @importe_total,
        @fecha_emision, @fecha_vencimiento, 'pendiente', @notas)`
    )
    .run({
      cliente_id: d.cliente_id,
      concepto: d.concepto,
      importe_total: total,
      fecha_emision: d.fecha_emision,
      fecha_vencimiento: d.fecha_vencimiento,
      notas: d.notas || null,
    });
  const id = info.lastInsertRowid;
  recomputeFactura(id);
  const f = getFactura(id);
  addEvento(id, 'creacion', 'Factura registrada', `${f.concepto} · ${L.formatImporte(f.importe_total)}`, {
    importe_total: f.importe_total,
  });
  return f;
}

function updateFactura(id, d) {
  const f = db.prepare(`SELECT * FROM facturas WHERE id = ?`).get(id);
  if (!f) return null;
  db.prepare(
    `UPDATE facturas SET cliente_id=@cliente_id, concepto=@concepto, importe_total=@importe_total,
       fecha_emision=@fecha_emision, fecha_vencimiento=@fecha_vencimiento, notas=@notas,
       updated_at=datetime('now') WHERE id=@id`
  ).run({
    id,
    cliente_id: d.cliente_id ?? f.cliente_id,
    concepto: d.concepto ?? f.concepto,
    importe_total: d.importe_total != null ? L.round2(d.importe_total) : f.importe_total,
    fecha_emision: d.fecha_emision ?? f.fecha_emision,
    fecha_vencimiento: d.fecha_vencimiento ?? f.fecha_vencimiento,
    notas: d.notas ?? f.notas,
  });
  const prev = f.estado;
  const after = recomputeFactura(id);
  addEvento(id, 'edicion', 'Factura editada', 'Se actualizaron datos de la factura.');
  if (after.estado !== prev)
    addEvento(id, 'cambio_estado', `Estado: ${prev} → ${after.estado}`, null, { de: prev, a: after.estado });
  return getFactura(id);
}

// ---------- Pagos ----------
function listPagos(factura_id) {
  return db.prepare(`SELECT * FROM pagos WHERE factura_id = ? ORDER BY date(fecha_pago) ASC, id ASC`).all(factura_id);
}

function addPago(factura_id, d) {
  const f = db.prepare(`SELECT * FROM facturas WHERE id = ?`).get(factura_id);
  if (!f) return null;
  const prevEstado = f.estado;
  db.prepare(
    `INSERT INTO pagos (factura_id, importe, fecha_pago, metodo_pago, nota)
     VALUES (?, ?, ?, ?, ?)`
  ).run(factura_id, L.round2(d.importe), d.fecha_pago || new Date().toISOString().slice(0, 10), d.metodo_pago || 'transferencia', d.nota || null);
  const after = recomputeFactura(factura_id);
  addEvento(
    factura_id,
    'pago',
    `Pago registrado · ${L.formatImporte(d.importe)}`,
    `${d.metodo_pago || 'transferencia'}${d.nota ? ' · ' + d.nota : ''}`,
    { importe: L.round2(d.importe), metodo: d.metodo_pago || 'transferencia' }
  );
  if (after.estado !== prevEstado) {
    const titulo =
      after.estado === 'pagada'
        ? 'Factura pagada por completo'
        : `Estado: ${prevEstado} → ${after.estado}`;
    addEvento(factura_id, 'cambio_estado', titulo, null, { de: prevEstado, a: after.estado });
  }
  return getFactura(factura_id);
}

// ---------- Plantillas ----------
function listPlantillas(filtros = {}) {
  let rows = db
    .prepare(`SELECT * FROM plantillas ORDER BY tipo_cliente, CASE nivel WHEN 'amistoso' THEN 1 WHEN 'firme' THEN 2 ELSE 3 END, canal`)
    .all();
  if (filtros.tipo_cliente) rows = rows.filter((p) => p.tipo_cliente === filtros.tipo_cliente);
  if (filtros.nivel) rows = rows.filter((p) => p.nivel === filtros.nivel);
  if (filtros.canal) rows = rows.filter((p) => p.canal === filtros.canal);
  return rows;
}
function getPlantillaCombo(tipo_cliente, nivel, canal) {
  return db
    .prepare(`SELECT * FROM plantillas WHERE tipo_cliente=? AND nivel=? AND canal=?`)
    .get(tipo_cliente, nivel, canal);
}
function getPlantilla(id) {
  return db.prepare(`SELECT * FROM plantillas WHERE id = ?`).get(id);
}
function updatePlantilla(id, d) {
  const p = getPlantilla(id);
  if (!p) return null;
  db.prepare(
    `UPDATE plantillas SET asunto=@asunto, cuerpo=@cuerpo, updated_at=datetime('now') WHERE id=@id`
  ).run({ id, asunto: d.asunto ?? p.asunto, cuerpo: d.cuerpo ?? p.cuerpo });
  return getPlantilla(id);
}

// ---------- Recordatorios ----------
function listRecordatorios(factura_id) {
  return db
    .prepare(`SELECT * FROM recordatorios WHERE factura_id = ? ORDER BY datetime(created_at) DESC, id DESC`)
    .all(factura_id);
}

// Construye una previsualización (sin guardar como recordatorio definitivo).
function previsualizarRecordatorio(factura_id, opts = {}) {
  const f = getFactura(factura_id);
  if (!f) return null;
  const cliente = f.cliente;
  const nivel = opts.nivel || f.nivel_sugerido || 'amistoso';
  const canal = opts.canal || 'email';
  const plantilla = getPlantillaCombo(cliente.tipo_cliente, nivel, canal);
  const vars = L.variablesFactura(f, cliente);
  const asunto = plantilla ? L.renderPlantilla(plantilla.asunto, vars) : '';
  const contenido = plantilla ? L.renderPlantilla(plantilla.cuerpo, vars) : '';
  return {
    factura_id,
    cliente_id: cliente.id,
    cliente_nombre: cliente.nombre,
    tipo_cliente: cliente.tipo_cliente,
    nivel,
    nivel_label: L.etiquetaNivel(nivel),
    canal,
    plantilla_id: plantilla ? plantilla.id : null,
    asunto,
    contenido,
    destinatario: canal === 'email' ? cliente.email : cliente.telefono,
    variables: vars,
  };
}

const { enviar } = require('./services/envio.mock');

// Guarda un recordatorio como marcado_como_enviado (envío simulado).
function marcarEnviado(factura_id, d) {
  const f = getFactura(factura_id);
  if (!f) return null;
  const cliente = f.cliente;
  const nivel = d.nivel || f.nivel_sugerido || 'amistoso';
  const canal = d.canal || 'email';
  const plantilla = getPlantillaCombo(cliente.tipo_cliente, nivel, canal);
  const asunto = d.asunto ?? '';
  const contenido = d.contenido ?? '';
  const acuse = enviar({ canal, destinatario: canal === 'email' ? cliente.email : cliente.telefono, asunto, contenido });
  const info = db
    .prepare(
      `INSERT INTO recordatorios (factura_id, plantilla_id, nivel, canal, asunto, contenido, estado, fecha_sugerida, fecha_marcado_enviado)
       VALUES (?, ?, ?, ?, ?, ?, 'marcado_como_enviado', date('now'), datetime('now'))`
    )
    .run(factura_id, plantilla ? plantilla.id : null, nivel, canal, asunto, contenido);
  addEvento(
    factura_id,
    'recordatorio',
    `Recordatorio ${L.etiquetaNivel(nivel).toLowerCase()} enviado por ${canal === 'email' ? 'email' : 'WhatsApp'}`,
    `Marcado como enviado (simulado) a ${acuse.destinatario}.`,
    { nivel, canal, recordatorio_id: info.lastInsertRowid }
  );
  return { recordatorio: db.prepare(`SELECT * FROM recordatorios WHERE id=?`).get(info.lastInsertRowid), acuse };
}

// ---------- Dashboard ----------
function dashboard() {
  recomputeTodas();
  const facturas = db.prepare(`SELECT * FROM facturas`).all().map(enrichFactura);
  const hoy = L.hoy();
  const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

  let total_pendiente = 0,
    total_vencido = 0,
    total_proximo_mes = 0,
    cobrado_mes = 0,
    n_pendientes = 0,
    n_vencidas = 0;

  for (const f of facturas) {
    if (f.estado !== 'pagada') total_pendiente += f.importe_pendiente;
    if (f.estado === 'vencida' || (f.estado === 'parcial' && f.dias_retraso > 0)) {
      total_vencido += f.importe_pendiente;
      n_vencidas++;
    }
    if (f.estado === 'pendiente' || (f.estado === 'parcial' && f.dias_retraso <= 0)) n_pendientes++;
    // Próximo a vencer este mes: no pagada, aún no vencida, vence dentro de este mes natural.
    if (f.estado !== 'pagada' && f.dias_retraso < 0) {
      const venc = L.parseFecha(f.fecha_vencimiento);
      if (venc <= finMes) total_proximo_mes += f.importe_pendiente;
    }
  }
  // Cobrado este mes: suma de pagos con fecha en el mes natural actual.
  const pagosMes = db
    .prepare(
      `SELECT COALESCE(SUM(importe),0) s FROM pagos
       WHERE strftime('%Y-%m', fecha_pago) = strftime('%Y-%m','now')`
    )
    .get().s;
  cobrado_mes = L.round2(pagosMes);

  // Total pendiente por cliente.
  const porClienteMap = {};
  for (const f of facturas) {
    if (f.estado === 'pagada') continue;
    const k = f.cliente_id;
    if (!porClienteMap[k])
      porClienteMap[k] = { cliente_id: k, cliente_nombre: f.cliente_nombre, tipo_cliente: f.tipo_cliente, total: 0, vencido: 0, n: 0 };
    porClienteMap[k].total += f.importe_pendiente;
    porClienteMap[k].n++;
    if (f.estado === 'vencida' || (f.estado === 'parcial' && f.dias_retraso > 0)) porClienteMap[k].vencido += f.importe_pendiente;
  }
  const por_cliente = Object.values(porClienteMap)
    .map((c) => ({ ...c, total: L.round2(c.total), vencido: L.round2(c.vencido) }))
    .sort((a, b) => b.total - a.total);

  const accion_hoy = facturas
    .filter((f) => f.accion_hoy)
    .sort((a, b) => b.dias_retraso - a.dias_retraso);

  return {
    fecha: new Date().toISOString().slice(0, 10),
    total_pendiente: L.round2(total_pendiente),
    total_vencido: L.round2(total_vencido),
    total_proximo_mes: L.round2(total_proximo_mes),
    cobrado_mes,
    n_pendientes,
    n_vencidas,
    n_facturas: facturas.length,
    por_cliente,
    accion_hoy,
  };
}

module.exports = {
  addEvento,
  getTimeline,
  listClientes,
  getCliente,
  createCliente,
  updateCliente,
  recomputeFactura,
  recomputeTodas,
  listFacturas,
  getFactura,
  createFactura,
  updateFactura,
  listPagos,
  addPago,
  listPlantillas,
  getPlantilla,
  getPlantillaCombo,
  updatePlantilla,
  listRecordatorios,
  previsualizarRecordatorio,
  marcarEnviado,
  dashboard,
};
