const express = require("express");
const cors = require("cors");
const logger = require("./utils/logger");
const {
  registerManualAccess,
  registerQrAccess,
  getRecentAccesses,
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

app.listen(PORT, () => {
  logger.info(`Servidor backend escuchando en puerto ${PORT}`);
  startQrScannerService();
});

