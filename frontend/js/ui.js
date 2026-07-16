// =====================================================================
// ui.js — Utilidades compartidas de interfaz para páginas protegidas
// ---------------------------------------------------------------------
// - Guarda de sesión (redirige a index.html si no hay sesión)
// - Cableado del menú lateral (usuario, sede, cerrar sesión)
// - Modal de error global reutilizable: showError(numero, mensaje)
//
// Debe cargarse DESPUÉS de api.js y ANTES del script propio de la página.
// =====================================================================

// ---------- Sesión ----------
function getNodo()    { return sessionStorage.getItem('nodo'); }
function getUsuario() { return sessionStorage.getItem('usuario') || 'Usuario'; }
function esSur()      { return getNodo() === 'S02'; }

function nombreSede(nodo) {
  if (nodo === 'S01') return 'Norte';
  if (nodo === 'S02') return 'Sur';
  return '';
}

// Redirige al login si no hay sesión activa.
function requireSession() {
  if (!getNodo()) {
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// ---------- Menú lateral ----------
function initSidebar() {
  const nodo = getNodo();

  const sedeLabelText = document.getElementById('sedeLabelText');
  if (sedeLabelText) sedeLabelText.textContent = 'Sede: ' + nombreSede(nodo).toUpperCase();

  const userName = document.getElementById('sidebarUserName');
  if (userName) userName.textContent = getUsuario();

  const userBtn = document.getElementById('sidebarUserBtn');
  const panel   = document.getElementById('logoutPanel');
  if (userBtn && panel) {
    userBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      panel.classList.toggle('open');
    });
    panel.addEventListener('click', (e) => e.stopPropagation());
    document.addEventListener('click', () => panel.classList.remove('open'));
  }

  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      sessionStorage.clear();
      window.location.href = 'index.html';
    });
  }
}

// ---------- Modal de error global ----------
function ensureErrorModal() {
  if (document.getElementById('globalErrorModal')) return;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'globalErrorModal';
  overlay.innerHTML = `
    <div class="modal" style="max-width:440px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid #eee; padding-bottom:12px;">
        <h3 class="modal-title" style="margin-bottom:0; color:#E63946;">Error en la operación</h3>
        <button id="btnCerrarErrorGlobal" style="background:none;border:1px solid #ccc;width:24px;height:24px;border-radius:3px;cursor:pointer;font-size:14px;line-height:1;">✕</button>
      </div>
      <p id="globalErrorNumero" style="font-size:13px; font-weight:700; color:#E63946; text-align:center; margin-bottom:8px;"></p>
      <p id="globalErrorMensaje" style="font-size:14px; color:#333; text-align:center; margin-bottom:24px;"></p>
      <div style="display:flex; justify-content:center;">
        <button class="btn btn-primary" id="btnAceptarErrorGlobal">Aceptar</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const cerrar = () => overlay.classList.remove('active');
  overlay.querySelector('#btnCerrarErrorGlobal').addEventListener('click', cerrar);
  overlay.querySelector('#btnAceptarErrorGlobal').addEventListener('click', cerrar);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrar(); });
}

// Muestra el modal de error. Acepta (numero, mensaje) o un objeto {numero, mensaje}.
function showError(numero, mensaje) {
  if (numero && typeof numero === 'object') {
    mensaje = numero.mensaje;
    numero  = numero.numero;
  }
  ensureErrorModal();
  const numEl = document.getElementById('globalErrorNumero');
  const msgEl = document.getElementById('globalErrorMensaje');
  numEl.textContent = numero ? ('Error N° ' + numero) : '';
  numEl.style.display = numero ? 'block' : 'none';
  msgEl.textContent = mensaje || 'Ocurrió un error inesperado.';
  document.getElementById('globalErrorModal').classList.add('active');
}

// ---------- Mensaje de tabla inaccesible (sin pop-up) ----------
// Se usa cuando NO se puede leer el contenido de una tabla al abrir la
// página (p. ej. la base de datos o un nodo remoto están desconectados).
function mensajeDesconexion(tabla) {
  return 'No se ha podido encontrar registros de la tabla ' + tabla +
         ' debido a la desconexión con la base de datos';
}

function renderTablaMensaje(tbodyId, colspan, mensaje) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML =
    '<tr><td colspan="' + colspan + '" style="text-align:center;color:#c0392b;padding:16px;">' +
    mensaje + '</td></tr>';
}

// ---------- Indicador de carga en botones de acción ----------
// Envuelve una operación asíncrona (guardar, eliminar, actualizar...):
// deshabilita el botón y muestra una ruedita mientras dura el proceso.
// Así el usuario ve que sí se hizo clic y no puede duplicar registros.
async function conCarga(btn, fn) {
  if (btn && btn.dataset.cargando === '1') return; // ya está en proceso
  if (btn) {
    const label = btn.textContent;
    btn.dataset.cargando = '1';
    btn.dataset.htmlOriginal = btn.innerHTML;
    btn.disabled = true;
    btn.classList.add('btn-cargando');
    btn.innerHTML = '<span class="spinner"></span>' + label;
  }
  try {
    return await fn();
  } finally {
    if (btn) {
      btn.dataset.cargando = '';
      btn.disabled = false;
      btn.classList.remove('btn-cargando');
      if (btn.dataset.htmlOriginal !== undefined) btn.innerHTML = btn.dataset.htmlOriginal;
    }
  }
}

// ---------- Arranque automático en páginas protegidas ----------
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (!requireSession()) return;
    initSidebar();
    ensureErrorModal();
  });
}
