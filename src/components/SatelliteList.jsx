// src/components/SatelliteList.jsx
// import "./SatelliteList.css";

import React from "react";

// Simple helper para banderas (a modo de ejemplo fijo, podrías mapear country_code)
function getFlagFromCountryCode(code) {
  if (code === "US") return "🇺🇸";
  if (code === "CL") return "🇨🇱";
  if (code === "JP") return "🇯🇵";
  // ... etc. Por defecto:
  return "🏳️";
}

function SatelliteList({ satelites }) {
  return (
    <div className="panel">
      <h2>Satélites en órbita</h2>

      {/* Filtros (opcional) */}
      <div className="filters">
        <input type="text" placeholder="Filtrar por país..." />
        <input type="text" placeholder="Filtrar por misión..." />
      </div>

      {/* Contenedor con scroll si hay muchos satélites */}
      <div className="satellite-list-scroll">
      <table className="w-full table-fixed border-collapse text-sm">
      <th className="border border-gray-600 p-1 bg-gray-700 sticky top-0" />
      <td className="border border-gray-600 p-1 truncate" />

          <thead>
            <tr>
              <th>ID</th>
              <th>Bandera</th>
              <th>Satélite</th>
              <th>Misión</th>
              <th>Tipo</th>
              <th>Potencia</th>
              <th>Latitud</th>
              <th>Longitud</th>
              <th>Altitud</th>
              <th>Vida Útil</th>
            </tr>
          </thead>
          <tbody>
            {satelites.map((sat) => {
              // Extrae (o define valores por defecto si no existen)
              const {
                satellite_id,
                name,              // p.ej. "Galileo GAL-345"
                mission = "N/A",
                type = "N/A",
                power,             // p.ej. 50
                lifespan,          // p.ej. 120
                position,          // { lat, long }
                altitude,          // p.ej. 0.08
                organization,
              } = sat;

              // Si no viene un "name" distinto, usa su id como fallback
              const satName = name || satellite_id;

              // Bandera / país
              const country_code = organization?.country?.country_code || "--";
              const countryFlag = getFlagFromCountryCode(country_code);

              // Conviertes lat, long, altitude a cadenas con decimales
              const latStr = position?.lat != null ? position.lat.toFixed(2) : "--";
              const longStr = position?.long != null ? position.long.toFixed(2) : "--";
              const altStr = altitude != null ? altitude.toFixed(2) : "--";

              return (
                <tr key={satellite_id}>
                  <td>{satellite_id}</td>
                  <td>{countryFlag}</td>
                  <td>{satName}</td>
                  <td>{mission}</td>
                  <td>{type}</td>
                  <td>{power != null ? power : "--"}</td>
                  <td>{latStr}</td>
                  <td>{longStr}</td>
                  <td>{altStr}</td>
                  <td>{lifespan != null ? lifespan : "--"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SatelliteList;
