// Servicio de envío SIMULADO (mock).
// No conecta con Gmail, Outlook, WhatsApp, WhatsApp Business API ni SMS.
// Solo registra el "envío" y devuelve un acuse simulado.
//
// === Cómo conectar un proveedor real en fase de pulido ===
// Implementa una función con la misma firma que `enviar()` que llame a tu
// proveedor (p. ej. Resend/SendGrid para email, Twilio/WhatsApp Cloud API para
// WhatsApp) y exporta esa implementación en lugar de esta. El resto de la app
// (rutas, timeline, recordatorios) no necesita cambios: solo consume `enviar()`.

function enviar({ canal, destinatario, asunto, contenido }) {
  // En un proveedor real aquí iría la llamada HTTP. Aquí lo simulamos.
  const acuse = {
    ok: true,
    simulado: true,
    canal,
    destinatario: destinatario || '(sin datos de contacto)',
    asunto: canal === 'email' ? asunto : undefined,
    longitud: (contenido || '').length,
    enviado_en: new Date().toISOString(),
    mensaje: `Envío SIMULADO por ${canal}. No se ha enviado nada real.`,
  };
  console.log(`[ENVÍO SIMULADO] ${canal} -> ${acuse.destinatario}`);
  return acuse;
}

module.exports = { enviar };
