// SatTable.jsx
import React from "react";

function SatTable({ satellites, onSelectSat }) {
  return (
    <div className="sat-table">
      <h2>Satélites</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {satellites.map((sat) => (
            <tr key={sat.satellite_id}>
              <td>{sat.satellite_id}</td>
              <td>
                <button onClick={() => onSelectSat(sat.satellite_id)}>
                  Ver detalles
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SatTable;
