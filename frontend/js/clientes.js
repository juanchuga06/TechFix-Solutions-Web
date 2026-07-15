// =====================================================================
// clientes.js — Gestión de clientes conectada al API
// (sesión y menú lateral los maneja ui.js)
// =====================================================================

// ===== Estado =====
let clientes = [];              // catálogo cargado desde el API
let clientesFiltrados = [];
const POR_PAGINA = 6;
let paginaActual = 1;
let clienteParaEliminar = null;
let clienteParaActualizar = null;

// Normaliza un registro del API a la forma que usa la vista.
function normalizar(c) {
  return {
    cedula:   c.cedula_cliente,
    nombre:   c.nombre_completo,
    telefono: c.telefono_cliente,
    correo:   c.correo_cliente,
  };
}

// ===== Carga desde el API =====
async function cargarClientes() {
  try {
    const data = await clientesApi.list();
    clientes = (data.clientes || []).map(normalizar);
    clientesFiltrados = [...clientes];
    paginaActual = 1;
    renderTabla();
  } catch (err) {
    clientes = [];
    clientesFiltrados = [];
    renderTablaMensaje('bodyClientes', 5, mensajeDesconexion('Clientes'));
    document.getElementById('paginacion').innerHTML = '';
  }
}

// ===== Renderizar tabla =====
function renderTabla() {
  const tbody = document.getElementById('bodyClientes');
  tbody.innerHTML = '';

  if (!clientesFiltrados.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#aaa;padding:16px;">No se encuentran registros de Clientes</td></tr>`;
    renderPaginacion();
    return;
  }

  const inicio = (paginaActual - 1) * POR_PAGINA;
  const pagina = clientesFiltrados.slice(inicio, inicio + POR_PAGINA);

  pagina.forEach(c => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.cedula}</td>
      <td>${c.nombre}</td>
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
      const c = clientes.find(x => x.cedula === btn.dataset.cedula);
      if (btn.dataset.action === 'actualizar') abrirActualizar(c);
      if (btn.dataset.action === 'eliminar')   abrirEliminar(c);
    });
  });

  renderPaginacion();
}

function renderPaginacion() {
  const total = Math.ceil(clientesFiltrados.length / POR_PAGINA);
  const div = document.getElementById('paginacion');
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

// ===== Búsqueda (filtra el catálogo cargado) =====
document.getElementById('buscarClienteDir').addEventListener('input', function () {
  const q = this.value.trim().toLowerCase();
  clientesFiltrados = q
    ? clientes.filter(c =>
        c.cedula.toLowerCase().includes(q) ||
        (c.nombre || '').toLowerCase().includes(q) ||
        (c.correo || '').toLowerCase().includes(q))
    : [...clientes];
  paginaActual = 1;
  renderTabla();
});

// ===== Limpiar formulario =====
document.getElementById('btnLimpiar').addEventListener('click', () => {
  ['fCedula','fNombre','fTelefono','fCorreo'].forEach(id => {
    document.getElementById(id).value = '';
  });
});

// ===== Registrar cliente =====
document.getElementById('btnRegistrar').addEventListener('click', async () => {
  const cedula   = document.getElementById('fCedula').value.trim();
  const nombre   = document.getElementById('fNombre').value.trim();
  const telefono = document.getElementById('fTelefono').value.trim();
  const correo   = document.getElementById('fCorreo').value.trim();

  try {
    await clientesApi.crear({
      cedula_cliente:   cedula,
      nombre_completo:  nombre,
      telefono_cliente: telefono,
      correo_cliente:   correo,
    });

    ['fCedula','fNombre','fTelefono','fCorreo'].forEach(id => {
      document.getElementById(id).value = '';
    });

    document.getElementById('modalRegistroNombre').textContent = nombre;
    document.getElementById('modalRegistro').classList.add('active');
    await cargarClientes();
  } catch (err) {
    showError(err);
  }
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
  document.getElementById('updCedula').value           = c.cedula;
  document.getElementById('updCedulaDisp').textContent = c.cedula;

  const campos = [
    { disp: 'updNombreDisp',   input: 'updNombre',   val: c.nombre   },
    { disp: 'updTelefonoDisp', input: 'updTelefono', val: c.telefono },
    { disp: 'updCorreoDisp',   input: 'updCorreo',   val: c.correo   },
  ];
  campos.forEach(({ disp, input, val }) => {
    document.getElementById(disp).textContent   = val;
    document.getElementById(input).value        = val;
    document.getElementById(input).style.display = 'none';
    document.getElementById(disp).style.display  = '';
  });

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

document.getElementById('btnConfirmarActualizar').addEventListener('click', async () => {
  if (!clienteParaActualizar) return;

  const nombre   = document.getElementById('updNombre').value.trim();
  const telefono = document.getElementById('updTelefono').value.trim();
  const correo   = document.getElementById('updCorreo').value.trim();

  try {
    await clientesApi.actualizar(clienteParaActualizar.cedula, {
      cedula_cliente:   clienteParaActualizar.cedula,
      nombre_completo:  nombre,
      telefono_cliente: telefono,
      correo_cliente:   correo,
    });
    document.getElementById('modalActualizar').classList.remove('active');
    document.getElementById('modalActualizadoExito').classList.add('active');
    await cargarClientes();
  } catch (err) {
    showError(err);
  }
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
  document.getElementById('modalElimNombre').textContent = c.nombre;
  document.getElementById('modalEliminarCliente').classList.add('active');
}

document.getElementById('btnCancelarElimCliente').addEventListener('click', () => {
  document.getElementById('modalEliminarCliente').classList.remove('active');
});

document.getElementById('btnConfirmarElimCliente').addEventListener('click', async () => {
  if (!clienteParaEliminar) return;
  const cedula = clienteParaEliminar.cedula;
  try {
    await clientesApi.eliminar(cedula);
    clienteParaEliminar = null;
    document.getElementById('modalEliminarCliente').classList.remove('active');
    await cargarClientes();
  } catch (err) {
    document.getElementById('modalEliminarCliente').classList.remove('active');
    showError(err);
  }
});

// Cerrar modales al clic fuera
['modalActualizar','modalEliminarCliente','modalRegistro','modalActualizadoExito'].forEach(id => {
  document.getElementById(id)?.addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
  });
});

// ===== Filtro numérico en campo cédula =====
document.getElementById('fCedula').addEventListener('input', function () {
  this.value = this.value.replace(/[^0-9]/g, '');
});

// ===== Inicializar =====
if (getNodo()) cargarClientes();
