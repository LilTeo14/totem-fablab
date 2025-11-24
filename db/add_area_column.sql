-- Agregar columna area a la tabla visita
ALTER TABLE "visita" ADD COLUMN IF NOT EXISTS "area" VARCHAR(50);
