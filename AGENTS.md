# AGENTS.md — Diario de Estudio
Web estática para registrar sesiones de estudio y motivarse viendo la racha de días
seguidos. Proyecto didáctico: el código debe poder entenderlo alguien que empieza a
programar.

## Stack y estructura
- HTML, CSS y JavaScript puros: sin frameworks, librerías, npm, bundler ni build.
- `index.html` (estructura), `styles.css` (estilos), `app.js` (lógica y datos).
- Debe funcionar abriendo `index.html` con doble clic (`file://`): nada de módulos ES
(`type="module"`), `fetch` a archivos locales ni nada que requiera servidor.

## Convenciones
- Textos de la interfaz en español.
- Código simple, nombres descriptivos y comentarios solo donde aporten.
- Diseño limpio y responsive; cualquier pantalla nueva debe verse bien en el móvil.

## Responsive (criterio medible, no breakpoints inventados)
- Mide con DevTools: a **320 px y 375 px**, `document.documentElement.scrollWidth` ≤
  `clientWidth` (sin scroll horizontal) y ningún elemento se sale del ancho visible.
- **Ojo:** `resize_page` de DevTools no baja de ~501 px. Para medir 320/375 px de verdad hay
  que usar `emulate viewport`.
- El criterio se cumple con ancho fluido y `max-width: 100 %`; las media queries solo donde de
  verdad hacen falta (ahora, el mapa de calor, que con 14 columnas no cabe en móvil).
- El ancho de contenido lo fija `main.container { max-width: 800px; margin-inline: auto; }`.

## Datos
- localStorage, clave `diario-estudio`: array de `{ fecha: "AAAA-MM-DD", tema, minutos, apuntes? }`.
- `apuntes` es opcional (string, máx 2000 chars). Si falta, se trata como `""`.
- Si cambias la forma de los datos, mantén compatibilidad con lo ya guardado o el usuario
perderá sus sesiones.

## Fechas y racha (fácil equivocarse)
- Trabaja siempre con la fecha local del usuario. Nunca uses `toISOString()` ni `new
Date("AAAA-MM-DD")`: se interpretan en UTC y desplazan el día.
- **Racha actual** = días consecutivos con ≥1 sesión que terminan hoy. Si hoy no hay sesión
pero ayer sí, la racha sigue viva y se cuenta desde ayer.
- **Mejor racha** = secuencia más larga de días consecutivos en todo el historial
(`calcularMejorRacha()`). Se recalcula en cada render; no se persiste aparte.
- Varias sesiones el mismo día cuentan como un solo día. Las fechas futuras no suman.

## Tema (claro/oscuro)
- Clave localStorage: `diario-estudio-tema` (`"light" | "dark"`)
- Inicialización en `initTheme()`: `prefers-color-scheme` → localStorage → light
- `applyTheme(theme)` setea `document.documentElement.dataset.theme` y actualiza SVG del botón
- Variables CSS en `:root` (light) y `[data-theme="dark"]` (dark)
- Las transiciones son puntuales (0.2 s) y están en el elemento que las necesita. **No hay
  ninguna transición global**: hay una regla `prefers-reduced-motion: reduce` que las anula.
- Botón en header con `aria-label` y `aria-pressed`, SVG inline (`SUN_SVG` / `MOON_SVG`)

## Objetivo semanal (lógica pura duplicada)
- Los objetivos van en su **propia clave**, `diario-estudio-objetivos`, indexados por la fecha
  del **lunes** de cada semana: `{"2026-09-28": 300}`. No se mezclan con las sesiones.
- Semana = lunes a domingo en **hora local**. La clave ordena como texto, así que los límites
  se comparan con `<` y `<=` sin convertir a fecha.
- El cálculo va en **funciones puras** en `docs/NNN-*/pure/*.mjs` (con `export`, para poder
  testearlas) y se **copia sin `export`** al final de `app.js`. **Ojo: la copia no puede llevar
  `export`**, un `<script>` normal no admite esa sintaxis y saltaría un `SyntaxError` que
  rompería la página entera al abrirla con doble clic. Si tocas una, toca la otra.
- En la copia se reutilizan `fechaAString()` y `stringAFecha()` de `app.js` en vez de duplicarlas.
- El acceso al almacenamiento y el `JSON.parse` son de `app.js`, nunca de las funciones puras.

## Forma de trabajar
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.

## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones
tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su
porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de
dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales). 

## Comandos
- Tests: `node --test`

## Reglas
- Lee la spec activa (`specs/NNN-*/`) y su `plan.md` antes de tocar código.

## Límites
- ✅ Siempre: respetar las reglas de fechas y racha, mantener los textos en español.
- ✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea. 
- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias, frameworks o un paso de build.


## Cambios habituales
- **Borrar sesión:** añadir botón en `render()`, hacer `splice` en `sesiones`, llamar `guardarDatos()` y `render()`
- **Editar sesión:** rellenar el formulario con los datos existentes y marcar `form.dataset.editIdx` con el índice, alternando el botón entre "Guardar sesión" y "Actualizar sesión"
- **Cambiar lógica de racha:** modificar `calcularRacha()` o `calcularMejorRacha()` — ambas usan `Set` de strings de fecha, recorren hacia atrás (actual) o escanean todo el historial ordenado (mejor)
- **Añadir/editar apuntes:** campo opcional `apuntes` en datos, textarea colapsable en form (`hidden` + botón toggle), render truncado a ~3 líneas con botón "Ver más", edición inline (textarea + guardar/cancelar), compatibilidad lectura `s.apuntes || ''`
- **Objetivo de la semana:** `renderObjetivoSemana()` pinta la sección; se llama desde `init()`, desde `handleSubmit()` y desde el botón de borrar sesión. La semana a mostrar sale de `semanaSeleccionada || fechaAString(lunesDe(hoyLocal()))`: si es `null` se sigue la semana en curso y si no, se queda en la semana anterior elegida. Cambiar de semana = mover el lunes 7 días con `sumarDias()`, nunca sumando milisegundos.

## Verificación
- **Hay tests automáticos**: la lógica pura de `docs/NNN-*/` se testea con `node --test` desde
  la raíz del proyecto. Ahora mismo son 69 en verde. No hay framework ni `package.json`. Los
  **ficheros de test** van en `.mjs`, porque la extensión fuerza módulo ES en cualquier versión
  de Node; `heat-map.pure.js` sigue en `.js` (funciona porque Node ≥ 22.7 detecta el módulo).
- Los tests **también** usan fechas locales (`new Date(año, mes-1, día)` + `setHours(0,0,0,0)`),
  nunca `toISOString()` ni `new Date("AAAA-MM-DD")`: un test con UTC puede pasar en tu huso y
  fallar en otro.
- Ojo con los recuentos: `heat-map.test.mjs` no usa `node:test`, así que el runner lo cuenta
  como **1** test, no como sus 5 checks internos.
- Lo que los tests **no** cubren (el DOM, el almacenamiento, el diseño) se verifica con el MCP
  de Chrome DevTools: abre `index.html` por `file://`, prueba la funcionalidad, **mira la
  consola en cada estado** (cero errores y cero warnings) y mide la vista móvil.
- Para empezar de cero: DevTools → Application → Local Storage → borrar las claves
  `diario-estudio` y `diario-estudio-objetivos`. 
