const HID = require('node-hid');

console.log("Buscando dispositivos HID conectados...");
const devices = HID.devices();

console.log("\nDispositivos encontrados:");
console.log("-------------------------");
devices.forEach((device) => {
    if (device.product) {
        console.log(`Producto: ${device.product}`);
        console.log(`Fabricante: ${device.manufacturer || 'Desconocido'}`);
        console.log(`VID: ${device.vendorId} (0x${device.vendorId.toString(16)})`);
        console.log(`PID: ${device.productId} (0x${device.productId.toString(16)})`);
        console.log(`Path: ${device.path}`);
        console.log("-------------------------");
    }
});

console.log("\nPor favor, identifica cuál de estos es tu lector de tarjetas y copia su VID y PID.");
