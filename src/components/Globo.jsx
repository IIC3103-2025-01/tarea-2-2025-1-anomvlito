import { useEffect, useRef } from "react";
import Globe from "globe.gl";
import * as THREE from "three";

function Globo({ satelites, antenas = [] }) {
  const globeRef = useRef(null);
  const globeInstance = useRef(null);

  // Se crea el globo 3D una sola vez
  useEffect(() => {
    globeInstance.current = Globe()(globeRef.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .atmosphereColor("lightblue")
      .atmosphereAltitude(0.2)
      .backgroundColor("#000011")
      .pointLat("position.lat")
      .pointLng("position.long")
      .pointAltitude("altitude")
      .pointColor((d) => {
        if (d.altitude > 3) return "red";
        if (d.altitude > 1) return "orange";
        return "cyan";
      })
      .pointRadius(0.4);

    // Agregar las antenas DSN como capa personalizada, si existen
    if (antenas.length > 0) {
      globeInstance.current.customLayerData(antenas)
        .customThreeObject((d) => {
          // Se crea una esfera amarilla para cada antena
          return new THREE.Mesh(
            new THREE.SphereGeometry(0.5),
            new THREE.MeshStandardMaterial({ color: "yellow" })
          );
        })
        .customThreeObjectUpdate((obj, d) => {
          // Convertir (lat, lng) a coordenadas 3D en la superficie del globo
          const phi = (90 - d.lat) * (Math.PI / 180);
          const theta = (d.lng + 180) * (Math.PI / 180);
          const radius = globeInstance.current.getGlobeRadius();
          obj.position.x = radius * Math.sin(phi) * Math.cos(theta);
          obj.position.y = radius * Math.cos(phi);
          obj.position.z = radius * Math.sin(phi) * Math.sin(theta);
        });
    }

    globeInstance.current.controls().autoRotate = true;
    globeInstance.current.controls().autoRotateSpeed = 0.5;

    return () => {
      globeInstance.current = null;
    };
  }, [antenas]); // se vuelve a montar solo si cambian las antenas

  // Cada vez que cambian los satélites, solo actualizamos los datos de puntos
  useEffect(() => {
    if (globeInstance.current && satelites.length > 0) {
      globeInstance.current.pointsData(satelites);
    }
  }, [satelites]);

  return (
    <div
      ref={globeRef}
      style={{
        // Cambios: en vez de ocupar toda la ventana (position: fixed con 100vw/100vh),
        // se adapta al contenedor padre (por ejemplo, left-pane)
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#000011"
      }}
    />
  );
}

export default Globo;
