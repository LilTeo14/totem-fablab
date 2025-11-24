CREATE TABLE IF NOT EXISTS
    "visita" (
        "id" serial PRIMARY KEY,
        "rut" INTEGER NOT NULL,
        "motivo" varchar(100) NOT NULL,
        "source" varchar(32) DEFAULT 'manual',
        "raw_code" text,
        "area" varchar(50),
        "fecha_creacion" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS
    "qr_badge" (
        "codigo" varchar(128) PRIMARY KEY,
        "rut" INTEGER NOT NULL,
        "motivo_default" varchar(100) DEFAULT 'qr-scan',
        "descripcion" varchar(120)
    );
