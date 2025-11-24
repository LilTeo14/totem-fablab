"use client";

import { useEffect, useState } from "react";
import StatusToggle from "./StatusToggle";

export default function StatusBanner() {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("buildingOpen") : null;
    setOpen(saved === null ? true : saved === "true");

    const handler = (e) => {
      setOpen(Boolean(e?.detail));
    };

    window.addEventListener("building-status-changed", handler);
    return () => window.removeEventListener("building-status-changed", handler);
  }, []);

  return (
    <div className={"statusBanner " + (open ? "open" : "closed")} role="status" aria-live="polite">
      <div className="statusContent">
        <div className="statusMain">
          <strong style={{ fontSize: 20 }}>{open ? "ABIERTO" : "CERRADO"}</strong>
          <div style={{ fontSize: 12, marginTop: 4 }}>{open ? "Bienvenido a FABLAB, elige alguna de las opciones de abajo e ingresa al laboratorio" : "El edificio está cerrado"}</div>
        </div>

        <div className="statusControls">
          <StatusToggle />
        </div>

        <div className="statusSchedule" style={{ marginTop: 6 }}>
          Horarios: Lunes a viernes, 11:05 - 13:40; 14:40 - 17:00
        </div>
      </div>
    </div>
  );
}
