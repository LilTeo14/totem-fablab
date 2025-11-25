"use client";

import { useEffect, useState } from "react";

export default function StatusBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const checkIsOpen = () => {
      const now = new Date();
      const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const hour = now.getHours();
      const minute = now.getMinutes();
      const time = hour * 60 + minute;

      // Schedule: Monday (1) to Friday (5)
      // 11:05 (665 mins) - 13:40 (820 mins)
      // 14:40 (880 mins) - 17:00 (1020 mins)

      if (day >= 1 && day <= 5) {
        const morningOpen = time >= 665 && time < 820;
        const afternoonOpen = time >= 880 && time < 1020;
        return morningOpen || afternoonOpen;
      }
      return false;
    };

    // Check immediately
    setOpen(checkIsOpen());

    // Check every minute
    const interval = setInterval(() => {
      setOpen(checkIsOpen());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={"statusBanner " + (open ? "open" : "closed")} role="status" aria-live="polite">
      <div className="statusContent">
        <div className="statusMain">
          <strong style={{ fontSize: 20 }}>{open ? "ABIERTO" : "CERRADO"}</strong>
          <div style={{ fontSize: 12, marginTop: 4 }}>{open ? "Bienvenido a FABLAB, elige alguna de las opciones de abajo e ingresa al laboratorio" : "El edificio está cerrado"}</div>
        </div>

        <div className="statusSchedule" style={{ marginTop: 6 }}>
          Horarios: Lunes a viernes, 11:05 - 13:40; 14:40 - 17:00
        </div>
      </div>
    </div>
  );
}
