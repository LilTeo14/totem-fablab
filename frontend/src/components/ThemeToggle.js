"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("system");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
      applyTheme(saved);
    } else {
      setTheme("system");
      applyTheme(null);
    }
    // listen to system changes when in system mode
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => { if (theme === "system") applyTheme(null); };
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyTheme(value) {
    const root = document.documentElement;
    if (value === "dark") {
      root.setAttribute("data-theme", "dark");
    } else if (value === "light") {
      root.removeAttribute("data-theme");
      // Ensure light values by forcing data-theme=light could be used, but our default :root is light
    } else {
      // system
      root.removeAttribute("data-theme");
    }
  }

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    applyTheme(next);
  }

  return (
    <button aria-label="Toggle theme" onClick={toggle} className="themeToggle">
      {theme === "dark" ? "🌙" : "☀️"}
    </button>
  );
}
