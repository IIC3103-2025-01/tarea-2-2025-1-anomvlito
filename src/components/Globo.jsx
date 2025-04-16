import { useEffect, useRef } from "react";
import Globe from "globe.gl";
import * as THREE from "three";

function Globo({ satelites = [], antenas = [], showCoverageZones = false }) {
  const globeRef = useRef(null);
  const globeInstance = useRef(null);

  // Constantes para el cálculo de altitud de los satélites
  const baseAltitudeOffset = 0.05;
  const altitudeVisualScale = 0.15;

  // Inicialización del globo: imagen, atmósfera, fondo y la capa de partículas para satélites
  useEffect(() => {
    if (!globeRef.current) return;

    globeInstance.current = Globe()(globeRef.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .atmosphereColor("lightblue")
      .atmosphereAltitude(0.1)
      .backgroundColor("#000011")
      // Configuración de la capa de satélites usando particlesData
      .particlesData([]) 
      .particlesList(d => d)
      .particleLat(d => d.position.lat)
      .particleLng(d => d.position.lng)
      .particleAltitude(d =>
        baseAltitudeOffset +
        (d?.altitude && typeof d.altitude === "number"
          ? (d.altitude / 6371) * altitudeVisualScale
          : 0)
      )
      .particlesSize(2.0);

    if (globeInstance.current.controls) {
      globeInstance.current.controls().autoRotate = true;
      globeInstance.current.controls().autoRotateSpeed = 0.1;
    }

    return () => {
      if (globeInstance.current?.controls)
        globeInstance.current.controls().dispose();
      if (globeInstance.current?._destructor)
        globeInstance.current._destructor();
      globeInstance.current = null;
    };
  }, []);

  // Actualiza la capa de satélites (partículas)
  useEffect(() => {
    if (globeInstance.current) {
      const validSatellites = satelites.filter(
        (d) =>
          d?.position &&
          typeof d.position.lat === "number" &&
          typeof d.position.lng === "number"
      );
      // Se envuelve el array de satélites en un array para formar un único grupo de partículas
      globeInstance.current
        .particlesData(validSatellites.length ? [validSatellites] : [])
        .particlesList(d => d)
        .particleLat(d => d.position.lat)
        .particleLng(d => d.position.lng)
        .particleAltitude(d =>
          baseAltitudeOffset +
          (d?.altitude && typeof d.altitude === "number"
            ? (d.altitude / 6371) * altitudeVisualScale
            : 0)
        )
        .particlesColor(() => "lime")
        .particlesSize(1.2);
    }
  }, [satelites]);

  // Agrega la capa de antenas usando pointsData (puntos naranjos)
  useEffect(() => {
    if (globeInstance.current) {
      const validAntenas = antenas.filter(
        (d) => typeof d?.lat === "number" && typeof d?.lng === "number"
      );
      globeInstance.current
        .pointsData(validAntenas)
        .pointLat(d => d.lat)
        .pointLng(d => d.lng)
        .pointAltitude(() => 0.1) // Offset para que se sitúen por encima de la superficie
        .pointColor(() => "yellow") // Color de las antenas
        .pointRadius(0.25);
    }
  }, [antenas]);

  // Agrega la capa de zonas de cobertura de satélites usando labelsData (map labels)
  // Se crean etiquetas sin texto pero con un marcador dot cuyo radio depende de la propiedad "power"
  useEffect(() => {
    if (!globeInstance.current) return;
    // Para cada satélite con power válido, creamos una entrada para la zona de cobertura
    const coverageZones = satelites
      .filter(
        (d) =>
          d?.position &&
          typeof d.position.lat === "number" &&
          typeof d.position.lng === "number" &&
          typeof d.power === "number"
      )
      .map((d) => ({
        lat: d.position.lat,
        lng: d.position.lng,
        power: d.power
      }));
    // La conversión de kilómetros a grados angulares:
    // angularDegrees = (power / 6371) * (180 / π)
    globeInstance.current
      .labelsData(coverageZones)
      .labelsTransitionDuration(1000)
      .labelLat((d) => d.lat)
      .labelLng((d) => d.lng)
      .labelAltitude(() => 0.005) // Pequeño offset para no quedar embutido en la superficie
      .labelText(() => "") // Sin texto, solo el marker
      .labelColor(() => "rgb(240, 168, 168)") // Naranja semi-transparente
      .labelDotRadius(() => 0.5) // Radio del marcador
      .labelSize((d) => (d.power / 6371) * (180 / Math.PI))
      .labelDotRadius((d) => (d.power / 6371) * (180 / Math.PI))
      .labelResolution(2);

  }, [satelites, showCoverageZones]);

  // (Opcional) Si tienes otras capas personalizadas, podrías actualizarlas aquí
  useEffect(() => {
    if (!globeInstance.current) return;
    globeInstance.current.customLayerData([]);
  }, [showCoverageZones]);

  return (
    <div
      ref={globeRef}
      style={{ width: "100%", height: "100%" }}
    ></div>
  );
}

export default Globo;
