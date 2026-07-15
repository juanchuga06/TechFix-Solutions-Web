// ===== Sesión =====
const params  = new URLSearchParams(window.location.search);
const sede    = sessionStorage.getItem('sede') || params.get('sede') || 'norte';
const usuario = sessionStorage.getItem('usuario') || 'Usuario';
const esSur   = sede === 'sur';

document.getElementById('sedeLabel').textContent       = 'Sede: ' + sede.toUpperCase();
document.getElementById('sidebarUserName').textContent = usuario;

if (esSur) {
  document.getElementById('secLaboratorio').style.display = 'block';
}

const modoEditar = params.get('modo') === 'editar';

// ===== Datos mock =====
const clientesMock = [
  { cedula: '1750094123', nombre: 'Karen Anahí Mosquera Tómala', telefono: '0990960044' },
  { cedula: '1715624352', nombre: 'Pedro Díaz Loor',              telefono: '0981234567' },
  { cedula: '0923456789', nombre: 'Sofía Torres Muñoz',           telefono: '0976543210' },
];

const tecnicosMock = [
  { id: 'T01', nombre: 'Carlos Ramírez' },
  { id: 'T02', nombre: 'Luis Mendoza'   },
  { id: 'T03', nombre: 'María Suárez'   },
];

const catalogoMock = [
  { codigo: 'R-001', nombre: 'Pantalla LCD'      },
  { codigo: 'R-002', nombre: 'Batería 4000mAh'   },
  { codigo: 'R-003', nombre: 'Conector de carga' },
  { codigo: 'R-004', nombre: 'Altavoz interno'   },
  { codigo: 'R-005', nombre: 'Cámara trasera'    },
];

// ===== Estado interno =====
let clienteSeleccionado = null;
let tecnicoSeleccionado = null;
let repuestosAgregados  = []; // { codigo, qty }

// ===== Calendario =====
let calDate    = new Date();
let selectedDate = null;
calDate.setDate(1);

// ===== Estado modales repuestos =====
let pendingElimCodigo = null;
let pendingActualizarCodigo = null;

// ===== Render repuestos =====
function renderRepuestos() {
  const tbody = document.getElementById('bodyRepuestos');
  tbody.innerHTML = '';

  if (!repuestosAgregados.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#aaa;padding:16px;">Sin repuestos agregados</td></tr>';
    return;
  }

  repuestosAgregados.forEach((r) => {
    const cat = catalogoMock.find(c => c.codigo === r.codigo);
    const tr  = document.createElement('tr');

    const tdCodigo  = document.createElement('td');
    tdCodigo.textContent = r.codigo;

    const tdNombre  = document.createElement('td');
    tdNombre.textContent = cat ? cat.nombre : '—';

    const tdQty     = document.createElement('td');
    tdQty.textContent = r.qty;

    const tdAcciones = document.createElement('td');
    tdAcciones.style.whiteSpace = 'nowrap';

    const btnElim = document.createElement('button');
    btnElim.textContent = 'Eliminar';
    btnElim.className   = 'btn btn-danger';
    btnElim.style.cssText = 'font-size:12px; padding:4px 10px; margin-right:6px;';
    btnElim.addEventListener('click', () => openElimRepuesto(r.codigo));

    const btnUpd = document.createElement('button');
    btnUpd.textContent = 'Actualizar';
    btnUpd.className   = 'btn btn-primary';
    btnUpd.style.cssText = 'font-size:12px; padding:4px 10px;';
    btnUpd.addEventListener('click', () => openActualizarRepuesto(r.codigo, r.qty));

    tdAcciones.appendChild(btnElim);
    tdAcciones.appendChild(btnUpd);

    tr.appendChild(tdCodigo);
    tr.appendChild(tdNombre);
    tr.appendChild(tdQty);
    tr.appendChild(tdAcciones);
    tbody.appendChild(tr);
  });
}

// ===== Eliminar repuesto (modal) =====
function openElimRepuesto(codigo) {
  pendingElimCodigo = codigo;
  document.getElementById('elimRepCodigo').textContent = codigo;
  document.getElementById('modalElimRepuesto').classList.add('active');
}
document.getElementById('btnCerrarElimRep').addEventListener('click', () => {
  document.getElementById('modalElimRepuesto').classList.remove('active');
});
document.getElementById('btnCancelarElimRep').addEventListener('click', () => {
  document.getElementById('modalElimRepuesto').classList.remove('active');
});
document.getElementById('btnConfirmarElimRep').addEventListener('click', () => {
  repuestosAgregados = repuestosAgregados.filter(r => r.codigo !== pendingElimCodigo);
  document.getElementById('modalElimRepuesto').classList.remove('active');
  renderRepuestos();
});

// ===== Actualizar cantidad (modal) =====
function openActualizarRepuesto(codigo, qty) {
  pendingActualizarCodigo = codigo;
  document.getElementById('actualizarRepCodigo').textContent = codigo;
  document.getElementById('actualizarRepQty').value = qty;
  document.getElementById('modalActualizarRep').classList.add('active');
}
document.getElementById('btnCerrarActualizarRep').addEventListener('click', () => {
  document.getElementById('modalActualizarRep').classList.remove('active');
});
document.getElementById('btnCancelarActualizarRep').addEventListener('click', () => {
  document.getElementById('modalActualizarRep').classList.remove('active');
});
document.getElementById('actualizarRepQty').addEventListener('keydown', e => {
  if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault();
});

document.getElementById('btnConfirmarActualizarRep').addEventListener('click', () => {
  const qty = parseInt(document.getElementById('actualizarRepQty').value);
  if (isNaN(qty) || qty < 1) { alert('Ingrese una cantidad válida (mínimo 1).'); return; }
  const rep = repuestosAgregados.find(r => r.codigo === pendingActualizarCodigo);
  if (rep) rep.qty = qty;
  document.getElementById('modalActualizarRep').classList.remove('active');
  renderRepuestos();
});

// Cerrar modales rep al clic fuera
['modalElimRepuesto', 'modalActualizarRep'].forEach(id => {
  document.getElementById(id).addEventListener('click', function(e) {
    if (e.target === this) this.classList.remove('active');
  });
});

// ===== Modo editar: prellenar datos =====
if (modoEditar) {
  document.getElementById('pageTitle').textContent  = 'Modificar orden de servicio';
  document.getElementById('btnGuardar').textContent = 'Guardar Cambios';

  document.getElementById('sec1Nueva').style.display  = 'none';
  document.getElementById('sec1Editar').style.display = 'block';
  document.getElementById('sec2Nueva').style.display  = 'none';
  document.getElementById('sec2Editar').style.display = 'block';

  document.getElementById('sec4Editar').style.display = 'block';
  document.getElementById('calWrapper').style.display  = 'none';

  if (esSur) {
    document.getElementById('sec4Tag').textContent      = '';
    document.getElementById('sec4Editar').style.display = 'none';
  }

  const folio = sessionStorage.getItem('ordenSeleccionada') || 'F-002';
  // TODO: fetch('/api/ordenes/' + folio)
  const ordenEditar = {
    cedula: '1715624352', nombre: 'Karen Anahí Mosquera Tómala', telefono: '0990960044',
    tecnico: 'Luis Mendoza', estado: 'En proceso', descripcion: 'Limpieza y cambio de pasta térmica',
    fecha: '2026-05-25',
  };

  document.getElementById('editBuscarCliente').value = ordenEditar.cedula;
  document.getElementById('dispNombre').textContent   = ordenEditar.nombre;
  document.getElementById('dispTelefono').textContent = ordenEditar.telefono;
  clienteSeleccionado = { cedula: ordenEditar.cedula, nombre: ordenEditar.nombre, telefono: ordenEditar.telefono };

  document.getElementById('editBuscarTecnico').value = ordenEditar.tecnico;
  tecnicoSeleccionado = tecnicosMock.find(t => t.nombre === ordenEditar.tecnico) || { id: '', nombre: ordenEditar.tecnico };

  const editEstado = document.getElementById('editEstado');
  if (editEstado) editEstado.value = ordenEditar.estado;
  document.getElementById('editDescripcion').value = ordenEditar.descripcion;

  document.getElementById('dispFecha').textContent    = ordenEditar.fecha;
  document.getElementById('dispNumOrden').textContent = folio;
  document.getElementById('fechaIngreso').value       = ordenEditar.fecha;

  const [y, m] = ordenEditar.fecha.split('-').map(Number);
  calDate      = new Date(y, m - 1, 1);
  selectedDate = new Date(y, m - 1, parseInt(ordenEditar.fecha.split('-')[2]));

  // Repuestos prellenados
  repuestosAgregados = [
    { codigo: 'R-001', qty: 1 },
    { codigo: 'R-002', qty: 2 },
    { codigo: 'R-003', qty: 1 },
  ];
  renderRepuestos();

  if (esSur) {
    const labMock = { encriptacion: 'AES-256', protocolo: 'TLS 1.3', horas: 4 };
    document.getElementById('sec5Tag').textContent      = '4. LABORATORIO DE RECUPERACIÓN';
    document.getElementById('sec5Editar').style.display = 'block';
    document.getElementById('sec5Nueva').style.display  = 'none';
    document.getElementById('editEncriptacion').value   = labMock.encriptacion;
    document.getElementById('editProtocolo').value      = labMock.protocolo;
    document.getElementById('editHoras').value          = labMock.horas;
  }
}

// ===== Helper: autocomplete genérico =====
function setupAutocomplete({ inputId, listId, data, labelFn, onSelect }) {
  const input = document.getElementById(inputId);
  const list  = document.getElementById(listId);

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    list.innerHTML = '';
    if (!q) { list.classList.remove('open'); return; }

    const matches = data.filter(d => labelFn(d).toLowerCase().includes(q));
    if (!matches.length) { list.classList.remove('open'); return; }

    matches.forEach(d => {
      const li = document.createElement('li');
      li.textContent = labelFn(d);
      li.addEventListener('click', () => {
        input.value = labelFn(d);
        list.classList.remove('open');
        onSelect(d);
      });
      list.appendChild(li);
    });
    list.classList.add('open');
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !list.contains(e.target)) {
      list.classList.remove('open');
    }
  });
}

// ===== Autocompletes =====
setupAutocomplete({
  inputId: 'buscarCliente', listId: 'listaClientes', data: clientesMock,
  labelFn: c => c.cedula,
  onSelect: c => {
    clienteSeleccionado = c;
    document.getElementById('clienteNombre').textContent   = c.nombre;
    document.getElementById('clienteTelefono').textContent = c.telefono;
  },
});

setupAutocomplete({
  inputId: 'buscarTecnico', listId: 'listaTecnicos', data: tecnicosMock,
  labelFn: t => t.nombre,
  onSelect: t => { tecnicoSeleccionado = t; },
});

setupAutocomplete({
  inputId: 'editBuscarCliente', listId: 'editListaClientes', data: clientesMock,
  labelFn: c => c.cedula,
  onSelect: c => {
    clienteSeleccionado = c;
    document.getElementById('dispNombre').textContent   = c.nombre;
    document.getElementById('dispTelefono').textContent = c.telefono;
  },
});

setupAutocomplete({
  inputId: 'editBuscarTecnico', listId: 'editListaTecnicos', data: tecnicosMock,
  labelFn: t => t.nombre,
  onSelect: t => { tecnicoSeleccionado = t; },
});

setupAutocomplete({
  inputId: 'buscarRepuesto', listId: 'listaRepuestos', data: catalogoMock,
  labelFn: r => r.codigo,
  onSelect: r => {
    document.getElementById('buscarRepuesto').value = '';
    const existente = repuestosAgregados.find(x => x.codigo === r.codigo);
    if (existente) {
      existente.qty++;
    } else {
      repuestosAgregados.push({ codigo: r.codigo, qty: 1 });
    }
    renderRepuestos();
  },
});

// ===== Calendario =====
function renderCalendar() {
  const year  = calDate.getFullYear();
  const month = calDate.getMonth();

  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  document.getElementById('calMonthYear').textContent = monthNames[month] + ' ' + year;

  const today       = new Date();
  const firstDay    = new Date(year, month, 1).getDay();
  const startOffset = (firstDay === 0) ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();

  const tbody = document.getElementById('calBody');
  tbody.innerHTML = '';

  let day = 1, nextDay = 1;
  let prevDay = daysInPrev - startOffset + 1;

  for (let row = 0; row < 6; row++) {
    const tr = document.createElement('tr');
    for (let col = 0; col < 7; col++) {
      const td   = document.createElement('td');
      const span = document.createElement('span');
      const cell = row * 7 + col;

      if (cell < startOffset) {
        span.textContent = prevDay++;
        span.classList.add('other-month');
      } else if (day > daysInMonth) {
        span.textContent = nextDay++;
        span.classList.add('other-month');
      } else {
        span.textContent = day;
        const d        = day;
        const thisDate = new Date(year, month, d);
        const isFuture = thisDate > today;

        if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === d) {
          span.classList.add('today');
        }
        if (selectedDate &&
            selectedDate.getFullYear() === year &&
            selectedDate.getMonth()    === month &&
            selectedDate.getDate()     === d) {
          span.classList.add('selected');
        }

        if (isFuture) {
          span.classList.add('disabled-date');
        } else {
          span.addEventListener('click', () => {
            selectedDate = new Date(year, month, d);
            document.getElementById('fechaIngreso').value = selectedDate.toISOString().split('T')[0];
            renderCalendar();
          });
        }
        day++;
      }
      td.appendChild(span);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
    if (day > daysInMonth && row >= 4) break;
  }
}

document.getElementById('calPrev').addEventListener('click', () => {
  calDate.setMonth(calDate.getMonth() - 1);
  renderCalendar();
});
document.getElementById('calNext').addEventListener('click', () => {
  calDate.setMonth(calDate.getMonth() + 1);
  renderCalendar();
});

// ===== Guardar / Cancelar =====
document.getElementById('btnGuardar').addEventListener('click', () => {
  if (!modoEditar) {
    if (!clienteSeleccionado) { alert('Seleccione un cliente.'); return; }
    if (!tecnicoSeleccionado) { alert('Seleccione un técnico.'); return; }
    if (!document.getElementById('descripcionFallo').value.trim()) {
      alert('Ingrese la descripción del fallo.'); return;
    }
    if (!document.getElementById('fechaIngreso').value) {
      alert('Seleccione la fecha de ingreso.'); return;
    }
    if (esSur) {
      if (!document.getElementById('nivelEncriptacion').value) {
        alert('Seleccione el nivel de encriptación.'); return;
      }
      if (!document.getElementById('protocoloSeguridad').value) {
        alert('Seleccione el protocolo de seguridad.'); return;
      }
    }
  }

  if (modoEditar) {
    const cedulaEdit      = document.getElementById('editBuscarCliente').value.trim();
    const tecnicoEdit     = document.getElementById('editBuscarTecnico').value.trim();
    const descripcionEdit = document.getElementById('editDescripcion').value.trim();

    if (!cedulaEdit)      { alert('Ingrese la cédula del cliente.'); return; }
    if (!tecnicoEdit)     { alert('Seleccione un técnico.'); return; }
    if (!descripcionEdit) { alert('Ingrese la descripción del fallo.'); return; }

    const numOrden = sessionStorage.getItem('ordenSeleccionada') || 'F-002';
    document.getElementById('modalNumOrdenEditar').textContent = numOrden;
    document.getElementById('modalExitoEditar').classList.add('active');
  } else {
    const numOrden = 'F-' + String(Math.floor(Math.random() * 900) + 100).padStart(3, '0');
    document.getElementById('modalNumOrden').textContent = numOrden;
    document.getElementById('modalExito').classList.add('active');
  }
});

document.getElementById('btnCancelar').addEventListener('click', () => {
  window.location.href = 'dashboard.html';
});

document.getElementById('btnAceptarExito')?.addEventListener('click', () => {
  window.location.href = 'dashboard.html';
});
document.getElementById('btnCerrarExito')?.addEventListener('click', () => {
  window.location.href = 'dashboard.html';
});
document.getElementById('btnAceptarExitoEditar')?.addEventListener('click', () => {
  window.location.href = 'dashboard.html';
});
document.getElementById('btnCerrarExitoEditar')?.addEventListener('click', () => {
  window.location.href = 'dashboard.html';
});

// ===== Cierre de sesión =====
document.getElementById('sidebarUserBtn').addEventListener('click', () => {
  document.getElementById('logoutPanel').classList.toggle('open');
});
document.getElementById('btnLogout').addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'index.html';
});

// ===== Inicializar =====
if (!modoEditar) renderCalendar();

const BLOCKED_KEYS = ['-', '+', 'e', 'E', '.', ','];
['horasLaboratorio', 'editHoras'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('keydown', e => {
    if (BLOCKED_KEYS.includes(e.key)) e.preventDefault();
  });
});
