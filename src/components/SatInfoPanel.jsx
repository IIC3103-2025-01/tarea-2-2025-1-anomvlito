// SatInfoPanel.jsx
import React from "react";

function SatInfoPanel({ details }) {
  return (
    <div className="sat-info-panel">
      <h2>Detalles del Satélite</h2>
      <pre>{JSON.stringify(details, null, 2)}</pre>
    </div>
  );
}

export default SatInfoPanel;
