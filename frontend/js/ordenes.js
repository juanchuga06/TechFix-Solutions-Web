// ===== Sesión =====
const sede    = sessionStorage.getItem('sede') || 'norte';
const usuario = sessionStorage.getItem('usuario') || 'Usuario';
const esSur   = sede === 'sur';

document.getElementById('sedeLabel').textContent       = 'Sede: ' + sede.toUpperCase();
document.getElementById('sidebarUserName').textContent = usuario;

// Mostrar sección laboratorio solo en sede sur
if (esSur) {
  document.getElementById('secLaboratorio').style.display = 'block';
}


const params = new URLSearchParams(window.location.search);
const modoEditar = params.get('modo') === 'editar';

if (modoEditar) {
  document.getElementById('pageTitle').textContent = 'Modificar orden de servicio';
  document.getElementById('btnGuardar').textContent = 'Guardar Cambios';

  // Ocultar secciones de nueva orden, mostrar editar
  document.getElementById('sec1Nueva').style.display = 'none';
  document.getElementById('sec1Editar').style.display = 'block';
  document.getElementById('sec2Nueva').style.display = 'none';
  document.getElementById('sec2Editar').style.display = 'block';

  // Sección 4 siempre muestra número de orden + fecha con lápiz
  document.getElementById('sec4Editar').style.display = 'block';
  document.getElementById('calWrapper').style.display = 'none';

  // En sede sur: la sección 4 de info de orden se oculta, laboratorio pasa a ser sección 4
  if (esSur) {
    document.getElementById('sec4Tag').textContent = '';
    document.getElementById('sec4Editar').style.display = 'none';
  }

  // Prellenar con datos mock del folio seleccionado
  const folio = sessionStorage.getItem('ordenSeleccionada') || 'F-002';
  // TODO: fetch('/api/ordenes/' + folio) — datos hardcodeados como stub
  const ordenEditar = {
    cedula: '1715624352', nombre: 'Karen Anahí Mosquera Tómala', telefono: '0990960044',
    tecnico: 'Luis Martínez', estado: 'En proceso', descripcion: 'Limpieza y cambio de pasta térmica',
    fecha: '2026-05-25',
  };

  document.getElementById('dispCedula').textContent    = ordenEditar.cedula;
  document.getElementById('dispNombre').textContent    = ordenEditar.nombre;
  document.getElementById('dispTelefono').textContent  = ordenEditar.telefono;
  document.getElementById('dispTecnico').textContent   = ordenEditar.tecnico;
  document.getElementById('dispEstado').textContent    = ordenEditar.estado;
  document.getElementById('dispDescripcion').textContent = ordenEditar.descripcion;
  document.getElementById('dispFecha').textContent     = ordenEditar.fecha;
  document.getElementById('dispNumOrden').textContent  = folio;
  document.getElementById('fechaIngreso').value        = ordenEditar.fecha;

  // Prellenar inputs ocultos
  document.getElementById('editCedula').value    = ordenEditar.cedula;
  document.getElementById('editNombre').value    = ordenEditar.nombre;
  document.getElementById('editTelefono').value  = ordenEditar.telefono;
  document.getElementById('editTecnico').value   = ordenEditar.tecnico;
  document.getElementById('editDescripcion').value = ordenEditar.descripcion;
  const editEstado = document.getElementById('editEstado');
  if (editEstado) editEstado.value = ordenEditar.estado;

  // Navegar calendario al mes de la fecha prellenada
  const [y, m] = ordenEditar.fecha.split('-').map(Number);
  calDate = new Date(y, m - 1, 1);
  selectedDate = new Date(y, m - 1, parseInt(ordenEditar.fecha.split('-')[2]));

  // Prellenar repuestos mock
  repuestosAgregados = [
    { codigo: '001', nombre: 'Pantalla LCD',    costo: 150.00, qty: 1 },
    { codigo: '002', nombre: 'Disco SSD 500GB', costo: 80.00,  qty: 2 },
    { codigo: '003', nombre: 'Memoria RAM 8GB', costo: 45.00,  qty: 1 },
  ];

  // Prellenar laboratorio si es sede sur
  if (esSur) {
    const labMock = { encriptacion: 'AES-256', protocolo: 'TLS 1.3', horas: 4 };
    document.getElementById('sec5Tag').textContent      = '4. LABORATORIO DE RECUPERACIÓN';
    document.getElementById('sec5Editar').style.display = 'block';
    document.getElementById('sec5Nueva').style.display  = 'none';
    document.getElementById('dispEncriptacion').textContent = labMock.encriptacion;
    document.getElementById('dispProtocolo').textContent    = labMock.protocolo;
    document.getElementById('dispHoras').textContent        = labMock.horas + ' h';
    document.getElementById('editEncriptacion').value = labMock.encriptacion;
    document.getElementById('editProtocolo').value    = labMock.protocolo;
    document.getElementById('editHoras').value        = labMock.horas;
  }
}

// ===== Lápiz: toggle edición =====
document.querySelectorAll('.pencil-btn[data-row]').forEach(btn => {
  btn.addEventListener('click', () => {
    const row = document.getElementById(btn.dataset.row);
    row.classList.toggle('editing');
  });
});

// Lápiz fecha — toggle calendario
document.getElementById('btnEditFecha')?.addEventListener('click', () => {
  const wrapper = document.getElementById('calWrapper');
  const isHidden = wrapper.style.display === 'none' || wrapper.style.display === '';
  wrapper.style.display = isHidden ? 'block' : 'none';
  if (isHidden) renderCalendar();
});


// ===== Datos mock — reemplazar con fetch al API =====
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
  { codigo: '001', nombre: 'Pantalla LCD',    costo: 150.00 },
  { codigo: '002', nombre: 'Disco SSD 500GB', costo: 80.00  },
  { codigo: '003', nombre: 'Memoria RAM 8GB', costo: 45.00  },
  { codigo: '004', nombre: 'Batería Li-Ion',  costo: 35.00  },
  { codigo: '005', nombre: 'Teclado USB',     costo: 25.00  },
];

// ===== Estado interno =====
let clienteSeleccionado = null;
let tecnicoSeleccionado = null;
let repuestosAgregados  = []; // { codigo, nombre, costo, qty }

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

  // Cerrar al hacer clic fuera
  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !list.contains(e.target)) {
      list.classList.remove('open');
    }
  });
}

// ===== 1. Clientes =====
setupAutocomplete({
  inputId: 'buscarCliente',
  listId:  'listaClientes',
  data:    clientesMock,
  labelFn: c => c.cedula,
  onSelect: c => {
    clienteSeleccionado = c;
    document.getElementById('clienteNombre').textContent   = c.nombre;
    document.getElementById('clienteTelefono').textContent = c.telefono;
  },
});

// ===== 2. Técnicos =====
setupAutocomplete({
  inputId: 'buscarTecnico',
  listId:  'listaTecnicos',
  data:    tecnicosMock,
  labelFn: t => t.nombre,
  onSelect: t => { tecnicoSeleccionado = t; },
});

// ===== 3. Repuestos =====
setupAutocomplete({
  inputId: 'buscarRepuesto',
  listId:  'listaRepuestos',
  data:    catalogoMock,
  labelFn: r => r.nombre,
  onSelect: r => {
    document.getElementById('buscarRepuesto').value = '';
    agregarRepuesto(r);
  },
});

function agregarRepuesto(r) {
  const existente = repuestosAgregados.find(x => x.codigo === r.codigo);
  if (existente) {
    existente.qty++;
    renderRepuestos();
    return;
  }
  repuestosAgregados.push({ ...r, qty: 1 });
  renderRepuestos();
}

function renderRepuestos() {
  const tbody = document.getElementById('bodyRepuestos');
  tbody.innerHTML = '';

  if (!repuestosAgregados.length) {
    tbody.innerHTML = `<tr id="emptyRepuestos">
      <td colspan="5" style="text-align:center;color:#aaa;padding:16px;">Sin repuestos agregados</td>
    </tr>`;
    return;
  }

  repuestosAgregados.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.codigo}</td>
      <td>${r.nombre}</td>
      <td>$${r.costo.toFixed(2)}</td>
      <td>
        <div class="qty-control">
          <button data-i="${i}" data-action="dec">−</button>
          <span>${r.qty}</span>
          <button data-i="${i}" data-action="inc">+</button>
        </div>
      </td>
      <td>
        <button class="btn btn-danger btn-sm" data-i="${i}" data-action="del">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Eventos qty / eliminar
  tbody.querySelectorAll('button[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const i      = parseInt(btn.dataset.i);
      const action = btn.dataset.action;
      if (action === 'inc') repuestosAgregados[i].qty++;
      if (action === 'dec') {
        repuestosAgregados[i].qty--;
        if (repuestosAgregados[i].qty <= 0) repuestosAgregados.splice(i, 1);
      }
      if (action === 'del') repuestosAgregados.splice(i, 1);
      renderRepuestos();
    });
  });
}

// ===== Calendario =====
let calDate = new Date();
calDate.setDate(1);
let selectedDate = null;

function renderCalendar() {
  const year  = calDate.getFullYear();
  const month = calDate.getMonth();

  const monthNames = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
  document.getElementById('calMonthYear').textContent = monthNames[month] + ' ' + year;

  const today    = new Date();
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  // Convert so Mon=0
  const startOffset = (firstDay === 0) ? 6 : firstDay - 1;
  const daysInMonth  = new Date(year, month + 1, 0).getDate();
  const daysInPrev   = new Date(year, month, 0).getDate();

  const tbody = document.getElementById('calBody');
  tbody.innerHTML = '';

  let day = 1;
  let nextDay = 1;
  let prevDay = daysInPrev - startOffset + 1;

  for (let row = 0; row < 6; row++) {
    const tr = document.createElement('tr');
    for (let col = 0; col < 7; col++) {
      const td   = document.createElement('td');
      const span = document.createElement('span');
      const cell = row * 7 + col;

      if (cell < startOffset) {
        // días del mes anterior
        span.textContent = prevDay++;
        span.classList.add('other-month');
      } else if (day > daysInMonth) {
        // días del mes siguiente
        span.textContent = nextDay++;
        span.classList.add('other-month');
      } else {
        span.textContent = day;
        const d = day;
        if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === d) {
          span.classList.add('today');
        }
        if (selectedDate &&
            selectedDate.getFullYear() === year &&
            selectedDate.getMonth() === month &&
            selectedDate.getDate() === d) {
          span.classList.add('selected');
        }
        span.addEventListener('click', () => {
          selectedDate = new Date(year, month, d);
          const iso = selectedDate.toISOString().split('T')[0];
          document.getElementById('fechaIngreso').value = iso;
          renderCalendar();
        });
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

  // TODO: POST/PUT /api/ordenes
  if (modoEditar) {
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

// Cerrar modal éxito nueva orden → volver al dashboard
document.getElementById('btnAceptarExito')?.addEventListener('click', () => {
  window.location.href = 'dashboard.html';
});
document.getElementById('btnCerrarExito')?.addEventListener('click', () => {
  window.location.href = 'dashboard.html';
});

// Cerrar modal éxito editar → volver al dashboard
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

// ===== Inicializar calendario en modo nueva orden =====
if (!modoEditar) {
  renderCalendar();
}
