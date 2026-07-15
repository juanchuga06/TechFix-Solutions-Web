// ===== Cierre de sesión =====
document.getElementById('sidebarUserBtn')?.addEventListener('click', (e) => {
  e.stopPropagation();
  document.getElementById('logoutPanel').classList.toggle('open');
});

document.getElementById('logoutPanel')?.addEventListener('click', (e) => {
  e.stopPropagation();
});

document.getElementById('btnLogout')?.addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'index.html';
});

// ===== Datos de sesión =====
const sede    = sessionStorage.getItem('sede') || 'norte';
const usuario = sessionStorage.getItem('usuario') || 'Usuario';
const esSur   = sede === 'sur';

// Mostrar sede y usuario en sidebar
const sedeLabel = document.getElementById('sedeLabel');
if (sedeLabel) sedeLabel.textContent = 'Sede: ' + sede.toUpperCase();
const sidebarUserName = document.getElementById('sidebarUserName');
if (sidebarUserName) sidebarUserName.textContent = usuario;

// ===== Mostrar/ocultar columnas sede sur =====
document.querySelectorAll('.col-sur').forEach(el => {
  el.style.display = esSur ? '' : 'none';
});

// ===== Datos mock (se reemplazarán con fetch al API) =====
const ordenesMock = [
  { folio: 'F-001', fecha: '2024-06-01', descripcion: 'Pantalla rota',      estado: 'Pendiente',  tecnico: 'Carlos Ramírez',  cliente: 'Ana López',     encriptacion: 'AES-256',  protocolo: 'TLS 1.3', horas: 4 },
  { folio: 'F-002', fecha: '2024-06-03', descripcion: 'No enciende',        estado: 'En proceso', tecnico: 'Luis Mendoza',    cliente: 'Pedro Díaz',    encriptacion: 'RSA-2048', protocolo: 'SSH',     horas: 6 },
  { folio: 'F-003', fecha: '2024-06-05', descripcion: 'Batería defectuosa', estado: 'Finalizada', tecnico: 'María Suárez',    cliente: 'Juan García',   encriptacion: 'AES-128',  protocolo: 'TLS 1.2', horas: 2 },
  { folio: 'F-004', fecha: '2024-06-07', descripcion: 'Teclado bloqueado',  estado: 'Pendiente',  tecnico: 'Carlos Ramírez',  cliente: 'Sofía Torres',  encriptacion: 'AES-256',  protocolo: 'TLS 1.3', horas: 3 },
  { folio: 'F-005', fecha: '2024-06-08', descripcion: 'Puerto USB dañado',  estado: 'En proceso', tecnico: 'Luis Mendoza',    cliente: 'Marta Ruiz',    encriptacion: 'RSA-2048', protocolo: 'SSH',     horas: 5 },
  { folio: 'F-006', fecha: '2024-06-10', descripcion: 'Sistema operativo',  estado: 'Finalizada', tecnico: 'María Suárez',    cliente: 'Roberto Vega',  encriptacion: 'AES-128',  protocolo: 'TLS 1.2', horas: 8 },
];

// ===== Estado de selección =====
let selectedFolio = null;

// ===== Columnas extra de sede sur para filas =====
function colsSur(o) {
  if (!esSur) return '';
  return `<td style="display:table-cell">${o.encriptacion}</td>
          <td style="display:table-cell">${o.protocolo}</td>
          <td style="display:table-cell">${o.horas} h</td>`;
}

// ===== Renderizar tabla "Todas las órdenes" =====
function renderTodasOrdenes(data) {
  const tbody = document.getElementById('bodyTodasOrdenes');
  if (!tbody) return;
  tbody.innerHTML = '';
  data.forEach(o => {
    const tr = document.createElement('tr');
    tr.dataset.folio = o.folio;
    if (o.folio === selectedFolio) tr.classList.add('selected');
    tr.innerHTML = `
      <td>${o.folio}</td>
      <td>${o.fecha}</td>
      <td>${o.descripcion}</td>
      <td><span class="badge ${badgeClass(o.estado)}">${o.estado}</span></td>
      <td>${o.tecnico}</td>
      <td>${o.cliente}</td>
      ${colsSur(o)}
    `;
    tr.addEventListener('click', () => selectOrden(o.folio, data));
    tbody.appendChild(tr);
  });
}

// ===== Renderizar tablas de estado =====
function renderTablaEstado(bodyId, data, estado) {
  const tbody = document.getElementById(bodyId);
  if (!tbody) return;
  tbody.innerHTML = '';
  data.filter(o => o.estado === estado).forEach(o => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${o.folio}</td>
      <td>${o.fecha}</td>
      <td>${o.descripcion}</td>
      <td>${o.tecnico}</td>
      <td>${o.cliente}</td>
      ${colsSur(o)}
    `;
    tbody.appendChild(tr);
  });
}

function badgeClass(estado) {
  const map = { 'Pendiente': 'badge-pending', 'En proceso': 'badge-progress', 'Finalizada': 'badge-done' };
  return map[estado] || '';
}

// ===== Selección de fila =====
function selectOrden(folio, data) {
  selectedFolio = (selectedFolio === folio) ? null : folio;
  renderTodasOrdenes(data);
  const hasSelection = !!selectedFolio;
  document.getElementById('btnEliminar').disabled   = !hasSelection;
  document.getElementById('btnActualizar').disabled = !hasSelection;
}

// ===== Filtro por fecha =====
document.getElementById('filtroFecha')?.addEventListener('input', function () {
  const val = this.value;
  const filtradas = val ? ordenesMock.filter(o => o.fecha === val) : ordenesMock;
  selectedFolio = null;
  document.getElementById('btnEliminar').disabled   = true;
  document.getElementById('btnActualizar').disabled = true;
  renderTodasOrdenes(filtradas);
});

// ===== Modal eliminar =====
document.getElementById('btnEliminar')?.addEventListener('click', () => {
  if (!selectedFolio) return;
  const orden = ordenesMock.find(o => o.folio === selectedFolio);
  if (!orden) return;

  document.getElementById('modalFolio').textContent       = orden.folio;
  document.getElementById('modalFecha').textContent       = orden.fecha;
  document.getElementById('modalDescripcion').textContent = orden.descripcion;
  document.getElementById('modalEstado').textContent      = orden.estado;
  document.getElementById('modalTecnico').textContent     = orden.tecnico;
  document.getElementById('modalCliente').textContent     = orden.cliente;

  // Campos sede sur
  document.querySelectorAll('.col-sur-modal').forEach(el => {
    el.style.display = esSur ? '' : 'none';
  });
  if (esSur) {
    document.getElementById('modalEncriptacion').textContent = orden.encriptacion;
    document.getElementById('modalProtocolo').textContent    = orden.protocolo;
    document.getElementById('modalHoras').textContent        = orden.horas + ' h';
  }

  document.getElementById('modalEliminar').classList.add('active');
});

document.getElementById('btnCancelarEliminar')?.addEventListener('click', () => {
  document.getElementById('modalEliminar').classList.remove('active');
});

document.getElementById('btnConfirmarEliminar')?.addEventListener('click', () => {
  // TODO: llamar API DELETE /ordenes/:folio
  const idx = ordenesMock.findIndex(o => o.folio === selectedFolio);
  if (idx !== -1) ordenesMock.splice(idx, 1);

  document.getElementById('modalEliminar').classList.remove('active');
  selectedFolio = null;
  document.getElementById('btnEliminar').disabled   = true;
  document.getElementById('btnActualizar').disabled = true;

  renderTodasOrdenes(ordenesMock);
  renderTablaEstado('bodyPendientes',  ordenesMock, 'Pendiente');
  renderTablaEstado('bodyEnProceso',   ordenesMock, 'En proceso');
  renderTablaEstado('bodyFinalizadas', ordenesMock, 'Finalizada');
});

document.getElementById('modalEliminar')?.addEventListener('click', function (e) {
  if (e.target === this) this.classList.remove('active');
});

// ===== Botones =====
document.getElementById('btnNueva')?.addEventListener('click', () => {
  window.location.href = 'ordenes.html';
});

document.getElementById('btnActualizar')?.addEventListener('click', () => {
  if (selectedFolio) {
    sessionStorage.setItem('ordenSeleccionada', selectedFolio);
    window.location.href = 'ordenes.html?modo=editar';
  }
});

// ===== Inicializar =====
// Limitar filtro de fecha a hoy como máximo
const filtroFecha = document.getElementById('filtroFecha');
if (filtroFecha) {
  const hoy = new Date().toISOString().split('T')[0];
  filtroFecha.setAttribute('max', hoy);
}

renderTodasOrdenes(ordenesMock);
renderTablaEstado('bodyPendientes',  ordenesMock, 'Pendiente');
renderTablaEstado('bodyEnProceso',   ordenesMock, 'En proceso');
renderTablaEstado('bodyFinalizadas', ordenesMock, 'Finalizada');
