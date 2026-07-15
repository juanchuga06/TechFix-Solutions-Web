// ===== Sesión =====
const sede    = sessionStorage.getItem('sede') || 'norte';
const usuario = sessionStorage.getItem('usuario') || 'Usuario';
document.getElementById('sedeLabel').textContent      = 'Sede: ' + sede.toUpperCase();
document.getElementById('sidebarUserName').textContent = usuario;

// ===== Datos mock =====
let clientesMock = [
  { cedula: '175094144',  nombre: 'Juan',   apellido: 'Pérez',   telefono: '0996541144', correo: 'juan.perez@email.com' },
  { cedula: '176548924',  nombre: 'María',  apellido: 'López',   telefono: '0996547788', correo: 'mlopez@email.com' },
  { cedula: '105566253',  nombre: 'Carlos', apellido: 'Sánchez', telefono: '0996542255', correo: 'csanchez@email.com' },
  { cedula: '098123456',  nombre: 'Sofía',  apellido: 'Torres',  telefono: '0976543210', correo: 'storres@email.com' },
  { cedula: '087654321',  nombre: 'Pedro',  apellido: 'Díaz',    telefono: '0981234567', correo: 'pdiaz@email.com' },
  { cedula: '112233445',  nombre: 'Ana',    apellido: 'García',  telefono: '0991122334', correo: 'agarcia@email.com' },
  { cedula: '223344556',  nombre: 'Luis',   apellido: 'Mora',    telefono: '0992233445', correo: 'lmora@email.com' },
];

// ===== Paginación =====
const POR_PAGINA = 6;
let paginaActual = 1;
let clientesFiltrados = [...clientesMock];
let clienteParaEliminar = null;
let clienteParaActualizar = null;

// ===== Renderizar tabla =====
function renderTabla() {
  const tbody = document.getElementById('bodyClientes');
  tbody.innerHTML = '';

  const inicio = (paginaActual - 1) * POR_PAGINA;
  const pagina = clientesFiltrados.slice(inicio, inicio + POR_PAGINA);

  if (!pagina.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#aaa;padding:16px;">Sin resultados</td></tr>`;
    renderPaginacion();
    return;
  }

  pagina.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.cedula}</td>
      <td>${c.nombre} ${c.apellido}</td>
      <td>${c.telefono}</td>
      <td>${c.correo}</td>
      <td style="display:flex; gap:6px;">
        <button class="btn btn-primary btn-sm" data-cedula="${c.cedula}" data-action="actualizar">Actualizar</button>
        <button class="btn btn-danger btn-sm" data-cedula="${c.cedula}" data-action="eliminar">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = clientesMock.find(x => x.cedula === btn.dataset.cedula);
      if (btn.dataset.action === 'actualizar') abrirActualizar(c);
      if (btn.dataset.action === 'eliminar')   abrirEliminar(c);
    });
  });

  renderPaginacion();
}

function renderPaginacion() {
  const total  = Math.ceil(clientesFiltrados.length / POR_PAGINA);
  const div    = document.getElementById('paginacion');
  div.innerHTML = '';
  if (total <= 1) return;

  const btnPrev = document.createElement('button');
  btnPrev.textContent = 'Anterior';
  btnPrev.disabled = paginaActual === 1;
  btnPrev.addEventListener('click', () => { paginaActual--; renderTabla(); });
  div.appendChild(btnPrev);

  for (let i = 1; i <= total; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = 'page-btn' + (i === paginaActual ? ' active' : '');
    btn.addEventListener('click', () => { paginaActual = i; renderTabla(); });
    div.appendChild(btn);
  }

  const btnNext = document.createElement('button');
  btnNext.textContent = 'Siguiente';
  btnNext.disabled = paginaActual === total;
  btnNext.addEventListener('click', () => { paginaActual++; renderTabla(); });
  div.appendChild(btnNext);
}

// ===== Búsqueda =====
document.getElementById('buscarClienteDir').addEventListener('input', function () {
  const q = this.value.trim().toLowerCase();
  clientesFiltrados = q
    ? clientesMock.filter(c =>
        c.cedula.includes(q) ||
        (c.nombre + ' ' + c.apellido).toLowerCase().includes(q) ||
        c.correo.toLowerCase().includes(q))
    : [...clientesMock];
  paginaActual = 1;
  renderTabla();
});

// ===== Limpiar formulario =====
document.getElementById('btnLimpiar').addEventListener('click', () => {
  ['fCedula','fNombre','fApellido','fTelefono','fCorreo'].forEach(id => {
    document.getElementById(id).value = '';
  });
});

// ===== Registrar cliente =====
document.getElementById('btnRegistrar').addEventListener('click', () => {
  const cedula   = document.getElementById('fCedula').value.trim();
  const nombre   = document.getElementById('fNombre').value.trim();
  const apellido = document.getElementById('fApellido').value.trim();
  const telefono = document.getElementById('fTelefono').value.trim();
  const correo   = document.getElementById('fCorreo').value.trim();

  if (!cedula || !nombre || !apellido || !telefono || !correo) {
    alert('Complete todos los campos.'); return;
  }
  if (clientesMock.find(c => c.cedula === cedula)) {
    alert('Ya existe un cliente con esa cédula.'); return;
  }

  // TODO: POST /api/clientes
  clientesMock.push({ cedula, nombre, apellido, telefono, correo });
  clientesFiltrados = [...clientesMock];

  // Limpiar form y mostrar modal
  ['fCedula','fNombre','fApellido','fTelefono','fCorreo'].forEach(id => {
    document.getElementById(id).value = '';
  });

  document.getElementById('modalRegistroNombre').textContent = nombre + ' ' + apellido;
  document.getElementById('modalRegistro').classList.add('active');
  renderTabla();
});

// ===== Modal registro exitoso =====
document.getElementById('btnAceptarRegistro')?.addEventListener('click', () => {
  document.getElementById('modalRegistro').classList.remove('active');
});
document.getElementById('btnCerrarRegistro')?.addEventListener('click', () => {
  document.getElementById('modalRegistro').classList.remove('active');
});

// ===== Actualizar =====
function abrirActualizar(c) {
  clienteParaActualizar = c;
  document.getElementById('updCedula').value        = c.cedula;
  document.getElementById('updCedulaDisp').textContent = c.cedula;

  // Poblar displays e inputs
  const campos = [
    { disp: 'updNombreDisp',   input: 'updNombre',   val: c.nombre   },
    { disp: 'updApellidoDisp', input: 'updApellido', val: c.apellido },
    { disp: 'updTelefonoDisp', input: 'updTelefono', val: c.telefono },
    { disp: 'updCorreoDisp',   input: 'updCorreo',   val: c.correo   },
  ];
  campos.forEach(({ disp, input, val }) => {
    document.getElementById(disp).textContent  = val;
    document.getElementById(input).value       = val;
    document.getElementById(input).style.display = 'none';
    document.getElementById(disp).style.display  = '';
  });

  // Resetear filas (quitar clase editing si quedó)
  document.querySelectorAll('.upd-row').forEach(row => row.classList.remove('editing'));

  document.getElementById('modalActualizar').classList.add('active');
}

// Lápices del modal actualizar
document.querySelectorAll('.pencil-modal').forEach(btn => {
  btn.addEventListener('click', () => {
    const row   = document.getElementById(btn.dataset.row);
    const disp  = row.querySelector('.upd-disp');
    const input = row.querySelector('.upd-input');
    const editing = input.style.display !== 'none';
    if (editing) {
      disp.style.display  = '';
      input.style.display = 'none';
    } else {
      disp.style.display  = 'none';
      input.style.display = '';
      input.focus();
    }
  });
});

document.getElementById('btnCerrarActualizar')?.addEventListener('click', () => {
  document.getElementById('modalActualizar').classList.remove('active');
});

document.getElementById('btnCancelarActualizar').addEventListener('click', () => {
  document.getElementById('modalActualizar').classList.remove('active');
});

document.getElementById('btnConfirmarActualizar').addEventListener('click', () => {
  if (!clienteParaActualizar) return;
  // TODO: PUT /api/clientes/:cedula
  clienteParaActualizar.nombre   = document.getElementById('updNombre').value.trim()   || clienteParaActualizar.nombre;
  clienteParaActualizar.apellido = document.getElementById('updApellido').value.trim() || clienteParaActualizar.apellido;
  clienteParaActualizar.telefono = document.getElementById('updTelefono').value.trim() || clienteParaActualizar.telefono;
  clienteParaActualizar.correo   = document.getElementById('updCorreo').value.trim()   || clienteParaActualizar.correo;
  document.getElementById('modalActualizar').classList.remove('active');
  document.getElementById('modalActualizadoExito').classList.add('active');
  renderTabla();
});

['btnAceptarActualizadoExito','btnCerrarActualizadoExito'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', () => {
    document.getElementById('modalActualizadoExito').classList.remove('active');
  });
});

// ===== Eliminar =====
function abrirEliminar(c) {
  clienteParaEliminar = c;
  document.getElementById('modalElimCedula').textContent = c.cedula;
  document.getElementById('modalElimNombre').textContent = c.nombre + ' ' + c.apellido;
  document.getElementById('modalEliminarCliente').classList.add('active');
}

document.getElementById('btnCancelarElimCliente').addEventListener('click', () => {
  document.getElementById('modalEliminarCliente').classList.remove('active');
});

document.getElementById('btnConfirmarElimCliente').addEventListener('click', () => {
  if (!clienteParaEliminar) return;
  // TODO: DELETE /api/clientes/:cedula
  clientesMock = clientesMock.filter(c => c.cedula !== clienteParaEliminar.cedula);
  clientesFiltrados = [...clientesMock];
  clienteParaEliminar = null;
  if ((paginaActual - 1) * POR_PAGINA >= clientesFiltrados.length && paginaActual > 1) paginaActual--;
  document.getElementById('modalEliminarCliente').classList.remove('active');
  renderTabla();
});

// Cerrar modales al clic fuera
['modalActualizar','modalEliminarCliente','modalRegistro','modalActualizadoExito'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
  });
});

// ===== Cierre de sesión =====
document.getElementById('sidebarUserBtn').addEventListener('click', () => {
  document.getElementById('logoutPanel').classList.toggle('open');
});
document.getElementById('btnLogout').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'index.html';
});

// ===== Filtro numérico en campo cédula =====
document.getElementById('fCedula').addEventListener('input', function () {
  this.value = this.value.replace(/[^0-9]/g, '');
});

// ===== Inicializar =====
renderTabla();
