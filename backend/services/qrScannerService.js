const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");
const { registerQrAccess } = require("./accessService");
const {
  BASE_MAP,
  SHIFT_MAP,
  KEY_ENTER,
  KEY_BACKSPACE,
  KEY_LEFT_SHIFT,
  KEY_RIGHT_SHIFT,
} = require("../utils/keyMap");

const INPUT_EVENT_SIZE = 24; // struct input_event size on 64-bit Linux
const DEFAULT_DEVICE_PATH = process.env.QR_SCANNER_DEVICE || "/dev/input/event0";
const ENABLED = process.env.QR_SCANNER_ENABLED !== "false";

class QrScannerService {
  constructor(devicePath) {
    this.devicePath = devicePath;
    this.stream = null;
    this.pending = Buffer.alloc(0);
    this.buffer = "";
    this.shiftPressed = false;
    this.reconnectTimer = null;
  }

  start() {
    if (!ENABLED) {
      logger.info("Servicio de lector QR deshabilitado por configuración");
      return;
    }

    if (process.platform !== "linux") {
      logger.warn("Servicio de lector QR solo se ejecuta en Linux", { platform: process.platform });
      return;
    }

    if (!fs.existsSync(this.devicePath)) {
      logger.warn("No se encontró el dispositivo del lector QR", { device: this.devicePath });
      return;
    }

    this.openStream();
  }

  stop() {
    if (this.stream) {
      this.stream.removeAllListeners();
      this.stream.destroy();
      this.stream = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  openStream() {
    try {
      const fd = fs.openSync(this.devicePath, "r");
      this.stream = fs.createReadStream(null, { fd, autoClose: true });
      this.stream.on("data", (chunk) => this.handleChunk(chunk));
      this.stream.on("error", (err) => this.handleError(err));
      this.stream.on("close", () => this.scheduleReconnect("close"));
      logger.info("Servicio del lector QR escuchando", { device: this.devicePath });
    } catch (err) {
      logger.error("No se pudo abrir el lector QR", { error: err.message, device: this.devicePath });
      this.scheduleReconnect("open-error");
    }
  }

  handleChunk(chunk) {
    this.pending = Buffer.concat([this.pending, chunk]);
    while (this.pending.length >= INPUT_EVENT_SIZE) {
      const event = this.pending.subarray(0, INPUT_EVENT_SIZE);
      this.pending = this.pending.subarray(INPUT_EVENT_SIZE);
      this.processEvent(event);
    }
  }

  processEvent(eventBuffer) {
    const type = eventBuffer.readUInt16LE(16);
    const code = eventBuffer.readUInt16LE(18);
    const value = eventBuffer.readInt32LE(20);

    // We only care about key events (type 1) and key presses (value 1)
    if (type !== 1) {
      return;
    }

    if (code === KEY_LEFT_SHIFT || code === KEY_RIGHT_SHIFT) {
      this.shiftPressed = value === 1 || value === 2;
      return;
    }

    if (value !== 1) {
      return;
    }

    if (code === KEY_ENTER) {
      this.flushBuffer();
      return;
    }

    if (code === KEY_BACKSPACE) {
      this.buffer = this.buffer.slice(0, -1);
      return;
    }

    const char = this.getCharFromCode(code);
    if (char) {
      this.buffer += char;
    }
  }

  getCharFromCode(code) {
    const map = this.shiftPressed ? SHIFT_MAP : BASE_MAP;
    const char = map[code];
    if (char) {
      return this.shiftPressed && char.length === 1 ? char : char;
    }

    // default to uppercase letters for base map when shift not pressed
    const fallback = BASE_MAP[code];
    if (!fallback) {
      return null;
    }

    if (/^[a-z]$/.test(fallback)) {
      return this.shiftPressed ? fallback.toUpperCase() : fallback;
    }

    return fallback;
  }

  flushBuffer() {
    const code = this.buffer.trim();
    if (!code) {
      this.buffer = "";
      return;
    }

    logger.info("Código QR leído", { code });
    this.sendCode(code);
    this.buffer = "";
  }

  async sendCode(code) {
    try {
      await registerQrAccess({ code });
      logger.info("Código QR procesado correctamente", { code });
    } catch (err) {
      logger.error("Error al registrar acceso desde QR", { error: err.message, code });
    }
  }

  handleError(err) {
    logger.error("Error en el dispositivo del lector QR", { error: err.message });
    this.scheduleReconnect("stream-error");
  }

  scheduleReconnect(reason) {
    if (this.reconnectTimer) {
      return;
    }

    this.stop();
    logger.warn("Intentando reconectar lector QR", { reason });
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.openStream();
    }, 3000);
  }
}

function startQrScannerService() {
  const devicePath = path.resolve(DEFAULT_DEVICE_PATH);
  const service = new QrScannerService(devicePath);
  service.start();
  return service;
}

module.exports = {
  startQrScannerService,
};
