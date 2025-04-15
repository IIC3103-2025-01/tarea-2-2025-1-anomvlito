// App2.jsx (Versión con solicitud activa de detalles iniciales)
import React, { useReducer, useCallback, useState, useRef } from 'react';
import { useWebSocket } from './hooks/useWebSocket'; // Ruta correcta
import SatTable from './components/SatTable';         // Ruta correcta
import SatInfoPanel from './components/SatInfoPanel'; // Ruta correcta
import './App.css';                                 // Si tienes estilos

// --- Lógica del Reducer (la misma que la ultra simplificada) ---

const initialState = {
  satellites: {}, // Objeto: { satellite_id: SatelliteData, ... }
  satelliteIds: [], // Array de IDs para la tabla inicial
  isLoadingList: true, // Para la lista inicial de IDs
  // Opcional: Podrías añadir un isLoadingDetails: true si quieres mostrar carga mientras llegan los detalles
  error: null,
};

// Tipos de acciones esenciales
const Actions = {
  SET_LOADING_LIST: 'SET_LOADING_LIST',
  SET_ERROR: 'SET_ERROR',
  RECEIVE_SATELLITE_IDS: 'RECEIVE_SATELLITE_IDS',
  UPDATE_SATELLITE_DATA: 'UPDATE_SATELLITE_DATA', // Para SATELLITE-STATUS y POSITION_UPDATE
};

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
          initialSatellites[id] = { satellite_id: id, status: 'loading_details' }; // Placeholder inicial, indicando que esperamos detalles
        }
      });
      return {
        ...state,
        satelliteIds: action.payload,
        satellites: initialSatellites,
        isLoadingList: false, // La lista de IDs llegó
      };

    case Actions.UPDATE_SATELLITE_DATA:
      const updateData = action.payload;
      const satIdToUpdate = updateData.satellite_id;

      if (!state.satellites[satIdToUpdate]) {
         // Si no está en la lista inicial, podríamos ignorarlo o loggearlo
         // console.warn(`Datos recibidos para satélite no listado inicialmente: ${satIdToUpdate}`);
         // O quizás añadirlo si es un satélite nuevo? Depende de la lógica deseada.
         // Por ahora, lo fusionamos igual por si acaso.
      }

      // Fusionar datos existentes con los nuevos
      return {
        ...state,
        satellites: {
          ...state.satellites,
          [satIdToUpdate]: {
            ...(state.satellites[satIdToUpdate] || { satellite_id: satIdToUpdate }), // Asegura objeto base si no existía
            ...updateData, // Fusiona (merge) con los nuevos datos recibidos
          },
        },
      };

    default:
      return state;
  }
}

// --- Componente Principal ---

function App2() {
  const [state, dispatch] = useReducer(satelliteReducer, initialState);
  const [selectedSatId, setSelectedSatId] = useState(null);
  const ws = useRef(null);

  // --- Callbacks para WebSocket ---

  const handleReady = useCallback((websocket) => {
    console.log("🔌 WebSocket conectado");
    ws.current = websocket;

    // 1. Autenticar
    const authMessage = {
      type: "AUTH",
      name: "Fabian Ortega", // Tu nombre
      student_number: "17627249" // Tu número
    };
    console.log("Enviando AUTH:", authMessage);
    ws.current.send(JSON.stringify(authMessage));

    // 2. Solicitar lista INICIAL de satélites (SOLO IDs)
    const requestSatellitesMessage = { type: "SATELLITES" };
    console.log("Solicitando SATELLITES (lista inicial de IDs)");
    ws.current.send(JSON.stringify(requestSatellitesMessage));
    dispatch({ type: Actions.SET_LOADING_LIST, payload: true });

  }, []);

  const handleMessage = useCallback((data) => {
    // console.log("📩 Mensaje recibido:", data.type);

    // *** Añadido: Necesitamos ws.current dentro de este callback para el bucle ***
    const currentWs = ws.current;
    if (!currentWs) return; // Si no hay conexión, no hacer nada

    try {
      switch (data.type) {
        case "SATELLITES":
          // Recibe la lista inicial de IDs.
          dispatch({ type: Actions.RECEIVE_SATELLITE_IDS, payload: data.satellites });

          // *** BUCLE REINTRODUCIDO ***
          // Ahora, pide detalles para CADA satélite recibido en la lista.
          console.log(`Recibida lista de ${data.satellites.length} IDs. Solicitando detalles...`);
          data.satellites.forEach(satId => {
            const requestStatusMessage = { type: "SATELLITE-STATUS", satellite_id: satId };
            // console.log(`-> Solicitando SATELLITE-STATUS para ${satId}`); // Puede ser muy verboso
            currentWs.send(JSON.stringify(requestStatusMessage));
          });
          // **************************
          break;

        case "SATELLITE-STATUS":
          // Recibe detalles completos de UN satélite (en respuesta a nuestra solicitud o push del servidor).
          // Actualiza el estado.
          dispatch({ type: Actions.UPDATE_SATELLITE_DATA, payload: data.satellite });
          break;

        // Asumiendo que este mensaje trae un array de actualizaciones parciales (ej: posición)
        case "POSITION_UPDATE": // Ajusta si la API usa otro nombre
            if (Array.isArray(data.satellites)) {
                data.satellites.forEach(satUpdate => {
                    // Fusiona los datos parciales que lleguen
                    dispatch({ type: Actions.UPDATE_SATELLITE_DATA, payload: satUpdate });
                });
            }
            break;

        // Ignoramos los demás tipos como en la versión anterior
        default:
          // console.log(`Ignorando mensaje tipo: ${data.type}`);
          break;
      }
    } catch (error) {
      console.error("❌ Error procesando mensaje:", error);
      dispatch({ type: Actions.SET_ERROR, payload: "Error procesando mensaje del servidor." });
    }
    // *** Quitamos ws de las dependencias de useCallback para evitar re-creaciones innecesarias ***
    // Se accede a través de la ref ws.current o la variable local currentWs.
  }, []);

  // --- Inicializar WebSocket ---
  useWebSocket(handleReady, handleMessage);

  // --- Selección de Satélite ---
  const handleSelectSat = useCallback((satId) => {
    // console.log("Satélite seleccionado:", satId);
    setSelectedSatId(satId);
  }, []);

  // --- Preparar datos para los componentes hijos ---
  // Usamos los IDs iniciales para la tabla. Los datos se irán rellenando.
  const satListForTable = state.satelliteIds.map(id => state.satellites[id] || { satellite_id: id });
  const selectedSatDetails = selectedSatId ? state.satellites[selectedSatId] : null;

  // --- Renderizado ---
  return (
    <div className="app-layout">
      <h1>Panel de Control de Satélites</h1>
      {state.error && <div className="error-message">Error: {state.error}</div>}

      <div className="main-content">
        {state.isLoadingList ? (
          <p>Cargando lista de satélites...</p>
        ) : (
          <SatTable
            satellites={satListForTable}
            onSelectSat={handleSelectSat}
          />
        )}
        {/* Opcional: podrías añadir un indicador global si muchos detalles están cargando */}

        {selectedSatDetails ? (
          // SatInfoPanel mostrará los detalles que tengamos (que ahora deberían ser más completos)
          <SatInfoPanel details={selectedSatDetails} />
        ) : (
          <div className="sat-info-panel placeholder">
            <p>Selecciona un satélite para ver sus detalles.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App2;