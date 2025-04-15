# Resumen de Progreso - Tarea 2: "Houston, we have a problem"

Este documento resume el estado actual de la Tarea 2, basado en los requisitos del enunciado, la rúbrica de evaluación y el código desarrollado hasta ahora.

**Última actualización:** 15 de Abril de 2025

## I. Requisitos Generales y Entorno

* **Framework Web:** Se está utilizando React. (`Hecho`)
* **Conexión WebSocket:** Conexión establecida y funcional usando `useWebSocket`. (`Hecho - Rúbrica: 0.3/0.3 pts`)
* **Autenticación:** Mensaje `AUTH` enviado al conectar. (`Hecho`)
* **Gestión de Estado:** Se utiliza `useReducer` para manejar el estado de los satélites. (`Hecho`)
* **Versionamiento Git:** Asumido como requisito cumplido por el estudiante. (`Pendiente Verificación`)
* **Despliegue Público:** Asumido como requisito a cumplir por el estudiante (Netlify, Vercel, etc.). (`Pendiente`)

## II. Estado de los Componentes Mínimos (Según Rúbrica y Enunciado)

### A. Globo Terráqueo (`Globo.jsx`)

* **Mostrar Globo Interactivo:** Se muestra el globo usando `globe.gl`, con rotación automática. (`Hecho - Rúbrica: 0.2/0.2 pts`)
* **Mostrar Satélites en Tiempo Real:**
    * Se obtienen IDs (`SATELLITES`) y detalles (`SATELLITE-STATUS`). (`Hecho`)
    * Los puntos se actualizan en el globo cuando cambian los datos (`pointsData`). (`Hecho`)
    * La altitud visual es ajustable y representa la órbita (no pegado a la superficie). (`Hecho`)
    * *Estado Rúbrica: `Hecho - Rúbrica: 0.4/0.4 pts`*
* **Color de Satélites por Tipo:** Los satélites se muestran actualmente todos en verde (`lime`). (`Pendiente - Rúbrica: 0/0.2 pts`)
    * *Acción:* Modificar `.pointColor()` en `Globo.jsx` para usar `d.type` y asignar un color a cada tipo (COM, SCI, NAV, SPY).
* **Mostrar Antenas DSN:** El componente `Globo.jsx` tiene la lógica para mostrar una capa personalizada (`customLayerData`) con esferas amarillas si recibe datos en la prop `antenas`. (`Parcial - Rúbrica: 0/0.2 pts`)
    * *Acción:* Definir los datos estáticos de las 3 antenas (Goldstone, Madrid, Canberra) con sus coordenadas en el componente padre (`App2.jsx` o similar) y pasarlos como prop `antenas` a `<Globo />`.
* **Mostrar Sitios de Lanzamiento Activos:** (`Pendiente - Rúbrica: 0/0.4 pts`)
    * *Acción:*
        1.  Manejar el evento `LAUNCHSITES` en `handleMessage` para recibir y almacenar la lista de sitios.
        2.  Crear una nueva capa en `Globo.jsx` (ej: `labelsLayer` o `customLayerData`) para mostrar estos sitios (ej: como puntos o etiquetas).
* **Zonas de Cobertura Satelital:**
    * Se dibujan círculos (`customLayerData` con `CircleGeometry`) centrados en lat/lon del satélite. (`Hecho`)
    * El radio se calcula usando `power` (en km) y un factor de conversión. (`Hecho`)
    * Botón para Mostrar/Ocultar zonas. (`Pendiente`)
    * *Estado Rúbrica: `Parcial - Rúbrica: ~0.2/0.4 pts`*
    * *Acción:* Añadir un estado (`useState`) en el componente padre para controlar la visibilidad y un botón que cambie ese estado. Pasar el estado como prop `showCoverageZones` a `<Globo />`.
* **Cálculo Cobertura Antena (Click):** (`Pendiente - Rúbrica: 0/0.4 pts`)
    * *Acción:*
        1.  Añadir manejo de clics a las antenas en `Globo.jsx` (ej: usando `onCustomLayerClick`).
        2.  Implementar la lógica para encontrar satélites cercanos (comparar distancia punto-centro vs radio=power).
        3.  Implementar la fórmula de cálculo de señal.
        4.  Mostrar un panel informativo con los resultados.
* **Arco de Lanzamiento (Evento `LAUNCH`):** (`Pendiente - Rúbrica: 0/0.4 pts`)
    * *Acción:*
        1.  Manejar el evento `LAUNCH` en `handleMessage` para obtener `satellite_id`, `launchsite_id`, `debris_site`.
        2.  Almacenar esta información temporalmente asociada al `satellite_id`.
        3.  Usar `arcsLayer` o `linesLayer` en `Globo.jsx` para dibujar el arco/línea desde el sitio de lanzamiento hasta `debris_site` mientras el `status` del satélite sea `launched`.
        4.  Manejar el evento `IN-ORBIT` para quitar el arco cuando el satélite llegue a órbita.
* **Información del Satélite (Click):**
    * Click en botón de la tabla muestra JSON en `SatInfoPanel`. (`Hecho - Parcial`)
    * Click en el punto del satélite en el globo. (`Pendiente`)
    * *Estado Rúbrica: `Parcial - Rúbrica: ~0.2/0.4 pts`*
    * *Acción:*
        1.  Añadir manejo de clics a los puntos en `Globo.jsx` (ej: `onPointClick`).
        2.  Mejorar `SatInfoPanel` para mostrar la información formateada en lugar de JSON crudo.
* **Realces Visuales (Eventos):** (`Pendiente - Rúbrica: 0/0.4 pts`)
    * *Acción:*
        1.  Manejar eventos `LAUNCH` y `CATASTROPHIC-FAILURE`.
        2.  Implementar lógica para realces temporales en `Globo.jsx` (ej: cambiar color/tamaño de punto, añadir anillo temporal).

### B. Tablero Informativo (Tabla - `SatTable.jsx`)

* **Mostrar Tabla:** Existe el componente `SatTable`, pero solo muestra ID y botón. (`Parcial - Rúbrica: ~0.1/0.5 pts`)
    * *Acción:* Modificar `SatTable.jsx` para recibir la lista completa de satélites (`Object.values(state.satellites)`) y mostrar todas las columnas requeridas (id, Bandera+Org, Misión, Nombre Sat, Fecha Lanz, Tipo, Potencia, Vida Útil).
* **Orden y Filtrado:** (`Pendiente - Rúbrica: 0/0.3 pts`)
    * *Acción:* Implementar lógica de ordenamiento (por altitud) y filtrado (por país/misión) en el componente padre antes de pasar los datos a `SatTable`, y añadir controles de UI para los filtros.
* **Mostrar Banderas:** (`Pendiente - Rúbrica: 0/0.2 pts`)
    * *Acción:* Obtener `country_code` de los datos del satélite y usar una API/servicio (FlagCDN, etc.) o mapeo local para mostrar la imagen de la bandera en la tabla.

### C. Chat

* **Funcionalidad Básica:** (`Pendiente - Rúbrica: 0/0.5 pts`)
    * *Acción:* Crear componente de Chat, manejar evento `COMM` entrante, almacenar mensajes, implementar input para enviar mensajes `COMM` salientes.
* **Formato del Chat:** (`Pendiente - Rúbrica: 0/0.3 pts`)
    * *Acción:* Asegurar que se muestre fecha/hora, emisor, y que los mensajes con `level: "warn"` se vean en rojo.

### D. General

* **Usabilidad:** Estructura básica funcional, pero requiere mejoras generales. (`Parcial - Rúbrica: ~0.1/0.5 pts`)
    * *Acción:* Mejorar layout, añadir manejo visual de errores/carga, asegurar navegación intuitiva.

### E. Bonus

* **Mostrar ISS:** (`Pendiente - Rúbrica: 0/0.5 pts`)
    * *Acción:* Investigar e implementar llamada a API de NASA (`api.nasa.gov`) para obtener posición de la ISS y mostrarla de forma destacada en el globo.

## III. Resumen del Estado Actual

Se ha establecido con éxito la conexión WebSocket y la autenticación. Se recibe la lista inicial de satélites y se solicitan y reciben sus detalles completos. El estado se maneja centralizadamente con `useReducer`. La visualización del globo muestra los satélites como puntos en órbita con altitud escalada visualmente y puede mostrar zonas de cobertura circulares (radio=power).

Las principales áreas pendientes son la implementación completa de la Tabla de Satélites (columnas, orden, filtro, banderas), el sistema de Chat (recepción, envío, formato), las interacciones específicas en el globo (clicks en antenas/satélites, arcos de lanzamiento, realces visuales), y la visualización de sitios de lanzamiento y antenas DSN.

## IV. Próximos Pasos / Pendiente (Priorizado aprox. por Rúbrica)

1.  **Tabla - Mostrar Tabla Completa (0.5 pts):** Modificar `SatTable` para mostrar todas las columnas requeridas.
2.  **Chat - Funcionalidad Básica (0.5 pts):** Crear componente, recibir/enviar mensajes `COMM`.
3.  **Globo - Sitios de Lanzamiento (0.4 pts):** Manejar evento `LAUNCHSITES`, mostrar en globo.
4.  **Funcionalidad - Zonas Cobertura (Botón) (0.2 pts / restante de 0.4):** Añadir botón y estado para toggle.
5.  **Funcionalidad - Cobertura Antena (Click) (0.4 pts):** Implementar click en antenas y cálculo de señal.
6.  **Funcionalidad - Arco LAUNCH (0.4 pts):** Manejar evento `LAUNCH`, dibujar/quitar arco.
7.  **Funcionalidad - Click en Satélite (Globo) (0.2 pts / restante de 0.4):** Añadir `onPointClick` en globo.
8.  **Funcionalidad - Realces Visuales (0.4 pts):** Manejar `LAUNCH`/`CATASTROPHIC-FAILURE` y mostrar realces.
9.  **Tabla - Orden y Filtrado (0.3 pts):** Implementar lógica y UI.
10. **Chat - Formato (0.3 pts):** Aplicar formato requerido a mensajes.
11. **Globo - Color por Tipo (0.2 pts):** Cambiar lógica de `.pointColor`.
12. **Globo - Antenas DSN (Datos) (0.2 pts):** Definir y pasar datos de antenas.
13. **Tabla - Banderas (0.2 pts):** Implementar visualización de banderas.
14. **General - Usabilidad (0.4 pts / restante de 0.5):** Mejoras generales de UI/UX.
15. **Bonus - ISS (0.5 pts):** Implementar API NASA para ISS.

