// =====================================================================
// tecnicos.js — Técnicos (fragmentados por sede) y Sedes, vía API
// (sesión y menú lateral los maneja ui.js)
// =====================================================================

const nodo = getNodo();

// Título con la sede activa
document.getElementById('pageTitleTecnicos').textContent =
  'Personal técnico de la Sede ' + nombreSede(nodo);

// ===== Estado =====
let tecnicos = [];          // { codigo, cedula, nombre, apellido, especialidad, sede }
let selectedCodigo = null;  // entero (codigo_empleado)

function normalizarTecnico(t) {
  return {
    codigo:       t.codigo_empleado,
    cedula:       t.cedula_tecnico,
    nombre:       t.nombre_tecnico,
    apellido:     t.apellido_tecnico,
    especialidad: t.especialidad_tecnico,
    sede:         t.codigo_sede,
  };
}

// ===== Carga desde el API =====
async function cargarTecnicos() {
  try {
    const data = await tecnicosApi.list(nodo);
    tecnicos = (data.tecnicos || []).map(normalizarTecnico);
    selectedCodigo = null;
    document.getElementById('btnEliminarTecnico').disabled   = true;
    document.getElementById('btnActualizarTecnico').disabled = true;
    renderTecnicos();
  } catch (err) {
    tecnicos = [];
    renderTablaMensaje('bodyTecnicos', 5, mensajeDesconexion('Técnicos'));
  }
}

async function cargarSedes() {
  try {
    const data = await sedesApi.list();
    renderSedes(data.sedes || []);
  } catch (err) {
    renderTablaMensaje('bodySedes', 3, mensajeDesconexion('Sedes'));
  }
}

// ===== Tablas =====
function renderTecnicos() {
  const tbody = document.getElementById('bodyTecnicos');
  tbody.innerHTML = '';

  if (!tecnicos.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#aaa;padding:16px;">No se encuentran registros de Técnicos</td></tr>';
    return;
  }

  tecnicos.forEach(function(t) {
    const tr = document.createElement('tr');
    if (t.codigo === selectedCodigo) tr.classList.add('selected');
    tr.innerHTML =
      '<td>' + t.codigo + '</td>' +
      '<td>' + t.cedula + '</td>' +
      '<td>' + t.nombre + '</td>' +
      '<td>' + t.apellido + '</td>' +
      '<td>' + t.especialidad + '</td>';
    tr.addEventListener('click', function() { selectTecnico(t.codigo); });
    tbody.appendChild(tr);
  });
}

function renderSedes(sedes) {
  const tbody = document.getElementById('bodySedes');
  tbody.innerHTML = '';
  if (!sedes.length) {
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#aaa;padding:16px;">No se encuentran registros de Sedes</td></tr>';
    return;
  }
  sedes.forEach(function(s) {
    const tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + s.nombre_sede + '</td>' +
      '<td>' + s.direccion_sede + '</td>' +
      '<td>' + s.telefono_sede + '</td>';
    tbody.appendChild(tr);
  });
}

function selectTecnico(codigo) {
  selectedCodigo = (selectedCodigo === codigo) ? null : codigo;
  renderTecnicos();
  const has = selectedCodigo !== null;
  document.getElementById('btnEliminarTecnico').disabled   = !has;
  document.getElementById('btnActualizarTecnico').disabled = !has;
}

function tecnicoSeleccionado() {
  return tecnicos.find(function(t) { return t.codigo === selectedCodigo; }) || null;
}

// ===== Toggle lápiz (usado con onclick en el HTML) =====
function toggleEdit(campo) {
  const span  = document.getElementById('span'  + campo);
  const input = document.getElementById('input' + campo);
  if (input.style.display === 'none' || input.style.display === '') {
    input.value         = span.textContent;
    span.style.display  = 'none';
    input.style.display = 'inline-block';
    input.focus();
  } else {
    span.textContent    = input.value.trim() || span.textContent;
    span.style.display  = 'inline';
    input.style.display = 'none';
  }
}

// ===== AGREGAR =====
document.getElementById('btnAgregarTecnico').addEventListener('click', function() {
  ['agCedula','agNombre','agApellido','agEspecialidad'].forEach(function(id) {
    document.getElementById(id).value = '';
  });
  document.getElementById('modalAgregarTecnico').classList.add('active');
});

document.getElementById('btnCerrarAgregar').addEventListener('click', function() {
  document.getElementById('modalAgregarTecnico').classList.remove('active');
});

document.getElementById('btnConfirmarAgregar').addEventListener('click', function() {
  const cedula       = document.getElementById('agCedula').value.trim();
  const nombre       = document.getElementById('agNombre').value.trim();
  const apellido     = document.getElementById('agApellido').value.trim();
  const especialidad = document.getElementById('agEspecialidad').value.trim();

  conCarga(document.getElementById('btnConfirmarAgregar'), async function() {
    try {
      await tecnicosApi.crear({
        cedula_tecnico:       cedula,
        nombre_tecnico:       nombre,
        apellido_tecnico:     apellido,
        especialidad_tecnico: especialidad,
        codigo_sede:          nodo,
      });
      document.getElementById('modalAgregarTecnico').classList.remove('active');
      await cargarTecnicos();
    } catch (err) {
      showError(err);
    }
  });
});

// ===== ELIMINAR =====
document.getElementById('btnEliminarTecnico').addEventListener('click', function() {
  const t = tecnicoSeleccionado();
  if (!t) return;
  document.getElementById('modalTecCodigo').textContent       = t.codigo;
  document.getElementById('modalTecCedula').textContent       = t.cedula;
  document.getElementById('modalTecNombre').textContent       = t.nombre;
  document.getElementById('modalTecApellido').textContent     = t.apellido;
  document.getElementById('modalTecEspecialidad').textContent = t.especialidad;
  document.getElementById('modalEliminarTecnico').classList.add('active');
});

document.getElementById('btnCancelarElimTecnico').addEventListener('click', function() {
  document.getElementById('modalEliminarTecnico').classList.remove('active');
});

document.getElementById('btnConfirmarElimTecnico').addEventListener('click', function() {
  const codigo = selectedCodigo;
  conCarga(document.getElementById('btnConfirmarElimTecnico'), async function() {
    try {
      await tecnicosApi.eliminar(codigo);
      document.getElementById('modalEliminarTecnico').classList.remove('active');
      await cargarTecnicos();
    } catch (err) {
      document.getElementById('modalEliminarTecnico').classList.remove('active');
      showError(err);
    }
  });
});

// ===== ACTUALIZAR =====
document.getElementById('btnActualizarTecnico').addEventListener('click', function() {
  const t = tecnicoSeleccionado();
  if (!t) return;

  document.getElementById('updCodigoDisp').textContent = t.codigo;
  document.getElementById('updCedulaDisp').textContent = t.cedula;

  document.getElementById('spanNombre').textContent    = t.nombre;
  document.getElementById('spanNombre').style.display  = 'inline';
  document.getElementById('inputNombre').value         = t.nombre;
  document.getElementById('inputNombre').style.display = 'none';

  document.getElementById('spanApellido').textContent    = t.apellido;
  document.getElementById('spanApellido').style.display  = 'inline';
  document.getElementById('inputApellido').value         = t.apellido;
  document.getElementById('inputApellido').style.display = 'none';

  document.getElementById('spanEspecialidad').textContent    = t.especialidad;
  document.getElementById('spanEspecialidad').style.display   = 'inline';
  document.getElementById('inputEspecialidad').value         = t.especialidad;
  document.getElementById('inputEspecialidad').style.display = 'none';

  document.getElementById('modalActualizarTecnico').classList.add('active');
});

document.getElementById('btnCerrarActualizar').addEventListener('click', function() {
  document.getElementById('modalActualizarTecnico').classList.remove('active');
});
document.getElementById('btnCancelarActualizar').addEventListener('click', function() {
  document.getElementById('modalActualizarTecnico').classList.remove('active');
});

document.getElementById('btnConfirmarActualizar').addEventListener('click', async function() {
  const t = tecnicoSeleccionado();
  if (!t) return;

  const inNombre = document.getElementById('inputNombre');
  const inApell  = document.getElementById('inputApellido');
  const inEsp    = document.getElementById('inputEspecialidad');

  const nombre       = (inNombre.style.display !== 'none' ? inNombre.value.trim() : document.getElementById('spanNombre').textContent.trim()) || t.nombre;
  const apellido     = (inApell.style.display  !== 'none' ? inApell.value.trim()  : document.getElementById('spanApellido').textContent.trim()) || t.apellido;
  const especialidad = (inEsp.style.display    !== 'none' ? inEsp.value.trim()    : document.getElementById('spanEspecialidad').textContent.trim()) || t.especialidad;

  conCarga(document.getElementById('btnConfirmarActualizar'), async function() {
    try {
      await tecnicosApi.actualizar(t.codigo, {
        cedula_tecnico:       t.cedula,
        nombre_tecnico:       nombre,
        apellido_tecnico:     apellido,
        especialidad_tecnico: especialidad,
      });
      document.getElementById('modalActualizarTecnico').classList.remove('active');
      document.getElementById('modalActualizadoExitoTec').classList.add('active');
      await cargarTecnicos();
    } catch (err) {
      showError(err);
    }
  });
});

document.getElementById('btnAceptarActualizadoTec').addEventListener('click', function() {
  document.getElementById('modalActualizadoExitoTec').classList.remove('active');
});

// Cerrar modales al clic fuera
['modalAgregarTecnico','modalActualizarTecnico','modalEliminarTecnico','modalActualizadoExitoTec'].forEach(function(id) {
  document.getElementById(id).addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
  });
});

// ===== Filtro numérico en campo cédula (modal agregar técnico) =====
document.getElementById('agCedula').addEventListener('input', function () {
  this.value = this.value.replace(/[^0-9]/g, '');
});

// ===== Inicializar =====
if (nodo) {
  cargarTecnicos();
  cargarSedes();
}
