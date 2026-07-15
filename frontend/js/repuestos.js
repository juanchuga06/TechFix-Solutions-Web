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

// ===== Modal de éxito =====
function showExito(titulo, mensaje) {
  document.getElementById('exitoTitulo').textContent  = titulo;
  document.getElementById('exitoMensaje').textContent = mensaje;
  document.getElementById('modalExito').classList.add('active');
}
document.getElementById('btnCerrarExito').addEventListener('click', () => {
  document.getElementById('modalExito').classList.remove('active');
});
document.getElementById('btnAceptarExito').addEventListener('click', () => {
  document.getElementById('modalExito').classList.remove('active');
});

// ===== Generar código automático =====
function generarCodigo() {
  if (!repuestosMock.length) return 'R-001';
  const nums = repuestosMock.map(r => parseInt(r.codigo.replace('R-', '')) || 0);
  const next  = Math.max(...nums) + 1;
  return 'R-' + String(next).padStart(3, '0');
}

// ===== Datos mock =====
let repuestosMock = [
  { codigo: 'R-001', nombre: 'Pantalla LCD',       precio: 85.00  },
  { codigo: 'R-002', nombre: 'Batería 4000mAh',    precio: 32.50  },
  { codigo: 'R-003', nombre: 'Conector de carga',  precio: 12.00  },
  { codigo: 'R-004', nombre: 'Altavoz interno',    precio: 18.75  },
  { codigo: 'R-005', nombre: 'Cámara trasera',     precio: 55.00  },
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

    const tdNombre = document.createElement('td');
    tdNombre.textContent = r.nombre;

    const tdPrecio = document.createElement('td');
    tdPrecio.textContent = parseFloat(r.precio).toFixed(2);

    tr.appendChild(tdCodigo);
    tr.appendChild(tdNombre);
    tr.appendChild(tdPrecio);

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

// ===== Validar precio: solo decimales positivos =====
function validarPrecio(input) {
  input.addEventListener('keydown', e => {
    if (['-', '+', 'e', 'E'].includes(e.key)) e.preventDefault();
  });
  input.addEventListener('input', () => {
    if (input.value !== '' && (isNaN(parseFloat(input.value)) || parseFloat(input.value) < 0)) {
      input.value = '';
    }
  });
}
validarPrecio(document.getElementById('nuevoPrecioRep'));
validarPrecio(document.getElementById('updPrecio'));

// ===== NUEVO REPUESTO =====
document.getElementById('btnNuevoRepuesto').addEventListener('click', () => {
  document.getElementById('nuevoNombreRep').value = '';
  document.getElementById('nuevoPrecioRep').value = '';
  document.getElementById('modalNuevo').classList.add('active');
});

document.getElementById('btnCerrarNuevo').addEventListener('click', () => {
  document.getElementById('modalNuevo').classList.remove('active');
});

document.getElementById('btnAgregarRepuesto').addEventListener('click', () => {
  const nombre = document.getElementById('nuevoNombreRep').value.trim();
  const precio = parseFloat(document.getElementById('nuevoPrecioRep').value);

  if (!nombre) { alert('Ingrese el nombre del repuesto.'); return; }
  if (isNaN(precio) || precio < 0) { alert('Ingrese un precio válido.'); return; }

  const codigo = generarCodigo();
  // TODO: POST /api/repuestos  payload: { codigo, nombre, precio }
  repuestosMock.push({ codigo, nombre, precio });
  document.getElementById('modalNuevo').classList.remove('active');
  selectedCodigo = null;
  document.getElementById('btnEliminarRepuesto').disabled   = true;
  document.getElementById('btnActualizarRepuesto').disabled = true;
  renderRepuestos();
  showExito('Repuesto Ingresado con Éxito', 'El repuesto se ingresó exitosamente.');
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
  const rep = repuestosMock.find(r => r.codigo === selectedCodigo);
  if (!rep) return;
  document.getElementById('updCodigo').value  = rep.codigo;
  document.getElementById('updNombre').value  = rep.nombre;
  document.getElementById('updPrecio').value  = parseFloat(rep.precio).toFixed(2);
  document.getElementById('modalActualizar').classList.add('active');
});

document.getElementById('btnCerrarActualizar').addEventListener('click', () => {
  document.getElementById('modalActualizar').classList.remove('active');
});

document.getElementById('btnConfirmarActualizar').addEventListener('click', () => {
  const nuevoNombre = document.getElementById('updNombre').value.trim();
  const nuevoPrecio = parseFloat(document.getElementById('updPrecio').value);

  if (!nuevoNombre) { alert('El nombre no puede estar vacío.'); return; }
  if (isNaN(nuevoPrecio) || nuevoPrecio < 0) { alert('Ingrese un precio válido.'); return; }

  const rep = repuestosMock.find(r => r.codigo === selectedCodigo);
  if (rep) {
    rep.nombre = nuevoNombre;
    rep.precio = nuevoPrecio;
  }
  // TODO: PUT /api/repuestos/:codigo  payload: { nombre: nuevoNombre, precio: nuevoPrecio }

  document.getElementById('modalActualizar').classList.remove('active');
  renderRepuestos();
  showExito('Repuesto Actualizado con Éxito', 'El repuesto se actualizó exitosamente.');
});

// Cerrar modales al clic fuera
['modalNuevo', 'modalEliminar', 'modalActualizar', 'modalExito'].forEach(id => {
  document.getElementById(id).addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
  });
});

// ===== Inicializar =====
renderRepuestos();
