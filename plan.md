# Plan 001 — Mapa de calor de sesiones de estudio

## Archivos creados o modificados

| Archivo | Responsabilidad | RF cubiertas |
|---------|----------------|-------------|
| `docs/001-heat-map/spec.md` | Especificación completa del feature: contexto, usuarios, historias, requisitos funcionales (RF-1 a RF-4) en notación EARS, requisitos no funcionales, casos límite, fuera de alcance, criterios de finalización y dudas abiertas. | RF-1, RF-2, RF-3, RF-4 |
| `docs/001-heat-map/plan.md` | **Este plano**: define la implementación técnica, funciones puras, algoritmo, estrategia de tests. Desgloba el spec en tareas accionables. | RF-1 (base), RF-2 (lógica de color), RF-3 (agrupación por día), RF-4 (origen de datos) |
| `app.js` (modificación) | Se añaden: (1) `calcularMapaCalor(hoy, sesiones)` — función pura que recibe la fecha de hoy y el array de sesiones, retorna una matrix `{fecha, minutos}` para los últimos 14 días; (2) `obtenerSesionesValidas(sesiones)` — filtro que ignora sesiones futuras; (3) `agruparMinutosPorFecha(sesiones)` — agrega minutos por fecha única. Ninguna de estas funciones toca `localStorage` ni `DOM` directamente. | RF-4 (origen de datos estructurados) |
| `index.html` (modificación opcional) | Se podría añadir un nuevo `<section>` con el grid del mapa de calor, pero el spec define la lógica por separado. La integración de la vista depende de quien implemente la interfaz. | — (fuera del scope de la lógica) |

## Funciones puras necesarias

Todas reciben `hoy` como parámetro (objeto `Date` en hora local, sin `toISOString()` ni `new Date("AAAA-MM-DD")):

1. **`obtenerSesionesValidas(hoy, sesiones)`** — Filtra el array de sesiones para excluir aquellas cuyas fechas son posteriores a `hoy`. Recibe el array completo y retorna uno nuevo filtrado. **No toca localStorage.** Cubre RF-4 (punto final de datos limpios).

2. **`agruparMinutosPorFecha(sesionesValidas)`** — Recibe el array ya filtrado y retorna un objeto `Map<string, number>` donde la clave es `AAAA-MM-DD` (formato string en hora local) y el valor es la suma de minutos para esa fecha. **No realiza ninguna operación de Date** más allá de usar la string `fecha` ya existente del objeto sesión. Cubre RF-3 (minutos sumados por día).

3. **`calcularMapaCalor(hoy, sesionesAgrupadas)`** — **La función pura central**. Recibe:
   - `hoy`: objeto `Date` en hora local (midnight, setHours 0:00).
   - `sesionesAgrupadas`: `Map<string, number>` de `obtenerSesionesValidas`.
   
   Retorna un **array** de 14 objetos `{fechaString, minutos, intensidad}` donde:
   - `fechaString` es `AAAA-MM-DD` para cada uno de los 14 días (hoy + 13 días hacia atrás).
   - `minutos` es el total de minutos para ese día (0 si no hay sesión).
   - `intensidad` es un número 0-3 que mapea al esquema de colores: 0 = gray/desactivado, 1 = base, 2 = medio, 3 = saturado.
   
   **Restricciones**: Sin `toISOString()`, sin `new Date()`, sin `localStorage`, sin `DOM`. Solo aritmética de strings y comparaciones numéricas simples. Cubre RF-2 (intensidad de color) y RF-3 (agrupación).

## Algoritmo del mapa de calor (pseudocódigo)

```
FUNCIÓN calcularMapaCalor(hoy, sesionesAgrupadas):
    resultado = array VACÍO
    
    PARA i desde 0 HASTA 13:
        fechaDía = RESTAR_DÍAS(hoy, i)  // resta i días a "hoy", respetando hora local
        fechaString = FORMAT_FECHA_ LOCAL(fechaDía)  // "AAAA-MM-DD" usando getters puros
        
        minutos = 0
        SI sesionesAgrupadas.tiene_clave(fechaString):
            minutos = sesionesAgrupadas.obtener(fechaString)
        
        SI minutos == 0:
            intensidad = 0
        SI_MINUTO <= 15:
            intensidad = 1
        SI_MINUTO <= 60:
            intensidad = 2
        SINO:
            intensidad = 3
        
        ALFINAL resultado.APENDER({fechaString, minutos, intensidad})
    FIN PARA
    
    RETORNAR resultado
FIN FUNCIÓN
```

**Notas del algoritmo**:
- `RESTAR_DÍAS(date, n)` debe implementarse **solo con setDate y setHours sobre una copia**, nunca con `setMonth` ni cálculos de zona horaria. La constitución prohíbe `toISOString()`.
- `FORMAT_FECHA_LOCAL(date)` usa `date.getFullYear()`, `date.getMonth() + 1`, `date.getDate()` con `String.padStart(2, '0')`.
- El array siempre tiene exactamente 14 elementos: índice 0 = hoy, índice 13 = hace 13 días.
- Las sesiones futuras ya fueron eliminadas por `obtenerSesionesValidas` antes de llegar a esta función.

## ¿Cómo se pinta en la interfaz?

El spec define la **lógica por separado de la interfaz** (constitución pto. 3). El flujo de pintura es:

1. **En `init()` o un handler de vista**: `const sesiones = JSON.parse(localStorage.getItem('diario-estudio')) || []`
2. **`const sesionesValidas = obtenerSesionesValidas(hoy, sesiones)`** — capa de presentación, no la función pura.
3. **`const mapa = calcularMapaCalor(hoy, sesionesAgrupadas)`** — aquí `sesionesAgrupadas` es el Map resultante de `agruparMinutosPorFecha(sesionesValidas)`.
4. **En el template HTML**: un `<grid>` de 14 celdas, donde cada celda `i` tiene:
   - `data-día = i` (0 = hoy, 13 = hace 13 días)
   - `class = "dia-" + mapa[i].intensidad` (clases CSS: `.dia-gris`, `.dia-base`, `.dia-medio`, `.dia-saturado`)
   - Contenido: `${mapa[i].minutos} min` o vacío/gris si 0
5. **CSS define el gradiente**: `.dia-gris { background: #e0e0e0; }`, `.dia-base { background: #a8e6cf; }`, `.dia-medio { background: #5dd9c6; }`, `.dia-saturado { background: #2c9a6f; }` — colores primavera-verde tipo GitHub.

**Nota**: La constitución dice "sin dependencias ni build". El CSS va en `styles.css` o en un `<style>` block. No se usan librerías de date formatting ni de UI.

## Decisiones técnicas y alternativas descartadas

| Decisión | Justificación | Alternativa descartada |
|----------|---------------|-----------------------|
| **Grid fijo de 14 columnas** (hoy + 13 días) | Cumple RF-1 exactamente "últimas 2 semanas". Fácil de implementar con grid CSS o table semántica. | Grid responsive con número variable de columnas dependiendo del ancho de pantalla. Descartado por "simplicidad primero" y requisito explícito de "últimas 2 semanas". |
| **Intensidad basada en umbrales fijos (0, 15, 60)** | Valores redondos, prácticos (Pomodoro 25 min, bloque completo 45-60 min). Fácil de explicar al usuario. | Gradient continuo por porcentaje de minutos. Descartado por complejidad y alineación con el principio de "código simple, nombres descriptivos y comentarios solo donde aporte". |
| **Funciones puras que reciben `hoy` y `sesiones`** | Alinea con constitución pto. 3: "lógica separada de interfaz". Permite tests con `node --test` sin DOM ni localStorage. | Funciones que lean directo de `localStorage` o usen `Date.now()`. Descartado por violar la constitución y prohibir tests en rojo. |
| **Orden del grid: hoy = columna 1** | Experiencia de usuario: ver primero el día actual. Coherente con cómo se muestran las rachas (hoy a la izquierda). | Orden inverso (hace 14 días a la izquierda). Descartado por usabilidad y consistencia con el flujo natural de "hoy primero". |
| **Ignorar sesiones futuras en `obtenerSesionesValidas`** | Constitución pto. 5: "fechas siempre en hora local. Nunca se pierde una sesión. Sesiones futuras no suman" (del AGENTS.md). | Incluir sesiones futuras para completar el grid. Descartado por regla de negocio explícita y conflicto con la Constitución. |

## Estrategia de tests con `node --test`

El spec incluye en criterios de finalización: *"Pruebas unitarias con `node --test` pasan para los casos de cálculo básicos"*.

La estrategia es:

1. **Archivo de tests**: `heat-map.test.mjs` (o `.js` con type module) en el directorio del spec o paralelo a `app.js`.
2. **Modo estricto**: Usar `import`/`export` (sin `type="module"` en HTML, sino en tests node).
3. **Cases de test** (mínimo pasando):

   - **Test 1**: `calcularMapaCalor(hoy, mapaVacio)` → retorna array de 14 objetos con `minutos: 0, intensidad: 0`. Cubre caso "usuario nuevo sin datos".
   
   - **Test 2**: `calcularMapaCalor(hoy, mapaUnDía)` → un solo día (hoy) tiene 30 minutos, los otros 13 tienen 0. Verifica que hoy tenga `intensidad: 1` y los demás `intensidad: 0`.
   
   - **Test 3**: `calcularMapaCalor(hoy, mapaMultiplesDías)` → sesiones en hoy (60 min) y hace 2 días (20 min). Verifica intensidades: hoy=3, hace 2 días=1, resto=0.
   
   - **Test 4**: `obtenerSesionesValidas(hoy, sesionesConFuturo)` → array que incluye solo sesiones con fecha ≤ hoy. Descarta sesiones mañana/tras.
   
   - **Test 5**: `agruparMinutosPorFecha(sesiones)` → objeto Map con claves `AAAA-MM-DD` y sumas correctas. Verifica que sesiones mismas fecha se sumen.

4. **Ejecutar**: `node --test heat-map.test.mjs`. Todos deben pasar (verde) antes de considerar el feature "terminado".
5. **Prohibido avanzar con tests en rojo**: Constitución pto. 4.

**Cobertura RF por tests**:
- Test 1 → RF-1 (grid estructura) y RF-4 (datos nulos)
- Test 2 → RF-2 (intensidad por umbral)
- Test 3 → RF-2 + RF-3 (múltiples días)
- Test 4 → RF-4 (filtro futuros)
- Test 5 → RF-3 (agrupación por fecha)

## Resumen de cumplimiento constitucional

- ✅ **Pto. 1 (Simplicidad)**: Grid fijo, umbrales claros, sin librerías, file:// compatible.
- ✅ **Pto. 2 (Spec manda)**: Todo está definido en el spec; nada se implementa sin este plan.
- ✅ **Pto. 3 (Lógica separada)**: 3 funciones puras independientes; la vista solo consume sus retornos.
- ✅ **Pto. 4 (Tests)**: Estrategia definida con `node --test`; tests obligatorios antes de considerar terminado.
- ✅ **Pto. 5 (Datos sagrados)**: `obtenerSesionesValidas` ignora futuras; `calcularMapaCalor` es predecible; compatibilidad hacia atrás si cambia el formato de `localStorage` (aunque el spec asume formato actual).
- ✅ **Pto. 6 (Idioma)**: Código en inglés; documentación y UI en español (consistente con el proyecto).

--- 

*Plan listo para guiar la implementación. Los próximos pasos son: 1) crear `heat-map.test.mjs` y verificar que los tests pasen, 2) añadir las 3 funciones puras a `app.js`, 3) integrar el grid HTML en `index.html` (quienese decida añadir la vista), 4) definir los valores exactos de `$MINIMO` y `$MAXIMO` del gradiente (duda abierta del spec).*