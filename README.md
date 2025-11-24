# Totem FabLab – Integración de lector QR

Este repositorio contiene un backend Express (Node.js), un frontend Next.js y una base de datos PostgreSQL usados para el tótem del FabLab. La Raspberry Pi aloja el backend y se conecta por USB a un lector QR tipo HID (emula teclado); la tablet Android solo muestra el frontend.

## Arquitectura rápida

- **Backend (`backend/`)**: API Express que registra accesos en la tabla `visita`, expone endpoints REST/SSE y levanta un servicio que lee `/dev/input/eventX` directamente.
- **Frontend (`frontend/`)**: App Next.js con vistas de ingreso y un widget en tiempo real para mostrar los últimos accesos.
- **Base de datos (`db/`)**: Scripts para `visita` y `qr_badge`, tabla auxiliar que asocia códigos QR con RUT/motivo por defecto.

## Variables de entorno clave

| Servicio | Variable | Descripción |
| --- | --- | --- |
| Backend | `PORT` | Puerto del servidor Express (default `8000`). |
| Backend | `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Credenciales PostgreSQL. |
| Backend | `QR_SCANNER_DEVICE` | Ruta del dispositivo HID (default `/dev/input/event0`). |
| Backend | `QR_SCANNER_ENABLED` | Coloca `false` para desactivar el servicio (útil en desarrollo sobre Windows/macOS). |
| Frontend | `NEXT_PUBLIC_BACKEND_URL` | URL base del backend para fetch/SSE (default `http://localhost:8000`). |

## Puesta en marcha local

1. **Base de datos**: aplica `db/data.sql` (o crea una migración equivalente) para asegurar las tablas `visita` y `qr_badge`.
2. **Backend**:

```bash
cd backend
npm install
npm run dev
```

3. **Frontend**:

```bash
cd frontend
npm install
npm run dev
```

En Raspberry Pi, ejecuta el backend con permisos suficientes para leer `/dev/input/eventX` (usualmente agregando el usuario al grupo `input` o mediante `udev` rules).

## Servicio del lector QR

- Vive en `backend/services/qrScannerService.js` y se inicializa automáticamente cuando arranca el backend.
- Lee eventos `EV_KEY` desde el dispositivo HID, arma la cadena hasta recibir `Enter` y llama a la misma lógica de registro (`registerQrAccess`).
- Si el dispositivo no está disponible o la plataforma no es Linux, se registran advertencias y el servicio reintenta cada 3 segundos.
- Los códigos QR se resuelven contra la tabla `qr_badge`; si no hay coincidencia, se intenta interpretar el valor como RUT numérico.

## Endpoints nuevos

- `POST /api/access/manual` – reemplazo JSON de `/saveData` (que se mantiene para compatibilidad).
- `POST /api/qr-scan` – recibe `{ "code": "..." }` o `{ "codigo_qr": "..." }`.
- `GET /api/access/latest?limit=10` – últimos registros.
- `GET /api/access/events` – Server-Sent Events para actualizaciones en vivo.

## Frontend

La vista `src/app/ingresos/page.js` ahora incluye el componente `LatestAccesses`, que consulta el backend y escucha el stream SSE para refrescar la tarjeta de “Últimos accesos”.

## Pruebas rápidas

No se incluyeron pruebas automáticas aún. Para validar rápidamente sin el hardware físico:

1. Inserta registros manuales vía `POST /api/access/manual` usando herramientas como `curl` o Thunder Client.
2. Observa que el componente de ingresos muestra las nuevas filas y que el endpoint SSE hace streaming.
3. En la Raspberry Pi, escanea un QR configurado en `qr_badge` y verifica que aparece en la lista.

## Próximos pasos sugeridos

- Añadir un panel de administración para gestionar la tabla `qr_badge`.
- Automatizar migraciones con herramientas como `node-pg-migrate` o `Prisma`.
- Añadir pruebas end-to-end que simulen eventos SSE y validen el flujo completo.
