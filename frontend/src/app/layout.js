// frontend/src/app/layout.js
import Link from "next/link";
import ThemeToggle from "../components/ThemeToggle";
import StatusBanner from "../components/StatusBanner";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Ingreso FabLab USMsss",
  description: "control de ingreso FabLab USM",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Header fijo arriba */}
        <header className="header">
          <img className="headerImg" src="/favicon.ico" alt="" />
          <Link href="/" className="brandLink">
            Totem FabLab
          </Link>
          <nav style={{ display: "flex", gap: 10, marginLeft: "auto" }} className="navLinks">
            <Link className="navLink" href="/ingresos">Registrar ingreso</Link>
            <Link className="navLink" href="/proyectos">Ver proyectos</Link>
            <Link className="navLink" href="/maquinas">Ver máquinas</Link>
            <Link className="navLink" href="/reservas">Ver reservas</Link>
            <ThemeToggle />
          </nav>
        </header>

        {/* Building status banner (unscaled) placed below the header so it won't be cropped by transforms */}
        <StatusBanner />

        {/* App content wrapped in .scaleWrap so it scales while header and banner remain unscaled */}
        <div className="scaleWrap">
          {/* 👇 Contenedor global que da el espacio bajo el header fijo */}
          <div className="app-content">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
