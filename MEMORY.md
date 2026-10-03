# MEMORY.md — Diario de Estudio

Memoria del proyecto entre sesiones. Máximo ~50 líneas: resume o elimina lo que no
aporte.

## Estado actual
- v4: registrar sesiones (fecha, tema, minutos), apuntes por sesión (opcional), racha
  actual, mejor racha, días este mes, tema claro/oscuro, mapa de calor de 14 días,
  editar/borrar sesión, y **objetivo semanal** (fijar, editar y borrar por semana, barra de
  progreso, navegación entre semanas, estado "Objetivo cumplido").
- Tres claves en localStorage: `diario-estudio` (sesiones), `diario-estudio-tema`,
  `diario-estudio-objetivos` (objetivos por semana).
- Lógica pura con tests: `docs/001-heat-map/` y `docs/002-objetivo-semanal/`. `node --test`
  = 69 (68 del objetivo + el fichero del mapa de calor, que cuenta como 1).

## Decisiones (y por qué)
- Sin backend ni dependencias: cualquiera debe poder abrirlo con doble clic.
- Fecha editable en el formulario: permite registrar días pasados y ver la racha crecer.
- **Objetivos en clave aparte**, indexados por la fecha del lunes de cada semana
  (`{"2026-09-28": 300}`). El lunes porque ya hay que calcularlo para los límites, ordena
  como texto y evita las reglas del número ISO de semana. Así tocar los objetivos no
  arriesga los datos ya guardados.
- **Seción del objetivo** entre las sesiones y el mapa de calor: se interpreta contra las
  sesiones ya registradas, que se leen justo antes.
- **Lógica pura duplicada** (fichero con `export` para los tests + copia SIN `export` al
  final de `app.js`): un `<script>` normal no admite `export`; con él saltaría un
  `SyntaxError` y la página entera dejaría de funcionar al abrir con doble clic.
- **Tests en `.mjs`**, no en `.js`: la extensión fuerza módulo ES en cualquier Node. El
  precedente de 001 importa un `.js` con `export` sin `package.json`, y eso solo funciona con
  Node ≥ 22.7 (falla en Node 20 LTS).
- **Validar con regex `/^\d+$/` antes de `parseInt`**: ver abajo.
- **Tema:** SVG inline, `prefers-color-scheme` → localStorage → light. Botón con
  `aria-label`/`aria-pressed`. **Apuntes:** campo opcional, texto plano con `escapeHtml`,
  truncado por `scrollHeight` con "Ver más", edición inline. Compatibilidad: `s.apuntes || ''`.

## Aprendizajes y errores a evitar
- Fechas siempre locales, **también en los tests**: `new Date(y, m-1, d)` + `setHours(0,0,0,0)`,
  nunca `toISOString()` ni `new Date("AAAA-MM-DD")` (UTC). Un test con UTC puede pasar en tu
  huso y fallar en otro: daría una falsa confianza.
- `parseInt("1e3")` da `1` y `Number("1e3")` da `1000`: los dos aceptarían un valor que hay
  que rechazar. Por eso la regex va ANTES de convertir.
- `<input type="number">` **borra por su cuenta** lo que no es número (`300,5`, `300 min`,
  `Infinity`, `NaN`): el campo queda vacío sin que el código haga nada. La validación propia
  sigue haciendo falta.
- `heat-map.test.mjs` no usa `node:test`, así que `node --test` lo cuenta como **1** test, no
  como sus 5 checks internos. No des por buenos los recuentos: compruébalos.
- `resize_page` de DevTools no baja de ~501 px: para medir 320/375 px de verdad hay que usar
  `emulate viewport`. Con el almacenamiento vacío hay fallos del mapa de calor que no se ven.
- Medir el contraste WCAG antes de fijar un color de texto: el dorado (`--gold`) sobre el
  crema del tema claro da solo 2.6:1 y no cumple AA. Para texto, `--ink`.