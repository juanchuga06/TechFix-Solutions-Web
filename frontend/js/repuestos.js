// =====================================================================
// repuestos.js — Catálogo de repuestos conectado al API
// (sesión y menú lateral los maneja ui.js)
// El código del repuesto lo genera el procedimiento almacenado (entero).
// =====================================================================

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

// ===== Estado =====
let repuestos = [];        // { codigo, nombre, precio }
let selectedCodigo = null; // entero

function normalizar(r) {
  return {
    codigo: r.codigo_repuesto,
    nombre: r.nombre_pieza,
    precio: r.costo_unitario,
  };
}

// ===== Carga desde el API =====
async function cargarRepuestos() {
  try {
    const data = await repuestosApi.list();
    repuestos = (data.repuestos || []).map(normalizar);
    selectedCodigo = null;
    document.getElementById('btnEliminarRepuesto').disabled   = true;
    document.getElementById('btnActualizarRepuesto').disabled = true;
    renderRepuestos();
  } catch (err) {
    repuestos = [];
    renderTablaMensaje('bodyRepuestos', 3, mensajeDesconexion('Repuestos'));
  }
}

// ===== Renderizar tabla =====
function renderRepuestos() {
  const tbody = document.getElementById('bodyRepuestos');
  tbody.innerHTML = '';

  if (!repuestos.length) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#aaa;padding:16px;">No se encuentran registros de Repuestos</td></tr>';
    return;
  }

  repuestos.forEach(r => {
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
  const has = selectedCodigo !== null;
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
  // Al salir del campo, un valor de 0 (o 0.0) se descarta.
  input.addEventListener('blur', () => {
    if (input.value !== '' && parseFloat(input.value) <= 0) input.value = '';
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

  if (isNaN(precio) || precio <= 0) {
    showError(null, 'El costo unitario debe ser un valor mayor a 0.');
    return;
  }

  conCarga(document.getElementById('btnAgregarRepuesto'), async () => {
    try {
      await repuestosApi.crear({ nombre_pieza: nombre, costo_unitario: isNaN(precio) ? null : precio });
      document.getElementById('modalNuevo').classList.remove('active');
      await cargarRepuestos();
      showExito('Repuesto Ingresado con Éxito', 'El repuesto se ingresó exitosamente.');
    } catch (err) {
      showError(err);
    }
  });
});

// ===== ELIMINAR REPUESTO =====
document.getElementById('btnEliminarRepuesto').addEventListener('click', () => {
  if (selectedCodigo === null) return;
  document.getElementById('modalElimCodigo').textContent = selectedCodigo;
  document.getElementById('modalEliminar').classList.add('active');
});

document.getElementById('btnCancelarElim').addEventListener('click', () => {
  document.getElementById('modalEliminar').classList.remove('active');
});

document.getElementById('btnConfirmarElim').addEventListener('click', () => {
  const codigo = selectedCodigo;
  conCarga(document.getElementById('btnConfirmarElim'), async () => {
    try {
      await repuestosApi.eliminar(codigo);
      document.getElementById('modalEliminar').classList.remove('active');
      await cargarRepuestos();
      showExito('Repuesto Eliminado con Éxito', 'El repuesto se eliminó exitosamente.');
    } catch (err) {
      document.getElementById('modalEliminar').classList.remove('active');
      showError(err);
    }
  });
});

// ===== ACTUALIZAR REPUESTO =====
document.getElementById('btnActualizarRepuesto').addEventListener('click', () => {
  if (selectedCodigo === null) return;
  const rep = repuestos.find(r => r.codigo === selectedCodigo);
  if (!rep) return;
  document.getElementById('updCodigo').value = rep.codigo;
  document.getElementById('updNombre').value = rep.nombre;
  document.getElementById('updPrecio').value = parseFloat(rep.precio).toFixed(2);
  document.getElementById('modalActualizar').classList.add('active');
});

document.getElementById('btnCerrarActualizar').addEventListener('click', () => {
  document.getElementById('modalActualizar').classList.remove('active');
});

document.getElementById('btnConfirmarActualizar').addEventListener('click', () => {
  const nuevoNombre = document.getElementById('updNombre').value.trim();
  const nuevoPrecio = parseFloat(document.getElementById('updPrecio').value);

  if (isNaN(nuevoPrecio) || nuevoPrecio <= 0) {
    showError(null, 'El costo unitario debe ser un valor mayor a 0.');
    return;
  }

  conCarga(document.getElementById('btnConfirmarActualizar'), async () => {
    try {
      await repuestosApi.actualizar(selectedCodigo, {
        nombre_pieza:   nuevoNombre,
        costo_unitario: isNaN(nuevoPrecio) ? null : nuevoPrecio,
      });
      document.getElementById('modalActualizar').classList.remove('active');
      await cargarRepuestos();
      showExito('Repuesto Actualizado con Éxito', 'El repuesto se actualizó exitosamente.');
    } catch (err) {
      showError(err);
    }
  });
});

// Cerrar modales al clic fuera
['modalNuevo', 'modalEliminar', 'modalActualizar', 'modalExito'].forEach(id => {
  document.getElementById(id).addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
  });
});

// ===== Inicializar =====
if (getNodo()) cargarRepuestos();
