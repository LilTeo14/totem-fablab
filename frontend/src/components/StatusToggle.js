"use client";

export default function StatusToggle() {
  function toggle() {
    const cur = localStorage.getItem("buildingOpen");
    const next = cur === null ? "false" : cur === "true" ? "false" : "true";
    localStorage.setItem("buildingOpen", next);
    // emit event to update banner
    window.dispatchEvent(new CustomEvent("building-status-changed", { detail: next === "true" }));
  }

  return (
    <button onClick={toggle} style={{ padding: 6, borderRadius: 8, marginLeft: 8 }} aria-label="Toggle building open/closed">Toggle Open/Closed</button>
  );
}
