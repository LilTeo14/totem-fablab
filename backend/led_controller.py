import board
import neopixel
import time
import socket
import threading
import datetime
import json
import os

# --- CONFIGURACIÓN ---
pixel_pin = board.D18   # GPIO 18 (Pin físico 12)
num_pixels = 32         # 16 del primer anillo + 16 del segundo

# COLORES (R, G, B)
BLANCO = (255, 255, 255)
ROJO   = (255, 0, 0)
VERDE  = (0, 255, 0)
AZUL   = (0, 0, 255)
NEGRO  = (0, 0, 0)

# BRILLO
pixels = neopixel.NeoPixel(
    pixel_pin, num_pixels, brightness=0.5, auto_write=False, pixel_order=neopixel.GRB
)

# ESTADO GLOBAL
current_mode = "NORMAL" # NORMAL, FLASH
flash_end_time = 0
STATUS_FILE = "status.json"

def is_open():
    # 1. Check override mode
    try:
        if os.path.exists(STATUS_FILE):
            with open(STATUS_FILE, "r") as f:
                data = json.load(f)
                mode = data.get("mode", "AUTO")
                
                if mode == "OPEN":
                    return True
                if mode == "CLOSED":
                    return False
    except Exception as e:
        print(f"Error leyendo status.json: {e}")

    # 2. AUTO mode (Time based)
    now = datetime.datetime.now()
    day = now.weekday() # 0 = Monday, ..., 6 = Sunday
    
    # Python weekday: 0=Mon, 4=Fri
    if 0 <= day <= 4:
        current_minute = now.hour * 60 + now.minute
        
        # 11:05 (665) - 13:40 (820)
        morning_open = 665 <= current_minute < 820
        
        # 14:40 (880) - 17:00 (1020)
        afternoon_open = 880 <= current_minute < 1020
        
        return morning_open or afternoon_open
    
    return False

def led_loop():
    global current_mode
    ring_len = 16
    offset = 0
    
    last_status_check = 0
    cached_open_status = False
    
    while True:
        if current_mode == "FLASH":
            # Parpadeo Azul
            if time.time() < flash_end_time:
                pixels.fill(AZUL)
                pixels.show()
                time.sleep(0.1)
                pixels.fill(NEGRO)
                pixels.show()
                time.sleep(0.1)
                continue
            else:
                current_mode = "NORMAL"
        
        # Modo Normal: Patrón giratorio
        # Check status only once per second to avoid blocking I/O
        if time.time() - last_status_check > 1.0:
            cached_open_status = is_open()
            last_status_check = time.time()
            
        primary_color = VERDE if cached_open_status else ROJO
        secondary_color = BLANCO
        
        # Girar
        for i in range(ring_len):
            posicion_virtual = (i + offset) % ring_len
            
            if posicion_virtual < (ring_len / 2):
                color = secondary_color
            else:
                color = primary_color
            
            pixels[i] = color
            pixels[i + ring_len] = color
            
        pixels.show()
        offset = (offset + 1) % ring_len
        time.sleep(0.05)

def start_socket_server():
    global current_mode, flash_end_time
    HOST = '127.0.0.1'
    PORT = 65432
    
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((HOST, PORT))
        s.listen()
        print(f"Servidor LED escuchando en {HOST}:{PORT}")
        
        while True:
            conn, addr = s.accept()
            with conn:
                data = conn.recv(1024)
                if not data:
                    continue
                command = data.decode('utf-8').strip()
                if command == "FLASH":
                    print("Comando FLASH recibido")
                    current_mode = "FLASH"
                    flash_end_time = time.time() + 2.0 # 2 segundos de flash

if __name__ == "__main__":
    try:
        print("Iniciando controlador LED...")
        
        # Iniciar hilo del servidor socket
        server_thread = threading.Thread(target=start_socket_server, daemon=True)
        server_thread.start()
        
        led_loop()
        
    except Exception as e:
        with open("led_error.log", "w") as f:
            f.write(f"Error fatal: {str(e)}\n")
        print(f"Error fatal: {e}")
        
    except KeyboardInterrupt:
        pixels.fill(NEGRO)
        pixels.show()
        print("\nApagado.")
