// Pruebas unitarias de helpers puros (ejecutar con: node frontend/tests/helpers.test.js)
const assert = require('assert');
const { parseSqlError } = require('../js/api.js');
const { mapSedeToNodo, validarCredenciales } = require('../js/auth.js');

let pasadas = 0;
function test(nombre, fn) {
  try { fn(); pasadas++; console.log('  OK  ' + nombre); }
  catch (e) { console.error('FALLO ' + nombre + ' -> ' + e.message); process.exitCode = 1; }
}

// ---------- parseSqlError ----------
test('parseSqlError extrae número y mensaje de un THROW del SP', () => {
  const detail = "('42000', \"[42000] [Microsoft][ODBC Driver 17 for SQL Server][SQL Server]Error: El cliente ya existe en el sistema. (50007) (SQLExecDirectW)\")";
  const r = parseSqlError(detail);
  assert.strictEqual(r.numero, '50007');
  assert.ok(/El cliente ya existe/.test(r.mensaje));
});

test('parseSqlError usa el texto crudo cuando no hay código 500xx', () => {
  const r = parseSqlError('Error interno inesperado');
  assert.strictEqual(r.numero, null);
  assert.strictEqual(r.mensaje, 'Error interno inesperado');
});

test('parseSqlError maneja null', () => {
  const r = parseSqlError(null);
  assert.strictEqual(r.numero, null);
  assert.ok(r.mensaje.length > 0);
});

// ---------- mapSedeToNodo ----------
test('mapSedeToNodo mapea norte->S01 y sur->S02', () => {
  assert.strictEqual(mapSedeToNodo('norte'), 'S01');
  assert.strictEqual(mapSedeToNodo('sur'), 'S02');
  assert.strictEqual(mapSedeToNodo('otra'), null);
});

// ---------- validarCredenciales ----------
test('validarCredenciales acepta el trío correcto', () => {
  const u = validarCredenciales('guillermo', 'cevallos', 'norte');
  assert.ok(u && u.nodo === 'S01');
});

test('validarCredenciales rechaza contraseña incorrecta', () => {
  assert.strictEqual(validarCredenciales('guillermo', 'malo', 'norte'), null);
});

test('validarCredenciales rechaza sede que no corresponde al usuario', () => {
  // guillermo pertenece a S01 (norte); si elige sur, debe fallar
  assert.strictEqual(validarCredenciales('guillermo', 'cevallos', 'sur'), null);
});

test('validarCredenciales acepta usuario de S02', () => {
  const u = validarCredenciales('juan', 'chuga', 'sur');
  assert.ok(u && u.nodo === 'S02');
});

console.log('\n' + pasadas + ' pruebas OK');
