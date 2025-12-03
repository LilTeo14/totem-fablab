const net = require('net');
const logger = require('../utils/logger');

const HOST = '127.0.0.1';
const PORT = 65432;

function sendCommand(command) {
    const client = new net.Socket();

    client.connect(PORT, HOST, () => {
        logger.info(`Enviando comando LED: ${command}`);
        client.write(command);
    });

    client.on('error', (err) => {
        logger.error('Error conectando al controlador LED', { error: err.message });
    });

    client.on('close', () => {
        // logger.info('Conexión LED cerrada');
    });
}

function flashBlue() {
    sendCommand('FLASH');
}

module.exports = {
    flashBlue,
};
