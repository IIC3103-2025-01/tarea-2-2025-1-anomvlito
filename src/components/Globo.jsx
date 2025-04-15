// src/components/Globo.jsx
import { useEffect, useRef } from "react";
import Globe from "globe.gl";
import * as THREE from "three";

// Asegúrate de que las props siempre tengan un valor por defecto si es necesario
function Globo({ satelites = [], antenas = [], showCoverageZones = false }) {
  const globeRef = useRef(null);
  const globeInstance = useRef(null);

  // Inicialización única del globo
  useEffect(() => {
    // Solo inicializar si globeRef.current existe
    if (!globeRef.current) return;

    globeInstance.current = Globe()(globeRef.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .atmosphereColor("lightblue")
      .atmosphereAltitude(0.2)
      .backgroundColor("#000011")
      // Configuración de los puntos (satélites)
      .pointsData(satelites) // Iniciar con los satélites iniciales si se pasan
      .pointLat(d => d?.position?.lat) // Añadir safe navigation ?.
      .pointLng(d => d?.position?.lng) // Añadir safe navigation ?.
      .pointAltitude(d => (d?.altitude ? d.altitude / 1000 : 0.05)) // Usar 1000 o ajustar según escala deseada
      .pointColor(d => {
        // Definir colores basados en algún criterio, por ejemplo, altitud o tipo
        // Este es un ejemplo basado en altitud, puedes cambiarlo
        if (d?.altitude > 3000) return "red";    // Ejemplo: > 3000 km
        if (d?.altitude > 1000) return "orange"; // Ejemplo: > 1000 km
        return "cyan";                           // Default
      })
      .pointRadius(0.24); // Ajustar radio visual del punto si es necesario

    // Configuración de controles y auto-rotación
    if (globeInstance.current.controls) {
        globeInstance.current.controls().autoRotate = true;
        globeInstance.current.controls().autoRotateSpeed = 0.1; // Ajustar velocidad si es necesario
    }


    // Limpieza al desmontar el componente
    return () => {
      if (globeInstance.current?.controls) {
        globeInstance.current.controls().dispose(); // Limpiar controles
      }
      if (globeInstance.current?._destructor) {
         globeInstance.current._destructor(); // Método de limpieza de globe.gl si existe
      }
      globeInstance.current = null;
    };
    // La dependencia vacía asegura que esto solo se ejecute una vez al montar
  }, []);

  // Actualización de los datos de los satélites (puntos)
  useEffect(() => {
    if (globeInstance.current) {
      // Filtrar satélites sin posición válida para evitar errores en globe.gl
      const validSatellites = satelites.filter(d => d?.position && typeof d.position.lat === 'number' && typeof d.position.lng === 'number');
      // console.log("Actualizando puntos en Globo con:", validSatellites.length, "satélites válidos");
      globeInstance.current.pointsData(validSatellites);
    }
    // Este efecto se re-ejecuta cada vez que la prop 'satelites' cambia
  }, [satelites]);

  // Actualización de antenas DSN (capa personalizada para antenas)
  useEffect(() => {
    // Solo proceder si hay instancia del globo y datos de antenas
    if (globeInstance.current && antenas.length > 0) {
      globeInstance.current
        .customLayerData(antenas) // Usar los datos de las antenas
        .customThreeObject(d => {
          // Crear una esfera amarilla simple para cada antena
          const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.5), // Radio visual de la antena
            new THREE.MeshStandardMaterial({ color: "yellow" })
          );
          return mesh;
        })
        .customThreeObjectUpdate((obj, d) => {
          // Actualizar la posición de la esfera de la antena en la superficie
          // Asegurarse de que 'd' tenga 'lat' y 'lng'
          if (typeof d?.lat !== 'number' || typeof d?.lng !== 'number') {
             obj.visible = false;
             return;
          };
          obj.visible = true;

          const lat = d.lat;
          const lng = d.lng;
          const phi = (90 - lat) * (Math.PI / 180);
          const theta = (lng + 180) * (Math.PI / 180);
          const radius = globeInstance.current.getGlobeRadius(); // Radio del globo visualizado
          // Calcular posición cartesiana desde lat/lng
          obj.position.set(
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.cos(phi),
            radius * Math.sin(phi) * Math.sin(theta)
          );
        });
    } else if (globeInstance.current) {
        // Si no hay antenas, asegurarse de limpiar la capa (opcional, depende de si usas la misma capa)
        // Si usas capas diferentes para antenas y zonas, no es necesario.
        // Si es la misma capa que las zonas, esta lógica debe combinarse con la de abajo.
    }
    // Este efecto depende de la prop 'antenas'
  }, [antenas]);

  // Capa de zonas de cobertura (opcional)
  useEffect(() => {
    // Asegurarse de que la instancia del globo exista
    if (!globeInstance.current) return;

    // Si la prop indica NO mostrar zonas, limpiar la capa y salir
    if (!showCoverageZones) {
      globeInstance.current.customLayerData([]); // Deja la capa sin datos
      return;
    }

    // Si SÍ quieres mostrar zonas:
    // Filtrar satélites que tengan datos válidos para la zona (posición y power)
    const validSatellitesForCoverage = satelites.filter(d =>
      d?.position && typeof d.position.lat === 'number' && typeof d.position.lng === 'number' && typeof d.power === 'number'
    );
    // console.log("DEBUG: Agregando zonas de cobertura para", validSatellitesForCoverage.length, "satélites válidos");

    // Obtener el radio del globo visualizado para la conversión de unidades
    const globeRadius = globeInstance.current.getGlobeRadius();
    // Factor constante para convertir km a unidades del globo
    const kmToGlobeUnitsFactor = globeRadius / 6371; // 6371 km = Radio Tierra aprox.

    // Configurar la capa personalizada usando los datos de los satélites válidos
    globeInstance.current.customLayerData(validSatellitesForCoverage)
      // Función para crear el objeto 3D (el círculo) para cada satélite 'd'
      .customThreeObject(d => {
        // Obtener la potencia (radio en KM según enunciado). Usar 1 si no está definido.
        const powerInKm = d.power > 0 ? d.power : 1; // Asegurar que sea > 0

        // Calcular el radio del círculo en las unidades del globo visualizado
        const zoneRadiusInGlobeUnits = powerInKm * kmToGlobeUnitsFactor; // <-- CORRECCIÓN APLICADA

        // Crear la geometría del círculo plano
        const geometry = new THREE.CircleGeometry(zoneRadiusInGlobeUnits, 32);
        // Rotar el círculo para que quede "acostado" sobre la superficie
        geometry.rotateX(-Math.PI / 2);

        // Crear el material visual
        const material = new THREE.MeshBasicMaterial({
          color: "lime",
          opacity: 0.2, // Hacerlo un poco más sutil si es necesario
          transparent: true,
          side: THREE.DoubleSide
        });

        return new THREE.Mesh(geometry, material);
      })
      // Función para actualizar la posición del círculo para cada satélite 'd'
      .customThreeObjectUpdate((obj, d) => {
        // Re-usamos la validación por si acaso, aunque ya filtramos antes
        if (!d?.position || typeof d.position.lat !== 'number' || typeof d.position.lng !== 'number') {
          obj.visible = false;
          return;
        }
        obj.visible = true;

        // Calcular la posición en la superficie usando lat/lng
        const lat = d.position.lat;
        const lng = d.position.lng;
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        const r = globeRadius;

        obj.position.set(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        );

        // Elevar ligeramente para evitar Z-fighting
        obj.position.multiplyScalar(1.001);
      });

  // Dependencias: se re-ejecuta si cambian los satélites o el flag
  }, [satelites, showCoverageZones]); // Asegúrate que 'antenas' no esté aquí si son capas separadas

  // El div donde se renderizará el globo
  return (
    <div
      ref={globeRef}
      style={{ width: '100%', height: '100%' }} // Asegúrate de que el div tenga tamaño
    ></div>
  );
}

export default Globo;