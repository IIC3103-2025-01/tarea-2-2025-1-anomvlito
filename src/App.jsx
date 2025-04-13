// App.jsx
import React, { useState, useEffect } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { useDummySatellite } from "./hooks/useDummySatellite";
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
  const [satellitesInfo, setSatellitesInfo] = useState({});
  const [showCoverageZones, setShowCoverageZones] = useState(true);
  const [filtroPais, setFiltroPais] = useState("");
  const [filtroMision, setFiltroMision] = useState("");

  useWebSocket((data) => {
    if (data.type === "POSITION_UPDATE") {
      data.satellites.forEach((posData) => {
        const position = {
          ...posData.position,
          lng: posData.position.long !== undefined ? posData.position.long : posData.position.lng,
        };

        setSatellitesInfo((prev) => {
          const current = prev[posData.satellite_id] || {};
          return {
            ...prev,
            [posData.satellite_id]: {
              ...current,
              ...Object.fromEntries(
                Object.entries({
                  ...posData,
                  position,
                }).map(([key, value]) => [
                  key,
                  value !== undefined && value !== null ? value : current[key],
                ])
              ),
            },
          };
        });
      });
    } else if (data.type === "SATELLITES" || data.type === "SATELLITE-STATUS") {
      let satDataArray = [];
      if (data.type === "SATELLITES") {
        satDataArray = data.satellites;
      } else if (data.type === "SATELLITE-STATUS") {
        satDataArray = [data.satellite];
      }

      satDataArray.forEach((sat) => {
        setSatellitesInfo((prev) => ({
          ...prev,
          [sat.satellite_id]: {
            ...prev[sat.satellite_id],
            ...sat,
          },
        }));
      });
    }
  });

  // LOG CONSOLIDADO DE SATÉLITES
  useEffect(() => {
    const consolidated = Object.values(satellitesInfo);
    if (consolidated.length === 0) return;

    // console.log("📡 Estado actual de los satélites:");
    consolidated.forEach((sat) => {
      const resumen = {
        satellite_id: sat.satellite_id,
        name: sat.name || "N/A",
        launchsite_origin: sat.launchsite_origin || "N/A",
        launch_date: sat.launch_date || "N/A",
        position: sat.position || { lat: "N/A", lng: "N/A" },
        altitude: sat.altitude ?? "N/A",
        mission: sat.mission || "N/A",
        organization: sat.organization?.name || "N/A",
        country: sat.organization?.country?.name || "N/A",
        type: sat.type || "N/A",
        orbital_period: sat.orbital_period ?? "N/A",
        lifespan: sat.lifespan ?? "N/A",
        power: sat.power ?? "N/A",
        status: sat.status || "N/A",
      };
      // console.table(resumen);
    });
  }, [satellitesInfo]);

  const satellitesArray = Object.values(satellitesInfo);
  const dummySatellite = useDummySatellite(satellitesArray.length === 0);

  const satelitesFiltrados = satellitesArray.filter((sat) => {
    const codigoPais = sat?.organization?.country?.country_code || "";
    const mision = sat?.mission || "";
    return (
      codigoPais.toLowerCase().includes(filtroPais.toLowerCase()) &&
      mision.toLowerCase().includes(filtroMision.toLowerCase())
    );
  });







  const datosParaMostrar =
  satelitesFiltrados.length > 0 ? satelitesFiltrados : dummySatellite ? [dummySatellite] : [];


  return (
    <div className="layout">
      <div className="left-pane">
      <h1 className="title">Tarea 2: Houston, we have a problem</h1>
      <SatelliteList
          satelites={datosParaMostrar}
          setFiltroPais={setFiltroPais}
          setFiltroMision={setFiltroMision}
        />
        <ChatPanel />
        
      </div>
      <div className="right-pane">
      <Globo
          satelites={datosParaMostrar}
          antenas={antenasDSN}
          showCoverageZones={showCoverageZones}
        />
        <button
          onClick={() => setShowCoverageZones(!showCoverageZones)}
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 10,
          }}
        >
          {showCoverageZones ? "Ocultar Zonas" : "Mostrar Zonas"}
        </button>
        
      </div>
    </div>
  );
}

export default App;
