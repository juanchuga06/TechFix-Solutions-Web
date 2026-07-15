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

// ===== Datos mock — solo codigo y unidades =====
let repuestosMock = [
  { codigo: 'R-001', unidades: 10 },
  { codigo: 'R-002', unidades: 5  },
  { codigo: 'R-003', unidades: 8  },
  { codigo: 'R-004', unidades: 3  },
  { codigo: 'R-005', unidades: 12 },
];

let selectedCodigo = null;

// ===== Renderizar tabla =====
function renderRepuestos() {
  const tbody = document.getElementById('bodyRepuestos');
  tbody.innerHTML = '';

  if (!repuestosMock.length) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#aaa;padding:16px;">Sin repuestos</td></tr>';
    return;
  }

  repuestosMock.forEach(r => {
    const tr = document.createElement('tr');
    tr.dataset.codigo = r.codigo;
    if (r.codigo === selectedCodigo) tr.classList.add('selected');

    const tdCodigo = document.createElement('td');
    tdCodigo.textContent = r.codigo;

    const tdUnidades = document.createElement('td');
    tdUnidades.textContent = r.unidades;

    tr.appendChild(tdCodigo);
    tr.appendChild(tdUnidades);

    tr.addEventListener('click', () => selectRepuesto(r.codigo));
    tbody.appendChild(tr);
  });
}

// ===== Selección =====
function selectRepuesto(codigo) {
  selectedCodigo = (selectedCodigo === codigo) ? null : codigo;
  renderRepuestos();
  const has = !!selectedCodigo;
  document.getElementById('btnEliminarRepuesto').disabled   = !has;
  document.getElementById('btnActualizarRepuesto').disabled = !has;
}

// ===== NUEVO REPUESTO =====
document.getElementById('btnNuevoRepuesto').addEventListener('click', () => {
  document.getElementById('nuevoCodigoRep').value = '';
  document.getElementById('nuevoUnidades').value  = '';
  document.getElementById('modalNuevo').classList.add('active');
});

document.getElementById('btnCerrarNuevo').addEventListener('click', () => {
  document.getElementById('modalNuevo').classList.remove('active');
});

document.getElementById('btnAgregarRepuesto').addEventListener('click', () => {
  const codigo   = document.getElementById('nuevoCodigoRep').value.trim();
  const unidades = parseInt(document.getElementById('nuevoUnidades').value);
  if (!codigo) { alert('Ingrese el código del repuesto.'); return; }
  if (isNaN(unidades) || unidades < 0) { alert('Ingrese una cantidad de unidades válida (0 o más).'); return; }
  if (repuestosMock.find(r => r.codigo === codigo)) {
    alert('Ya existe un repuesto con ese código.'); return;
  }
  // TODO: POST /api/repuestos  payload: { codigo_repuesto: codigo, cantidad: unidades }
  repuestosMock.push({ codigo, unidades });
  document.getElementById('modalNuevo').classList.remove('active');
  selectedCodigo = null;
  document.getElementById('btnEliminarRepuesto').disabled   = true;
  document.getElementById('btnActualizarRepuesto').disabled = true;
  renderRepuestos();
});

// ===== ELIMINAR REPUESTO =====
document.getElementById('btnEliminarRepuesto').addEventListener('click', () => {
  if (!selectedCodigo) return;
  document.getElementById('modalElimCodigo').textContent = selectedCodigo;
  document.getElementById('modalEliminar').classList.add('active');
});

document.getElementById('btnCancelarElim').addEventListener('click', () => {
  document.getElementById('modalEliminar').classList.remove('active');
});

document.getElementById('btnConfirmarElim').addEventListener('click', () => {
  // TODO: DELETE /api/repuestos/:codigo
  repuestosMock = repuestosMock.filter(x => x.codigo !== selectedCodigo);
  selectedCodigo = null;
  document.getElementById('btnEliminarRepuesto').disabled   = true;
  document.getElementById('btnActualizarRepuesto').disabled = true;
  document.getElementById('modalEliminar').classList.remove('active');
  renderRepuestos();
});

// ===== ACTUALIZAR REPUESTO =====
document.getElementById('btnActualizarRepuesto').addEventListener('click', () => {
  if (!selectedCodigo) return;
  document.getElementById('updCodigo').value   = selectedCodigo;
  document.getElementById('updCantidad').value = '';
  document.getElementById('modalActualizar').classList.add('active');
});

document.getElementById('btnCerrarActualizar').addEventListener('click', () => {
  document.getElementById('modalActualizar').classList.remove('active');
});

document.getElementById('updCantidad').addEventListener('keydown', e => {
  if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault();
});
document.getElementById('nuevoUnidades').addEventListener('keydown', e => {
  if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault();
});

document.getElementById('btnConfirmarActualizar').addEventListener('click', () => {
  const cantidad = parseInt(document.getElementById('updCantidad').value);
  if (isNaN(cantidad) || cantidad < 1) {
    alert('Ingrese una cantidad válida (entero \u2265 1).'); return;
  }
  // TODO: PUT /api/repuestos/:codigo  payload: { codigo_repuesto: selectedCodigo, cantidad }
  const payload = { codigo_repuesto: selectedCodigo, cantidad };
  console.log('Actualizar repuesto:', payload);

  // Actualizar dato local
  const rep = repuestosMock.find(r => r.codigo === selectedCodigo);
  if (rep) rep.unidades = cantidad;

  document.getElementById('modalActualizar').classList.remove('active');
  renderRepuestos();
});

// Cerrar modales al clic fuera
['modalNuevo', 'modalEliminar', 'modalActualizar'].forEach(id => {
  document.getElementById(id).addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
  });
});

// ===== Inicializar =====
renderRepuestos();
