"use client";

import { useEffect, useState, useCallback } from "react";
import LatestAccesses from "../../components/LatestAccesses";
import AreaSelectionModal from "../../components/AreaSelectionModal";
import { parseStudentQR, maskRut } from "../../utils/rut";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function IngresosPage() {
  const [scannedCode, setScannedCode] = useState("");
  const [message, setMessage] = useState("");
  const [buffer, setBuffer] = useState("");
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [pendingAccessId, setPendingAccessId] = useState(null);

  const processCode = useCallback(async (code) => {
    const processedCode = parseStudentQR(code);
    setScannedCode(processedCode);
    setMessage("Procesando...");

    try {
      const response = await fetch(`${BACKEND_URL}/api/qr-scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: processedCode }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Acceso registrado: ${data.data?.nombre || "Desconocido"}`);
      } else {
        setMessage(`Error: ${data.error || "No se pudo registrar"}`);
      }
    } catch (error) {
      console.error("Error al enviar código:", error);
      setMessage("Error de conexión con el servidor");
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignorar teclas de control, excepto Enter
      if (e.key.length > 1 && e.key !== "Enter") return;

      if (e.key === "Enter") {
        if (buffer.length > 0) {
          processCode(buffer);
          setBuffer("");
        }
      } else {
        // Acumular caracteres numéricos o alfanuméricos
        setBuffer((prev) => prev + e.key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [buffer, processCode]);

  const handleAreaSelect = async (area) => {
    if (!pendingAccessId) return;

    try {
      await fetch(`${BACKEND_URL}/api/access/${pendingAccessId}/area`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ area }),
      });

      setShowAreaModal(false);
      setPendingAccessId(null);
    } catch (error) {
      console.error("Error al actualizar área:", error);
    }
  };

  // Escuchar eventos del servidor para actualizar la pantalla principal
  useEffect(() => {
    const endpoint = `${BACKEND_URL}/api/access/events`;
    const source = new EventSource(endpoint);

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Actualizar solo si viene del lector remoto
        if (data.source === "qr-reader" && (data.raw_code || data.rut)) {
          setScannedCode(data.raw_code || String(data.rut));
          setMessage(`Acceso registrado: RUT ${maskRut(data.rut)}`);

          // Mostrar modal de selección de área SOLO si no tiene área asignada aún
          if (!data.area) {
            setPendingAccessId(data.id);
            setShowAreaModal(true);
          }

          // Limpiar después de 5 segundos
          setTimeout(() => {
            setScannedCode("");
            setMessage("");
          }, 5000);
        }
      } catch (err) {
        console.error("Error procesando evento SSE", err);
      }
    };

    source.onerror = () => {
      console.warn("Conexión SSE interrumpida, reintentando...");
    };

    return () => {
      source.close();
    };
  }, []);

  return (
    <main className="container" style={{
      display: "flex",
      flexDirection: "column",
      height: "calc(100vh - 60px)",
      overflow: "hidden",
      padding: 0 // Reset padding, we'll handle it inside
    }}>
      {/* Fixed Top Section */}
      <div style={{
        flex: "0 0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        gap: 24,
        width: "100%",
        maxWidth: 600,
        margin: "0 auto",
        paddingTop: 120, // Space for fixed header
        paddingBottom: 20,
        paddingLeft: 20,
        paddingRight: 20,
        zIndex: 10,
        background: "var(--background)" // Ensure it covers content behind it if any
      }}>
        {/* Hero Icon */}
        <div style={{
          width: 100,
          height: 100,
          borderRadius: "50%",
          background: "var(--accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          boxShadow: "0 0 30px rgba(59, 130, 246, 0.4)",
          marginBottom: 8
        }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7V5a2 2 0 0 1 2-2h2" />
            <path d="M17 3h2a2 2 0 0 1 2 2v2" />
            <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
            <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
            <rect x="7" y="7" width="10" height="10" rx="1" />
          </svg>
        </div>

        <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
          Control de Ingreso
        </h1>

        <p style={{ fontSize: 24, fontWeight: 600, color: "var(--foreground)", margin: 0, lineHeight: 1.4 }}>
          Acerque su tarjeta al lector para registrar su ingreso
        </p>

        {/* Feedback Area */}
        <div style={{
          minHeight: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 16,
          width: "100%"
        }}>
          {message ? (
            <div style={{
              padding: "16px 32px",
              borderRadius: 16,
              background: message.startsWith("Error") ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)",
              color: message.startsWith("Error") ? "#ef4444" : "#16a34a",
              fontWeight: 600,
              fontSize: 20,
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              border: `1px solid ${message.startsWith("Error") ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)"}`,
              animation: "fadeIn 0.3s ease-out"
            }}>
              {message}
            </div>
          ) : (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "var(--muted)",
              opacity: 0.6,
              fontSize: 18
            }}>
              <span className="animate-pulse">●</span> Esperando lectura...
            </div>
          )}
        </div>
      </div>

      {/* Scrollable List Section */}
      <div style={{
        flex: "1 1 auto",
        overflowY: "auto",
        width: "100%",
        maxWidth: 800,
        margin: "0 auto",
        padding: "0 20px 40px 20px",
        display: "flex",
        flexDirection: "column"
      }}>
        <LatestAccesses limit={50} />
      </div>

      <AreaSelectionModal
        isOpen={showAreaModal}
        onSelectArea={handleAreaSelect}
        onClose={() => setShowAreaModal(false)}
      />
    </main>
  );
}
