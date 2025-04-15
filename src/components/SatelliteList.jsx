import React from "react";

// Helper simple para banderas




function getFlagFromCountryCode(code) {
  if (code && code.length === 2) {
    const codePoints = code
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  }
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

      {/* Tabla scrollable */}
      <div className="satellite-list-scroll">
        <table className="w-full table-fixed border-collapse text-sm sat-table">
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
              const {
                satellite_id,
                name,
                mission = "N/A",
                type = "N/A",
                power,
                lifespan,
                position,
                altitude,
                organization,
              } = sat;

              const satName = name || satellite_id;
              const country_code = organization?.country?.country_code || "--";
              const countryFlag = getFlagFromCountryCode(country_code);

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
