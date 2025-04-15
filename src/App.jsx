// App.jsx (Fusionado con useReducer)
import React, { useState, useEffect, useReducer, useCallback, useRef } from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import { useDummySatellite } from "./hooks/useDummySatellite"; // Mantenemos el dummy
import Globo from "./components/Globo";
import SatelliteList from "./components/SatelliteList"; // Mantenemos SatelliteList
import ChatPanel from "./components/Chat";             // Mantenemos ChatPanel
import "./App.css";

// --- Lógica del Reducer (Traída de App2.jsx) ---

const initialReducerState = {
  satellites: {}, // Objeto: { satellite_id: SatelliteData, ... }
  satelliteIds: [], // Array de IDs para referencia si es necesario
  isLoadingList: true,
  error: null,
};

// Tipos de acciones esenciales
const Actions = {
  SET_LOADING_LIST: 'SET_LOADING_LIST',
  SET_ERROR: 'SET_ERROR',
  RECEIVE_SATELLITE_IDS: 'RECEIVE_SATELLITE_IDS',
  UPDATE_SATELLITE_DATA: 'UPDATE_SATELLITE_DATA', // Para SATELLITE-STATUS y POSITION_UPDATE
};

// El Reducer que ya funcionaba
function satelliteReducer(state, action) {
  // console.log("Reducer Action:", action.type, action.payload); // Descomentar para depurar

  switch (action.type) {
    case Actions.SET_LOADING_LIST:
      return { ...state, isLoadingList: action.payload };

    case Actions.SET_ERROR:
      return { ...state, error: action.payload, isLoadingList: false };

    case Actions.RECEIVE_SATELLITE_IDS:
      const initialSatellites = { ...state.satellites };
      action.payload.forEach(id => {
        if (!initialSatellites[id]) {
          initialSatellites[id] = { satellite_id: id, status: 'loading_details' }; // Placeholder
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
         // console.warn(`Datos recibidos para satélite no listado inicialmente: ${satIdToUpdate}`);
         // Podríamos decidir ignorarlo o añadirlo si es necesario
         // Por ahora, lo fusionamos igual
      }

      return {
        ...state,
        satellites: {
          ...state.satellites,
          [satIdToUpdate]: {
            ...(state.satellites[satIdToUpdate] || { satellite_id: satIdToUpdate }),
            ...updateData, // Fusionar datos
          },
        },
      };

    default:
      return state;
  }
}


// --- Componente Principal App ---

// Antenas DSN (se mantiene igual)
const antenasDSN = [
  { id: "GDSCC", name: "Goldstone Deep Space Complex", lat: 35.4267, lng: -116.8900 },
  { id: "MDSCC", name: "Madrid Deep Space Complex", lat: 40.4314, lng: -4.2481 },
  { id: "CDSCC", name: "Canberra Deep Space Complex", lat: -35.4014, lng: 148.9817 },
];

// Ya no necesitamos mergeSatelliteData, el reducer lo hace.
// function mergeSatelliteData(prevData, newData) { ... }

function App() {
  // Reemplazamos useState por useReducer para los datos de satélites
  const [satState, dispatch] = useReducer(satelliteReducer, initialReducerState);

  // Mantenemos los otros estados de la UI
  const [showCoverageZones, setShowCoverageZones] = useState(true);
  const [filtroPais, setFiltroPais] = useState("");
  const [filtroMision, setFiltroMision] = useState("");

  // Ref para el WebSocket
  const ws = useRef(null);

  // --- Callbacks para WebSocket (Traídos de App2.jsx y adaptados) ---

  const handleReady = useCallback((websocket) => {
    console.log("🔌 WebSocket conectado");
    ws.current = websocket; // Guardar instancia

    // 1. Autenticar
    const authMessage = { type: "AUTH", name: "Fabian Ortega", student_number: "17627249" };
    console.log("Enviando AUTH:", authMessage);
    ws.current.send(JSON.stringify(authMessage));

    // 2. Solicitar lista INICIAL de satélites
    const requestSatellitesMessage = { type: "SATELLITES" };
    console.log("Solicitando SATELLITES");
    ws.current.send(JSON.stringify(requestSatellitesMessage));
    dispatch({ type: Actions.SET_LOADING_LIST, payload: true });

  }, []); // Sin dependencias, se crea una vez

  const handleMessage = useCallback((data) => {
    // console.log("📩 Mensaje recibido:", data.type);
    const currentWs = ws.current;
    if (!currentWs) return;

    try {
      switch (data.type) {
        case "SATELLITES":
          dispatch({ type: Actions.RECEIVE_SATELLITE_IDS, payload: data.satellites });
          // Pedir detalles para CADA satélite recibido
          console.log(`Recibida lista de ${data.satellites.length} IDs. Solicitando detalles...`);
          data.satellites.forEach(satId => {
            const requestStatusMessage = { type: "SATELLITE-STATUS", satellite_id: satId };
            currentWs.send(JSON.stringify(requestStatusMessage));
          });
          break;

        case "SATELLITE-STATUS":
          // Recibe detalles completos de UN satélite. Actualiza el estado.
          dispatch({ type: Actions.UPDATE_SATELLITE_DATA, payload: data.satellite });
          break;

        case "POSITION_UPDATE":
            // Gestiona actualizaciones parciales (ej: solo posición)
            if (Array.isArray(data.satellites)) {
                data.satellites.forEach(satUpdate => {
                    // Preparamos los datos para asegurarnos que 'position' existe si hay lat/long
                    const position = satUpdate.position ? {
                        lat: satUpdate.position.lat,
                        // Usamos 'long' si existe, si no 'lng'. El reducer fusionará.
                        long: satUpdate.position.long,
                        lng: satUpdate.position.lng,
                    } : undefined;

                    const payloadData = {
                        ...satUpdate, // Incluye satellite_id y otros campos si los hay
                        ...(position && { position }) // Añade el objeto position si existía
                    };
                    dispatch({ type: Actions.UPDATE_SATELLITE_DATA, payload: payloadData });
                });
            }
            break;

        // Ignoramos los demás tipos
        default:
           // console.log(`Ignorando mensaje tipo: ${data.type}`);
          break;
      }
    } catch (error) {
      console.error("❌ Error procesando mensaje:", error);
      dispatch({ type: Actions.SET_ERROR, payload: "Error procesando mensaje del servidor." });
    }
  }, []); // Sin dependencias de useCallback problemáticas

  // --- Usar el hook WebSocket con los nuevos callbacks ---
  useWebSocket(handleReady, handleMessage);


  // --- Procesamiento de Datos (Adaptado para usar satState) ---

  // 1. Obtener array desde el estado del reducer
  const satellitesArray = Object.values(satState.satellites);

  // 2. Usar el dummy satellite (igual que antes)
  const dummySatellite = useDummySatellite(satellitesArray.length === 0 && satState.isLoadingList === false); // Mostrar dummy solo si no hay datos REALES y no estamos cargando

  // 3. Filtrar por país y misión (igual que antes)
  const satelitesFiltrados = satellitesArray.filter((sat) => {
    // Añadimos '?' para seguridad por si el objeto aún no está completo
    const codigoPais = sat?.organization?.country?.country_code || "";
    const mision = sat?.mission || "";
    return (
      (filtroPais === "" || codigoPais.toLowerCase().includes(filtroPais.toLowerCase())) &&
      (filtroMision === "" || mision.toLowerCase().includes(filtroMision.toLowerCase()))
    );
  });

  // 4. Decidir qué mostrar (filtrados o dummy)
   const datosConDummy = satelitesFiltrados.length > 0 ? satelitesFiltrados : dummySatellite ? [dummySatellite] : [];

  // 5. Preparar datos para Globo: asegurar 'position' y usar 'lng'
  const datosParaMostrar = datosConDummy
    .filter(s => s?.position?.lat !== undefined && (s.position?.lng !== undefined || s.position?.long !== undefined)) // Aceptar lng o long
    .map(s => ({
      ...s,
      // Crear/asegurar objeto position con lat y lng (preferido por Globo)
      position: {
        lat: s.position.lat,
        lng: s.position.long !== undefined ? s.position.long : s.position.lng
      }
    }));


  // --- Renderizado (prácticamente igual que antes) ---
  return (
    <div className="layout">
      <div className="left-pane">
        <h1 className="title">Tarea 2: Houston, we have a problem (con useReducer)</h1>
        {/* Mostrar estado de carga/error si es útil */}
        {satState.isLoadingList && <p>Cargando lista inicial...</p>}
        {satState.error && <p className="error-message">Error: {satState.error}</p>}

        <SatelliteList
          // Pasamos los satélites ya filtrados y preparados (aunque sin 'lng' asegurado aún, SatelliteList lo manejará?)
          // O quizás es mejor pasar satelitesFiltrados aquí? Depende de qué espere SatelliteList.
          // Asumamos que puede manejar ambos o que le pasamos los datos más crudos:
          satelites={satelitesFiltrados} // Pasamos los filtrados antes de la transformación final para Globo
          setFiltroPais={setFiltroPais}
          setFiltroMision={setFiltroMision}
        />
        <ChatPanel />
      </div>
      <div className="right-pane">
        <Globo
          // Pasamos los datos finales, filtrados, con dummy si aplica, y con position.lng asegurado
          satelites={datosParaMostrar}
          antenas={antenasDSN}
          showCoverageZones={showCoverageZones}
        />
        <button
          onClick={() => setShowCoverageZones(!showCoverageZones)}
          style={{ position: "absolute", top: "10px", left: "10px", zIndex: 10 }}
        >
          {showCoverageZones ? "Ocultar Zonas" : "Mostrar Zonas"}
        </button>
      </div>
    </div>
  );
}

export default App;