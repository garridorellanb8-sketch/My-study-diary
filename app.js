// Utilidades de fecha local (sin bugs de UTC)
// NUNCA se usa new Date(y, m, d) ni toISOString() por interpretación en UTC
// En su lugar: getters locales + setHours(0,0,0,0) para medianoche local

function hoyLocal() {
  const ahora = new Date();
  const inicio = new Date(ahora.getTime());
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

function fechaAString(fecha) {
  // Usa getters locales para respetar la zona horaria del usuario
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function stringAFecha(str) {
  const [y, m, d] = str.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  // Normalizar a medianoche en zona local para evitar desplazamientos UTC
  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

function formatearFecha(fecha) {
  return fecha.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

// Estado
let sesiones = [];
// La semana que se está mostrando. Si es null, se sigue la semana en curso.
// Nunca se guarda en el almacenamiento: al recargar se vuelve a la actual (CF-7).
let semanaSeleccionada = null;
// Mensaje de confirmación tras guardar un objetivo. Vacío = no se muestra nada.
let mensajeObjetivo = '';

// DOM
const form = document.getElementById('session-form');
const dateInput = document.getElementById('date');
const topicInput = document.getElementById('topic');
const minutesInput = document.getElementById('minutes');
const notesInput = document.getElementById('notes');
const notesToggle = document.getElementById('notes-toggle');
const notesGroup = document.getElementById('notes-group');
const sessionsList = document.getElementById('sessions-list');
const emptyMessage = document.getElementById('empty-message');
const streakCurrent = document.getElementById('streak-current');
const streakBest = document.getElementById('streak-best');
const streakMonth = document.getElementById('streak-month');
const themeToggle = document.getElementById('theme-toggle');

// DOM de la sección "Objetivo de la semana"
const objetivoForm = document.getElementById('objetivo-form');
const objetivoInput = document.getElementById('objetivo-minutos-input');
const objetivoRango = document.getElementById('objetivo-rango');
const objetivoProgreso = document.getElementById('objetivo-progreso');
const objetivoBarra = document.getElementById('objetivo-barra');
const objetivoRelleno = document.getElementById('objetivo-barra-relleno');
const objetivoMinutos = document.getElementById('objetivo-minutos');
const objetivoCumplido = document.getElementById('objetivo-cumplido');
const objetivoSinObjetivo = document.getElementById('objetivo-sin-objetivo');
const objetivoSinObjetivoMinutos = document.getElementById('objetivo-sin-objetivo-minutos');
const objetivoError = document.getElementById('objetivo-error');
const objetivoGuardado = document.getElementById('objetivo-guardado');
const objetivoBorrar = document.getElementById('objetivo-borrar');
const objetivoAnterior = document.getElementById('objetivo-semana-anterior');
const objetivoSiguiente = document.getElementById('objetivo-semana-siguiente');

// SVG icons (outline style, stroke="currentColor" hereda color del texto)
const SUN_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;

const MOON_SVG = `<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

// Inicialización
function init() {
  initTheme();
  cargarDatos();
  dateInput.value = fechaAString(hoyLocal());
  render();
  generarMapaCalor();
  renderObjetivoSemana();
  form.addEventListener('submit', handleSubmit);
  themeToggle.addEventListener('click', toggleTheme);
  notesToggle.addEventListener('click', toggleNotes);
  objetivoForm.addEventListener('submit', handleGuardarObjetivo);
  objetivoBorrar.addEventListener('click', handleBorrarObjetivo);
  objetivoAnterior.addEventListener('click', handleSemanaAnterior);
  objetivoSiguiente.addEventListener('click', handleSemanaSiguiente);
  // Al tocar el campo se limpia el mensaje de error, pero se conserva lo escrito
  objetivoInput.addEventListener('input', handleObjetivoInput);
}

// Tema claro/oscuro
function initTheme() {
  const saved = localStorage.getItem('diario-estudio-tema');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem('diario-estudio-tema', theme);
  themeToggle.innerHTML = theme === 'dark' ? SUN_SVG : MOON_SVG;
  themeToggle.setAttribute('aria-pressed', theme === 'dark');
  themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

function toggleNotes() {
  const isHidden = notesGroup.hidden;
  notesGroup.hidden = !isHidden;
  notesToggle.textContent = isHidden ? 'Ocultar apuntes' : 'Añadir apuntes';
  if (!isHidden) {
    notesInput.focus();
  }
}

// localStorage
function cargarDatos() {
  const guardado = localStorage.getItem('diario-estudio');
  if (guardado) {
    try {
      sesiones = JSON.parse(guardado);
    } catch {
      sesiones = [];
    }
  }
}

function guardarDatos() {
  localStorage.setItem('diario-estudio', JSON.stringify(sesiones));
}

// ── Objetivos semanales ──
// Van en su propia clave, separada de las sesiones: los datos ya guardados no
// se tocan ni se migran (CF-14).
const CLAVE_OBJETIVOS = 'diario-estudio-objetivos';

// Devuelve el texto guardado, o null si no hay nada.
// Aquí solo se LEE del almacenamiento; convertirlo en objeto es de otra función.
function obtenerTextoObjetivos() {
  return localStorage.getItem(CLAVE_OBJETIVOS);
}

// Convierte el texto guardado en un objeto de objetivos ya saneado.
// El JSON.parse va aquí, en la capa del navegador, y no en las funciones puras
// (CF-39). Si el texto está corrupto se devuelve un objeto vacío en vez de
// romper la aplicación (CF-16).
function leerObjetivosGuardados() {
  const texto = obtenerTextoObjetivos();
  if (!texto) return {};
  try {
    return sanearObjetivos(JSON.parse(texto));
  } catch {
    return {};
  }
}

// Guarda el objeto de objetivos que se le pase.
function guardarObjetivos(objetivos) {
  localStorage.setItem(CLAVE_OBJETIVOS, JSON.stringify(objetivos));
}

// Racha: días consecutivos con sesión que terminan HOY (o ayer si hoy no hay sesión aún)
// Usa getters locales para evitar desplazamientos UTC
function calcularRacha() {
  if (sesiones.length === 0) return 0;

  const diasConSesion = new Set(sesiones.map(s => s.fecha));

  // Obtener hoy y ayer usando funciones locales (sin bugs UTC)
  const hoy = hoyLocal();
  const hoyStr = fechaAString(hoy);

  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  const ayerStr = fechaAString(ayer);

  // ¿Hay sesión hoy?
  const hayHoy = diasConSesion.has(hoyStr);

  // Empezamos a contar desde hoy si hay sesión, si no desde ayer
  let cursor = hayHoy ? hoy : ayer;
  let racha = 0;

  // Avanzar hacia atrás un día a la vez, usando setDate en un objeto Date copiado
  while (diasConSesion.has(fechaAString(cursor))) {
    racha++;
    const cursorCopy = new Date(cursor);
    cursorCopy.setDate(cursorCopy.getDate() - 1);
    cursorCopy.setHours(0, 0, 0, 0);
    cursor = cursorCopy;
  }

  return racha;
}

// Mejor racha: la secuencia más larga de días consecutivos en todo el historial
function calcularMejorRacha() {
  if (sesiones.length === 0) return 0;

  // Días únicos con sesión, ordenados de más antiguo a más reciente
  // Usa stringAFecha que normaliza a medianoche local
  const diasUnicos = [...new Set(sesiones.map(s => s.fecha))]
    .map(stringAFecha)
    .sort((a, b) => a - b);

  let mejor = 1;
  let actual = 1;

  for (let i = 1; i < diasUnicos.length; i++) {
    const diff = (diasUnicos[i] - diasUnicos[i - 1]) / (1000 * 60 * 60 * 24);
    // Usa Math.round para manejar posibles diferencias menores/mayor a 1ms por DST
    if (Math.round(diff) === 1) {
      actual++;
      if (actual > mejor) mejor = actual;
    } else {
      actual = 1;
    }
  }

  return mejor;
}

// Días estudiados este mes: días únicos con sesión en el mes actual (local), sin fechas futuras
function calcularDiasEsteMes() {
  if (sesiones.length === 0) return 0;

  const hoy = hoyLocal();
  const añoMesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const hoyStr = fechaAString(hoy);

  const diasEsteMes = new Set(
    sesiones
      .map(s => s.fecha)
      .filter(f => f.startsWith(añoMesActual) && f <= hoyStr)
  );

  return diasEsteMes.size;
}

// ═══════════════════════════════════════════════
// OBJETIVO SEMANAL — Toda la sección
// Las funciones puras que usa están copiadas al final de este archivo.
// ════════════════════════════════════════════════

// Devuelve la clave del lunes de la semana que se está mostrando.
// Si semanaSeleccionada es null, se sigue la semana en curso: así, si la
// semana cambia con la aplicación abierta, se salta sola a la nueva (CF-5, CF-6),
// y si el usuario está viendo una semana pasada, se queda en ella (CF-6).
function lunesMostrado() {
  return semanaSeleccionada || fechaAString(lunesDe(hoyLocal()));
}

// Texto de los minutos estudiados en una semana SIN objetivo.
// La spec pide aquí el rótulo de la semana seguido de ": X min" (CF-27), que es
// un formato distinto del "X de Y min" de la barra. Con 0 minutos no se
// muestra nada: no hay nada que celebrar.
function textoMinutosSinObjetivo(acumulado) {
  if (acumulado <= 0) return '';
  return `${objetivoRango.textContent}: ${acumulado} min`;
}

// Pinta la sección del objetivo de la semana que se está viendo.
function renderObjetivoSemana() {
  const hoy = hoyLocal();
  const lunes = lunesMostrado();

  // Rótulo de la semana: siempre visible, tenga o no objetivo.
  objetivoRango.textContent = describirRangoSemana(lunes);

  const objetivos = leerObjetivosGuardados();
  const objetivo = leerObjetivo(objetivos, lunes);
  const acumulado = acumuladoSemana(hoy, sesiones, lunes);

  if (objetivo === null) {
    // Sin objetivo fijado: NO hay barra (CF-27, CF-28). Si hay minutos
    // estudiados se muestran junto al mensaje accionable.
    objetivoProgreso.hidden = true;
    objetivoSinObjetivo.hidden = false;
    // La llamada a la acción "Fijar objetivo de esta semana" está siempre
    // escrita en el HTML y no se reescribe aquí. Los minutos van en su propio
    // elemento, que se oculta si son 0: así se ven LAS DOS COSAS a la vez
    // cuando hay minutos (CF-27).
    objetivoSinObjetivoMinutos.textContent = textoMinutosSinObjetivo(acumulado);
    objetivoSinObjetivoMinutos.hidden = acumulado <= 0;
    objetivoBorrar.hidden = true; // no hay nada que quitar (CF-47)
    objetivoInput.value = '';
  } else {
    // Con objetivo: barra de progreso y cifras reales.
    objetivoSinObjetivo.hidden = true;
    objetivoProgreso.hidden = false;

    const porcentajeActual = porcentaje(acumulado, objetivo);
    const porcentajeRedondeado = Math.round(porcentajeActual);
    // El texto lleva las cifras reales, no el porcentaje (CF-29).
    objetivoMinutos.textContent = `${acumulado} de ${objetivo} min`;

    // El ancho del relleno va en %, para que se vea la transición del CSS.
    objetivoRelleno.style.width = `${porcentajeRedondeado}%`;
    // aria-valuenow lleva el porcentaje real saturado a 100; aria-valuetext,
    // las cifras (requisito de accesibilidad).
    objetivoBarra.setAttribute('aria-valuenow', porcentajeRedondeado);
    objetivoBarra.setAttribute('aria-valuetext', `${acumulado} de ${objetivo} min`);

    // El estado cumplido se comunica con texto, nunca solo con color.
    objetivoCumplido.hidden = !cumpleObjetivo(acumulado, objetivo);

    objetivoInput.value = objetivo;
    objetivoBorrar.hidden = false;
  }

  // El mensaje de error se borra al redibujar; el de guardado se mantiene
  // hasta que el usuario toca el campo o cambia de semana (CF-10).
  objetivoError.hidden = true;
  objetivoGuardado.hidden = mensajeObjetivo === '';

  // "Semana siguiente" se deshabilita en la semana en curso (CF-41) y se
  // rehabilita en cualquier semana anterior (CF-44).
  objetivoSiguiente.disabled = lunes === fechaAString(lunesDe(hoy));
}

// Guarda el objetivo de la semana que se está viendo.
function handleGuardarObjetivo(e) {
  e.preventDefault();

  const texto = objetivoInput.value;
  const resultado = validarObjetivo(texto);

  if (!resultado.ok) {
    // No se borra lo que el usuario había escrito (CF-11): solo se muestra
    // el mensaje. El texto de error lo pone la app, no el navegador (CF-9).
    objetivoError.textContent = 'Introduce un número entero entre 1 y 100.000';
    objetivoError.hidden = false;
    objetivoGuardado.hidden = true;
    return;
  }

  const lunes = lunesMostrado();
  const objetivos = leerObjetivosGuardados();
  // Se sobrescribe solo la entrada de esta semana; las demás no se tocan (CF-17).
  objetivos[lunes] = resultado.valor;
  guardarObjetivos(objetivos);

  mensajeObjetivo = 'Objetivo guardado';
  renderObjetivoSemana();
}

// Borra el objetivo de la semana que se está viendo.
function handleBorrarObjetivo() {
  if (!confirm('¿Borrar el objetivo de esta semana?')) return;

  const lunes = lunesMostrado();
  const objetivos = leerObjetivosGuardados();
  // Solo se quita ESTA semana; ni las sesiones ni los demás objetivos cambian
  // (CF-49).
  delete objetivos[lunes];
  guardarObjetivos(objetivos);

  mensajeObjetivo = '';
  renderObjetivoSemana();
}

// Va a la semana anterior (retrocede 7 días naturales).
function handleSemanaAnterior() {
  semanaSeleccionada = fechaAString(sumarDias(stringAFecha(lunesMostrado()), -7));
  mensajeObjetivo = '';
  renderObjetivoSemana();
}

// Va a la semana siguiente (avanza 7 días naturales). Al llegar a la semana en
// curso vuelve a ser null, para seguirla si vuelve a cambiar.
function handleSemanaSiguiente() {
  const siguiente = fechaAString(sumarDias(stringAFecha(lunesMostrado()), 7));
  semanaSeleccionada = siguiente === fechaAString(lunesDe(hoyLocal())) ? null : siguiente;
  mensajeObjetivo = '';
  renderObjetivoSemana();
}

// Al tocar el campo se quitan los dos avisos: el de error y el de guardado.
function handleObjetivoInput() {
  objetivoError.hidden = true;
  objetivoGuardado.hidden = true;
  mensajeObjetivo = '';
}

// ═══════════════════════════════════════════════
// MAPA DE CALOR — Generación del grid (solo navegador)
// Usa las funciones puras para cálculo y renderiza el grid en el DOM
// ════════════════════════════════════════════════
function generarMapaCalor() {
  const grid = document.getElementById('heat-map-grid');
  if (!grid) return;

  const hoy = hoyLocal();
  const sesionesValidas = obtenerSesionesValidas(hoy, sesiones);
  const mapaMinutos = agruparMinutosPorFecha(sesionesValidas);
  const mapaCalor = calcularMapaCalor(hoy, mapaMinutos);

  grid.innerHTML = '';

  const intensidadClase = ['dia-gris', 'dia-base', 'dia-medio', 'dia-saturado'];

  for (const dia of mapaCalor) {
    const celda = document.createElement('div');
    celda.className = 'dia ' + intensidadClase[dia.intensidad];
    celda.textContent = dia.minutos > 0 ? dia.minutos + ' min' : '';
    grid.appendChild(celda);
  }
}

// Handlers
function handleSubmit(e) {
  e.preventDefault();

  const fecha = dateInput.value;
  const tema = topicInput.value.trim();
  const minutos = parseInt(minutesInput.value, 10);
  const apuntes = notesInput.value.trim();

  if (!fecha || !tema || !minutos || minutos < 1) return;

  const editIdx = form.dataset.editIdx;
  if (editIdx !== undefined) {
    // Modo edición: actualizar sesión existente
    sesiones[editIdx] = { fecha, tema, minutos, apuntes };
    delete form.dataset.editIdx;
    form.querySelector('.btn-primary').textContent = 'Guardar sesión';
  } else {
    // Modo crear: añadir nueva sesión
    sesiones.unshift({ fecha, tema, minutos, apuntes });
  }

  guardarDatos();
  render();
  generarMapaCalor();
  // El objetivo semanal se recalcula: aunque la sesión no sea de la semana
  // visible, el indicador se refresca igual (CF-23, CF-25).
  renderObjetivoSemana();

  form.reset();
  dateInput.value = fechaAString(hoyLocal());
  notesGroup.hidden = true;
  notesToggle.textContent = 'Añadir apuntes';
  topicInput.focus();
}

// Render
function render() {
  // Rachas
  streakCurrent.textContent = calcularRacha();
  streakBest.textContent = calcularMejorRacha();
  streakMonth.textContent = calcularDiasEsteMes();

  // Lista
  sessionsList.innerHTML = '';

  if (sesiones.length === 0) {
    emptyMessage.hidden = false;
    return;
  }

  emptyMessage.hidden = true;

  sesiones.forEach((s, idx) => {
    const li = document.createElement('li');
    li.className = 'session-item';
    li.dataset.idx = idx;

    const tieneApuntes = s.apuntes && s.apuntes.trim().length > 0;
    const apuntesHtml = tieneApuntes ? `
      <div class="session-notes">
        <span class="notes-text">${escapeHtml(s.apuntes)}</span>
        <div class="notes-actions">
          <button type="button" class="notes-btn notes-expand">Ver más</button>
          <button type="button" class="notes-btn notes-edit">Editar</button>
        </div>
      </div>
    ` : '';

    li.innerHTML = `
      <div class="session-header">
        <div class="session-info">
          <span class="session-date">${formatearFecha(stringAFecha(s.fecha))}</span>
          <span class="session-topic">${escapeHtml(s.tema)}</span>
        </div>
        <span class="session-minutes">${s.minutos} min</span>
      </div>
      <div class="session-actions">
        <button type="button" class="btn-secondary session-edit" title="Editar sesión">✏️</button>
        <button type="button" class="btn-secondary session-delete" title="Borrar sesión">🗑️</button>
      </div>
      ${apuntesHtml}
    `;

    sessionsList.appendChild(li);

    // Botón borrar sesión
    li.querySelector('.session-delete').addEventListener('click', () => {
      if (confirm('¿Borrar esta sesión?')) {
        sesiones.splice(idx, 1);
        guardarDatos();
        render();
        generarMapaCalor();
        renderObjetivoSemana();
      }
    });

    // Botón editar sesión
    li.querySelector('.session-edit').addEventListener('click', () => {
      // Rellenar formulario con datos existentes
      dateInput.value = s.fecha;
      topicInput.value = s.tema;
      minutesInput.value = s.minutos;
      notesInput.value = s.apuntes || '';
      notesGroup.hidden = false;
      notesToggle.textContent = 'Ocultar apuntes';
      notesInput.focus();

      // Marcar formulario como modo edición
      form.dataset.editIdx = idx;
      form.querySelector('.btn-primary').textContent = 'Actualizar sesión';
    });

    if (tieneApuntes) {
      const notesDiv = li.querySelector('.session-notes');
      const textSpan = li.querySelector('.notes-text');
      const expandBtn = li.querySelector('.notes-expand');
      const editBtn = li.querySelector('.notes-edit');

      // Detectar si el texto necesita truncado (aprox 3 líneas)
      const needsTruncate = textSpan.scrollHeight > 60; // ~3 líneas * 20px

      if (!needsTruncate) {
        expandBtn.hidden = true;
      }

      expandBtn.addEventListener('click', () => {
        const isExpanded = textSpan.classList.toggle('expanded');
        expandBtn.textContent = isExpanded ? 'Ver menos' : 'Ver más';
      });

      editBtn.addEventListener('click', () => {
        const currentNotes = s.apuntes || '';
        notesDiv.innerHTML = `
          <div class="notes-editor">
            <textarea class="notes-edit-input" id="notes-edit-input" name="apuntes" maxlength="2000">${escapeHtml(currentNotes)}</textarea>
            <div class="notes-editor-actions">
              <button type="button" class="btn-secondary notes-cancel">Cancelar</button>
              <button type="button" class="btn-primary notes-save">Guardar</button>
            </div>
          </div>
        `;
        const textarea = notesDiv.querySelector('.notes-edit-input');
        textarea.focus();

        notesDiv.querySelector('.notes-save').addEventListener('click', () => {
          sesiones[idx].apuntes = textarea.value.trim();
          guardarDatos();
          render();
        });

        notesDiv.querySelector('.notes-cancel').addEventListener('click', () => {
          render();
        });
      });
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ════════════════════════════════════════════════
// MAPA DE CALOR — LÓGICA PURA (sin DOM, sin localStorage)
// Reciben "hoy" como parámetro y operan solo con strings/arrays.
// ════════════════════════════════════════════════

// 1. Filtrar sesiones: excluir las futuras.
// Recibe el objeto hoy (Date en hora local, medianoche) y el array de sesiones.
// Retorna un array nuevo; no muta el original.
function obtenerSesionesValidas(hoy, sesiones) {
  if (!Array.isArray(sesiones)) return [];
  const hoyStr = fechaAString(hoy);
  return sesiones.filter(s => s.fecha <= hoyStr);
}

// 2. Agrupar minutos por fecha.
// Recibe el array ya filtrado de obtenerSesionesValidas.
// Retorna un Map<string, number> donde la clave es AAAA-MM-DD y el valor es la suma de minutos para esa fecha.
// No realiza operaciones de Date más allá de usar la string `fecha` existente.
function agruparMinutosPorFecha(sesionesValidas) {
  const mapa = new Map();
  for (const s of sesionesValidas) {
    const clave = s.fecha; // ya está en formato AAAA-MM-DD
    const actual = mapa.get(clave) || 0;
    mapa.set(clave, actual + s.minutos);
  }
  return mapa;
}

// 3. Calcular el mapa de calor.
// La función pura central. Recibe el objeto hoy (Date en hora local, medianoche)
// y el Map de agruparMinutosPorFecha.
// Retorna un array de exactamente 14 objetos {fechaString, minutos, intensidad}:
//   - índice 0 = hoy, índice 13 = hace 13 días.
//   - intensidad: 0 (gris/desactivado), 1 (base), 2 (medio), 3 (saturado).
//   - Umbrales: 0 min → 0; 1-15 min → 1; 16-60 min → 2; 61+ min → 3.
//   - Sin toISOString(), sin new Date(), sin localStorage, sin DOM.
function calcularMapaCalor(hoy, sesionesAgrupadas) {
  const resultado = [];
  // Para cada uno de los 14 días: hoy (índice 0) hacia atrás 13 días
  for (let i = 0; i < 14; i++) {
    // Crear la fecha del día i hacia atrás usando setDate en copia segura
    const fechaDía = new Date(hoy);
    fechaDía.setDate(fechaDía.getDate() - i);
    fechaDía.setHours(0, 0, 0, 0); // normalizar a medianoche local
    const fechaString = fechaAString(fechaDía);

    const minutos = sesionesAgrupadas.get(fechaString) || 0;
    let intensidad;
    if (minutos === 0) {
      intensidad = 0;
    } else if (minutos <= 15) {
      intensidad = 1;
    } else if (minutos <= 60) {
      intensidad = 2;
    } else {
      intensidad = 3;
    }

    resultado.push({ fechaString, minutos, intensidad });
  }
  return resultado;
}

// ════════════════════════════════════════════════
// OBJETIVO SEMANAL — LÓGICA PURA (copia sin export)
// Es el MISMO código que docs/002-objetivo-semanal/pure/objetivo-semanal.pure.mjs
// y sus tests, pero sin la palabra "export" porque un <script> normal del
// navegador no admite esa sintaxis (CF-38).
//
// OJO: si cambias estas funciones, cambia también el fichero puro de arriba
// (y sus tests), y al revés. Lo único que cambia es la palabra "export".
//
// Aquí se reutilizan las funciones de fecha que ya tenía app.js: fechaAString()
// y stringAFecha() (esta última es la misma que fechaDesdeTexto() del fichero
// puro), en vez de volver a definirlas.
// ════════════════════════════════════════════════
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// 1. Devuelve una COPIA de la fecha a medianoche hora local.
function normalizarMedianoche(fecha) {
  const copia = new Date(fecha.getTime());
  copia.setHours(0, 0, 0, 0);
  return copia;
}

// 2. Copia la fecha, le suma n días y la deja a medianoche.
// n puede ser negativo para retroceder. Nunca se suman milisegundos:
// sumar 24 h por día falla con el cambio de hora de verano (DST).
function sumarDias(fecha, n) {
  const copia = new Date(fecha.getTime());
  copia.setDate(copia.getDate() + n);
  return normalizarMedianoche(copia);
}

// 3. Devuelve el lunes de la semana que contiene "hoy", a medianoche local.
// getDay() va de 0 (domingo) a 6 (sábado):
//   - si es domingo (0) hay que retroceder 6 días;
//   - si no, hay que retroceder getDay() - 1 días.
function lunesDe(hoy) {
  const dia = hoy.getDay();
  const diasParaRetroceder = dia === 0 ? 6 : dia - 1;
  return sumarDias(hoy, -diasParaRetroceder);
}

// 4. Devuelve los dos extremos de la semana de "hoy" como texto "AAAA-MM-DD".
function rangoSemana(hoy) {
  const lunes = lunesDe(hoy);
  return {
    lunes: fechaAString(lunes),
    domingo: fechaAString(sumarDias(lunes, 6)),
  };
}

// 5. Nombre del mes en español a partir de su número (1 = enero).
function nombreMes(mes) {
  return MESES[mes - 1];
}

// 6. Texto del rótulo de la semana, a partir de la fecha de su lunes.
// Meses distintos: "Semana del 28 de septiembre al 4 de octubre de 2026".
// Mismo mes:     "Semana del 5 al 11 de octubre de 2026".
// El año aparece siempre.
function describirRangoSemana(lunesISO) {
  const lunes = stringAFecha(lunesISO);
  const domingo = sumarDias(lunes, 6);

  const diaLunes = lunes.getDate();
  const diaDomingo = domingo.getDate();
  const anio = lunes.getFullYear();

  if (lunes.getMonth() === domingo.getMonth()) {
    return `Semana del ${diaLunes} al ${diaDomingo} de ${nombreMes(lunes.getMonth() + 1)} de ${anio}`;
  }

  return `Semana del ${diaLunes} de ${nombreMes(lunes.getMonth() + 1)} `
    + `al ${diaDomingo} de ${nombreMes(domingo.getMonth() + 1)} de ${anio}`;
}

// 7. Comprueba si un texto es una clave válida de objetivo, es decir, si tiene
//    el formato "AAAA-MM-DD", si esa fecha existe en el calendario y si es lunes
//    (solo los lunes identifican una semana). Sirve para descartar entradas
//    guardadas con una clave equivocada (CF-18).
function esClaveLunesValida(clave) {
  if (typeof clave !== 'string') return false;

  // Un formato distinto de "AAAA-MM-DD" (mes de un solo dígito, barras, texto…)
  // no se considera clave.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clave)) return false;

  const fecha = stringAFecha(clave);
  if (Number.isNaN(fecha.getTime())) return false;

  // Al construir una fecha como "2026-02-30" el día se pasa al 2 de marzo, así
  // que al volver a escribirla no coincide con la clave original. Esa
  // comprobación detecta las fechas que no existen.
  if (fechaAString(fecha) !== clave) return false;

  // Si la fecha es lunes, su propio lunes de semana es ella misma.
  return fechaAString(lunesDe(fecha)) === clave;
}

// 8. Comprueba si un valor sirve como objetivo: un número entero entre 1 y
//    100.000. Descarta decimales (300.5), textos ("300"), 0, negativos, NaN
//    e Infinity porque ninguno de ellos cumple la condición.
//    (No se exporta: es un detalle de sanearObjetivos y leerObjetivo.)
function esObjetivoValido(minutos) {
  if (typeof minutos !== 'number') return false;
  if (!Number.isInteger(minutos)) return false;
  return minutos >= 1 && minutos <= 100000;
}

// 9. Convierte el contenido bruto del almacenamiento en un objeto de objetivos
//    utilizable: solo las claves que son lunes válidos y con un número entero
//    entre 1 y 100.000. Si el contenido no se puede interpretar devuelve {}. No
//    hace el JSON.parse ni toca el almacenamiento: eso es de la capa del
//    navegador (CF-39). Tampoco modifica lo que recibe.
function sanearObjetivos(contenidoBruto) {
  // Solo sirve un objeto. Un texto, un número, un array, null o undefined
  // significan que no hay objetivos que leer.
  if (contenidoBruto === null || typeof contenidoBruto !== 'object') return {};
  if (Array.isArray(contenidoBruto)) return {};

  const objetivos = {};
  for (const [clave, minutos] of Object.entries(contenidoBruto)) {
    if (esClaveLunesValida(clave) && esObjetivoValido(minutos)) {
      objetivos[clave] = minutos;
    }
  }
  return objetivos;
}

// 10. Devuelve el objetivo de la semana indicada por su clave de lunes, o null
//     si esa semana no tiene objetivo (CF-15). Comprueba también que la clave
//     sea un lunes válido y que el valor guardado siga siendo válido, para no
//     fiarse a ciegas de unos datos que pueden estar corruptos (CF-16).
function leerObjetivo(objetivosSanados, claveLunes) {
  if (objetivosSanados === null || typeof objetivosSanados !== 'object') return null;
  if (!esClaveLunesValida(claveLunes)) return null;

  const minutos = objetivosSanados[claveLunes];
  if (!esObjetivoValido(minutos)) return null;

  return minutos;
}

// 11. Comprueba si el texto escrito en el campo de minutos es un objetivo
//     válido. Devuelve { ok: true, valor } si lo es y { ok: false } si no.
//     El ORDEN importa: primero se mira el TEXTO y solo después se convierte a
//     número. Si se hiciera al revés, parseInt("1e3") daría 1 y
//     Number("1e3") daría 1000, y los dos aceptarían un valor que hay que
//     rechazar (CF-11). Tampoco lanza excepciones: cualquier cosa que no sea
//     texto se considera inválida.
function validarObjetivo(texto) {
  if (typeof texto !== 'string') return { ok: false };

  // Se quitan los espacios de los extremos: " 300 " vale lo mismo que "300".
  const recortado = texto.trim();

  // Solo se admiten uno o más dígitos, nada más. Esta comprobación descarta
  // decimales ("300.5", "300,5"), negativos ("-5"), texto ("300 min") y la
  // notación exponencial ("1e3").
  if (!/^\d+$/.test(recortado)) return { ok: false };

  const valor = parseInt(recortado, 10);

  // Con el rango 1..100.000. Se reutiliza el mismo predicado que usan el
  // saneo y la lectura, para que las tres cosas coincidan siempre.
  if (!esObjetivoValido(valor)) return { ok: false };

  return { ok: true, valor };
}

// 12. Porcentaje de progreso de la semana, de 0 a 100. Devuelve null si la
//     semana no tiene objetivo (entonces no hay barra que pintar) y nunca pasa
//     de 100, aunque se haya estudiado más de lo previsto (CF-24, CF-29).
function porcentaje(acumulado, objetivo) {
  if (!esObjetivoValido(objetivo)) return null;

  const resultado = (acumulado / objetivo) * 100;
  if (resultado > 100) return 100;
  return resultado;
}

// 13. Indica si la semana ya ha cumplido su objetivo. Sin objetivo no se puede
//     cumplir nada, así que devuelve false (CF-29, CF-30).
function cumpleObjetivo(acumulado, objetivo) {
  if (!esObjetivoValido(objetivo)) return false;
  return acumulado >= objetivo;
}

// 14. Suma los minutos de todas las sesiones que caen dentro de la semana
//     elegida, siempre que sus datos estén bien formados.
//
//     Una sesión cuenta solo si cumple LAS DOS condiciones:
//       1. tiene "fecha" como texto con el formato AAAA-MM-DD y esa fecha existe;
//       2. tiene "minutos" como número finito.
//     Si falta cualquiera de las dos, la sesión se ignora por completo (CF-22).
//     No se convierte nada con parseInt: un texto donde debería haber un número
//     significa que el almacenamiento está corrupto, y convertirlo a la fuerza
//     escondería el problema.
//
//     Devuelve 0 para una semana que todavía no ha llegado (CF-20).
//     Tolera que "sesiones" no sea una lista utilizable sin lanzar errores.
function acumuladoSemana(hoy, sesiones, lunesISO) {
  // Sin lista de sesiones no hay nada que sumar.
  if (!Array.isArray(sesiones)) return 0;

  // El domingo de la semana cuya clave de lunes es lunesISO. Si el lunes no es
  // un texto válido no hay forma de saber los límites, así que no se suma nada.
  if (typeof lunesISO !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(lunesISO)) return 0;

  const domingo = fechaAString(sumarDias(stringAFecha(lunesISO), 6));

  // "Hoy" en texto: las sesiones con fecha posterior a hoy no cuentan.
  const hoyISO = fechaAString(normalizarMedianoche(hoy));

  let total = 0;
  for (const sesion of sesiones) {
    // Saltamos los huecos y los valores que no son objetos.
    if (sesion === null || typeof sesion !== 'object') continue;

    // Condición 1: la fecha tiene que ser un texto AAAA-MM-DD que exista.
    if (typeof sesion.fecha !== 'string') continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(sesion.fecha)) continue;
    // Al construir "2026-02-30" la fecha se pasa al 2 de marzo, así que al
    // volver a escribirla no coincide: esa fecha no existe.
    if (fechaAString(stringAFecha(sesion.fecha)) !== sesion.fecha) continue;

    // Condición 2: los minutos tienen que ser un número finito.
    if (typeof sesion.minutos !== 'number') continue;
    if (!Number.isFinite(sesion.minutos)) continue;

    // La fecha tiene que caer dentro de la semana (lunes y domingo incluidos).
    // Como el formato AAAA-MM-DD ordena bien como texto, se puede comparar con
    // < y <= sin convertir a fecha.
    if (sesion.fecha < lunesISO) continue;
    if (sesion.fecha > domingo) continue;

    // Y no puede ser posterior a hoy.
    if (sesion.fecha > hoyISO) continue;

    total += sesion.minutos;
  }
  return total;
}

// Arranque
// Ejecución sólo en navegador (node --test no tiene "document")
if (typeof window !== 'undefined') init();