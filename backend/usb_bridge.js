const HID = require('node-hid');
const axios = require('axios');

// Configuración por defecto (se puede sobreescribir con argumentos)
const ARGS = process.argv.slice(2).reduce((acc, arg) => {
    const [key, value] = arg.split('=');
    if (key.startsWith('--')) acc[key.slice(2)] = value;
    return acc;
}, {});

const VID = parseInt(ARGS.vid) || 0; // Reemplazar con el VID real si no se pasa por argumento
const PID = parseInt(ARGS.pid) || 0; // Reemplazar con el PID real si no se pasa por argumento
const BACKEND_URL = ARGS.url || 'http://localhost:8000';

if (!VID || !PID) {
    console.error("Error: Debes especificar VID y PID.");
    console.error("Uso: node usb_bridge.js --vid=1234 --pid=5678");
    console.error("Ejecuta 'node list_devices.js' para ver los dispositivos conectados.");
    process.exit(1);
}

console.log(`Buscando dispositivo VID: ${VID}, PID: ${PID}...`);

let device;
try {
    device = new HID.HID(VID, PID);
    console.log("Dispositivo conectado exitosamente.");
} catch (e) {
    console.error("No se pudo conectar al dispositivo:", e.message);
    process.exit(1);
}

let buffer = "";
let shift = false;

// Mapa básico de códigos HID a caracteres (ajustar según necesidad)
const KEYMAP = {
    4: 'a', 5: 'b', 6: 'c', 7: 'd', 8: 'e', 9: 'f', 10: 'g', 11: 'h', 12: 'i', 13: 'j',
    14: 'k', 15: 'l', 16: 'm', 17: 'n', 18: 'o', 19: 'p', 20: 'q', 21: 'r', 22: 's', 23: 't',
    24: 'u', 25: 'v', 26: 'w', 27: 'x', 28: 'y', 29: 'z',
    30: '1', 31: '2', 32: '3', 33: '4', 34: '5', 35: '6', 36: '7', 37: '8', 38: '9', 39: '0',
    40: '\n', // Enter
    44: ' ', // Space
    45: '-', 46: '=', 47: '[', 48: ']', 56: '/', 57: '*', 58: '-', 59: '+'
};

const SHIFT_MAP = {
    30: '!', 31: '@', 32: '#', 33: '$', 34: '%', 35: '^', 36: '&', 37: '*', 38: '(', 39: ')'
};

device.on("data", (data) => {
    // data es un Buffer. El formato depende del dispositivo, usualmente:
    // byte 0: modificadores (Shift, Ctrl, etc.)
    // byte 2: código de tecla

    const modifiers = data[0];
    const key = data[2];

    if (key === 0) return; // Sin tecla presionada

    // Detectar Shift (izquierdo o derecho)
    const isShift = (modifiers & 0x02) || (modifiers & 0x20);

    // Enter (40) -> Enviar código
    if (key === 40) {
        if (buffer.length > 0) {
            sendCode(buffer);
            buffer = "";
        }
        return;
    }

    let char = KEYMAP[key];

    if (isShift && SHIFT_MAP[key]) {
        char = SHIFT_MAP[key];
    } else if (isShift && char && char.match(/[a-z]/)) {
        char = char.toUpperCase();
    }

    if (char) {
        buffer += char;
    }
});

device.on("error", (err) => {
    console.error("Error en dispositivo:", err);
});

async function sendCode(code) {
    console.log(`Código leído: ${code}`);
    try {
        await axios.post(`${BACKEND_URL}/api/qr-scan`, { code });
        console.log("Enviado al backend correctamente.");
    } catch (err) {
        console.error("Error enviando al backend:", err.message);
    }
}

console.log("Esperando lectura de tarjeta...");
