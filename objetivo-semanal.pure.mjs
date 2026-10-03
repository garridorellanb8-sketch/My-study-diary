// Lógica pura del objetivo semanal de estudio.
// Sin DOM, sin localStorage, sin "document", sin Date.now().
// Nunca se usa toISOString() ni new Date("AAAA-MM-DD"): interpretarían la
// fecha en UTC y podrían desplazar el día. Todo se calcula con los getters
// locales (getFullYear, getMonth, getDate, getDay) y new Date(año, mes, día).
//
// OJO: si cambias estas funciones, cambia también la copia del final de app.js
// (y viceversa). Son el mismo código, solo cambia la palabra "export".
// La copia de app.js reutiliza su fechaAString() y su stringAFecha(), que es
// idéntica a la fechaDesdeTexto() de aquí.

// Nombres de los meses en español. El índice 0 es enero: por eso
// nombreMes() suma 1 al número de mes que devuelve getMonth().
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// Copia mínima de fechaAString() de app.js: convierte una fecha en
// "AAAA-MM-DD" usando getters locales (nunca toISOString).
function fechaAString(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Convierte "AAAA-MM-DD" en un Date a medianoche hora local.
// Se separa el texto a mano y se usa new Date(año, mes - 1, día) porque
// new Date("AAAA-MM-DD") se interpreta en UTC y desplaza el día.
function fechaDesdeTexto(texto) {
  const [y, m, d] = texto.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  fecha.setHours(0, 0, 0, 0);
  return fecha;
}

// 1. Devuelve una COPIA de la fecha a medianoche hora local.
export function normalizarMedianoche(fecha) {
  const copia = new Date(fecha.getTime());
  copia.setHours(0, 0, 0, 0);
  return copia;
}

// 2. Copia la fecha, le suma n días y la deja a medianoche.
// n puede ser negativo para retroceder. Nunca se suman milisegundos:
// sumar 24 h por día falla con el cambio de hora de verano (DST).
export function sumarDias(fecha, n) {
  const copia = new Date(fecha.getTime());
  copia.setDate(copia.getDate() + n);
  return normalizarMedianoche(copia);
}

// 3. Devuelve el lunes de la semana que contiene "hoy", a medianoche local.
// getDay() va de 0 (domingo) a 6 (sábado):
//   - si es domingo (0) hay que retroceder 6 días;
//   - si no, hay que retroceder getDay() - 1 días.
export function lunesDe(hoy) {
  const dia = hoy.getDay();
  const diasParaRetroceder = dia === 0 ? 6 : dia - 1;
  return sumarDias(hoy, -diasParaRetroceder);
}

// 4. Devuelve los dos extremos de la semana de "hoy" como texto "AAAA-MM-DD".
export function rangoSemana(hoy) {
  const lunes = lunesDe(hoy);
  return {
    lunes: fechaAString(lunes),
    domingo: fechaAString(sumarDias(lunes, 6)),
  };
}

// 5. Nombre del mes en español a partir de su número (1 = enero).
export function nombreMes(mes) {
  return MESES[mes - 1];
}

// 6. Texto del rótulo de la semana, a partir de la fecha de su lunes.
// Meses distintos: "Semana del 28 de septiembre al 4 de octubre de 2026".
// Mismo mes:     "Semana del 5 al 11 de octubre de 2026".
// El año aparece siempre.
export function describirRangoSemana(lunesISO) {
  const lunes = fechaDesdeTexto(lunesISO);
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
export function esClaveLunesValida(clave) {
  if (typeof clave !== 'string') return false;

  // Un formato distinto de "AAAA-MM-DD" (mes de un solo dígito, barras, texto…)
  // no se considera clave.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clave)) return false;

  const fecha = fechaDesdeTexto(clave);
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
export function sanearObjetivos(contenidoBruto) {
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
export function leerObjetivo(objetivosSanados, claveLunes) {
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
export function validarObjetivo(texto) {
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
export function porcentaje(acumulado, objetivo) {
  if (!esObjetivoValido(objetivo)) return null;

  const resultado = (acumulado / objetivo) * 100;
  if (resultado > 100) return 100;
  return resultado;
}

// 13. Indica si la semana ya ha cumplido su objetivo. Sin objetivo no se puede
//     cumplir nada, así que devuelve false (CF-29, CF-30).
export function cumpleObjetivo(acumulado, objetivo) {
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
export function acumuladoSemana(hoy, sesiones, lunesISO) {
  // Sin lista de sesiones no hay nada que sumar.
  if (!Array.isArray(sesiones)) return 0;

  // El domingo de la semana cuya clave de lunes es lunesISO. Si el lunes no es
  // un texto válido no hay forma de saber los límites, así que no se suma nada.
  if (typeof lunesISO !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(lunesISO)) return 0;

  const domingo = fechaAString(sumarDias(fechaDesdeTexto(lunesISO), 6));

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
    if (fechaAString(fechaDesdeTexto(sesion.fecha)) !== sesion.fecha) continue;

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