const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const DB_DIR = path.join(__dirname, '..', 'db');
const DB_PATH = path.join(DB_DIR, 'cobros.sqlite');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT,
      telefono TEXT,
      tipo_cliente TEXT NOT NULL DEFAULT 'nuevo' CHECK (tipo_cliente IN ('habitual','nuevo','moroso')),
      notas TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS facturas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
      concepto TEXT NOT NULL,
      importe_total REAL NOT NULL,
      importe_pagado REAL NOT NULL DEFAULT 0,
      importe_pendiente REAL NOT NULL DEFAULT 0,
      fecha_emision TEXT NOT NULL,
      fecha_vencimiento TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','parcial','pagada','vencida')),
      notas TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pagos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factura_id INTEGER NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
      importe REAL NOT NULL,
      fecha_pago TEXT NOT NULL,
      metodo_pago TEXT NOT NULL DEFAULT 'transferencia',
      nota TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plantillas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo_cliente TEXT NOT NULL CHECK (tipo_cliente IN ('habitual','nuevo','moroso')),
      nivel TEXT NOT NULL CHECK (nivel IN ('amistoso','firme','serio')),
      canal TEXT NOT NULL CHECK (canal IN ('email','whatsapp')),
      asunto TEXT,
      cuerpo TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (tipo_cliente, nivel, canal)
    );

    CREATE TABLE IF NOT EXISTS recordatorios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factura_id INTEGER NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
      plantilla_id INTEGER REFERENCES plantillas(id),
      nivel TEXT NOT NULL CHECK (nivel IN ('amistoso','firme','serio')),
      canal TEXT NOT NULL CHECK (canal IN ('email','whatsapp')),
      asunto TEXT,
      contenido TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'previsualizado' CHECK (estado IN ('pendiente','previsualizado','marcado_como_enviado')),
      fecha_sugerida TEXT,
      fecha_marcado_enviado TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS eventos_timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factura_id INTEGER NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL,
      titulo TEXT NOT NULL,
      descripcion TEXT,
      fecha TEXT NOT NULL DEFAULT (datetime('now')),
      metadata_json TEXT
    );
  `);
}

module.exports = { db, init, DB_PATH };
