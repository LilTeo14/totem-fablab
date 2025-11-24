"use client";

import Link from "next/link";

export default function ChooseIngreso() {
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 16px" }}>
      <section className="menu">
        <h1 className="menuTitle">Registrar ingreso</h1>
        <p className="menuSubtitle">Selecciona el tipo de ingreso</p>

        <div className="menuGrid">
          <Link href="/ingresos" className="menuTile" prefetch={false}>
            <h2 className="menuTileTitle">Ingreso libre</h2>
            <p className="menuTileDesc">Entradas sin reserva — sube tu credencial.</p>
          </Link>

          <Link href="/ingresos/reserva" className="menuTile" prefetch={false}>
            <h2 className="menuTileTitle">Tengo reserva</h2>
            <p className="menuTileDesc">Validar una reserva existente.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
