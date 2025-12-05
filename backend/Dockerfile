FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Instalar wait-port globalmente
RUN npm install -g wait-port

# Instalar Python y dependencias para NeoPixel y tzdata para zona horaria
RUN apk add --no-cache python3 py3-pip gcc musl-dev linux-headers python3-dev tzdata
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"
RUN pip install --no-cache-dir rpi_ws281x adafruit-circuitpython-neopixel adafruit-blinka RPi.GPIO

# Comando modificado para esperar a PostgreSQL, iniciar el controlador LED y luego el backend
CMD ["sh", "-c", "wait-port postgres_db:5432 && python3 led_controller.py & npm start"]