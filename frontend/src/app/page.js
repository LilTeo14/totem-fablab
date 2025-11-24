// frontend/src/app/page.js
"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="menu">
        <h1 className="menuTitle">Bienvenido</h1>
        <p className="menuSubtitle">Elige una opción para comenzar</p>

        <div className="menuGrid">
          <Link href="/ingresos/choose" className="menuTile" prefetch={false}>
            <h2 className="menuTileTitle">Registrar ingreso</h2>
            <p className="menuTileDesc">
              Registra visitantes o alumnos al laboratorio.
            </p>
          </Link>

          <Link href="/proyectos" className="menuTile" prefetch={false}>
            <h2 className="menuTileTitle">Ver proyectos</h2>
            <p className="menuTileDesc">
              Explora, filtra y gestiona proyectos.
            </p>
          </Link>

          <Link href="/maquinas" className="menuTile" prefetch={false}>
            <h2 className="menuTileTitle">Ver máquinas</h2>
            <p className="menuTileDesc">
              Disponibilidad y estado de equipos.
            </p>
          </Link>

          <Link href="/reservas" className="menuTile" prefetch={false}>
            <h2 className="menuTileTitle">Ver reservas</h2>
            <p className="menuTileDesc">
              Agenda y gestiona tus reservas.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
