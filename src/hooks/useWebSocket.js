import { useEffect, useRef } from "react";

export function useWebSocket(onMessage) {
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  const connect = () => {
    const URL = "wss://tarea-2.2025-1.tallerdeintegracion.cl/connect";
    console.log("🌐 Intentando conectar a:", URL);

    ws.current = new WebSocket(URL);

    ws.current.onopen = () => {
      console.log("✅ WebSocket conectado");
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (error) {
        console.error("❌ Error al parsear JSON:", error);
      }
    };

    ws.current.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    ws.current.onclose = (event) => {
      console.warn("🔌 WebSocket desconectado");
      console.log("🔁 Reintentando conexión en 5 segundos...");
      reconnectTimeout.current = setTimeout(connect, 5000);
    };
  };

  useEffect(() => {
    connect();

    return () => {
      if (ws.current) ws.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, []);

  return ws;
}
