import { useState } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import Globo from "./components/Globo";
import "./App.css";

// Antenas DSN fijas
const antenasDSN = [
  {
    id: "GDSCC",
    name: "Goldstone Deep Space Complex",
    lat: 35.4267,
    lng: -116.8900,
  },
  {
    id: "MDSCC",
    name: "Madrid Deep Space Complex",
    lat: 40.4314,
    lng: -4.2481,
  },
  {
    id: "CDSCC",
    name: "Canberra Deep Space Complex",
    lat: -35.4014,
    lng: 148.9817,
  },
];

function App() {
  const [mensajes, setMensajes] = useState([]);

  // WebSocket: al llegar "POSITION_UPDATE", guardamos data.satellites en 'mensajes'
  useWebSocket((data) => {
    if (data.type === "POSITION_UPDATE") {
      setMensajes(data.satellites);
      console.log("📦 Data POSITION_UPDATE recibida:", data);
    }
  });

  // Filtrar datos válidos: lat ∈ [-90, 90], long ∈ [-180, 180]
  const satelitesValidos = mensajes.filter(
    (sat) =>
      sat.position &&
      Math.abs(sat.position.lat) <= 90 &&
      Math.abs(sat.position.long) <= 180
  );

  // Dummy para debug si no llegan datos
  const satelitesDummy = [
    {
      satellite_id: "TEST-001",
      position: { lat: 0, long: 0 },
      altitude: 0.1,
      type: "COM",
      mission: "Prueba 1",
      organization: { name: "TestCorp", country: { country_code: "US" } },
    },
    {
      satellite_id: "TEST-002",
      position: { lat: 30, long: 120 },
      altitude: 0.5,
      type: "NAV",
      mission: "Prueba 2",
      organization: { name: "SatOrg", country: { country_code: "CL" } },
    },
    {
      satellite_id: "TEST-003",
      position: { lat: -45, long: -90 },
      altitude: 1.2,
      type: "SCI",
      mission: "Prueba 3",
      organization: { name: "ResearchCo", country: { country_code: "JP" } },
    },
  ];

  // Si no hay satélites válidos, usar dummy
  const datosParaMostrar =
    satelitesValidos.length > 0 ? satelitesValidos : satelitesDummy;

  return (
    <div className="layout">
      {/* Panel IZQUIERDO -> Globo */}
      <div className="left-pane">
        <Globo satelites={datosParaMostrar} antenas={antenasDSN} />
      </div>

      {/* Panel DERECHO -> Info (tabla + chat) */}
      <div className="right-pane">
        <h1 className="title">Tarea 2: Houston, we have a problem</h1>

        {/* Panel de satélites */}
        <div className="panel">
          <h2>Satélites en órbita</h2>

          {/* Filtros (por país, misión) */}
          <div className="filters">
            <input type="text" placeholder="Filtrar por país..." />
            <input type="text" placeholder="Filtrar por misión..." />
          </div>

          {/* Tabla con datos dinámicos */}
          <table className="sat-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>País</th>
                <th>Misión</th>
                <th>Altitud</th>
                <th>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {datosParaMostrar.map((sat) => {
                // Lógica para la bandera (si tienes country_code)
                const code = sat?.organization?.country?.country_code || "--";
                // Muestra altitud con 2 decimales
                const altStr = sat?.altitude?.toFixed(2) ?? "0.00";

                return (
                  <tr key={sat.satellite_id}>
                    <td>{sat.satellite_id}</td>
                    <td> 
                      {code === "--" ? code : `🇨🇱`} 
                      {/* Podrías mejorar con un mapping de code->emoji/bandera real */}
                    </td>
                    <td>{sat?.mission || "N/A"}</td>
                    <td>{altStr}</td>
                    <td>{sat?.type || "?"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Panel de chat */}
        <div className="panel">
          <h2>Chat con Satélites</h2>
          <div className="chat-log">
            {/* Ejemplo de un mensaje dummy */}
            <p>
              <strong>NRO-002:</strong> Hello, Earth!
            </p>
          </div>
          <div className="chat-input">
            <input type="text" placeholder="Escribe un mensaje..." />
            <button>Enviar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
