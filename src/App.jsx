// App.jsx (Fusionado con useReducer y manejo de click en antena)
import React, { useState, useEffect, useReducer, useCallback, useRef } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { useDummySatellite } from "./hooks/useDummySatellite"; // Mantenemos el dummy
import Globo from "./components/Globo";
import SatelliteList from "./components/SatelliteList"; // Mantenemos SatelliteList
import ChatPanel from "./components/Chat";             // Mantenemos ChatPanel
import "./App.css";
// Importar función de distancia si se usa una librería como Turf
// import distance from '@turf/distance';
// import { point } from '@turf/helpers';

// --- Lógica del Reducer (Sin cambios) ---

const initialReducerState = {
  satellites: {},
  satelliteIds: [],
  isLoadingList: true,
  error: null,
};

const Actions = {
  SET_LOADING_LIST: 'SET_LOADING_LIST',
  SET_ERROR: 'SET_ERROR',
  RECEIVE_SATELLITE_IDS: 'RECEIVE_SATELLITE_IDS',
  UPDATE_SATELLITE_DATA: 'UPDATE_SATELLITE_DATA',
};

function satelliteReducer(state, action) {
  // console.log("Reducer Action:", action.type, action.payload);
  switch (action.type) {
    case Actions.SET_LOADING_LIST:
      return { ...state, isLoadingList: action.payload };
    case Actions.SET_ERROR:
      return { ...state, error: action.payload, isLoadingList: false };
    case Actions.RECEIVE_SATELLITE_IDS:
      const initialSatellites = { ...state.satellites };
      action.payload.forEach(id => {
        if (!initialSatellites[id]) {
          initialSatellites[id] = { satellite_id: id, status: 'loading_details' };
        }
      });
      return {
        ...state,
        satelliteIds: action.payload,
        satellites: initialSatellites,
        isLoadingList: false,
      };
    case Actions.UPDATE_SATELLITE_DATA:
      const updateData = action.payload;
      const satIdToUpdate = updateData.satellite_id;
      if (!state.satellites[satIdToUpdate]) {
        // Podríamos añadirlo si no existe
      }
      return {
        ...state,
        satellites: {
          ...state.satellites,
          [satIdToUpdate]: {
            ...(state.satellites[satIdToUpdate] || { satellite_id: satIdToUpdate }),
            ...updateData,
          },
        },
      };
    default:
      return state;
  }
}


// --- Componente Principal App ---

// Antenas DSN
const antenasDSN = [
  { id: "GDSCC", name: "Goldstone Deep Space Complex", lat: 35.4267, lng: -116.8900 },
  { id: "MDSCC", name: "Madrid Deep Space Complex", lat: 40.4314, lng: -4.2481 },
  { id: "CDSCC", name: "Canberra Deep Space Complex", lat: -35.4014, lng: 148.9817 },
];


function App() {
  const [satState, dispatch] = useReducer(satelliteReducer, initialReducerState);
  const [showCoverageZones, setShowCoverageZones] = useState(true); // Mantenido
  const [filtroPais, setFiltroPais] = useState("");
  const [filtroMision, setFiltroMision] = useState("");

  // --- NUEVO ESTADO: Para la antena seleccionada y su info ---
  const [selectedAntenna, setSelectedAntenna] = useState(null);
  const [antennaInfo, setAntennaInfo] = useState(null); // Guardará { nearbySatellites: [], message: "..." }
  // ---------------------------------------------------------

  const ws = useRef(null);

  // --- Callbacks para WebSocket (Sin cambios) ---
  const handleReady = useCallback((websocket) => {
    console.log("🔌 WebSocket conectado");
    ws.current = websocket;
    if (ws.current.readyState === WebSocket.OPEN) {
        const authMessage = { type: "AUTH", name: "Fabian Ortega", student_number: "17627249" };
        console.log("Enviando AUTH:", authMessage);
        ws.current.send(JSON.stringify(authMessage));
        const requestSatellitesMessage = { type: "SATELLITES" };
        console.log("Solicitando SATELLITES");
        ws.current.send(JSON.stringify(requestSatellitesMessage));
        dispatch({ type: Actions.SET_LOADING_LIST, payload: true });
    } else {
        console.warn("WebSocket no listo en handleReady");
        // Podríamos intentar reenviar tras un delay si esto ocurre consistentemente
    }
  }, []); // No depende de dispatch si dispatch es estable

  const handleMessage = useCallback((data) => {
    const currentWs = ws.current;
    if (!currentWs) return;
    try {
      switch (data.type) {
        case "SATELLITES":
          dispatch({ type: Actions.RECEIVE_SATELLITE_IDS, payload: data.satellites });
          console.log(`Recibida lista de ${data.satellites.length} IDs. Solicitando detalles...`);
          data.satellites.forEach(satId => {
            const requestStatusMessage = { type: "SATELLITE-STATUS", satellite_id: satId };
            currentWs.send(JSON.stringify(requestStatusMessage));
          });
          break;
        case "SATELLITE-STATUS":
          dispatch({ type: Actions.UPDATE_SATELLITE_DATA, payload: data.satellite });
          break;
        case "POSITION_UPDATE":
            if (Array.isArray(data.satellites)) {
                data.satellites.forEach(satUpdate => {
                    const position = satUpdate.position ? {
                        lat: satUpdate.position.lat,
                        long: satUpdate.position.long,
                        lng: satUpdate.position.lng,
                    } : undefined;
                    const payloadData = {
                        ...satUpdate,
                        ...(position && { position })
                    };
                    dispatch({ type: Actions.UPDATE_SATELLITE_DATA, payload: payloadData });
                });
            }
            break;
        default:
          break;
      }
    } catch (error) {
      console.error("❌ Error procesando mensaje:", error);
      dispatch({ type: Actions.SET_ERROR, payload: "Error procesando mensaje del servidor." });
    }
  }, []); // No depende de dispatch si dispatch es estable

  useWebSocket(handleReady, handleMessage);

  // --- NUEVA FUNCIÓN: Callback para manejar click en antena ---
  const handleAntennaSelect = useCallback((antennaData) => {
    console.log("Antenna seleccionada en App:", antennaData);
    setSelectedAntenna(antennaData); // Guardar la antena clickeada

    // --- Lógica de Cálculo (PENDIENTE) ---
    // Aquí es donde calcularías la distancia y la señal
    const allSatellites = Object.values(satState.satellites);
    let nearbySats = [];
    // TODO: Implementar cálculo de distancia (Haversine o Turf.distance)
    // const antennaCoords = point([antennaData.lng, antennaData.lat]);

    allSatellites.forEach(sat => {
        if (sat?.position?.lat && sat.position?.lng && sat.power > 0) {
            // const satCoords = point([sat.position.lng, sat.position.lat]);
            // const distKm = distance(antennaCoords, satCoords, { units: 'kilometers' });
            const distKm = 1000; // Placeholder distancia

            if (distKm <= sat.power) {
                const signal = Math.max(0, 1 - (distKm / sat.power));
                nearbySats.push({
                    id: sat.satellite_id,
                    name: sat.name,
                    distance: distKm,
                    signal: (signal * 100).toFixed(1) + '%' // Formatear como porcentaje
                });
            }
        }
    });

    console.log("Satélites cercanos calculados:", nearbySats); // Depuración
    setAntennaInfo({ // Guardar resultados (incluso si están vacíos o son placeholder)
        nearbySatellites: nearbySats,
        message: nearbySats.length > 0 ? `Se encontraron ${nearbySats.length} satélites cercanos.` : "Ningún satélite cercano."
    });
    // --------------------------------------------------

  }, [satState.satellites]); // Depende de los satélites para el cálculo
  // -------------------------------------------------------

  // --- Procesamiento de Datos (Sin cambios) ---
  const satellitesArray = Object.values(satState.satellites);
  const dummySatellite = useDummySatellite(satellitesArray.length === 0 && satState.isLoadingList === false);
  const satelitesFiltrados = satellitesArray.filter((sat) => {
    const codigoPais = sat?.organization?.country?.country_code || "";
    const mision = sat?.mission || "";
    return (
      (filtroPais === "" || codigoPais.toLowerCase().includes(filtroPais.toLowerCase())) &&
      (filtroMision === "" || mision.toLowerCase().includes(filtroMision.toLowerCase()))
    );
  });
  const datosConDummy = satelitesFiltrados.length > 0 ? satelitesFiltrados : dummySatellite ? [dummySatellite] : [];
  const datosParaMostrar = datosConDummy
    .filter(s => s?.position?.lat !== undefined && (s.position?.lng !== undefined || s.position?.long !== undefined))
    .map(s => ({
      ...s,
      position: {
        lat: s.position.lat,
        lng: s.position.long !== undefined ? s.position.long : s.position.lng
      }
    }));


  // --- Renderizado ---
  return (
    <div className="layout">
      <div className="left-pane">
        <h1 className="title">Tarea 2: Houston, we have a problem (con useReducer)</h1>
        {satState.isLoadingList && <p>Cargando lista inicial...</p>}
        {satState.error && <p className="error-message">Error: {satState.error}</p>}

        <SatelliteList
          satelites={satelitesFiltrados}
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
          // --- Pasar el nuevo callback como prop ---
          onAntennaClick={handleAntennaSelect}
          // ---------------------------------------
        />
        <button
          onClick={() => setShowCoverageZones(!showCoverageZones)}
          style={{ position: "absolute", top: "10px", left: "10px", zIndex: 10 }}
        >
          {showCoverageZones ? "Ocultar Zonas" : "Mostrar Zonas"}
        </button>

        {/* --- NUEVO PANEL: Para mostrar info de antena seleccionada --- */}
        {selectedAntenna && (
          <div className="info-panel antenna-info" style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(40,40,40,0.8)', color: 'white', padding: '10px', borderRadius: '5px', zIndex: 10, maxWidth: '300px', maxHeight: '300px', overflowY: 'auto' }}>
            <h3>Antena: {selectedAntenna.name}</h3>
            <p>ID: {selectedAntenna.id}</p>
            <p>Pos: {selectedAntenna.lat?.toFixed(4)}, {selectedAntenna.lng?.toFixed(4)}</p>
            {antennaInfo ? (
              <>
                <h4>Info Cobertura:</h4>
                <p>{antennaInfo.message}</p>
                {antennaInfo.nearbySatellites && antennaInfo.nearbySatellites.length > 0 && (
                  <ul>
                    {antennaInfo.nearbySatellites.map(sat => (
                      <li key={sat.id}>
                        {sat.name || sat.id}: {sat.signal} ({sat.distance.toFixed(0)} km)
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
                <p>Calculando información...</p>
            )}
            <button onClick={() => { setSelectedAntenna(null); setAntennaInfo(null); }} style={{marginTop: '5px', background: '#555', border: 'none', color: 'white', padding: '3px 6px', borderRadius: '3px', cursor: 'pointer'}}>Cerrar</button>
          </div>
        )}
        {/* ---------------------------------------------------------- */}

      </div>
    </div>
  );
}

export default App;