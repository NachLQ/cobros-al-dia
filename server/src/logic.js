// Lógica de dominio: fechas, estados, recordatorios y render de plantillas.
// Nombre del negocio del usuario (autónomo). Editable en el seed / config.
const NOMBRE_NEGOCIO = 'Tu Negocio';

function hoy() {
  // Fecha local a medianoche (sin hora) para comparar días limpios.
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function parseFecha(str) {
  // Espera 'YYYY-MM-DD'
  const [y, m, dd] = String(str).slice(0, 10).split('-').map(Number);
  return new Date(y, (m || 1) - 1, dd || 1);
}

const MS_DIA = 24 * 60 * 60 * 1000;

// Días de retraso (positivo = vencida hace N días). Negativo = aún no vence.
function diasRetraso(fechaVencimiento, ref = hoy()) {
  return Math.round((ref - parseFecha(fechaVencimiento)) / MS_DIA);
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

// Calcula importe pendiente y estado a partir de total, pagado y vencimiento.
function calcularEstado(importeTotal, importePagado, fechaVencimiento, ref = hoy()) {
  const total = round2(importeTotal);
  const pagado = round2(importePagado);
  const pendiente = round2(total - pagado);
  let estado;
  if (pendiente <= 0) {
    estado = 'pagada';
  } else if (pagado > 0) {
    estado = 'parcial';
  } else if (diasRetraso(fechaVencimiento, ref) > 0) {
    estado = 'vencida';
  } else {
    estado = 'pendiente';
  }
  return { importe_pendiente: Math.max(0, pendiente), estado };
}

// Nivel de recordatorio sugerido según días de retraso.
// serio (>=21) / firme (>=7) / amistoso (0-6) / null si aún no vence.
function nivelSugerido(fechaVencimiento, ref = hoy()) {
  const d = diasRetraso(fechaVencimiento, ref);
  if (d < 0) return null;
  if (d >= 21) return 'serio';
  if (d >= 7) return 'firme';
  return 'amistoso';
}

function etiquetaNivel(nivel) {
  return { amistoso: 'Amistoso', firme: 'Firme', serio: 'Serio' }[nivel] || nivel;
}

function formatImporte(n) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(Number(n) || 0);
}

function formatFechaES(str) {
  const d = parseFecha(str);
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }).format(d);
}

// Sustituye variables {{...}} en un texto de plantilla.
function renderPlantilla(texto, vars) {
  if (!texto) return '';
  return texto.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (m, key) => {
    return vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : m;
  });
}

// Construye el diccionario de variables para una factura + cliente.
function variablesFactura(factura, cliente, nombreNegocio = NOMBRE_NEGOCIO) {
  const pendiente = factura.importe_pendiente;
  const dr = Math.max(0, diasRetraso(factura.fecha_vencimiento));
  return {
    cliente_nombre: cliente.nombre,
    factura_concepto: factura.concepto,
    importe_pendiente: formatImporte(pendiente),
    fecha_vencimiento: formatFechaES(factura.fecha_vencimiento),
    dias_retraso: String(dr),
    nombre_negocio: nombreNegocio,
  };
}

module.exports = {
  NOMBRE_NEGOCIO,
  hoy,
  parseFecha,
  diasRetraso,
  round2,
  calcularEstado,
  nivelSugerido,
  etiquetaNivel,
  formatImporte,
  formatFechaES,
  renderPlantilla,
  variablesFactura,
};
