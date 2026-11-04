// Cliente HTTP minimalista para la API de Cobros al Día.
async function req(method, url, body) {
  const res = await fetch(`/api${url}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export const api = {
  dashboard: () => req('GET', '/dashboard'),

  clientes: () => req('GET', '/clientes'),
  crearCliente: (d) => req('POST', '/clientes', d),
  actualizarCliente: (id, d) => req('PUT', `/clientes/${id}`, d),

  facturas: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v != null)
    ).toString();
    return req('GET', `/facturas${qs ? '?' + qs : ''}`);
  },
  factura: (id) => req('GET', `/facturas/${id}`),
  crearFactura: (d) => req('POST', '/facturas', d),
  actualizarFactura: (id, d) => req('PUT', `/facturas/${id}`, d),
  timeline: (id) => req('GET', `/facturas/${id}/timeline`),

  pagos: (id) => req('GET', `/facturas/${id}/pagos`),
  crearPago: (id, d) => req('POST', `/facturas/${id}/pagos`, d),

  recordatorios: (id) => req('GET', `/facturas/${id}/recordatorios`),
  previsualizar: (id, d) => req('POST', `/facturas/${id}/recordatorios/previsualizar`, d),
  marcarEnviado: (id, d) => req('POST', `/facturas/${id}/recordatorios/marcar-enviado`, d),

  plantillas: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return req('GET', `/plantillas${qs ? '?' + qs : ''}`);
  },
  actualizarPlantilla: (id, d) => req('PUT', `/plantillas/${id}`, d),
};
