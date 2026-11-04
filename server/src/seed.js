const { db, init } = require('./db');
const store = require('./store');
const { PLANTILLAS } = require('./plantillas.seed');

// Fecha relativa a HOY (en formato YYYY-MM-DD) para que los estados de la demo
// sean siempre coherentes, sea cual sea el día en que se ejecute el seed.
function dia(offset) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function reset() {
  db.exec(`
    DELETE FROM eventos_timeline;
    DELETE FROM recordatorios;
    DELETE FROM pagos;
    DELETE FROM facturas;
    DELETE FROM plantillas;
    DELETE FROM clientes;
    DELETE FROM sqlite_sequence;
  `);
}

function seedPlantillas() {
  const stmt = db.prepare(
    `INSERT INTO plantillas (tipo_cliente, nivel, canal, asunto, cuerpo) VALUES (?, ?, ?, ?, ?)`
  );
  for (const p of PLANTILLAS) stmt.run(p.tipo_cliente, p.nivel, p.canal, p.asunto, p.cuerpo);
}

function run() {
  init();
  reset();
  seedPlantillas();

  // -------- 8 clientes --------
  const clientes = {};
  const defs = [
    { key: 'alba', nombre: 'Clínica Alba Reus', tipo_cliente: 'habitual', email: 'admin@clinicaalba.es', telefono: '+34 977 111 222', notas: 'Cliente recurrente, paga bien aunque a veces tarde.' },
    { key: 'delta', nombre: 'Academia Delta', tipo_cliente: 'nuevo', email: 'info@academiadelta.es', telefono: '+34 622 334 455', notas: 'Primer proyecto con ellos.' },
    { key: 'laura', nombre: 'Fitness Laura', tipo_cliente: 'habitual', email: 'laura@fitnesslaura.com', telefono: '+34 600 998 877', notas: 'Sesiones mensuales de coaching online.' },
    { key: 'montseny', nombre: 'Taller Montseny', tipo_cliente: 'moroso', email: 'taller@montseny.cat', telefono: '+34 938 445 566', notas: 'Históricamente se retrasa en los pagos.' },
    { key: 'marina', nombre: 'Estética Marina', tipo_cliente: 'nuevo', email: 'hola@esteticamarina.es', telefono: '+34 611 223 344', notas: 'Captada por recomendación.' },
    { key: 'vidal', nombre: 'Reformas Vidal', tipo_cliente: 'moroso', email: 'contacto@reformasvidal.es', telefono: '+34 955 667 788', notas: 'Pagos siempre conflictivos, perseguir de cerca.' },
    { key: 'norte', nombre: 'Consultoría Norte', tipo_cliente: 'habitual', email: 'facturacion@consultorianorte.es', telefono: '+34 944 556 677', notas: 'Buena relación, abonan por transferencia.' },
    { key: 'brisa', nombre: 'Restaurante Brisa', tipo_cliente: 'nuevo', email: 'gerencia@restaurantebrisa.es', telefono: '+34 633 221 100', notas: 'Web y menús digitales.' },
  ];
  for (const d of defs) clientes[d.key] = store.createCliente(d);

  // -------- 15 facturas --------
  // Helper para crear factura sin disparar eventos extra de edición.
  const nueva = (key, concepto, total, emisionOffset, vencOffset, notas = null) =>
    store.createFactura({
      cliente_id: clientes[key].id,
      concepto,
      importe_total: total,
      fecha_emision: dia(emisionOffset),
      fecha_vencimiento: dia(vencOffset),
      notas,
    });

  // 4 VENCIDAS (sin pagar): pocos días, >7 días y >21 días
  const fMarina = nueva('marina', 'Sesión de fotos para catálogo', 320, -33, -3); // amistoso (3 días)
  const fDelta = nueva('delta', 'Diseño de identidad visual', 540, -39, -9);      // firme (9 días)
  const fMontseny = nueva('montseny', 'Mantenimiento web trimestral', 740, -55, -25); // serio (25 días)
  const fVidal = nueva('vidal', 'Reforma landing + SEO local', 1850, -60, -31);   // serio (31 días)

  // 3 PARCIALES (con pago parcial, queda pendiente)
  const fAlbaP = nueva('alba', 'Campaña de captación pacientes', 1200, -35, -5);
  store.addPago(fAlbaP.id, { importe: 600, fecha_pago: dia(-2), metodo_pago: 'transferencia', nota: 'Primer 50%' });
  const fLauraP = nueva('laura', 'Pack 4 sesiones coaching', 450, -42, -12);
  store.addPago(fLauraP.id, { importe: 200, fecha_pago: dia(-6), metodo_pago: 'bizum', nota: 'A cuenta' });
  const fNorteP = nueva('norte', 'Auditoría de procesos', 900, -10, 10);
  store.addPago(fNorteP.id, { importe: 300, fecha_pago: dia(-3), metodo_pago: 'transferencia', nota: 'Anticipo' });

  // 3 PAGADAS (completas)
  const fBrisaPag = nueva('brisa', 'Carta digital con QR', 380, -28, -10);
  store.addPago(fBrisaPag.id, { importe: 380, fecha_pago: dia(-9), metodo_pago: 'tarjeta', nota: 'Pago íntegro' });
  const fAlbaPag = nueva('alba', 'Vídeo promocional clínica', 1500, -50, -20);
  store.addPago(fAlbaPag.id, { importe: 1500, fecha_pago: dia(-18), metodo_pago: 'transferencia' });
  const fDeltaPag = nueva('delta', 'Curso flyer y cartelería', 240, -20, -5);
  store.addPago(fDeltaPag.id, { importe: 240, fecha_pago: dia(-4), metodo_pago: 'efectivo' });

  // 3 PENDIENTES no vencidas (vencen dentro de >7 días)
  nueva('norte', 'Consultoría estrategia anual', 1100, -2, 20);
  nueva('laura', 'Sesión extra puntual', 90, -1, 15);
  nueva('brisa', 'Rediseño de menú web', 670, -3, 25);

  // 2 PRÓXIMAS A VENCER (vencen en pocos días, sin pagar)
  nueva('marina', 'Retoque de fotos producto', 210, -10, 2);
  nueva('montseny', 'Hosting + dominio anual', 1350, -8, 5);

  // -------- Algunos recordatorios ya marcados como enviados --------
  const enviarHistorico = (facturaId, nivel, canal) => {
    const prev = store.previsualizarRecordatorio(facturaId, { nivel, canal });
    store.marcarEnviado(facturaId, { nivel, canal, asunto: prev.asunto, contenido: prev.contenido });
  };
  // Reformas Vidal (31 días): ya se mandó amistoso y firme; toca el serio (queda en Acción hoy).
  enviarHistorico(fVidal.id, 'amistoso', 'email');
  enviarHistorico(fVidal.id, 'firme', 'whatsapp');
  // Taller Montseny (25 días): ya se mandó el amistoso.
  enviarHistorico(fMontseny.id, 'amistoso', 'whatsapp');
  // Academia Delta (9 días): ya se mandó el amistoso; toca el firme.
  enviarHistorico(fDelta.id, 'amistoso', 'email');
  // Fitness Laura parcial (12 días): ya se mandó el amistoso.
  enviarHistorico(fLauraP.id, 'amistoso', 'whatsapp');

  const n = (t) => db.prepare(`SELECT COUNT(*) c FROM ${t}`).get().c;
  console.log('Seed completado:');
  console.log(`  Clientes:      ${n('clientes')}`);
  console.log(`  Facturas:      ${n('facturas')}`);
  console.log(`  Pagos:         ${n('pagos')}`);
  console.log(`  Plantillas:    ${n('plantillas')}`);
  console.log(`  Recordatorios: ${n('recordatorios')}`);
}

module.exports = { run };

if (require.main === module) run();
