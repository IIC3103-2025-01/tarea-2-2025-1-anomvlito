
// src/hooks/useDummySatellite.js
import { useState, useEffect } from "react";

export function useDummySatellite(enabled) {
  const [dummySatellite, setDummySatellite] = useState(null);

  useEffect(() => {
    // Si no queremos usar el dummy, no hacemos nada.
    if (!enabled) return;

    const interval = setInterval(() => {
      const angle = (Date.now() / 1000) % (2 * Math.PI);
      // Genera una posición dummy que rota en un círculo (latitud fija 0 y longitud variable)
      setDummySatellite({
        satellite_id: "DUMMY-ROTATING",
        position: {
          lat: 0,
          lng: 20 * Math.cos(angle),
        },
        altitude: 0.1,
        type: "TEST",
        mission: "Rotating Test",
        organization: { name: "DummyOrg", country: { country_code: "US" } },
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled]);

  return dummySatellite;
}
