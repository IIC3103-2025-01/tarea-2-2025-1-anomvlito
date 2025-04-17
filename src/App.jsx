// src/App.jsx
import React, {
  useState,
  useReducer,
  useCallback,
  useRef
} from "react";
import { useWebSocket } from "./hooks/useWebSocket";
import Globo from "./components/Globo";
import SatelliteList from "./components/SatelliteList";
import ChatPanel from "./components/Chat";
import "./App.css";

// — Chat reducer —
const initialChatState = { messages: [] };
function chatReducer(state, action) {
  switch (action.type) {
    case "ADD_MESSAGE":
      return { messages: [...state.messages, action.payload] };
    default:
      return state;
  }
}

// — Satélites reducer —
const initialSatState = {
  satellites: {},
  satelliteIds: [],
  isLoadingList: true,
  error: null
};
const Actions = {
  SET_LOADING_LIST: "SET_LOADING_LIST",
  SET_ERROR: "SET_ERROR",
  RECEIVE_SATELLITE_IDS: "RECEIVE_SATELLITE_IDS",
  UPDATE_SATELLITE_DATA: "UPDATE_SATELLITE_DATA"
};
function satelliteReducer(state, action) {
  switch (action.type) {
    case Actions.SET_LOADING_LIST:
      return { ...state, isLoadingList: action.payload };
    case Actions.SET_ERROR:
      return { ...state, error: action.payload, isLoadingList: false };
    case Actions.RECEIVE_SATELLITE_IDS:
      const initialSats = { ...state.satellites };
      action.payload.forEach(id => {
        if (!initialSats[id]) {
          initialSats[id] = {
            satellite_id: id,
            status: "loading_details"
          };
        }
      });
      return {
        ...state,
        satelliteIds: action.payload,
        satellites: initialSats,
        isLoadingList: false
      };
    case Actions.UPDATE_SATELLITE_DATA:
      const upd = action.payload;
      return {
        ...state,
        satellites: {
          ...state.satellites,
          [upd.satellite_id]: {
            ...(state.satellites[upd.satellite_id] || {
              satellite_id: upd.satellite_id
            }),
            ...upd
          }
        }
      };
    default:
      return state;
  }
}

const antenasDSN = [
  {
    id: "GDSCC",
    name: "Goldstone Deep Space Complex",
    lat: 35.4267,
    lng: -116.8900
  },
  {
    id: "MDSCC",
    name: "Madrid Deep Space Complex",
    lat: 40.4314,
    lng: -4.2481
  },
  {
    id: "CDSCC",
    name: "Canberra Deep Space Complex",
    lat: -35.4014,
    lng: 148.9817
  }
];

function App() {
  // chat
  const [chatState, chatDispatch] = useReducer(
    chatReducer,
    initialChatState
  );

  // satélites
  const [satState, dispatch] = useReducer(
    satelliteReducer,
    initialSatState
  );

  // filtros y UI
  const [showCoverageZones, setShowCoverageZones] = useState(true);
  const [filtroPais, setFiltroPais] = useState("");
  const [filtroMision, setFiltroMision] = useState("");
  const [selectedAntenna, setSelectedAntenna] = useState(null);
  const [antennaInfo, setAntennaInfo] = useState(null);

  const ws = useRef(null);

  // cuando el WS abre conexión
  const handleReady = useCallback(websocket => {
    ws.current = websocket;
    if (websocket.readyState === WebSocket.OPEN) {
      websocket.send(
        JSON.stringify({
          type: "AUTH",
          name: "Fabian Ortega",
          student_number: "17627249"
        })
      );
      websocket.send(JSON.stringify({ type: "SATELLITES" }));
      dispatch({ type: Actions.SET_LOADING_LIST, payload: true });
    }
  }, []);

  // cuando llega un mensaje
  const handleMessage = useCallback(data => {
    switch (data.type) {
      case "SATELLITES":
        dispatch({
          type: Actions.RECEIVE_SATELLITE_IDS,
          payload: data.satellites
        });
        data.satellites.forEach(id =>
          ws.current.send(
            JSON.stringify({
              type: "SATELLITE-STATUS",
              satellite_id: id
            })
          )
        );
        break;

      case "SATELLITE-STATUS":
        dispatch({
          type: Actions.UPDATE_SATELLITE_DATA,
          payload: data.satellite
        });
        break;

      case "POSITION_UPDATE":
        if (Array.isArray(data.satellites)) {
          data.satellites.forEach(su => {
            const pos = su.position && {
              lat: su.position.lat,
              lng:
                su.position.lng !== undefined
                  ? su.position.lng
                  : su.position.long
            };
            dispatch({
              type: Actions.UPDATE_SATELLITE_DATA,
              payload: { ...su, ...(pos && { position: pos }) }
            });
          });
        }
        break;

      case "COMM":
        // mensajes entrantes
        chatDispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: Date.now(),
            content: data.message,
            sender: data.satellite_id || "station",
            timestamp: data.date
              ? new Date(data.date)
              : new Date(),
            level: data.level || "info",
            direction: "incoming"
          }
        });
        break;

      // otros eventos (POWER-UP, LAUNCH, etc) …
      default:
        break;
    }
  }, []);

  // inicializa WS
  useWebSocket(handleReady, handleMessage);

  // enviar mensaje por chat
  const handleSendMessage = useCallback(text => {
    if (ws.current?.readyState === WebSocket.OPEN && text.trim()) {
      ws.current.send(
        JSON.stringify({ type: "COMM", message: text })
      );
      chatDispatch({
        type: "ADD_MESSAGE",
        payload: {
          id: Date.now(),
          content: text,
          sender: "station",
          timestamp: new Date(),
          level: "info",
          direction: "outgoing"
        }
      });
    }
  }, []);

  // filtros de lista satélites
  const satsArray = Object.values(satState.satellites);
  const satsFiltrados = satsArray.filter(s => {
    const cc = s.organization?.country?.country_code || "";
    const m = s.mission || "";
    return (
      (!filtroPais ||
        cc.toLowerCase().includes(filtroPais.toLowerCase())) &&
      (!filtroMision ||
        m.toLowerCase().includes(filtroMision.toLowerCase()))
    );
  });
  const datosParaMostrar = satsFiltrados
    .filter(s => s.position?.lat != null && s.position?.lng != null)
    .map(s => ({
      ...s,
      position: {
        lat: s.position.lat,
        lng: s.position.lng
      }
    }));

  // click antena
  const handleAntennaSelect = useCallback(ant => {
    setSelectedAntenna(ant);
    const nearby = datosParaMostrar
      .filter(s => {
        // aquí tu cálculo real de distancia/cover…
        const dist = /* tu función Haversine */ 1000;
        return dist <= s.power;
      })
      .map(s => ({
        id: s.satellite_id,
        name: s.name,
        distance: 1000,
        signal: "50%"
      }));
    setAntennaInfo({
      nearbySatellites: nearby,
      message: `${nearby.length} satélites cercanos`
    });
  }, [datosParaMostrar]);

  return (
    <div className="layout">
      {/* panel izquierdo: lista + chat */}
      <div className="left-pane">
        <h1 className="title">
          Tarea 2: Houston, we have a problem
        </h1>
        {satState.isLoadingList && (
          <p>Cargando lista inicial...</p>
        )}
        {satState.error && (
          <p className="error-message">
            Error: {satState.error}
          </p>
        )}
        <SatelliteList
          satelites={satsFiltrados}
          setFiltroPais={setFiltroPais}
          setFiltroMision={setFiltroMision}
        />
        <ChatPanel
          messages={chatState.messages}
          onSendMessage={handleSendMessage}
        />
      </div>

      {/* panel derecho: globo + antenas */}
      <div className="right-pane">
        <Globo
          satelites={datosParaMostrar}
          antenas={antenasDSN}
          showCoverageZones={showCoverageZones}
          onAntennaClick={handleAntennaSelect}
        />
        <button
          onClick={() =>
            setShowCoverageZones(v => !v)
          }
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 10
          }}
        >
          {showCoverageZones
            ? "Ocultar Zonas"
            : "Mostrar Zonas"}
        </button>

        {selectedAntenna && (
          <div className="info-panel antenna-info">
            {/* … tu UI de info de antena … */}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
