const client = require("../db/client");
const logger = require("../utils/logger");

const accessListeners = new Set();

function notify(record) {
  accessListeners.forEach((listener) => {
    try {
      listener(record);
    } catch (err) {
      logger.warn("Listener error while broadcasting access event", { error: err.message });
    }
  });
}

function onAccessSaved(listener) {
  accessListeners.add(listener);
  return () => accessListeners.delete(listener);
}

function normalizeRut(raw) {
  if (raw === undefined || raw === null) {
    return null;
  }

  if (typeof raw === "number") {
    return raw;
  }

  const digits = String(raw).replace(/[^0-9]/g, "");
  return digits ? Number(digits) : null;
}

function calculateDV(rutBody) {
  let sum = 0;
  let multiplier = 2;

  // Iterate backwards over the digits
  for (let i = String(rutBody).length - 1; i >= 0; i--) {
    sum += parseInt(String(rutBody).charAt(i)) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);

  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return String(remainder);
}

async function registerAccess({ rut, motivo, source, rawCode, area }) {
  const normalizedRut = normalizeRut(rut);
  if (!normalizedRut) {
    throw new Error("El RUT es obligatorio para registrar el acceso");
  }

  const safeSource = source || "manual";
  const safeMotivo = motivo && motivo.trim()
    ? motivo.trim()
    : safeSource === "manual"
      ? "manual-entry"
      : "qr-scan";

  const query = 'INSERT INTO "visita" (rut, motivo, source, raw_code, area) VALUES ($1, $2, $3, $4, $5) RETURNING *';
  const values = [normalizedRut, safeMotivo, safeSource, rawCode || null, area || null];
  const { rows } = await client.query(query, values);
  const record = rows[0];
  notify(record);
  logger.info("Acceso registrado", { rut: normalizedRut, source: safeSource, area });
  return record;
}

async function updateAccessArea(id, area) {
  if (!id) {
    throw new Error("El ID del acceso es obligatorio");
  }

  const validAreas = [
    "Cortadora laser",
    "CNC",
    "Mecanica",
    "Electronica",
    "Impresion 3d",
    "Costura",
    "Otro"
  ];

  if (!area || !validAreas.includes(area)) {
    throw new Error("Área no válida");
  }

  const query = 'UPDATE "visita" SET area = $1 WHERE id = $2 RETURNING *';
  const values = [area, id];
  const { rows } = await client.query(query, values);

  if (rows.length === 0) {
    throw new Error("Acceso no encontrado");
  }

  const record = rows[0];
  notify(record);
  logger.info("Área actualizada", { id, area });
  return record;
}

async function registerManualAccess({ rut, motivo }) {
  return registerAccess({ rut, motivo, source: "manual" });
}

async function resolveQrCode(code) {
  const trimmed = (code || "").trim();
  if (!trimmed) {
    return null;
  }

  const lookupQuery = 'SELECT rut, motivo_default FROM "qr_badge" WHERE codigo = $1';
  const { rows } = await client.query(lookupQuery, [trimmed]);
  if (rows.length) {
    const row = rows[0];
    return {
      rut: row.rut,
      motivo: row.motivo_default || "qr-scan",
    };
  }

  const numericRut = normalizeRut(trimmed);
  const digitsOnly = trimmed.replace(/\D/g, '');

  // Check for 18-digit student credential code
  // Example: 870041246420885246 -> RUT 20885246
  if (digitsOnly.length === 18) {
    const rutBody = digitsOnly.slice(-8);
    const dv = calculateDV(rutBody);

    let rutWithDv = rutBody + dv;

    return { rut: rutWithDv, motivo: "qr-scan" };
  }

  if (numericRut) {
    return { rut: numericRut, motivo: "qr-scan" };
  }

  return null;
}

async function registerQrAccess({ code }) {
  const resolved = await resolveQrCode(code);
  if (!resolved) {
    throw new Error("Código QR no reconocido");
  }

  return registerAccess({ ...resolved, source: "qr-reader", rawCode: code });
}

async function getRecentAccesses(limit = 10) {
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 100) : 10;
  const query = 'SELECT id, rut, motivo, source, raw_code, area, fecha_creacion FROM "visita" ORDER BY fecha_creacion DESC LIMIT $1';
  const { rows } = await client.query(query, [safeLimit]);
  return rows;
}

module.exports = {
  registerManualAccess,
  registerQrAccess,
  getRecentAccesses,
  updateAccessArea,
  onAccessSaved,
};
