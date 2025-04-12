import { useEffect, useRef } from "react";
import Globe from "globe.gl";
import * as THREE from "three";

function Globo({ satelites, antenas = [] }) {
  const globeRef = useRef(null);
  const globeInstance = useRef(null);

  // Definición inicial del globo (una sola vez)
  useEffect(() => {
    globeInstance.current = Globe()(globeRef.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .atmosphereColor("lightblue")
      .atmosphereAltitude(0.2)
      .backgroundColor("#000011")
      .pointsData([])
      .pointLat(d => d.position.lat)
      .pointLng(d => d.position.lng)
      .pointAltitude(d => (d.altitude ? d.altitude / 1000 : 0.05)) 
      .pointColor(d => {
        if (d.altitude > 3) return "red";
        if (d.altitude > 1) return "orange";
        return "cyan";
      })
      .pointRadius(0.24);

    globeInstance.current.controls().autoRotate = true;
    globeInstance.current.controls().autoRotateSpeed = 0.5;

    return () => {
      globeInstance.current = null;
    };
  }, []);

  // Actualización de satélites
  useEffect(() => {
    if (globeInstance.current) {
      globeInstance.current.pointsData(satelites);
    }
  }, [satelites]);

  // Actualización de antenas DSN (custom layer)
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

  return (
    <div
      ref={globeRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: "#000011"
      }}
    />
  );
}

export default Globo;
