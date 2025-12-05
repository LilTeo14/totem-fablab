"use client";

import { useEffect, useState } from "react";

export default function StatusBanner() {
  const [open, setOpen] = useState(false);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/status`, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setOpen(data.isOpen);
        }
      } catch (err) {
        console.error("Error fetching status:", err);
      }
    };

    // Check immediately
    fetchStatus();

    // Check every minute
    const interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, [BACKEND_URL]);

  return (
    <div className={"statusBanner " + (open ? "open" : "closed")} role="status" aria-live="polite">
      <div className="statusContent">
        <div className="statusMain">
          <strong style={{ fontSize: 26 }}>{open ? "ABIERTO" : "CERRADO"}</strong>
          <div style={{ fontSize: 16, marginTop: 4 }}>{open ? "Bienvenido a FABLAB, elige alguna de las opciones de abajo e ingresa al laboratorio" : "El edificio está cerrado"}</div>
        </div>

        <div className="statusSchedule" style={{ marginTop: 6 }}>
          Horarios: Lunes a viernes, 11:05 - 13:40; 14:40 - 17:00
        </div>
      </div>
    </div>
  );
}
