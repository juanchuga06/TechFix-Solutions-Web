// =====================================================================
// auth.js — Autenticación de la pantalla de inicio (index.html)
// ---------------------------------------------------------------------
// Los usuarios/contraseñas están definidos aquí (no provienen de la base
// de datos). Su único fin es decidir en qué sede (nodo) se realizarán las
// operaciones de forma realista.
//
//   usuario     contraseña    nodo
//   guillermo   cevallos      S01  (Norte)
//   karen       mosquera      S01  (Norte)
//   juan        chuga         S02  (Sur)
//   henry       echeverria    S02  (Sur)
//
// En la sesión se guarda:
//   - nodo:    'S01' | 'S02'  -> se usa en todas las operaciones
//   - usuario: nombre de usuario -> se muestra en el menú lateral
// =====================================================================

const USUARIOS = [
  { usuario: 'guillermo', contrasena: 'cevallos',   nodo: 'S01' },
  { usuario: 'karen',     contrasena: 'mosquera',   nodo: 'S01' },
  { usuario: 'juan',      contrasena: 'chuga',      nodo: 'S02' },
  { usuario: 'henry',     contrasena: 'echeverria', nodo: 'S02' },
];

// Mapea la opción del selector de sede a su código de nodo.
function mapSedeToNodo(sede) {
  if (sede === 'norte') return 'S01';
  if (sede === 'sur')   return 'S02';
  return null;
}

// Valida el trío usuario + contraseña + sede.
// Devuelve el usuario encontrado (con su nodo) o null.
function validarCredenciales(usuario, contrasena, sede) {
  const nodo = mapSedeToNodo(sede);
  if (!nodo) return null;

  const encontrado = USUARIOS.find(
    (u) => u.usuario === usuario && u.contrasena === contrasena
  );
  if (!encontrado) return null;

  // El nodo del usuario debe coincidir con la sede seleccionada.
  if (encontrado.nodo !== nodo) return null;

  return encontrado;
}

// ---------------------------------------------------------------------
// Wiring del formulario (solo en el navegador)
// ---------------------------------------------------------------------
if (typeof document !== 'undefined') {
  const form = document.getElementById('loginForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const usuario    = document.getElementById('usuario').value.trim();
      const contrasena = document.getElementById('contrasena').value;
      const sede       = document.getElementById('sede').value;
      const alertBox   = document.getElementById('loginAlert');

      if (!usuario || !contrasena || !sede) {
        alertBox.textContent = 'Por favor complete todos los campos.';
        alertBox.style.display = 'block';
        return;
      }

      const encontrado = validarCredenciales(usuario, contrasena, sede);
      if (!encontrado) {
        alertBox.textContent = 'Usuario, contraseña o sede incorrectos.';
        alertBox.style.display = 'block';
        return;
      }

      alertBox.style.display = 'none';

      sessionStorage.setItem('nodo', encontrado.nodo);
      sessionStorage.setItem('usuario', encontrado.usuario);
      window.location.href = 'dashboard.html';
    });
  }
}

// Exportar helpers puros para tests en Node.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { USUARIOS, mapSedeToNodo, validarCredenciales };
}
