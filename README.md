# Cobros al Día

**Seguimiento de cobros para autónomos.** Abre la app y en 10 segundos sabes cuánto te deben, quién te debe, qué facturas están vencidas y qué mensaje toca mandar hoy.

> ⚠️ **Esto no es un software de facturación legal.** Es un sistema para hacer seguimiento del cobro de facturas que ya has emitido en otra herramienta. No genera facturas con validez fiscal ni sustituye asesoramiento contable o fiscal.

---

## Qué es y para quién

Aplicación web pensada para autónomos, freelancers y pequeños negocios de servicios en España: diseñadores, coaches, consultores, técnicos, instaladores, academias, clínicas estéticas, servicios locales… cualquier profesional que emite facturas y luego tiene que perseguir el cobro.

### Qué resuelve

- **Saber siempre qué te deben** y quién, sin abrir una hoja de cálculo.
- **No olvidar reclamar:** la app detecta los vencimientos y te dice a quién toca escribir hoy.
- **Reclamar sin esfuerzo:** propone el mensaje adecuado según el retraso, con un tono que escala de amistoso a serio, y lo deja listo para revisar y enviar.

---

## Requisitos

- **Node.js 18 o superior** (incluye `npm`).
- Nada más: la base de datos es SQLite (un archivo local), no necesitas instalar ningún servidor de base de datos.

---

## Instalación

Desde la carpeta `cobros-al-dia/`:

```bash
npm run install:all
```

Esto instala las dependencias de la raíz, del servidor (`/server`) y del cliente (`/client`).

> Si prefieres hacerlo a mano:
> ```bash
> npm install
> npm --prefix server install
> npm --prefix client install
> ```

---

## Ejecución

```bash
npm run dev
```

- **API (backend):** http://localhost:3001
- **App (frontend):** http://localhost:5173 ← **abre esta en el navegador**

La **primera vez** que arranca, el servidor detecta que la base de datos está vacía y **carga automáticamente los datos demo** (seed). No tienes que hacer nada más para ver la app llena de ejemplos.

### Comandos útiles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Arranca servidor y cliente a la vez (desarrollo). |
| `npm run dev:server` | Solo el backend. |
| `npm run dev:client` | Solo el frontend. |
| `npm run seed` | **Reinicia** la base de datos y vuelve a cargar los datos demo. |
| `npm run build` | Compila el frontend para producción. |
| `npm start` | Arranca solo el servidor (sirve el frontend compilado si existe). |

> Para volver a empezar de cero en cualquier momento: `npm run seed`.

---

## Cómo se usa

### Registrar una factura (en menos de 30 segundos)

Pulsa **«+ Nueva factura»** (arriba a la derecha). Eliges el cliente (o creas uno nuevo ahí mismo con el botón **«+ Nuevo»**), escribes concepto e importe, y confirmas las fechas (emisión y vencimiento vienen prerrellenadas). Guardas y ya aparece en el panel y en la lista.

### Registrar un pago (total o parcial)

Abre la factura → **«Registrar pago»**. Indica importe, fecha y método (transferencia, Bizum, efectivo, tarjeta u otro). Puedes usar el botón **«Pago completo»** para rellenar el pendiente exacto. Al guardar:

- se recalcula el importe pagado y el pendiente,
- el **estado se actualiza solo**,
- queda registrado en el historial de la factura.

Puedes registrar **varios pagos parciales** sobre la misma factura.

### Preparar y enviar un recordatorio

Abre la factura → **«Preparar recordatorio»**. La app:

1. Sugiere el **tono** adecuado según los días de retraso (puedes cambiarlo).
2. Te deja elegir **canal**: email o WhatsApp.
3. Genera el **mensaje** a partir de la plantilla, ya con los datos rellenados.
4. Puedes **editar** el texto antes de enviar.
5. Al pulsar **«Marcar como enviado»**, se registra en el historial.

> 🔔 **El envío es 100% simulado.** La app no se conecta a Gmail, Outlook, WhatsApp ni a ningún servicio externo. Marca el recordatorio como enviado y lo registra para que tú lleves el control; el envío real lo haces tú desde tu correo o WhatsApp (de momento).

---

## Cómo funcionan los estados

El estado de cada factura se calcula automáticamente:

| Estado | Cuándo |
|---|---|
| **Pendiente** | No está pagada y aún **no** ha llegado su vencimiento. |
| **Vencida** | No está pagada y su fecha de vencimiento **ya pasó**. |
| **Parcial** | Hay algún pago, pero **queda importe** por cobrar. |
| **Pagada** | El importe pendiente es **0 o menos**. |

Cálculo: `importe_pendiente = importe_total − suma de pagos`.

### Recordatorio sugerido (escalado de tono)

Según los **días de retraso** desde el vencimiento:

| Días de retraso | Tono sugerido |
|---|---|
| Aún no vence | *Aún no toca* |
| 0 – 6 días | **Amistoso** |
| 7 – 20 días | **Firme** |
| 21 días o más | **Serio** |

### «Acción hoy»

En el panel aparecen las facturas que requieren seguimiento hoy:

- facturas **vencidas** a las que aún **no** has mandado un recordatorio del nivel que toca, o
- facturas **próximas a vencer** (en 3 días o menos) sin pagar.

---

## Cómo funcionan las plantillas

Hay **18 plantillas** = **3 tipos de cliente** × **3 tonos** × **2 canales**.

- **Tipos de cliente:** Habitual (más cercano), Nuevo (neutro y profesional), Moroso (más directo, sin perder la educación).
- **Tonos:** Amistoso, Firme, Serio.
- **Canales:** Email (con asunto) y WhatsApp.

Se editan en la pantalla **«Plantillas»**: eliges la combinación, cambias el asunto y el cuerpo, y ves la **vista previa** con datos de ejemplo. Los cambios se guardan y se usan en los próximos recordatorios.

### Variables disponibles

Puedes usar estas variables en cualquier plantilla (se sustituyen al generar el mensaje):

```
{{cliente_nombre}}      {{factura_concepto}}     {{importe_pendiente}}
{{fecha_vencimiento}}   {{dias_retraso}}         {{nombre_negocio}}
```

> El nombre de tu negocio se define en `server/src/logic.js` (`NOMBRE_NEGOCIO`).

---

## Qué incluye el seed (datos demo)

Al arrancar por primera vez (o tras `npm run seed`) se cargan:

- **8 clientes** de los 3 tipos: Clínica Alba Reus (habitual), Academia Delta (nuevo), Fitness Laura (habitual), Taller Montseny (moroso), Estética Marina (nuevo), Reformas Vidal (moroso), Consultoría Norte (habitual), Restaurante Brisa (nuevo).
- **15 facturas** en estados variados: 4 vencidas (a pocos días, a más de 7 y a más de 21), 3 parciales, 3 pagadas, 3 pendientes no vencidas y 2 próximas a vencer. Importes entre 90 € y 2.400 €.
- **Pagos parciales** en las facturas parciales y pagos completos en las pagadas.
- **Recordatorios ya marcados como enviados** en algunas facturas, para que el escalado de tono se vea desde el primer momento.
- Las **18 plantillas** iniciales con copy real en español.

> Las fechas del seed son **relativas al día en que lo ejecutas**, así que los estados (vencida, próxima, etc.) siempre son coherentes.

---

## Arquitectura

```
cobros-al-dia/
├── package.json          ← scripts del monorepo (install:all, dev, seed…)
├── README.md
├── client/               ← Frontend: React 18 + Vite + Tailwind CSS
│   ├── index.html
│   └── src/
│       ├── main.jsx, App.jsx
│       ├── lib/          ← api.js (cliente HTTP) y format.js (formatos)
│       ├── components/   ← ui.jsx, FacturaForm.jsx
│       └── pages/        ← Dashboard, Facturas, FacturaDetalle, Plantillas
└── server/               ← Backend: Node.js + Express + SQLite (better-sqlite3)
    └── src/
        ├── index.js              ← app Express + rutas REST + auto-seed
        ├── db.js                 ← conexión y esquema SQLite
        ├── logic.js              ← fechas, estados, tono sugerido, render de plantillas
        ├── store.js              ← acceso a datos y reglas de negocio
        ├── seed.js               ← datos demo
        ├── plantillas.seed.js    ← las 18 plantillas con copy real
        └── services/
            └── envio.mock.js     ← envío SIMULADO (interfaz lista para un proveedor real)
```

### Modelo de datos

`Cliente`, `Factura`, `Pago`, `Recordatorio`, `PlantillaMensaje` y `EventoTimeline` (historial). El modelo de `Factura` es compatible con un módulo de facturación recurrente (misma entidad).

### API REST

```
GET  /api/dashboard

GET  /api/clientes              POST /api/clientes
GET  /api/clientes/:id          PUT  /api/clientes/:id

GET  /api/facturas              POST /api/facturas
GET  /api/facturas/:id          PUT  /api/facturas/:id
GET  /api/facturas/:id/timeline

GET  /api/facturas/:id/pagos    POST /api/facturas/:id/pagos

GET  /api/facturas/:id/recordatorios
POST /api/facturas/:id/recordatorios/previsualizar
POST /api/facturas/:id/recordatorios/marcar-enviado

GET  /api/plantillas            PUT  /api/plantillas/:id
```

Filtros de `GET /api/facturas` (query string): `q`, `estado`, `cliente_id`, `tipo_cliente`, `filtro` (`vencidas`, `proximas`, `parciales`, `pagadas`, `accion_hoy`).

### Conectar un proveedor de envío real (fase de pulido)

Todo el envío pasa por `server/src/services/envio.mock.js`, que expone una única función `enviar({ canal, destinatario, asunto, contenido })`. Para enviar de verdad, sustituye esa implementación por una que llame a tu proveedor (por ejemplo Resend/SendGrid para email o la API de WhatsApp Cloud/Twilio para WhatsApp). El resto de la app no necesita cambios.

---

## Qué queda fuera del MVP

Sin envío real (email/WhatsApp/SMS), sin conciliación bancaria, sin pasarelas de pago, sin facturación legal, sin PDF, sin IVA/IRPF, sin multiempresa, sin roles de usuario ni automatizaciones reales. Un solo usuario local, sin autenticación.

---

## Nota

Esta app **no genera facturas legales ni sustituye asesoramiento contable o fiscal**. Es una herramienta de organización y seguimiento de cobros.
