// hooks/useWebSocket.js
import { useEffect, useRef } from "react";

export function useWebSocket(onReady, onMessage) {
  const ws = useRef(null);
  const reconnectTimeout = useRef(null);

  const connect = () => {
    const URL = "wss://tarea-2.2025-1.tallerdeintegracion.cl/connect";

    ws.current = new WebSocket(URL);

    ws.current.onopen = () => {
      if (onReady) {
        onReady(ws.current);
      }
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) {
          onMessage(data, ws.current);
        }
      } catch (error) {
        console.error("❌ Error al parsear JSON:", error);
      }
    };

    ws.current.onerror = (error) => {
      console.error("❌ WebSocket error:", error);
    };

    ws.current.onclose = () => {
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
