// ===== Sesión y sidebar =====
const sede    = sessionStorage.getItem('sede') || 'norte';
const usuario = sessionStorage.getItem('usuario') || 'Usuario';
document.getElementById('sedeLabel').textContent       = 'Sede: ' + sede.toUpperCase();
document.getElementById('sidebarUserName').textContent = usuario;

document.getElementById('sidebarUserBtn').addEventListener('click', () => {
  document.getElementById('logoutPanel').classList.toggle('open');
});
document.getElementById('btnLogout').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'index.html';
});

// ===== Datos mock =====
let repuestosMock = [
  { codigo: 'R-001', nombre: 'Pantalla LCD 15"',      costo: 85.00  },
  { codigo: 'R-002', nombre: 'Batería Li-Ion 4000mAh', costo: 32.50  },
  { codigo: 'R-003', nombre: 'Teclado USB estándar',   costo: 18.00  },
  { codigo: 'R-004', nombre: 'Disco SSD 256GB',        costo: 55.00  },
  { codigo: 'R-005', nombre: 'Memoria RAM DDR4 8GB',   costo: 40.00  },
  { codigo: 'R-006', nombre: 'Cable HDMI 1.8m',        costo: 8.50   },
  { codigo: 'R-007', nombre: 'Ventilador CPU 80mm',    costo: 12.00  },
  { codigo: 'R-008', nombre: 'Fuente de poder 500W',   costo: 48.00  },
  { codigo: 'R-009', nombre: 'Placa madre micro-ATX',  costo: 110.00 },
];

let selectedCodigo = null;
let contadorCodigo = repuestosMock.length + 1;

// ===== Helpers =====
function nextCodigo() {
  const code = 'R-' + String(contadorCodigo).padStart(3, '0');
  contadorCodigo++;
  return code;
}

function formatCosto(val) {
  return '$' + parseFloat(val).toFixed(2);
}

// ===== Renderizar tabla =====
function renderRepuestos() {
  const tbody = document.getElementById('bodyRepuestos');
  tbody.innerHTML = '';
  repuestosMock.forEach(r => {
    const tr = document.createElement('tr');
    tr.dataset.codigo = r.codigo;
    if (r.codigo === selectedCodigo) tr.classList.add('selected');
    tr.innerHTML = `
      <td>${r.codigo}</td>
      <td>${r.nombre}</td>
      <td>${formatCosto(r.costo)}</td>
    `;
    tr.addEventListener('click', () => selectRepuesto(r.codigo));
    tbody.appendChild(tr);
  });
}

// ===== Selección =====
function selectRepuesto(codigo) {
  selectedCodigo = (selectedCodigo === codigo) ? null : codigo;
  renderRepuestos();
  const has = !!selectedCodigo;
  document.getElementById('btnEliminarRepuesto').disabled  = !has;
  document.getElementById('btnActualizarRepuesto').disabled = !has;
}

// ===== NUEVO REPUESTO =====
document.getElementById('btnNuevoRepuesto').addEventListener('click', () => {
  document.getElementById('nuevoNombre').value = '';
  document.getElementById('nuevoCosto').value  = '';
  document.getElementById('modalNuevo').classList.add('active');
});

document.getElementById('btnCerrarNuevo').addEventListener('click', () => {
  document.getElementById('modalNuevo').classList.remove('active');
});

document.getElementById('btnAgregarRepuesto').addEventListener('click', () => {
  const nombre = document.getElementById('nuevoNombre').value.trim();
  const costo  = parseFloat(document.getElementById('nuevoCosto').value);

  if (!nombre || isNaN(costo) || costo < 0) {
    alert('Complete todos los campos correctamente.'); return;
  }

  // TODO: POST /api/repuestos
  repuestosMock.push({ codigo: nextCodigo(), nombre, costo });
  document.getElementById('modalNuevo').classList.remove('active');
  selectedCodigo = null;
  document.getElementById('btnEliminarRepuesto').disabled  = true;
  document.getElementById('btnActualizarRepuesto').disabled = true;
  renderRepuestos();
});

// ===== ELIMINAR REPUESTO =====
document.getElementById('btnEliminarRepuesto').addEventListener('click', () => {
  if (!selectedCodigo) return;
  const r = repuestosMock.find(x => x.codigo === selectedCodigo);
  if (!r) return;
  document.getElementById('modalElimCodigo').textContent = r.codigo;
  document.getElementById('modalElimNombre').textContent = r.nombre;
  document.getElementById('modalElimCosto').textContent  = formatCosto(r.costo);
  document.getElementById('modalEliminar').classList.add('active');
});

document.getElementById('btnCancelarElim').addEventListener('click', () => {
  document.getElementById('modalEliminar').classList.remove('active');
});

document.getElementById('btnConfirmarElim').addEventListener('click', () => {
  // TODO: DELETE /api/repuestos/:codigo
  repuestosMock = repuestosMock.filter(x => x.codigo !== selectedCodigo);
  selectedCodigo = null;
  document.getElementById('btnEliminarRepuesto').disabled  = true;
  document.getElementById('btnActualizarRepuesto').disabled = true;
  document.getElementById('modalEliminar').classList.remove('active');
  renderRepuestos();
});

// ===== ACTUALIZAR REPUESTO =====
document.getElementById('btnActualizarRepuesto').addEventListener('click', () => {
  if (!selectedCodigo) return;
  const r = repuestosMock.find(x => x.codigo === selectedCodigo);
  if (!r) return;
  document.getElementById('updCodigo').value       = r.codigo;
  document.getElementById('updNombreActual').value  = r.nombre;
  document.getElementById('updCostoActual').value   = formatCosto(r.costo);
  document.getElementById('updNuevoNombre').value   = '';
  document.getElementById('updNuevoCosto').value    = '';
  document.getElementById('modalActualizar').classList.add('active');
});

document.getElementById('btnCerrarActualizar').addEventListener('click', () => {
  document.getElementById('modalActualizar').classList.remove('active');
});

document.getElementById('btnConfirmarActualizar').addEventListener('click', () => {
  const r = repuestosMock.find(x => x.codigo === selectedCodigo);
  if (!r) return;

  const nuevoNombre = document.getElementById('updNuevoNombre').value.trim();
  const nuevoCosto  = parseFloat(document.getElementById('updNuevoCosto').value);

  if (!nuevoNombre && isNaN(nuevoCosto)) {
    alert('Ingrese al menos un campo a actualizar.'); return;
  }

  // TODO: PUT /api/repuestos/:codigo
  if (nuevoNombre) r.nombre = nuevoNombre;
  if (!isNaN(nuevoCosto) && nuevoCosto >= 0) r.costo = nuevoCosto;

  document.getElementById('modalActualizar').classList.remove('active');
  renderRepuestos();
});

// Cerrar modales al clic fuera
['modalNuevo', 'modalEliminar', 'modalActualizar'].forEach(id => {
  document.getElementById(id).addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('active');
  });
});

// ===== Inicializar =====
renderRepuestos();
