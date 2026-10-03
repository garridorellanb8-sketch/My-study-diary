/// <reference types="node" />
// Tests de las funciones puras del objetivo semanal.
// Tests de T1 (límites de semana y rótulo del rango), de T2 (saneo y lectura
// de los objetivos guardados) y de T3 (validación del objetivo y progreso).
// Fechas construidas SIEMPRE en hora local: new Date(año, mes - 1, día).
// Nunca toISOString() ni new Date("AAAA-MM-DD"): interpretarían la fecha en UTC.
import test from 'node:test';
import assert from 'node:assert';
import {
  normalizarMedianoche,
  sumarDias,
  lunesDe,
  rangoSemana,
  nombreMes,
  describirRangoSemana,
  esClaveLunesValida,
  sanearObjetivos,
  leerObjetivo,
  validarObjetivo,
  porcentaje,
  cumpleObjetivo,
  acumuladoSemana,
} from './pure/objetivo-semanal.pure.mjs';

// Helper: crea un Date en hora local a medianoche.
// new Date(año, mes, día) usa el mes empezando en 0 (enero = 0).
function fecha(año, mes, día) {
  const d = new Date(año, mes - 1, día);
  d.setHours(0, 0, 0, 0);
  return d;
}

// =============================================
// T1: normalizarMedianoche
// =============================================
test('normalizarMedianoche quita la hora y no toca la fecha original', () => {
  const conHora = new Date(2026, 8, 2, 17, 45, 30);
  const resultado = normalizarMedianoche(conHora);

  assert.strictEqual(resultado.getHours(), 0);
  assert.strictEqual(resultado.getMinutes(), 0);
  assert.strictEqual(resultado.getSeconds(), 0);
  assert.strictEqual(resultado.getMilliseconds(), 0);
  // Sigue siendo el 2 de septiembre de 2026
  assert.strictEqual(resultado.getFullYear(), 2026);
  assert.strictEqual(resultado.getMonth(), 8);
  assert.strictEqual(resultado.getDate(), 2);

  // La fecha de entrada no se modifica (devuelve una copia)
  assert.strictEqual(conHora.getHours(), 17);
});

// =============================================
// T1: sumarDias
// =============================================
test('sumarDias avanza y retrocede, y siempre deja la fecha a medianoche', () => {
  const base = new Date(2026, 8, 2, 13, 30, 0);

  const mas = sumarDias(base, 3);
  assert.strictEqual(mas.getDate(), 5);
  assert.strictEqual(mas.getMonth(), 8);
  assert.strictEqual(mas.getHours(), 0);

  const menos = sumarDias(base, -2);
  assert.strictEqual(menos.getDate(), 31);
  assert.strictEqual(menos.getMonth(), 7);
  assert.strictEqual(menos.getHours(), 0);

  // No muta la fecha de entrada
  assert.strictEqual(base.getDate(), 2);
  assert.strictEqual(base.getHours(), 13);
});

test('sumarDias cruza el cambio de mes y de año', () => {
  const finDeAño = fecha(2023, 12, 31);
  const nuevo = sumarDias(finDeAño, 1);
  assert.strictEqual(nuevo.getFullYear(), 2024);
  assert.strictEqual(nuevo.getMonth(), 0);
  assert.strictEqual(nuevo.getDate(), 1);

  // 31 de agosto de 2026 + 1 día = 1 de septiembre de 2026
  // Ojo: getMonth() empieza en 0, así que septiembre es 8.
  const finDeMes = fecha(2026, 8, 31);
  const otroMes = sumarDias(finDeMes, 1);
  assert.strictEqual(otroMes.getFullYear(), 2026);
  assert.strictEqual(otroMes.getMonth(), 8); // septiembre
  assert.strictEqual(otroMes.getDate(), 1);
});

// =============================================
// T1: lunesDe  (CF-1, CF-2, CF-3, CF-4, CF-34, CF-36)
// =============================================
test('lunesDe devuelve el lunes de la semana de un día cualquiera', () => {
  // Miércoles 2 de septiembre de 2026 → lunes 31 de agosto de 2026
  const miercoles = fecha(2026, 9, 2);
  const lunes = lunesDe(miercoles);

  assert.strictEqual(lunes.getDay(), 1); // 1 = lunes
  assert.strictEqual(lunes.getFullYear(), 2026);
  assert.strictEqual(lunes.getMonth(), 7); // agosto
  assert.strictEqual(lunes.getDate(), 31);
  assert.strictEqual(lunes.getHours(), 0);
});

test('lunesDe de un lunes devuelve ese mismo día', () => {
  const lunes = fecha(2026, 8, 31);
  const resultado = lunesDe(lunes);
  assert.strictEqual(resultado.getFullYear(), 2026);
  assert.strictEqual(resultado.getMonth(), 7);
  assert.strictEqual(resultado.getDate(), 31);
  assert.strictEqual(resultado.getHours(), 0);
});

test('lunesDe de un domingo retrocede 6 días, no 7', () => {
  // Domingo 6 de septiembre de 2026 → lunes 31 de agosto de 2026
  const domingo = fecha(2026, 9, 6);
  const lunes = lunesDe(domingo);
  assert.strictEqual(lunes.getMonth(), 7);
  assert.strictEqual(lunes.getDate(), 31);
  assert.strictEqual(lunes.getDay(), 1);
});

test('lunesDe cruza el cambio de mes y el de año', () => {
  // Lunes 30 de junio de 2025 → se queda en sí mismo
  const junio = fecha(2025, 6, 30);
  const mismo = lunesDe(junio);
  assert.strictEqual(mismo.getFullYear(), 2025);
  assert.strictEqual(mismo.getMonth(), 5);
  assert.strictEqual(mismo.getDate(), 30);

  // Domingo 31 de diciembre de 2023 → lunes 25 de diciembre de 2023
  const finDeAnio = fecha(2023, 12, 31);
  const lunes = lunesDe(finDeAnio);
  assert.strictEqual(lunes.getFullYear(), 2023);
  assert.strictEqual(lunes.getMonth(), 11);
  assert.strictEqual(lunes.getDate(), 25);
  assert.strictEqual(lunes.getDay(), 1);
});

// =============================================
// T1: rangoSemana
// =============================================
test('rangoSemana de un miércoles va de lunes a domingo', () => {
  // CF-1: miércoles 2/9/2026 → del 31/8 al 6/9, clave 2026-08-31
  const rango = rangoSemana(fecha(2026, 9, 2));
  assert.deepStrictEqual(rango, { lunes: '2026-08-31', domingo: '2026-09-06' });
});

test('rangoSemana de un domingo incluye ese domingo y no el lunes siguiente', () => {
  // CF-2: domingo 6/9/2026 → domingo es 2026-09-06, el lunes 7/9 ya es otra semana
  const rango = rangoSemana(fecha(2026, 9, 6));
  assert.strictEqual(rango.lunes, '2026-08-31');
  assert.strictEqual(rango.domingo, '2026-09-06');

  const siguienteLunes = rangoSemana(fecha(2026, 9, 7));
  assert.strictEqual(siguienteLunes.lunes, '2026-09-07');
  assert.strictEqual(siguienteLunes.domingo, '2026-09-13');
});

test('rangoSemana cruza el cambio de mes', () => {
  // CF-3: lunes 30/6/2025 → del 30/6 al 6/7, clave 2025-06-30
  const rango = rangoSemana(fecha(2025, 6, 30));
  assert.deepStrictEqual(rango, { lunes: '2025-06-30', domingo: '2025-07-06' });
});

test('rangoSemana cruza el cambio de año (CF-36)', () => {
  // Domingo 31/12/2023 → del 25/12 al 31/12/2023, clave 2023-12-25
  const rango = rangoSemana(fecha(2023, 12, 31));
  assert.deepStrictEqual(rango, { lunes: '2023-12-25', domingo: '2023-12-31' });
});

// =============================================
// T1: nombreMes
// =============================================
test('nombreMes devuelve los 12 meses en español', () => {
  assert.strictEqual(nombreMes(1), 'enero');
  assert.strictEqual(nombreMes(2), 'febrero');
  assert.strictEqual(nombreMes(3), 'marzo');
  assert.strictEqual(nombreMes(4), 'abril');
  assert.strictEqual(nombreMes(5), 'mayo');
  assert.strictEqual(nombreMes(6), 'junio');
  assert.strictEqual(nombreMes(7), 'julio');
  assert.strictEqual(nombreMes(8), 'agosto');
  assert.strictEqual(nombreMes(9), 'septiembre');
  assert.strictEqual(nombreMes(10), 'octubre');
  assert.strictEqual(nombreMes(11), 'noviembre');
  assert.strictEqual(nombreMes(12), 'diciembre');
});

// =============================================
// T1: describirRangoSemana
// =============================================
test('describirRangoSemana con meses distintos pone el mes de los dos extremos', () => {
  const texto = describirRangoSemana('2026-09-28');
  assert.strictEqual(texto, 'Semana del 28 de septiembre al 4 de octubre de 2026');
});

test('describirRangoSemana con el mismo mes solo pone el mes una vez', () => {
  const texto = describirRangoSemana('2026-10-05');
  assert.strictEqual(texto, 'Semana del 5 al 11 de octubre de 2026');
});

test('describirRangoSemana siempre incluye el año', () => {
  assert.strictEqual(
    describirRangoSemana('2023-12-25'),
    'Semana del 25 al 31 de diciembre de 2023'
  );
});

// =============================================
// T2: esClaveLunesValida  (CF-18)
// =============================================
test('esClaveLunesValida acepta fechas que son lunes', () => {
  assert.strictEqual(esClaveLunesValida('2026-08-31'), true);
  assert.strictEqual(esClaveLunesValida('2026-09-07'), true);
  assert.strictEqual(esClaveLunesValida('2025-06-30'), true);
  // Año bisiesto: el 26/2/2024 fue lunes (el 29/2/2024 fue jueves)
  assert.strictEqual(esClaveLunesValida('2024-02-26'), true);
});

test('esClaveLunesValida rechaza fechas que no son lunes', () => {
  assert.strictEqual(esClaveLunesValida('2026-09-01'), false); // martes
  assert.strictEqual(esClaveLunesValida('2026-09-02'), false); // miércoles
  assert.strictEqual(esClaveLunesValida('2026-09-06'), false); // domingo
});

test('esClaveLunesValida rechaza textos con otro formato o que no son fechas', () => {
  assert.strictEqual(esClaveLunesValida('2026-9-7'), false);   // sin ceros delante
  assert.strictEqual(esClaveLunesValida('2026/09/07'), false); // barras
  assert.strictEqual(esClaveLunesValida('07-09-2026'), false); // orden invertido
  assert.strictEqual(esClaveLunesValida('2026-09-07extra'), false);
  assert.strictEqual(esClaveLunesValida(''), false);
  assert.strictEqual(esClaveLunesValida('lunes'), false);
});

test('esClaveLunesValida rechaza fechas que no existen en el calendario', () => {
  // El 30 de febrero no existe: al construir la fecha el día se pasa a marzo.
  assert.strictEqual(esClaveLunesValida('2026-02-30'), false);
  // El mes 13 no existe.
  assert.strictEqual(esClaveLunesValida('2026-13-05'), false);
  // El 29 de febrero solo existe en años bisiestos.
  assert.strictEqual(esClaveLunesValida('2023-02-29'), false);
});

test('esClaveLunesValida tolera que le llegue algo que no es texto', () => {
  assert.strictEqual(esClaveLunesValida(null), false);
  assert.strictEqual(esClaveLunesValida(undefined), false);
  assert.strictEqual(esClaveLunesValida(20260907), false);
  assert.strictEqual(esClaveLunesValida({}), false);
});

// =============================================
// T2: sanearObjetivos  (CF-16, CF-18, CF-37, CF-39)
// =============================================
test('sanearObjetivos se queda con las entradas válidas', () => {
  const saneados = sanearObjetivos({
    '2026-08-31': 300,
    '2026-09-07': 1,
    '2025-06-30': 100000,
  });
  assert.deepStrictEqual(saneados, {
    '2026-08-31': 300,
    '2026-09-07': 1,
    '2025-06-30': 100000,
  });
});

test('sanearObjetivos descarta los valores que no son minutos enteros válidos', () => {
  const saneados = sanearObjetivos({
    '2026-08-31': 300.5, // decimal
    '2026-09-07': '300', // texto en vez de número
    '2026-09-14': 0,     // cero
    '2026-09-21': -5,    // negativo
    '2026-09-28': NaN,
    '2026-10-05': Infinity,
    '2026-10-12': 100001, // por encima del máximo
    '2026-10-19': null,
    '2026-10-26': true,
    '2026-11-02': { minutos: 300 },
  });
  // Todas esas semanas quedan sin objetivo.
  assert.deepStrictEqual(saneados, {});
});

test('sanearObjetivos descarta las claves que no son un lunes válido (CF-18)', () => {
  const saneados = sanearObjetivos({
    '2026-09-01': 300,     // martes
    '2026-09-06': 240,     // domingo
    '2026-02-30': 120,     // fecha que no existe
    '2026-9-14': 60,       // formato inválido
    'lunes': 60,           // no es una fecha
    '2026-09-21': 180,     // esta sí es lunes y se conserva
  });
  assert.deepStrictEqual(saneados, { '2026-09-21': 180 });
});

test('sanearObjetivos devuelve un objeto vacío si no hay nada que interpretar', () => {
  assert.deepStrictEqual(sanearObjetivos(null), {});
  assert.deepStrictEqual(sanearObjetivos(undefined), {});
  assert.deepStrictEqual(sanearObjetivos(42), {});
  assert.deepStrictEqual(sanearObjetivos(true), {});
  assert.deepStrictEqual(sanearObjetivos(['2026-08-31']), {});
  assert.deepStrictEqual(sanearObjetivos('esto no es un objetivo'), {});
});

test('sanearObjetivos no interpreta texto: eso es de la capa del navegador (CF-39)', () => {
  // Aunque el texto sea JSON válido, aquí no se convierte: sanearObjetivos
  // recibe el contenido ya leído por la capa del navegador.
  assert.deepStrictEqual(sanearObjetivos('{"2026-08-31":300}'), {});
});

test('sanearObjetivos no modifica el objeto que recibe', () => {
  const original = { '2026-08-31': 300, '2026-09-01': 240 };
  const copia = JSON.parse(JSON.stringify(original));

  const saneados = sanearObjetivos(original);

  // El original sigue igual...
  assert.deepStrictEqual(original, copia);
  // ...y el resultado es un objeto nuevo, no el mismo.
  assert.notStrictEqual(saneados, original);
  assert.deepStrictEqual(saneados, { '2026-08-31': 300 });
});

// =============================================
// T2: leerObjetivo  (CF-15, CF-16, CF-17, CF-37)
// =============================================
test('leerObjetivo devuelve el objetivo de la semana que se le pide', () => {
  const objetivos = sanearObjetivos({
    '2026-08-31': 300,
    '2026-09-07': 240,
  });
  assert.strictEqual(leerObjetivo(objetivos, '2026-08-31'), 300);
  assert.strictEqual(leerObjetivo(objetivos, '2026-09-07'), 240);
});

test('leerObjetivo devuelve null si esa semana no tiene objetivo (CF-15)', () => {
  const objetivos = sanearObjetivos({ '2026-08-31': 300 });
  assert.strictEqual(leerObjetivo(objetivos, '2026-09-07'), null);
  assert.strictEqual(leerObjetivo({}, '2026-09-07'), null);
});

test('leerObjetivo devuelve null si el objetivo guardado es inválido', () => {
  // Aunque saneados ya lo habrían quitado, leerObjetivo no se fía a ciegas.
  assert.strictEqual(leerObjetivo({ '2026-08-31': 300.5 }, '2026-08-31'), null);
  assert.strictEqual(leerObjetivo({ '2026-08-31': '300' }, '2026-08-31'), null);
  assert.strictEqual(leerObjetivo({ '2026-08-31': 0 }, '2026-08-31'), null);
  assert.strictEqual(leerObjetivo({ '2026-08-31': Infinity }, '2026-08-31'), null);
});

test('leerObjetivo tolera que no le pasen ningún objeto de objetivos', () => {
  assert.strictEqual(leerObjetivo(null, '2026-08-31'), null);
  assert.strictEqual(leerObjetivo(undefined, '2026-08-31'), null);
  assert.strictEqual(leerObjetivo('2026-08-31', '2026-08-31'), null);
  assert.strictEqual(leerObjetivo({ '2026-08-31': 300 }, null), null);
});

test('leerObjetivo solo devuelve el objetivo si la clave es un lunes válido', () => {
  // Una entrada guardada con una clave que no es lunes no se puede leer como
  // objetivo de ninguna semana.
  const objetivos = sanearObjetivos({ '2026-09-01': 300 });
  assert.deepStrictEqual(objetivos, {});
  assert.strictEqual(leerObjetivo(objetivos, '2026-09-01'), null);
});

// =============================================
// T3: validarObjetivo  (CF-11, CF-12)
// =============================================
test('validarObjetivo acepta un número entero dentro del rango', () => {
  assert.deepStrictEqual(validarObjetivo('300'), { ok: true, valor: 300 });
  assert.deepStrictEqual(validarObjetivo('1'), { ok: true, valor: 1 });
  assert.deepStrictEqual(validarObjetivo('100000'), { ok: true, valor: 100000 });
});

test('validarObjetivo quita los espacios de los extremos antes de validar (CF-12)', () => {
  assert.deepStrictEqual(validarObjetivo(' 300 '), { ok: true, valor: 300 });
  assert.deepStrictEqual(validarObjetivo('300   '), { ok: true, valor: 300 });
  // Un espacio dentro del número sí impide que sea válido.
  assert.deepStrictEqual(validarObjetivo('3 00'), { ok: false });
});

test('validarObjetivo rechaza los valores que no son un entero válido (CF-11)', () => {
  const rechazados = [
    '',          // vacío
    '   ',       // solo espacios
    '0',         // cero
    '-5',        // negativo
    '300.5',     // decimal con punto
    '300,5',     // decimal con coma
    '300 min',   // texto pegado al número
    'min 300',   // texto delante del número
    '100000.5',  // decimal por encima del máximo
    '100001',    // por encima del máximo
    'Infinity',  // no finito
    '-Infinity', // no finito
    'NaN',       // no es un número
    'abc',       // texto
    '+300',      // el signo más no es un dígito
    '3e2',       // notación exponencial
  ];
  for (const texto of rechazados) {
    assert.deepStrictEqual(validarObjetivo(texto), { ok: false }, `debería rechazar: "${texto}"`);
  }
});

test('validarObjetivo rechaza la notación exponencial "1e3" (CF-11)', () => {
  // Ojo: parseInt("1e3") daría 1 y Number("1e3") daría 1000. Los dos
  // aceptarían un valor que hay que rechazar, así que el texto se comprueba
  // con una expresión regular ANTES de convertirlo a número.
  assert.deepStrictEqual(validarObjetivo('1e3'), { ok: false });
});

test('validarObjetivo tolera que le llegue algo que no es texto', () => {
  // Aunque el navegador siempre manda texto, la función no debe romperse con
  // ningún valor: siempre devuelve { ok: false } y nunca lanza una excepción.
  const noTextos = [null, undefined, 300, 0, true, {}, [], ['300'], NaN, Infinity];
  for (const valor of noTextos) {
    assert.deepStrictEqual(validarObjetivo(valor), { ok: false });
  }
});

// =============================================
// T3: porcentaje  (CF-24, CF-29)
// =============================================
test('porcentaje da 0 cuando el acumulado es 0', () => {
  assert.strictEqual(porcentaje(0, 300), 0);
});

test('porcentaje divide el acumulado entre el objetivo', () => {
  assert.strictEqual(porcentaje(150, 300), 50);
  assert.strictEqual(porcentaje(75, 300), 25);
  assert.strictEqual(porcentaje(299, 300), 100 * 299 / 300);
});

test('porcentaje llega a 100 justo cuando se cumple el objetivo (CF-30)', () => {
  assert.strictEqual(porcentaje(300, 300), 100);
});

test('porcentaje nunca pasa de 100 aunque se supere el objetivo (CF-29)', () => {
  assert.strictEqual(porcentaje(520, 300), 100);
  assert.strictEqual(porcentaje(10000, 300), 100);
});

test('porcentaje devuelve null si la semana no tiene objetivo', () => {
  assert.strictEqual(porcentaje(150, null), null);
  assert.strictEqual(porcentaje(0, null), null);
  assert.strictEqual(porcentaje(300, undefined), null);
  assert.strictEqual(porcentaje(300, 0), null);
});

// =============================================
// T3: cumpleObjetivo  (CF-29, CF-30)
// =============================================
test('cumpleObjetivo es true al alcanzar exactamente el objetivo (CF-30)', () => {
  assert.strictEqual(cumpleObjetivo(300, 300), true);
});

test('cumpleObjetivo es true al superar el objetivo (CF-29)', () => {
  assert.strictEqual(cumpleObjetivo(520, 300), true);
  assert.strictEqual(cumpleObjetivo(10000, 300), true);
});

test('cumpleObjetivo es false si todavía no se ha llegado', () => {
  assert.strictEqual(cumpleObjetivo(0, 300), false);
  assert.strictEqual(cumpleObjetivo(299, 300), false);
});

test('cumpleObjetivo es false si la semana no tiene objetivo', () => {
  assert.strictEqual(cumpleObjetivo(300, null), false);
  assert.strictEqual(cumpleObjetivo(9999, null), false);
  assert.strictEqual(cumpleObjetivo(300, undefined), false);
  assert.strictEqual(cumpleObjetivo(300, 0), false);
});

// =============================================
// T4: acumuladoSemana  (CF-19..CF-23)
// =============================================
// Semana de referencia para casi todos los tests:
//   lunes 2026-08-31 → domingo 2026-09-06, con "hoy" = miércoles 2026-09-02.
test('acumuladoSemana suma los minutos de la semana', () => {
  const sesiones = [
    { fecha: '2026-08-31', tema: 'Matemáticas', minutos: 45 },
    { fecha: '2026-09-01', tema: 'Historia', minutos: 30 },
    { fecha: '2026-09-02', tema: 'Programación', minutos: 60 },
  ];
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 2), sesiones, '2026-08-31'), 135);
});

test('acumuladoSemana suma varias sesiones del mismo día (CF-19)', () => {
  // Tres sesiones del lunes 31/8/2026: suman entre sí y cuentan una sola vez.
  const sesiones = [
    { fecha: '2026-08-31', tema: 'Matemáticas', minutos: 30 },
    { fecha: '2026-08-31', tema: 'Inglés', minutos: 20 },
    { fecha: '2026-08-31', tema: 'Programación', minutos: 10 },
  ];
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 2), sesiones, '2026-08-31'), 60);
});

test('acumuladoSemana incluye el lunes y el domingo de la semana', () => {
  // Los dos extremos entran: la semana va de lunes a domingo, ambos incluidos.
  const inicio = [{ fecha: '2026-08-31', tema: 'A', minutos: 25 }];
  const fin = [{ fecha: '2026-09-06', tema: 'B', minutos: 35 }];

  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 6), inicio, '2026-08-31'), 25);
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 6), fin, '2026-08-31'), 35);
});

test('acumuladoSemana no cuenta las sesiones futuras (CF-20)', () => {
  // Hoy es miércoles 2/9: las sesiones del jueves al domingo son futuras.
  const sesiones = [
    { fecha: '2026-09-02', tema: 'Programación', minutos: 60 },
    { fecha: '2026-09-03', tema: 'Matemáticas', minutos: 45 },
    { fecha: '2026-09-06', tema: 'Historia', minutos: 30 },
  ];
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 2), sesiones, '2026-08-31'), 60);
});

test('acumuladoSemana no cuenta sesiones de otras semanas (CF-21)', () => {
  const sesiones = [
    { fecha: '2026-08-30', tema: 'Semana anterior', minutos: 90 }, // domingo pasado
    { fecha: '2026-08-31', tema: 'Esta semana', minutos: 60 },    // lunes
    { fecha: '2026-09-07', tema: 'Semana siguiente', minutos: 45 }, // lunes siguiente
    { fecha: '2026-10-01', tema: 'Dentro de un mes', minutos: 30 },
  ];
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 2), sesiones, '2026-08-31'), 60);
});

test('acumuladoSemana devuelve 0 si la semana no tiene ninguna sesión', () => {
  const sesiones = [{ fecha: '2026-08-30', tema: 'Otra semana', minutos: 90 }];
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 2), sesiones, '2026-08-31'), 0);
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 2), [], '2026-08-31'), 0);
});

test('acumuladoSemana no cambia al guardar una sesión de otra semana (CF-23)', () => {
  const hoy = fecha(2026, 9, 2);
  const sesiones = [{ fecha: '2026-08-31', tema: 'Matemáticas', minutos: 60 }];
  const antes = acumuladoSemana(hoy, sesiones, '2026-08-31');

  // El usuario guarda una sesión de la semana siguiente. El acumulado de la
  // semana visible debe seguir siendo el mismo.
  sesiones.push({ fecha: '2026-09-07', tema: 'Inglés', minutos: 45 });
  const despues = acumuladoSemana(hoy, sesiones, '2026-08-31');

  assert.strictEqual(antes, 60);
  assert.strictEqual(despues, 60);
});

test('acumuladoSemana ignora las sesiones con datos mal formados (CF-22)', () => {
  // Ninguna de estas sesiones debe sumar ni lanzar un error.
  const malFormadas = [
    { fecha: '2026-09-01', tema: 'Sin minutos' },                    // minutos ausente
    { fecha: '2026-09-01', tema: 'Minutos texto', minutos: '30' },    // minutos como texto
    { fecha: '2026-09-01', tema: 'Minutos null', minutos: null },
    { fecha: '2026-09-01', tema: 'Minutos NaN', minutos: NaN },
    { fecha: '2026-09-01', tema: 'Minutos Infinity', minutos: Infinity },
    { fecha: '2026-09-01', tema: 'Minutos vacío', minutos: '' },
    { tema: 'Sin fecha', minutos: 45 },                              // fecha ausente
    { fecha: null, tema: 'Fecha null', minutos: 45 },
    { fecha: '01/09/2026', tema: 'Fecha con barras', minutos: 45 },  // formato distinto
    { fecha: '2026-9-1', tema: 'Fecha sin ceros', minutos: 45 },
    { fecha: '2026-09-32', tema: 'Día imposible', minutos: 45 },
    { fecha: '2026-13-01', tema: 'Mes imposible', minutos: 45 },
  ];
  // Cada una por separado vale 0, y todas juntas también.
  for (const sesion of malFormadas) {
    assert.strictEqual(acumuladoSemana(fecha(2026, 9, 2), [sesion], '2026-08-31'), 0);
  }
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 2), malFormadas, '2026-08-31'), 0);
});

test('acumuladoSemana suma las sesiones bien formadas aunque haya mal formadas', () => {
  const sesiones = [
    { fecha: '2026-09-01', tema: 'Buena', minutos: 45 },
    { fecha: '2026-09-01', tema: 'Mala', minutos: 'muchos' },
    { tema: 'Sin fecha', minutos: 100 },
    { fecha: '2026-09-02', tema: 'Buena', minutos: 15 },
  ];
  // Solo las dos buenas cuentan: 45 + 15. Las malas ni suman ni estorban.
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 2), sesiones, '2026-08-31'), 60);
});

test('acumuladoSemana tolera que no le lleguen sesiones o que estén vacías', () => {
  // No debe lanzar ninguna excepción con ninguna de estas entradas.
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 2), null, '2026-08-31'), 0);
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 2), undefined, '2026-08-31'), 0);
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 2), {}, '2026-08-31'), 0);
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 2), 'sesiones', '2026-08-31'), 0);
  // Array con huecos: null y undefined entre sesiones válidas.
  const conHuecos = [
    null,
    undefined,
    { fecha: '2026-09-01', tema: 'Buena', minutos: 20 },
    undefined,
  ];
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 2), conHuecos, '2026-08-31'), 20);
  // Array con números y textos sueltos.
  const basurero = [42, 'hola', true, { fecha: '2026-09-01', minutos: 10 }];
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 2), basurero, '2026-08-31'), 10);
});

test('acumuladoSemana no modifica la lista de sesiones que recibe', () => {
  const sesiones = [
    { fecha: '2026-09-01', tema: 'Buena', minutos: 45 },
    { fecha: '2026-09-01', tema: 'Mala', minutos: 'x' },
  ];
  const copia = JSON.parse(JSON.stringify(sesiones));

  acumuladoSemana(fecha(2026, 9, 2), sesiones, '2026-08-31');

  assert.deepStrictEqual(sesiones, copia);
  assert.strictEqual(sesiones.length, 2);
});

test('acumuladoSemana devuelve 0 para una semana futura', () => {
  // La semana del lunes 2026-09-07 todavía no ha llegado: hoy es 2/9/2026.
  const sesiones = [
    { fecha: '2026-09-07', tema: 'Futura', minutos: 60 },
    { fecha: '2026-09-08', tema: 'Futura', minutos: 60 },
  ];
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 2), sesiones, '2026-09-07'), 0);
});

test('acumuladoSemana de una semana futura da 0 min y 0 % de progreso', () => {
  // Una semana futura nunca se muestra como cumplida (caso límite de la spec).
  const sesiones = [{ fecha: '2026-09-07', tema: 'Futura', minutos: 60 }];
  const acumulado = acumuladoSemana(fecha(2026, 9, 2), sesiones, '2026-09-07');

  assert.strictEqual(acumulado, 0);
  assert.strictEqual(porcentaje(acumulado, 300), 0);
  assert.strictEqual(cumpleObjetivo(acumulado, 300), false);
});

// =============================================
// T4: casos límite de calendario
// =============================================
test('acumuladoSemana cruza el cambio de año: domingo 31/12/2023 (CF-36)', () => {
  // Hoy es domingo 31/12/2023, así que la semana va del lunes 25/12 al
  // domingo 31/12 de 2023 (clave 2023-12-25).
  const sesiones = [
    { fecha: '2023-12-25', tema: 'Navidad', minutos: 30 },
    { fecha: '2023-12-31', tema: 'Nochevieja', minutos: 60 },
    { fecha: '2024-01-01', tema: 'Año nuevo', minutos: 90 }, // ya es otra semana
  ];
  assert.strictEqual(acumuladoSemana(fecha(2023, 12, 31), sesiones, '2023-12-25'), 90);
});

test('acumuladoSemana funciona con el 29 de febrero de un año bisiesto', () => {
  // 2028 es bisiesto y el 29/2/2028 fue martes. Su semana va del lunes 28/2
  // al domingo 6/3/2028. Si se sumaran 24 h por día en vez de usar setDate(),
  // el paso de febrero a marzo se desplazaría y estas sumas saldrían mal.
  const sesiones = [
    { fecha: '2028-02-28', tema: 'Lunes', minutos: 20 },
    { fecha: '2028-02-29', tema: 'Bisiesto', minutos: 25 },
    { fecha: '2028-03-05', tema: 'Domingo', minutos: 35 },
    { fecha: '2028-03-06', tema: 'Lunes siguiente', minutos: 99 },
  ];
  // Hoy es el domingo 6/3: la semana entera está cerrada y suma 20 + 25 + 35.
  // El lunes 6/3 ya pertenece a la semana siguiente y no cuenta.
  assert.strictEqual(acumuladoSemana(fecha(2028, 3, 6), sesiones, '2028-02-28'), 80);

  // El mismo 29/2 es un día real y cuenta: aquí hoy es el propio martes.
  assert.strictEqual(acumuladoSemana(fecha(2028, 2, 29), sesiones, '2028-02-28'), 45);
});

test('acumuladoSemana aguanta el cambio de hora de verano (DST)', () => {
  // En Europe/Zurich el reloj adelanta una hora el domingo 29/3/2026 a las
  // 02:00 y lo atrasa el domingo 25/10/2026 a las 03:00. Esa semana de marzo
  // tiene un día de 23 horas y la de octubre uno de 25, así que no duran las
  // 168 horas de una semana normal. Si el cálculo sumara milisegundos (24 h
  // exactas por día) un día se desplazaría; con setDate() no ocurre.
  const primavera = [
    { fecha: '2026-03-23', tema: 'Lunes antes del cambio', minutos: 10 },
    { fecha: '2026-03-28', tema: 'Sábado', minutos: 20 },
    { fecha: '2026-03-29', tema: 'Domingo del cambio', minutos: 30 },
    { fecha: '2026-03-30', tema: 'Lunes siguiente', minutos: 999 },
  ];
  assert.strictEqual(acumuladoSemana(fecha(2026, 3, 29), primavera, '2026-03-23'), 60);

  const otoño = [
    { fecha: '2026-10-19', tema: 'Lunes antes del cambio', minutos: 15 },
    { fecha: '2026-10-24', tema: 'Sábado', minutos: 25 },
    { fecha: '2026-10-25', tema: 'Domingo del cambio', minutos: 35 },
    { fecha: '2026-10-26', tema: 'Lunes siguiente', minutos: 999 },
  ];
  assert.strictEqual(acumuladoSemana(fecha(2026, 10, 25), otoño, '2026-10-19'), 75);

  // Y los límites de la semana siguen siendo los mismos con el cambio dentro.
  const rangoPrimavera = rangoSemana(fecha(2026, 3, 29));
  assert.deepStrictEqual(rangoPrimavera, { lunes: '2026-03-23', domingo: '2026-03-29' });
  const rangoOtoño = rangoSemana(fecha(2026, 10, 25));
  assert.deepStrictEqual(rangoOtoño, { lunes: '2026-10-19', domingo: '2026-10-25' });

  // Para dejar claro que estas semanas contienen un cambio de hora real, se
  // mide cuántas horas duran de lunes a lunes. Solo se comprueba si la zona del
  // ordenador tiene cambio de hora: en una zona sin él (por ejemplo UTC) las dos
  // semanas duran 168 horas y no habría nada que demostrar.
  const horasDeLaSemana = (lunes) => {
    const inicio = fecha(lunes.getFullYear(), lunes.getMonth() + 1, lunes.getDate());
    const fin = sumarDias(inicio, 7);
    return (fin.getTime() - inicio.getTime()) / 3600000;
  };
  const hayCambioDeHora = fecha(2026, 3, 30).getTimezoneOffset()
    !== fecha(2026, 3, 28).getTimezoneOffset();

  if (hayCambioDeHora) {
    assert.strictEqual(horasDeLaSemana(fecha(2026, 3, 23)), 167); // un día de 23 h
    assert.strictEqual(horasDeLaSemana(fecha(2026, 10, 19)), 169); // un día de 25 h
  } else {
    // Sin cambio de hora en esta zona: las dos semanas duran 7 días exactos.
    assert.strictEqual(horasDeLaSemana(fecha(2026, 3, 23)), 168);
    assert.strictEqual(horasDeLaSemana(fecha(2026, 10, 19)), 168);
  }
});

test('acumuladoSemana cuenta los 7 días completos de una semana pasada', () => {
  // Semana del lunes 2026-08-31 al domingo 2026-09-06, ya terminada:
  // hoy es 2026-09-08, así que los 7 días cuentan.
  const sesiones = [];
  const dias = ['2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03',
    '2026-09-04', '2026-09-05', '2026-09-06'];
  for (const dia of dias) {
    sesiones.push({ fecha: dia, tema: 'Estudio', minutos: 10 });
  }
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 8), sesiones, '2026-08-31'), 70);

  // El mismo caso calculado día a día va sumando de uno en uno: el lunes 10,
  // el martes 20, el miércoles 30… hasta los 70 del domingo.
  dias.forEach((dia, indice) => {
    const [a, m, d] = dia.split('-').map(Number);
    const acumulado = acumuladoSemana(fecha(a, m, d), sesiones, '2026-08-31');
    assert.strictEqual(acumulado, (indice + 1) * 10, `acumulado incorrecto el ${dia}`);
  });

  // Y antes del lunes de esa semana no cuenta nada de ella.
  assert.strictEqual(acumuladoSemana(fecha(2026, 8, 30), sesiones, '2026-08-31'), 0);
});

// =============================================
// T4: la lógica pura completa, encadenada como lo hará T8
// =============================================
// Estos tests no cubren una función nueva: comprueban que leer el objetivo,
// calcular el acumulado y sacar el progreso encadenados dan el resultado que
// espera la interfaz. Son el espejo de lo que hará renderObjetivoSemana().
test('flujo completo: objetivo sin cumplir, con minutos acumulados', () => {
  const hoy = fecha(2026, 9, 2); // miércoles
  const rango = rangoSemana(hoy);
  const sesiones = [
    { fecha: '2026-08-31', tema: 'Matemáticas', minutos: 60 },
    { fecha: '2026-09-01', tema: 'Historia', minutos: 40 },
    { fecha: '2026-09-03', tema: 'Futura', minutos: 500 }, // no cuenta
  ];
  const objetivos = sanearObjetivos({ [rango.lunes]: 300 });

  const objetivo = leerObjetivo(objetivos, rango.lunes);
  const acumulado = acumuladoSemana(hoy, sesiones, rango.lunes);

  assert.strictEqual(objetivo, 300);
  assert.strictEqual(acumulado, 100);
  // 100 de 300 es un tercio: el porcentaje sale en coma flotante, sin redondear.
  assert.strictEqual(porcentaje(acumulado, objetivo), (100 / 300) * 100);
  assert.strictEqual(cumpleObjetivo(acumulado, objetivo), false);
});

test('flujo completo: objetivo cumplido justo en el último día de la semana', () => {
  const hoy = fecha(2026, 9, 6); // domingo
  const rango = rangoSemana(hoy);
  const sesiones = [{ fecha: '2026-09-06', tema: 'Repaso', minutos: 300 }];

  const objetivo = leerObjetivo(sanearObjetivos({ [rango.lunes]: 300 }), rango.lunes);
  const acumulado = acumuladoSemana(hoy, sesiones, rango.lunes);

  assert.strictEqual(rango.lunes, '2026-08-31');
  assert.strictEqual(acumulado, 300);
  assert.strictEqual(porcentaje(acumulado, objetivo), 100);
  assert.strictEqual(cumpleObjetivo(acumulado, objetivo), true);
});

test('flujo completo: objetivo superado mantiene el 100 % y las cifras reales', () => {
  const hoy = fecha(2026, 9, 6);
  const rango = rangoSemana(hoy);
  const sesiones = [{ fecha: '2026-09-05', tema: 'Repaso', minutos: 520 }];

  const objetivo = leerObjetivo(sanearObjetivos({ [rango.lunes]: 300 }), rango.lunes);
  const acumulado = acumuladoSemana(hoy, sesiones, rango.lunes);

  assert.strictEqual(acumulado, 520);
  assert.strictEqual(porcentaje(acumulado, objetivo), 100); // nunca > 100
  assert.strictEqual(cumpleObjetivo(acumulado, objetivo), true);
});

test('flujo completo: almacenamiento de objetivos corrupto deja la semana sin objetivo', () => {
  const hoy = fecha(2026, 9, 2);
  const rango = rangoSemana(hoy);
  const sesiones = [{ fecha: '2026-09-01', tema: 'Historia', minutos: 40 }];

  // El navegador pasa el objeto ya parseado; si está corrupto, sanear da {}.
  const objetivo = leerObjetivo(sanearObjetivos(null), rango.lunes);
  const acumulado = acumuladoSemana(hoy, sesiones, rango.lunes);

  assert.strictEqual(objetivo, null);
  assert.strictEqual(acumulado, 40);
  assert.strictEqual(porcentaje(acumulado, objetivo), null); // sin barra
  assert.strictEqual(cumpleObjetivo(acumulado, objetivo), false);
});

test('flujo completo: objetivo guardado como decimal deja la semana sin objetivo', () => {
  const hoy = fecha(2026, 9, 2);
  const rango = rangoSemana(hoy);

  const objetivo = leerObjetivo(
    sanearObjetivos({ [rango.lunes]: 300.5 }), rango.lunes);

  assert.strictEqual(objetivo, null);
});

test('flujo completo: al cambiar de semana el acumulado y el objetivo son los nuevos', () => {
  const hoy = fecha(2026, 9, 8); // martes de la semana siguiente
  const objetivos = sanearObjetivos({
    '2026-08-31': 300, // semana anterior
    '2026-09-07': 240, // semana en curso
  });
  const sesiones = [
    { fecha: '2026-08-31', tema: 'Semana anterior', minutos: 300 },
    { fecha: '2026-09-07', tema: 'Semana en curso', minutos: 60 },
  ];

  const semanaAnterior = rangoSemana(fecha(2026, 9, 2));
  const semanaEnCurso = rangoSemana(hoy);
  assert.strictEqual(semanaAnterior.lunes, '2026-08-31');
  assert.strictEqual(semanaEnCurso.lunes, '2026-09-07');

  // Cada semana ve solo lo suyo.
  assert.strictEqual(leerObjetivo(objetivos, semanaAnterior.lunes), 300);
  assert.strictEqual(acumuladoSemana(fecha(2026, 9, 2), sesiones, semanaAnterior.lunes), 300);
  assert.strictEqual(leerObjetivo(objetivos, semanaEnCurso.lunes), 240);
  assert.strictEqual(acumuladoSemana(hoy, sesiones, semanaEnCurso.lunes), 60);
});