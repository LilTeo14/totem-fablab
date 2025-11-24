"use client";

import { useEffect, useState, useCallback } from "react";
import LatestAccesses from "../../components/LatestAccesses";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function IngresosPage() {
  const [scannedCode, setScannedCode] = useState("");
  const [message, setMessage] = useState("");
  const [buffer, setBuffer] = useState("");

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Archivo seleccionado:", file.name);
      // aquí podrías enviar el archivo al backend (fetch/FormData)
    }
  };

  const processCode = useCallback(async (code) => {
    setScannedCode(code);
    setMessage("Procesando...");

    try {
      const response = await fetch(`${BACKEND_URL}/api/qr-scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
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

  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start", // align to top/left so header doesn't overlap
        justifyContent: "flex-start",
        gap: 16,
        padding: "24px 16px",
        textAlign: "left",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
        Control de ingreso
      </h1>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        Acerque su tarjeta al lector o suba su credencial.
      </p>

      {/* Visual feedback for scanned code */}
      <div style={{
        padding: "16px",
        backgroundColor: "#f3f4f6",
        borderRadius: "8px",
        width: "100%",
        marginBottom: "16px"
      }}>
        <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "4px" }}>
          Código detectado:
        </p>
        <p style={{ fontSize: "1.25rem", fontFamily: "monospace", fontWeight: "bold" }}>
          {scannedCode || "Esperando lectura..."}
        </p>
        {message && (
          <p style={{
            marginTop: "8px",
            color: message.startsWith("Error") ? "#ef4444" : "#10b981",
            fontWeight: "500"
          }}>
            {message}
          </p>
        )}
      </div>

      <label
        htmlFor="credencial"
        style={{
          display: "inline-block",
          padding: "10px 18px",
          border: "1px solid #2563eb",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        Subir Credencial (PDF/Img)
      </label>
      <input
        id="credencial"
        type="file"
        accept="image/*,.pdf"
        onChange={handleUpload}
        style={{ display: "none" }}
      />

      <div id="resultado" style={{ marginTop: 12, minHeight: 24 }} />

      <LatestAccesses limit={8} />
    </main>
  );
}
