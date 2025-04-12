// App.jsx
import React, { useState } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { useDummySatellite } from "./hooks/useDummySatellite"; // Importa el hook dummy
import Globo from "./components/Globo";
import SatelliteList from "./components/SatelliteList";
import ChatPanel from "./components/Chat";
import "./App.css";

// Definición de las antenas DSN fijas
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

  // WebSocket: cuando llega "POSITION_UPDATE", se actualizan los mensajes
  useWebSocket((data) => {
    if (data.type === "POSITION_UPDATE") {
      setMensajes(data.satellites);
      console.log("📦 Data POSITION_UPDATE recibida:", data);
    }
  });

  // Preprocesamiento: si la propiedad se llama "long", renombrarla a "lng"
  const satelitesValidos = mensajes
    .filter(sat => sat.position && typeof sat.position.lat === 'number' && typeof sat.position.long === 'number')
    .map(sat => ({
      ...sat,
      position: {
        ...sat.position,
        lng: sat.position.long,
      },
    }));

  // Utiliza el hook dummy solo si no hay datos reales
  const dummySatellite = useDummySatellite(satelitesValidos.length === 0);

  // Si hay satélites válidos, se usan; de lo contrario, usamos el dummy (si está definido)
  const datosParaMostrar = satelitesValidos.length > 0 ? satelitesValidos : (dummySatellite ? [dummySatellite] : []);

  return (
    <div className="layout">
      <div className="left-pane">
        <Globo satelites={datosParaMostrar} antenas={antenasDSN} />
      </div>
      <div className="right-pane">
        <h1 className="title">Tarea 2: Houston, we have a problem</h1>
        <SatelliteList satelites={datosParaMostrar} />
        <ChatPanel />
      </div>
    </div>
  );
}

export default App;
