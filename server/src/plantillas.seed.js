// 18 plantillas iniciales: 3 tipos de cliente x 3 tonos x 2 canales.
// Variables: {{cliente_nombre}} {{factura_concepto}} {{importe_pendiente}}
//            {{fecha_vencimiento}} {{dias_retraso}} {{nombre_negocio}}
// Adaptación de tono: habitual (cercano), nuevo (neutro profesional), moroso (directo).

const PLANTILLAS = [
  // ===================== HABITUAL =====================
  {
    tipo_cliente: 'habitual', nivel: 'amistoso', canal: 'email',
    asunto: 'Recordatorio de factura pendiente',
    cuerpo:
`Hola {{cliente_nombre}},

Espero que todo vaya genial por ahí. Te escribo solo para recordarte que la factura de {{factura_concepto}} tenía vencimiento el {{fecha_vencimiento}} y queda pendiente {{importe_pendiente}}.

Seguro que se ha traspapelado entre el día a día, así que te lo dejo por aquí para que lo tengas a mano. Sin prisa.

Un abrazo y gracias siempre por la confianza,
{{nombre_negocio}}`
  },
  {
    tipo_cliente: 'habitual', nivel: 'amistoso', canal: 'whatsapp',
    asunto: '',
    cuerpo:
`¡Hola {{cliente_nombre}}! ¿Qué tal todo? 😊
Te escribo solo para recordarte la factura de {{factura_concepto}}, que vencía el {{fecha_vencimiento}}. Queda pendiente {{importe_pendiente}}.
Cuando puedas le echas un ojo, sin prisa. ¡Gracias!`
  },
  {
    tipo_cliente: 'habitual', nivel: 'firme', canal: 'email',
    asunto: 'Factura pendiente desde hace {{dias_retraso}} días',
    cuerpo:
`Hola {{cliente_nombre}},

Te escribo porque la factura de {{factura_concepto}} sigue pendiente. Venció el {{fecha_vencimiento}} y ya acumula {{dias_retraso}} días de retraso; el importe pendiente es de {{importe_pendiente}}.

Como siempre trabajamos bien juntos, prefiero comentártelo directamente: ¿podrías regularizarlo en los próximos días o decirme si hay algún problema con este pago?

Gracias por tu ayuda,
{{nombre_negocio}}`
  },
  {
    tipo_cliente: 'habitual', nivel: 'firme', canal: 'whatsapp',
    asunto: '',
    cuerpo:
`Hola {{cliente_nombre}} 🙂
Te escribo porque sigue pendiente la factura de {{factura_concepto}}, vencida el {{fecha_vencimiento}}. Quedan {{importe_pendiente}} y han pasado {{dias_retraso}} días.
¿Me confirmas cuándo lo puedes dejar resuelto? Gracias.`
  },
  {
    tipo_cliente: 'habitual', nivel: 'serio', canal: 'email',
    asunto: 'Último recordatorio de factura pendiente',
    cuerpo:
`Hola {{cliente_nombre}},

Te escribo de nuevo porque la factura de {{factura_concepto}} continúa pendiente tras varios recordatorios. Venció el {{fecha_vencimiento}}, acumula {{dias_retraso}} días de retraso y el importe pendiente es de {{importe_pendiente}}.

Valoro mucho nuestra relación, y precisamente por eso necesito cerrar este tema: te pido que regularices el pago o me indiques una fecha concreta. Si ya lo has abonado, ignora este mensaje o envíame el justificante para actualizarlo.

Gracias,
{{nombre_negocio}}`
  },
  {
    tipo_cliente: 'habitual', nivel: 'serio', canal: 'whatsapp',
    asunto: '',
    cuerpo:
`Hola {{cliente_nombre}}.
Te escribo otra vez porque la factura de {{factura_concepto}} sigue pendiente tras varios avisos. Venció el {{fecha_vencimiento}}, acumula {{dias_retraso}} días de retraso y quedan {{importe_pendiente}}.
Necesito que me confirmes una fecha concreta de pago o si hay algún problema. Gracias.`
  },

  // ===================== NUEVO =====================
  {
    tipo_cliente: 'nuevo', nivel: 'amistoso', canal: 'email',
    asunto: 'Recordatorio de factura pendiente',
    cuerpo:
`Hola {{cliente_nombre}},

Te escribo para recordarte que la factura correspondiente a {{factura_concepto}} tenía vencimiento el {{fecha_vencimiento}}. El importe pendiente es de {{importe_pendiente}}.

Probablemente se te haya pasado entre otras cosas, así que te lo dejo por aquí para que lo tengas localizado.

Gracias,
{{nombre_negocio}}`
  },
  {
    tipo_cliente: 'nuevo', nivel: 'amistoso', canal: 'whatsapp',
    asunto: '',
    cuerpo:
`Hola {{cliente_nombre}}, ¿qué tal?
Te escribo solo para recordarte la factura de {{factura_concepto}}, que vencía el {{fecha_vencimiento}}. Queda pendiente {{importe_pendiente}}.
Cuando puedas, échale un ojo. Gracias.`
  },
  {
    tipo_cliente: 'nuevo', nivel: 'firme', canal: 'email',
    asunto: 'Factura pendiente desde hace {{dias_retraso}} días',
    cuerpo:
`Hola {{cliente_nombre}},

Te escribo porque la factura de {{factura_concepto}} sigue pendiente de pago. El vencimiento fue el {{fecha_vencimiento}} y actualmente acumula {{dias_retraso}} días de retraso. El importe pendiente es de {{importe_pendiente}}.

Te agradecería que pudieras regularizarlo lo antes posible o indicarme si hay algún problema con el pago.

Gracias,
{{nombre_negocio}}`
  },
  {
    tipo_cliente: 'nuevo', nivel: 'firme', canal: 'whatsapp',
    asunto: '',
    cuerpo:
`Hola {{cliente_nombre}}.
Te escribo porque sigue pendiente la factura de {{factura_concepto}}, vencida el {{fecha_vencimiento}}. Ahora mismo quedan pendientes {{importe_pendiente}} y han pasado {{dias_retraso}} días desde el vencimiento.
¿Puedes confirmarme cuándo quedará resuelto? Gracias.`
  },
  {
    tipo_cliente: 'nuevo', nivel: 'serio', canal: 'email',
    asunto: 'Último recordatorio de factura pendiente',
    cuerpo:
`Hola {{cliente_nombre}},

Te escribo de nuevo porque la factura correspondiente a {{factura_concepto}} continúa pendiente de pago tras varios recordatorios. La factura venció el {{fecha_vencimiento}}, acumula {{dias_retraso}} días de retraso y el importe pendiente es de {{importe_pendiente}}.

Necesito que el pago quede regularizado o que me indiques una fecha concreta de pago. Si ya has realizado el pago, por favor ignora este mensaje o envíame el justificante para actualizar el estado.

Gracias,
{{nombre_negocio}}`
  },
  {
    tipo_cliente: 'nuevo', nivel: 'serio', canal: 'whatsapp',
    asunto: '',
    cuerpo:
`Hola {{cliente_nombre}}.
Te escribo de nuevo porque la factura de {{factura_concepto}} sigue pendiente tras varios recordatorios. Venció el {{fecha_vencimiento}}, acumula {{dias_retraso}} días de retraso y quedan pendientes {{importe_pendiente}}.
Necesito que me confirmes una fecha concreta de pago o que me indiques si hay algún problema. Gracias.`
  },

  // ===================== MOROSO =====================
  {
    tipo_cliente: 'moroso', nivel: 'amistoso', canal: 'email',
    asunto: 'Recordatorio de factura pendiente',
    cuerpo:
`Hola {{cliente_nombre}},

Te recuerdo que la factura de {{factura_concepto}} venció el {{fecha_vencimiento}} y queda pendiente {{importe_pendiente}}.

Te agradecería que la tuvieras presente y me confirmes cuándo prevés realizar el pago.

Gracias,
{{nombre_negocio}}`
  },
  {
    tipo_cliente: 'moroso', nivel: 'amistoso', canal: 'whatsapp',
    asunto: '',
    cuerpo:
`Hola {{cliente_nombre}}.
Te recuerdo la factura de {{factura_concepto}}, vencida el {{fecha_vencimiento}}. Queda pendiente {{importe_pendiente}}.
¿Me confirmas cuándo la podrás abonar? Gracias.`
  },
  {
    tipo_cliente: 'moroso', nivel: 'firme', canal: 'email',
    asunto: 'Factura pendiente desde hace {{dias_retraso}} días',
    cuerpo:
`Hola {{cliente_nombre}},

La factura de {{factura_concepto}} sigue sin abonarse. Venció el {{fecha_vencimiento}}, acumula {{dias_retraso}} días de retraso y el importe pendiente es de {{importe_pendiente}}.

Necesito que realices el pago en los próximos días y que me confirmes la fecha exacta en la que lo harás.

Gracias,
{{nombre_negocio}}`
  },
  {
    tipo_cliente: 'moroso', nivel: 'firme', canal: 'whatsapp',
    asunto: '',
    cuerpo:
`Hola {{cliente_nombre}}.
La factura de {{factura_concepto}} sigue pendiente: venció el {{fecha_vencimiento}}, lleva {{dias_retraso}} días de retraso y quedan {{importe_pendiente}}.
Necesito que me confirmes hoy una fecha concreta de pago. Gracias.`
  },
  {
    tipo_cliente: 'moroso', nivel: 'serio', canal: 'email',
    asunto: 'Último recordatorio de factura pendiente',
    cuerpo:
`Hola {{cliente_nombre}},

La factura de {{factura_concepto}} continúa impagada tras varios recordatorios. Venció el {{fecha_vencimiento}}, acumula {{dias_retraso}} días de retraso y el importe pendiente es de {{importe_pendiente}}.

Este es un último aviso antes de tener que valorar otras vías para reclamar la deuda. Te pido que regularices el pago de forma inmediata o que me indiques hoy mismo una fecha concreta. Si ya lo has abonado, envíame el justificante para actualizar el estado.

Quedo a la espera de tu respuesta,
{{nombre_negocio}}`
  },
  {
    tipo_cliente: 'moroso', nivel: 'serio', canal: 'whatsapp',
    asunto: '',
    cuerpo:
`Hola {{cliente_nombre}}.
La factura de {{factura_concepto}} sigue impagada tras varios avisos. Venció el {{fecha_vencimiento}}, lleva {{dias_retraso}} días de retraso y quedan {{importe_pendiente}}.
Es un último aviso: necesito que me confirmes hoy una fecha concreta de pago. Gracias.`
  },
];

module.exports = { PLANTILLAS };
