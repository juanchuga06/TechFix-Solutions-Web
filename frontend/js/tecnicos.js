// ===== Sesión y sidebar =====
const sede    = sessionStorage.getItem('sede') || 'norte';
const usuario = sessionStorage.getItem('usuario') || 'Usuario';
document.getElementById('sedeLabel').textContent       = 'Sede: ' + sede.toUpperCase();
document.getElementById('sidebarUserName').textContent = usuario;
document.getElementById('pageTitleTecnicos').textContent =
  'Personal técnico de la Sede ' + sede.charAt(0).toUpperCase() + sede.slice(1);

document.getElementById('sidebarUserBtn').addEventListener('click', function() {
  document.getElementById('logoutPanel').classList.toggle('open');
});
document.getElementById('btnLogout').addEventListener('click', function() {
  sessionStorage.clear();
  window.location.href = 'index.html';
});

// ===== Datos =====
var tecnicosMock = [
  { codigo: 'T-001', cedula: '1234567890', nombre: 'Carlos', apellido: 'Ramírez', especialidad: 'Hardware', sede: 'norte' },
  { codigo: 'T-002', cedula: '0987654321', nombre: 'Luis',   apellido: 'Morales', especialidad: 'Software', sede: 'norte' },
  { codigo: 'T-003', cedula: '1122334455', nombre: 'María',  apellido: 'Salas',   especialidad: 'Redes',    sede: 'sur'   },
  { codigo: 'T-004', cedula: '5544332211', nombre: 'Jorge',  apellido: 'Vega',    especialidad: 'Hardware', sede: 'sur'   },
];

var sedesMock = [
  { nombre: 'Sede Norte', direccion: 'Av. Norte 123', telefono: '02-555-1001' },
  { nombre: 'Sede Sur',   direccion: 'Calle Sur 456', telefono: '02-555-2002' },
];

var selectedCodigo = null;
var contadorCodigo = tecnicosMock.length + 1;

function nextCodigo() {
  return 'T-' + String(contadorCodigo++).padStart(3, '0');
}

// ===== Tabla técnicos =====
function renderTecnicos() {
  var tbody = document.getElementById('bodyTecnicos');
  tbody.innerHTML = '';
  tecnicosMock.filter(function(t) { return t.sede === sede; }).forEach(function(t) {
    var tr = document.createElement('tr');
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

function renderSedes() {
  var tbody = document.getElementById('bodySedes');
  tbody.innerHTML = '';
  sedesMock.forEach(function(s) {
    var tr = document.createElement('tr');
    tr.innerHTML = '<td>' + s.nombre + '</td><td>' + s.direccion + '</td><td>' + s.telefono + '</td>';
    tbody.appendChild(tr);
  });
}

function selectTecnico(codigo) {
  selectedCodigo = (selectedCodigo === codigo) ? null : codigo;
  renderTecnicos();
  var has = !!selectedCodigo;
  document.getElementById('btnEliminarTecnico').disabled   = !has;
  document.getElementById('btnActualizarTecnico').disabled = !has;
}

// ===== Toggle lápiz =====
function toggleEdit(campo) {
  var span  = document.getElementById('span'  + campo);
  var input = document.getElementById('input' + campo);
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
  var cedula       = document.getElementById('agCedula').value.trim();
  var nombre       = document.getElementById('agNombre').value.trim();
  var apellido     = document.getElementById('agApellido').value.trim();
  var especialidad = document.getElementById('agEspecialidad').value.trim();
  if (!cedula || !nombre || !apellido || !especialidad) { alert('Complete todos los campos.'); return; }
  tecnicosMock.push({ codigo: nextCodigo(), cedula: cedula, nombre: nombre, apellido: apellido, especialidad: especialidad, sede: sede });
  document.getElementById('modalAgregarTecnico').classList.remove('active');
  renderTecnicos();
});

// ===== ELIMINAR =====
document.getElementById('btnEliminarTecnico').addEventListener('click', function() {
  var t = null;
  for (var i = 0; i < tecnicosMock.length; i++) {
    if (tecnicosMock[i].codigo === selectedCodigo) { t = tecnicosMock[i]; break; }
  }
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
  tecnicosMock = tecnicosMock.filter(function(x) { return x.codigo !== selectedCodigo; });
  selectedCodigo = null;
  document.getElementById('btnEliminarTecnico').disabled   = true;
  document.getElementById('btnActualizarTecnico').disabled = true;
  document.getElementById('modalEliminarTecnico').classList.remove('active');
  renderTecnicos();
});

// ===== ACTUALIZAR =====
document.getElementById('btnActualizarTecnico').addEventListener('click', function() {
  var t = null;
  for (var i = 0; i < tecnicosMock.length; i++) {
    if (tecnicosMock[i].codigo === selectedCodigo) { t = tecnicosMock[i]; break; }
  }
  if (!t) return;

  document.getElementById('updCodigoDisp').textContent = t.codigo;
  document.getElementById('updCedulaDisp').textContent = t.cedula;

  document.getElementById('spanNombre').textContent       = t.nombre;
  document.getElementById('spanNombre').style.display     = 'inline';
  document.getElementById('inputNombre').value            = t.nombre;
  document.getElementById('inputNombre').style.display    = 'none';

  document.getElementById('spanApellido').textContent     = t.apellido;
  document.getElementById('spanApellido').style.display   = 'inline';
  document.getElementById('inputApellido').value          = t.apellido;
  document.getElementById('inputApellido').style.display  = 'none';

  document.getElementById('spanEspecialidad').textContent    = t.especialidad;
  document.getElementById('spanEspecialidad').style.display  = 'inline';
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

document.getElementById('btnConfirmarActualizar').addEventListener('click', function() {
  var t = null;
  for (var i = 0; i < tecnicosMock.length; i++) {
    if (tecnicosMock[i].codigo === selectedCodigo) { t = tecnicosMock[i]; break; }
  }
  if (!t) return;

  var inNombre = document.getElementById('inputNombre');
  var inApell  = document.getElementById('inputApellido');
  var inEsp    = document.getElementById('inputEspecialidad');

  t.nombre       = (inNombre.style.display !== 'none' ? inNombre.value.trim()  : document.getElementById('spanNombre').textContent.trim())       || t.nombre;
  t.apellido     = (inApell.style.display  !== 'none' ? inApell.value.trim()   : document.getElementById('spanApellido').textContent.trim())      || t.apellido;
  t.especialidad = (inEsp.style.display    !== 'none' ? inEsp.value.trim()     : document.getElementById('spanEspecialidad').textContent.trim())  || t.especialidad;

  document.getElementById('modalActualizarTecnico').classList.remove('active');
  document.getElementById('modalActualizadoExitoTec').classList.add('active');
  renderTecnicos();
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
renderTecnicos();
renderSedes();
