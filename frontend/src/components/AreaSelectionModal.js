"use client";

export default function AreaSelectionModal({ isOpen, onSelectArea, onClose }) {
    if (!isOpen) return null;

    const areas = [
        "Cortadora laser",
        "CNC",
        "Mecanica",
        "Electronica",
        "Impresion 3d",
        "Costura",
        "Otro"
    ];

    const handleSelect = (area) => {
        onSelectArea(area);
        onClose();
    };

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
                padding: "20px",
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: "white",
                    borderRadius: "16px",
                    padding: "32px",
                    maxWidth: "600px",
                    width: "100%",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2
                    style={{
                        fontSize: "28px",
                        fontWeight: "600",
                        marginBottom: "8px",
                        textAlign: "center",
                    }}
                >
                    ¿A qué área vienes?
                </h2>
                <p
                    style={{
                        color: "#6b7280",
                        marginBottom: "24px",
                        textAlign: "center",
                    }}
                >
                    Selecciona el área que vas a utilizar
                </p>

                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "12px",
                    }}
                >
                    {areas.map((area) => (
                        <button
                            key={area}
                            onClick={() => handleSelect(area)}
                            style={{
                                padding: "20px",
                                fontSize: "18px",
                                fontWeight: "500",
                                backgroundColor: "#2563eb",
                                color: "white",
                                border: "none",
                                borderRadius: "12px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)",
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = "#1d4ed8";
                                e.target.style.transform = "scale(1.05)";
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = "#2563eb";
                                e.target.style.transform = "scale(1)";
                            }}
                        >
                            {area}
                        </button>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    style={{
                        marginTop: "24px",
                        width: "100%",
                        padding: "12px",
                        fontSize: "16px",
                        backgroundColor: "#e5e7eb",
                        color: "#374151",
                        border: "none",
                        borderRadius: "8px",
                        cursor: "pointer",
                        fontWeight: "500",
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#d1d5db";
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#e5e7eb";
                    }}
                >
                    Cancelar
                </button>
            </div>
        </div >
    );
}
