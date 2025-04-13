// src/components/Globo.jsx
import { useEffect, useRef } from "react";
import Globe from "globe.gl";
import * as THREE from "three";

function Globo({ satelites, antenas = [], showCoverageZones = false }) {
  const globeRef = useRef(null);
  const globeInstance = useRef(null);

  // Inicialización única del globo
  useEffect(() => {
    globeInstance.current = Globe()(globeRef.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .atmosphereColor("lightblue")
      .atmosphereAltitude(0.2)
      .backgroundColor("#000011")
      // Se empieza sin puntos (satélites); luego se actualizan
      .pointsData([])
      .pointLat(d => d.position.lat)
      .pointLng(d => d.position.lng)
      // Ajusta la altitud; he optado por dividir entre 10 (puedes ajustar según lo que necesites)
      .pointAltitude(d => (d.altitude ? d.altitude / 1000 : 0.05))
      .pointColor(d => {
        if (d.altitude > 3) return "red";
        if (d.altitude > 1) return "orange";
        return "cyan";
      })
      .pointRadius(0.24);

    globeInstance.current.controls().autoRotate = true;
    // Configurar la velocidad de rotación (más lenta)
    globeInstance.current.controls().autoRotateSpeed = 0.005;

    return () => {
      globeInstance.current = null;
    };
  }, []);

  // Actualización de los satélites
  useEffect(() => {
    if (globeInstance.current) {
      // console.log("Actualizando puntos en Globo con:", satelites);
      globeInstance.current.pointsData(satelites);
    }
  }, [satelites]);

  // Actualización de antenas DSN (capa personalizada para antenas)
  useEffect(() => {
    if (globeInstance.current && antenas.length > 0) {
      globeInstance.current
        .customLayerData(antenas)
        .customThreeObject(d => {
          const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.5),
            new THREE.MeshStandardMaterial({ color: "yellow" })
          );
          return mesh;
        })
        .customThreeObjectUpdate((obj, d) => {
          const phi = (90 - d.lat) * (Math.PI / 180);
          const theta = (d.lng + 180) * (Math.PI / 180);
          const radius = globeInstance.current.getGlobeRadius();
          obj.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
          );
        });
    }
  }, [antenas]);

  // Capa de zonas de cobertura (opcional)
  // Agregar o actualizar la capa de zonas de cobertura (custom layer)
  useEffect(() => {
    if (!globeInstance.current) return;
  
    // Si NO quieres mostrar zonas, las limpias:
    if (!showCoverageZones) {
      // Deja la capa vacía
      globeInstance.current.customLayerData([]);
      return;
    }
  
    // Si sí quieres mostrar zonas:
    // console.log("DEBUG: Agregando zonas de cobertura para satélites:", satelites);
    const globeRadius = globeInstance.current.getGlobeRadius();
  
    globeInstance.current.customLayerData(satelites)
      .customThreeObject(d => {
        const power = d.power || 1;
        // Factor de conversión de km a "unidades del globo" (6371 es ~radio Tierra en km)
        const conversionFactor = globeRadius / 6371;
        // Multiplicador para hacerlos bien visibles:
        const zoneRadius = power * conversionFactor * 50;
  
        // Círculo “plano”
        const geometry = new THREE.CircleGeometry(zoneRadius, 32);
        // Lo rotamos para que quede paralelo a la superficie (horizontal)
        geometry.rotateX(-Math.PI / 2);
  
        const material = new THREE.MeshBasicMaterial({
          color: "lime",
          opacity: 0.25,
          transparent: true,
          side: THREE.DoubleSide  // Para verse desde arriba y abajo
        });
        return new THREE.Mesh(geometry, material);
      })
      .customThreeObjectUpdate((obj, d) => {
        // Uso lat, lng
        const phi = (90 - d.position.lat) * (Math.PI / 180);
        const theta = (d.position.lng + 180) * (Math.PI / 180);
        const r = globeRadius;
  
        // Posición “exacta” en la superficie
        obj.position.set(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        );
  
        // Sube un pelín (por ejemplo 1%) para que no se incruste
        obj.position.multiplyScalar(1.001);
      });
  }, [satelites, showCoverageZones]);
  
  return (
    <div
      ref={globeRef}
      
    ></div>
  );
}

export default Globo;
