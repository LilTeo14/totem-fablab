const express = require("express");
const cors = require("cors");
const logger = require("./utils/logger");
const fs = require("fs");
const path = require("path");
const STATUS_FILE = path.join(__dirname, "status.json");
const {
  registerManualAccess,
  registerQrAccess,
  getRecentAccesses,
  updateAccessArea,
  onAccessSaved,
} = require("./services/accessService");
const { startQrScannerService } = require("./services/qrScannerService");

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hola desde el backend" });
});

app.post("/api/access/manual", async (req, res) => {
  try {
    const record = await registerManualAccess(req.body || {});
    res.json({ success: true, data: record });
  } catch (err) {
    const status = err.message.includes("RUT") ? 400 : 500;
    logger.error("Error en registro manual", { error: err.message });
    res.status(status).json({ success: false, error: err.message });
  }
});

app.post("/api/qr-scan", async (req, res) => {
  const { codigo_qr, code } = req.body || {};
  const payload = codigo_qr || code;
  if (!payload) {
    return res.status(400).json({ success: false, error: "El código QR es obligatorio" });
  }

  try {
    const record = await registerQrAccess({ code: payload });
    res.json({ success: true, data: record });
  } catch (err) {
    const status = err.message.includes("no reconocido") ? 404 : 500;
    logger.error("Error al procesar código QR", { error: err.message });
    res.status(status).json({ success: false, error: err.message });
  }
});

app.get("/api/access/latest", async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const rows = await getRecentAccesses(limit);
    res.json(rows);
  } catch (err) {
    logger.error("Error obteniendo accesos recientes", { error: err.message });
    res.status(500).json({ success: false, error: "No se pudieron obtener los accesos" });
  }
});

app.get("/api/access/events", (req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  res.write("retry: 4000\n\n");

  const unsubscribe = onAccessSaved((record) => {
    res.write(`data: ${JSON.stringify(record)}\n\n`);
  });

  req.on("close", () => {
    unsubscribe();
    res.end();
  });
});

app.patch("/api/access/:id/area", async (req, res) => {
  const { id } = req.params;
  const { area } = req.body;

  if (!area) {
    return res.status(400).json({ success: false, error: "El área es obligatoria" });
  }

  try {
    const record = await updateAccessArea(id, area);
    res.json({ success: true, data: record });
  } catch (err) {
    const status = err.message.includes("no válida") || err.message.includes("no encontrado") ? 400 : 500;
    logger.error("Error al actualizar área", { error: err.message, id, area });
    res.status(status).json({ success: false, error: err.message });
  }
});

app.post("/saveData", async (req, res) => {
  try {
    await registerManualAccess(req.body || {});
    res.status(200).send("Registro guardado correctamente");
  } catch (err) {
    logger.error("Error al guardar registro desde /saveData", { error: err.message });
    const status = err.message.includes("RUT") ? 400 : 500;
    res.status(status).send("Error interno del servidor");
  }
});

// --- STATUS API ---

function getAutoStatus() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const hour = now.getHours();
  const minute = now.getMinutes();
  const time = hour * 60 + minute;

  // Schedule: Monday (1) to Friday (5)
  // 11:05 (665 mins) - 13:40 (820 mins)
  // 14:40 (880 mins) - 17:00 (1020 mins)

  logger.info(`AutoStatus Check: Day=${day}, Time=${hour}:${minute} (${time} mins)`);

  if (day >= 1 && day <= 5) {
    const morningOpen = time >= 665 && time < 820;
    const afternoonOpen = time >= 880 && time < 1020;
    logger.info(`Morning: ${morningOpen}, Afternoon: ${afternoonOpen}`);
    return morningOpen || afternoonOpen;
  }
  return false;
}

function readStatusMode() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      const data = fs.readFileSync(STATUS_FILE, "utf8");
      return JSON.parse(data).mode || "AUTO";
    }
  } catch (err) {
    logger.error("Error leyendo status.json", { error: err.message });
  }
  return "AUTO";
}

app.get("/api/status", (req, res) => {
  const mode = readStatusMode();
  let isOpen = false;

  if (mode === "OPEN") isOpen = true;
  else if (mode === "CLOSED") isOpen = false;
  else isOpen = getAutoStatus();

  res.json({ isOpen, mode });
});

app.post("/api/status", (req, res) => {
  const { mode } = req.body;
  if (!["AUTO", "OPEN", "CLOSED"].includes(mode)) {
    return res.status(400).json({ success: false, error: "Modo inválido. Use AUTO, OPEN o CLOSED" });
  }

  try {
    fs.writeFileSync(STATUS_FILE, JSON.stringify({ mode }, null, 2));
    logger.info(`Modo de estado actualizado a: ${mode}`);
    res.json({ success: true, mode });
  } catch (err) {
    logger.error("Error escribiendo status.json", { error: err.message });
    res.status(500).json({ success: false, error: "Error guardando estado" });
  }
});

app.listen(PORT, () => {
  logger.info(`Servidor backend escuchando en puerto ${PORT}`);
  startQrScannerService();
});

