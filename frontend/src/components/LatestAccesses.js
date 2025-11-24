"use client";

import { useEffect, useMemo, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

function formatTime(timestamp) {
  try {
    return new Intl.DateTimeFormat("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(timestamp));
  } catch (err) {
    return timestamp;
  }
}

export default function LatestAccesses({ limit = 10 }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("Conectando al lector...");

  useEffect(() => {
    let cancelled = false;
    async function fetchInitial() {
      setStatus("Cargando accesos recientes...");
      try {
        const response = await fetch(`${BACKEND_URL}/api/access/latest?limit=${limit}`);
        const data = await response.json();
        if (!cancelled) {
          setItems(Array.isArray(data) ? data : []);
          setStatus("Actualizado");
        }
      } catch (err) {
        console.error("No se pudieron obtener los accesos", err);
        if (!cancelled) {
          setStatus("Sin conexión al backend");
        }
      }
    }

    fetchInitial();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  useEffect(() => {
    const endpoint = `${BACKEND_URL}/api/access/events`;
    const source = new EventSource(endpoint);

    source.onopen = () => setStatus("Escuchando nuevos accesos");
    source.onerror = () => {
      setStatus("Intentando reconectar al backend...");
    };

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setItems((prev) => {
          const next = [data, ...prev];
          return next.slice(0, limit);
        });
      } catch (err) {
        console.error("Evento SSE inválido", err);
      }
    };

    return () => {
      source.close();
    };
  }, [limit]);

  const rows = useMemo(() => items.map((item) => ({
    id: item.id,
    rut: item.rut,
    motivo: item.motivo,
    source: item.source,
    raw: item.raw_code,
    area: item.area,
    time: item.fecha_creacion,
  })), [items]);

  return (
    <section className="latestAccesses" aria-live="polite">
      <div className="latestAccessesHeader">
        <div>
          <h2>Últimos accesos registrados</h2>
          <p className="latestAccessesStatus">{status}</p>
        </div>
      </div>

      <ul className="latestAccessesList">
        {rows.length === 0 && (
          <li className="latestAccessesEmpty">No hay registros recientes.</li>
        )}
        {rows.map((row) => (
          <li key={row.id} className="latestAccessesItem">
            <div className="latestAccessesPrimary">
              <span className="latestAccessesRut">RUT {row.rut}</span>
              <span className="latestAccessesMotivo">{row.motivo}</span>
            </div>
            <div className="latestAccessesMeta">
              <span className="latestAccessesSource">{row.source}</span>
              <time dateTime={row.time}>{formatTime(row.time)}</time>
            </div>
            {row.raw && (
              <div className="latestAccessesRaw">QR: {row.raw}</div>
            )}
            {row.area && (
              <div className="latestAccessesRaw">Área: {row.area}</div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
