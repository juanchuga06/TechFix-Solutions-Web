// =====================================================================
// app.js — Dashboard de órdenes (lectura distribuida) vía API
// (sesión y menú lateral los maneja ui.js)
//
// Ahora se pueden ver las órdenes de ambas sedes mediante pestañas:
//   ALL -> todas las sedes | S01 -> Norte | S02 -> Sur
// Se carga todo una vez y se filtra en el cliente al cambiar de pestaña.
// =====================================================================

const nodo = getNodo();

// ===== Estado =====
let ordenes = [];          // todas las órdenes cargadas (ambas sedes)
let selectedFolio = null;  // entero
let sedeActiva = 'ALL';    // 'ALL' | 'S01' | 'S02'

// Las columnas de laboratorio se muestran salvo en la pestaña "Sede norte".
function mostrarLab() { return sedeActiva !== 'S01'; }

function normalizar(o) {
  return {
    folio:        o.numero_folio,
    fecha:        o.fecha_ingreso,
    descripcion:  o.descripcion_fallo,
    estado:       o.estado_orden,
    tecnico:      o.nombre_tecnico,
    cliente:      o.nombre_cliente,
    sede:         o.codigo_sede,
    encriptacion: o.nivel_encriptacion,
    protocolo:    o.protocolo_seguridad,
    horas:        o.horas_laboratorio,
  };
}

// Órdenes visibles según la pestaña activa.
function ordenesVisibles() {
  if (sedeActiva === 'ALL') return ordenes;
  return ordenes.filter(o => o.sede === sedeActiva);
}

// ===== Carga desde el API (siempre todas las sedes) =====
async function cargarOrdenes(fecha) {
  try {
    const data = await ordenesApi.dashboard(null, null, fecha || null);
    ordenes = (data.ordenes || []).map(normalizar);
    selectedFolio = null;
    document.getElementById('btnEliminar').disabled   = true;
    document.getElementById('btnActualizar').disabled = true;
    renderTodo();
  } catch (err) {
    ordenes = [];
    const colTodas  = mostrarLab() ? 9 : 6;
    const colEstado = mostrarLab() ? 8 : 5;
    renderTablaMensaje('bodyTodasOrdenes', colTodas,  mensajeDesconexion('Órdenes'));
    renderTablaMensaje('bodyPendientes',   colEstado, mensajeDesconexion('Órdenes'));
    renderTablaMensaje('bodyEnProceso',    colEstado, mensajeDesconexion('Órdenes'));
    renderTablaMensaje('bodyFinalizadas',  colEstado, mensajeDesconexion('Órdenes'));
  }
}

// Muestra/oculta las columnas de laboratorio según la pestaña.
function actualizarColumnasLab() {
  const mostrar = mostrarLab();
  document.querySelectorAll('.col-sur').forEach(el => {
    el.style.display = mostrar ? '' : 'none';
  });
}

function renderTodo() {
  actualizarColumnasLab();
  const data = ordenesVisibles();
  renderTodasOrdenes(data);
  renderTablaEstado('bodyPendientes',  data, 'Pendiente');
  renderTablaEstado('bodyEnProceso',   data, 'En Proceso');
  renderTablaEstado('bodyFinalizadas', data, 'Finalizada');
}

function badgeClass(estado) {
  const map = { 'Pendiente': 'badge-pending', 'En Proceso': 'badge-progress', 'Finalizada': 'badge-done' };
  return map[estado] || '';
}

function colsSur(o) {
  if (!mostrarLab()) return '';
  return `<td style="display:table-cell">${o.encriptacion ?? '—'}</td>
          <td style="display:table-cell">${o.protocolo ?? '—'}</td>
          <td style="display:table-cell">${o.horas ?? '—'}</td>`;
}

// ===== Tabla "Todas las órdenes" (seleccionable) =====
function renderTodasOrdenes(data) {
  const tbody = document.getElementById('bodyTodasOrdenes');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!data.length) {
    const cols = mostrarLab() ? 9 : 6;
    tbody.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;color:#aaa;padding:16px;">No se encuentran registros de Órdenes</td></tr>`;
    return;
  }

  data.forEach(o => {
    const tr = document.createElement('tr');
    tr.dataset.folio = o.folio;
    if (o.folio === selectedFolio) tr.classList.add('selected');
    tr.innerHTML = `
      <td>${o.folio}</td>
      <td>${o.fecha}</td>
      <td>${o.descripcion}</td>
      <td><span class="badge ${badgeClass(o.estado)}">${o.estado}</span></td>
      <td>${o.tecnico ?? '—'}</td>
      <td>${o.cliente ?? '—'}</td>
      ${colsSur(o)}
    `;
    tr.addEventListener('click', () => selectOrden(o.folio));
    tbody.appendChild(tr);
  });
}

function renderTablaEstado(bodyId, data, estado) {
  const tbody = document.getElementById(bodyId);
  if (!tbody) return;
  tbody.innerHTML = '';
  const filtradas = data.filter(o => o.estado === estado);

  if (!filtradas.length) {
    const cols = mostrarLab() ? 8 : 5;
    tbody.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;color:#aaa;padding:16px;">No se encuentran registros de Órdenes</td></tr>`;
    return;
  }

  filtradas.forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${o.folio}</td>
      <td>${o.fecha}</td>
      <td>${o.descripcion}</td>
      <td>${o.tecnico ?? '—'}</td>
      <td>${o.cliente ?? '—'}</td>
      ${colsSur(o)}
    `;
    tbody.appendChild(tr);
  });
}

// ===== Selección de fila =====
function selectOrden(folio) {
  selectedFolio = (selectedFolio === folio) ? null : folio;
  renderTodasOrdenes(ordenesVisibles());
  const has = selectedFolio !== null;
  document.getElementById('btnEliminar').disabled   = !has;
  document.getElementById('btnActualizar').disabled = !has;
}

// ===== Pestañas de sede =====
document.querySelectorAll('.sede-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.sede-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    sedeActiva = tab.dataset.sede;
    // Al cambiar de pestaña se deselecciona cualquier orden.
    selectedFolio = null;
    document.getElementById('btnEliminar').disabled   = true;
    document.getElementById('btnActualizar').disabled = true;
    renderTodo();
  });
});

// ===== Filtro por fecha (consulta al API) =====
document.getElementById('filtroFecha')?.addEventListener('change', function () {
  cargarOrdenes(this.value || null);
});

// ===== Modal eliminar =====
document.getElementById('btnEliminar')?.addEventListener('click', () => {
  if (selectedFolio === null) return;
  const orden = ordenes.find(o => o.folio === selectedFolio);
  if (!orden) return;

  document.getElementById('modalFolio').textContent       = orden.folio;
  document.getElementById('modalFecha').textContent       = orden.fecha;
  document.getElementById('modalDescripcion').textContent = orden.descripcion;
  document.getElementById('modalEstado').textContent      = orden.estado;
  document.getElementById('modalTecnico').textContent     = orden.tecnico ?? '—';
  document.getElementById('modalCliente').textContent     = orden.cliente ?? '—';

  // Los datos de laboratorio solo aplican a órdenes de la sede sur.
  const esOrdenSur = orden.sede === 'S02';
  document.querySelectorAll('.col-sur-modal').forEach(el => {
    el.style.display = esOrdenSur ? '' : 'none';
  });
  if (esOrdenSur) {
    document.getElementById('modalEncriptacion').textContent = orden.encriptacion ?? '—';
    document.getElementById('modalProtocolo').textContent    = orden.protocolo ?? '—';
    document.getElementById('modalHoras').textContent        = (orden.horas ?? '—') + (orden.horas != null ? ' h' : '');
  }

  document.getElementById('modalEliminar').classList.add('active');
});

document.getElementById('btnCancelarEliminar')?.addEventListener('click', () => {
  document.getElementById('modalEliminar').classList.remove('active');
});

document.getElementById('btnConfirmarEliminar')?.addEventListener('click', () => {
  const folio = selectedFolio;
  conCarga(document.getElementById('btnConfirmarEliminar'), async () => {
    try {
      await ordenesApi.eliminar(folio);
      document.getElementById('modalEliminar').classList.remove('active');
      await cargarOrdenes(document.getElementById('filtroFecha')?.value || null);
    } catch (err) {
      document.getElementById('modalEliminar').classList.remove('active');
      showError(err);
    }
  });
});

document.getElementById('modalEliminar')?.addEventListener('click', function (e) {
  if (e.target === this) this.classList.remove('active');
});

// ===== Botones nueva / actualizar =====
document.getElementById('btnNueva')?.addEventListener('click', () => {
  sessionStorage.removeItem('ordenEditar');
  sessionStorage.removeItem('ordenSeleccionada');
  window.location.href = 'ordenes.html';
});

document.getElementById('btnActualizar')?.addEventListener('click', () => {
  if (selectedFolio === null) return;
  const orden = ordenes.find(o => o.folio === selectedFolio);
  if (!orden) return;
  sessionStorage.setItem('ordenSeleccionada', String(selectedFolio));
  sessionStorage.setItem('ordenEditar', JSON.stringify(orden));
  window.location.href = 'ordenes.html?modo=editar';
});

// ===== Inicializar =====
const filtroFecha = document.getElementById('filtroFecha');
if (filtroFecha) {
  const hoy = new Date().toISOString().split('T')[0];
  filtroFecha.setAttribute('max', hoy);
}

if (nodo) cargarOrdenes();
