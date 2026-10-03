/// <reference types="node" />
// Test que vigila que la COPIA de la lógica pura dentro de app.js no se
// quede atrás respecto al fichero puro que se testea aquí.
//
// El proyecto mantiene el mismo código en dos sitios (decisión D4 del plan):
//   - docs/002-objetivo-semanal/pure/objetivo-semanal.pure.mjs, con "export",
//     para poder importarlo desde los tests;
//   - al final de app.js, sin "export", porque un <script> normal del navegador
//     no admite esa palabra y saltaría un SyntaxError al abrir con doble clic.
//
// Este test lee los dos ficheros DEL DISCO en cada ejecución y los compara, así
// que si alguien toca una función y olvida la otra, falla aquí en vez de
// descubrirlo en el navegador.
import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Las rutas se calculan desde este mismo fichero, y no desde el directorio
// actual, para que el test funcione aunque se ejecute node --test desde otro sitio.
const CARPETA_AQUI = dirname(fileURLToPath(import.meta.url));
const RUTA_PURO = join(CARPETA_AQUI, 'pure', 'objetivo-semanal.pure.mjs');
const RUTA_APP = join(CARPETA_AQUI, '..', '..', 'app.js');

// Marcador que abre el bloque de código en los dos ficheros.
const INICIO_BLOQUE = 'const MESES = [';
// Marcador que cierra el bloque copiado en app.js (justo después va el arranque).
const FIN_BLOQUE_APP = '// Arranque';

// Helpers que SOLO define el fichero puro. En la copia no están porque app.js
// ya tiene fechaAString() y stringAFecha() (decisión D11), y por eso el test no
// debe quejarse de que falten allí.
const SOLO_EN_EL_FICHERO_PURO = ['fechaAString', 'fechaDesdeTexto'];

// ───────────────────────────── Lectura ─────────────────────────────

function leer(ruta) {
  return readFileSync(ruta, 'utf8');
}

// Se quedan con el bloque de código, sin la cabecera de comentarios que lo explica.
function extraerPuro(texto) {
  const desde = texto.indexOf(INICIO_BLOQUE);
  assert.ok(desde >= 0, `no encuentro "${INICIO_BLOQUE}" en el fichero puro`);
  return texto.slice(desde).split('\n');
}

function extraerCopia(texto) {
  const desde = texto.indexOf(INICIO_BLOQUE);
  const hasta = texto.indexOf(FIN_BLOQUE_APP);
  assert.ok(desde >= 0, `no encuentro "${INICIO_BLOQUE}" en app.js`);
  assert.ok(hasta > desde, `no encuentro "${FIN_BLOQUE_APP}" en app.js`);
  return texto.slice(desde, hasta).split('\n');
}

// ─────────────────────────── Normalización ───────────────────────────
// Se comparan solo LÍNEAS DE CÓDIGO, así que se quita todo lo que no es código:
// los comentarios (pueden diferir: los avisos de sincronización son distintos en
// cada fichero) y las líneas en blanco.
function quitarComentarios(lineas) {
  return lineas
    .map((linea) => {
      const pos = linea.indexOf('//');
      return pos >= 0 ? linea.slice(0, pos) : linea;
    })
    .filter((linea) => linea.trim() !== '');
}

// Normaliza una línea de código para poder compararla con su homónima:
//   - quita los espacios de sobra, que no cambian el comportamiento;
//   - quita la palabra "export", que solo lleva el fichero puro (CF-38);
//   - renombra fechaDesdeTexto por stringAFecha, porque en la copia esa función
//     se llama así: es la misma función, con el nombre que ya usa app.js (D11).
function normalizarLinea(linea) {
  let limpia = linea.trim().replace(/\s+/g, ' ');
  limpia = limpia.replace(/^export\s+/, '');
  limpia = limpia.replace(/\bfechaDesdeTexto\b/g, 'stringAFecha');
  return limpia;
}

// ─────────────────────Trocear en funciones ─────────────────────
// El bloque se parte en un trozo por cada función o constante, para poder decir
// QUÉ función difiere y no solo "son distintos".
function trocear(lineas) {
  const trozos = new Map();
  let nombre = null;
  let lineasTrozo = [];
  let lineaInicio = 0;
  let profundidad = 0;

  const cerrarTrozo = () => {
    if (nombre !== null) trozos.set(nombre, { lineasTrozo, lineaInicio });
    nombre = null;
    lineasTrozo = [];
  };

  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    // Solo interesta abrir un trozo nuevo si estamos a nivel superior.
    // Se admiten las dos formas de declarar: "function f()" en el fichero puro y
    // "export function f()" (que solo lleva el fichero puro), "const MESES", etc.
    const abre = profundidad === 0
      && /^(?:export\s+)?(?:function|const|let|var)\s+[A-Za-z_$][\w$]*/.test(linea);
    if (abre) {
      cerrarTrozo();
      nombre = linea.replace(/^(?:export\s+)?(?:function|const|let|var)\s+/, '').split(/[^\w$]/)[0];
      lineaInicio = i + 1;
    }

    // Se cuentan llaves, corchetes y paréntesis para saber cuándo acaba el
    // trozo. Las plantillas como `${x}` también llevan llaves, pero entran y
    // salen emparejadas, así que no falsean la cuenta.
    profundidad += (linea.match(/[{([]/g) || []).length;
    profundidad -= (linea.match(/[})\]]/g) || []).length;

    if (nombre !== null) lineasTrozo.push(linea);

    // El trozo acaba al volver a nivel superior (la llave o el corchete que lo
    // abrieron ya se ha cerrado).
    if (nombre !== null && profundidad === 0) cerrarTrozo();
  }
  cerrarTrozo();
  return trozos;
}

// ───────────────────────────── Comparar ─────────────────────────────

// Devuelve una lista de problemas. Vacía significa que todo cuadra.
function encontrarDiferencias(puro, copia) {
  const problemas = [];
  const troceadosPuro = trocear(puro);
  const troceadosCopia = trocear(copia);

  const soloEnPuro = SOLO_EN_EL_FICHERO_PURO;

  // Guarda contra los troceadores: si dejaran de encontrar declaraciones, la
  // comparación de abajo pasaría siempre en verde sin mirar nada. Se avisa
  // nombrando lo que sobra o falta, no solo con una cuenta.
  const enPuro = [...troceadosPuro.keys()];
  const enCopia = [...troceadosCopia.keys()];
  const compartidas = enPuro.filter((n) => enCopia.includes(n) && !soloEnPuro.includes(n));
  if (compartidas.length !== 15) {
    problemas.push(
      `el troceador ha encontrado ${compartidas.length} declaraciones compartidas `
      + 'en vez de las 15 que debería; la comparación no sería fiable',
    );
  }

  for (const [nombre, enPuro] of troceadosPuro) {
    // Los helpers que solo define el fichero puro se saltan a propósito.
    if (soloEnPuro.includes(nombre)) continue;

    const enCopia = troceadosCopia.get(nombre);
    if (!enCopia) {
      problemas.push(
        `la función "${nombre}" está en el fichero puro (línea ${enPuro.lineaInicio}) `
        + 'pero NO está en la copia de app.js',
      );
      continue;
    }

    const lineasPuro = enPuro.lineasTrozo.map(normalizarLinea);
    const lineasCopia = enCopia.lineasTrozo.map(normalizarLinea);
    const maximo = Math.max(lineasPuro.length, lineasCopia.length);

    for (let i = 0; i < maximo; i++) {
      const a = lineasPuro[i];
      const b = lineasCopia[i];
      if (a === b) continue;

      const dondePuro = a === undefined ? '(la línea no existe)' : a;
      const dondeCopia = b === undefined ? '(la línea no existe)' : b;
      problemas.push(
        `la función "${nombre}" difiere `
        + `(fichero puro línea ${enPuro.lineaInicio + i}, `
        + `app.js línea ${enCopia.lineaInicio + i}):\n`
        + `      fichero puro: ${dondePuro}\n`
        + `      copia app.js: ${dondeCopia}`,
      );
      // Con una diferencia basta: se listan solo las primeras de cada función
      // para que el mensaje siga siendo legible.
      break;
    }
  }

  for (const [nombre, enCopia] of troceadosCopia) {
    if (troceadosPuro.has(nombre)) continue;
    problemas.push(
      `la función "${nombre}" está en la copia de app.js (línea ${enCopia.lineaInicio}) `
      + 'pero NO está en el fichero puro',
    );
  }

  return problemas;
}

// ───────────────────────────── El test ─────────────────────────────

test('la copia de la lógica pura en app.js está sincronizada con el fichero puro', () => {
  const puro = quitarComentarios(extraerPuro(leer(RUTA_PURO)));
  const copia = quitarComentarios(extraerCopia(leer(RUTA_APP)));

  const problemas = encontrarDiferencias(puro, copia);

  assert.deepStrictEqual(
    problemas,
    [],
    'La lógica pura y su copia en app.js NO son la misma cosa.\n'
    + 'Si has tocado una función, toca también la otra (decisión D4).\n'
    + 'Recuerda: en la copia no puede ir "export", y fechaDesdeTexto se llama '
    + 'stringAFecha.\n'
    + '\nProblemas encontrados:\n'
    + problemas.map((p) => '  - ' + p).join('\n'),
  );
});