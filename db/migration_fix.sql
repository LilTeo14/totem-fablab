-- Script para actualizar la base de datos existente
ALTER TABLE "visita" ADD COLUMN IF NOT EXISTS "source" varchar(32) DEFAULT 'manual';
ALTER TABLE "visita" ADD COLUMN IF NOT EXISTS "raw_code" text;

CREATE TABLE IF NOT EXISTS "qr_badge" (
    "codigo" varchar(128) PRIMARY KEY,
    "rut" INTEGER NOT NULL,
    "motivo_default" varchar(100) DEFAULT 'qr-scan',
    "descripcion" varchar(120)
);
