// =====================================================================
// ordenes.js — Alta y edición de órdenes de servicio, vía API
// (sesión y menú lateral los maneja ui.js)
// =====================================================================

const params     = new URLSearchParams(window.location.search);
const nodo       = getNodo();
const sur        = esSur();
const modoEditar = params.get('modo') === 'editar';

if (sur) {
  const secLab = document.getElementById('secLaboratorio');
  if (secLab) secLab.style.display = 'block';
}

// ===== Catálogos (cargados desde el API) =====
let clientes  = [];   // { cedula, nombre, telefono, correo }
let tecnicos  = [];   // { codigo, cedula, nombre, apellido, especialidad, full }
let catalogo  = [];   // { codigo, nombre, precio }

// ===== Selección / estado interno =====
let clienteSeleccionado = null;   // { cedula, nombre, telefono }
let tecnicoSeleccionado = null;   // { codigo, full }
let repuestosAgregados  = [];     // { codigo, nombre, qty }
let repuestosOriginales = [];     // snapshot para diff en edición

// ===== Calendario =====
let calDate = new Date();
let selectedDate = null;
calDate.setDate(1);

// ===== Modales repuestos =====
let pendingElimCodigo = null;
let pendingActualizarCodigo = null;

// =====================================================================
// Normalizadores
// =====================================================================
function normCliente(c) {
  return { cedula: c.cedula_cliente, nombre: c.nombre_completo, telefono: c.telefono_cliente, correo: c.correo_cliente };
}
function normTecnico(t) {
  return {
    codigo: t.codigo_empleado, cedula: t.cedula_tecnico,
    nombre: t.nombre_tecnico, apellido: t.apellido_tecnico,
    especialidad: t.especialidad_tecnico,
    full: (t.nombre_tecnico + ' ' + t.apellido_tecnico).trim(),
  };
}
function normRepuesto(r) {
  return { codigo: r.codigo_repuesto, nombre: r.nombre_pieza, precio: r.costo_unitario };
}

// =====================================================================
// diffRepuestos — separa qué actualizar / agregar / quitar
// =====================================================================
function diffRepuestos(original, current) {
  const origCod = new Set(original.map(r => r.codigo));
  const curCod  = new Set(current.map(r => r.codigo));
  return {
    toUpdate: current.filter(r => origCod.has(r.codigo)),
    toAdd:    current.filter(r => !origCod.has(r.codigo)),
    toRemove: original.filter(r => !curCod.has(r.codigo)),
  };
}

// =====================================================================
// Render tabla de repuestos
// =====================================================================
function renderRepuestos() {
  const tbody = document.getElementById('bodyRepuestos');
  tbody.innerHTML = '';

  if (!repuestosAgregados.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#aaa;padding:16px;">Sin repuestos agregados</td></tr>';
    return;
  }

  repuestosAgregados.forEach((r) => {
    const tr = document.createElement('tr');

    const tdCodigo = document.createElement('td');
    tdCodigo.textContent = r.codigo;
    const tdNombre = document.createElement('td');
    tdNombre.textContent = r.nombre || '—';
    const tdQty = document.createElement('td');
    tdQty.textContent = r.qty;

    const tdAcciones = document.createElement('td');
    tdAcciones.style.whiteSpace = 'nowrap';

    const btnElim = document.createElement('button');
    btnElim.textContent = 'Eliminar';
    btnElim.className = 'btn btn-danger';
    btnElim.style.cssText = 'font-size:12px; padding:4px 10px; margin-right:6px;';
    btnElim.addEventListener('click', () => openElimRepuesto(r.codigo));

    const btnUpd = document.createElement('button');
    btnUpd.textContent = 'Actualizar';
    btnUpd.className = 'btn btn-primary';
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
document.getElementById('btnConfirmarActualizarRep').addEventListener('click', () => {
  const qty = parseInt(document.getElementById('actualizarRepQty').value);
  if (isNaN(qty) || qty <= 0) { showError(null, 'La cantidad debe ser un número mayor a 0.'); return; }
  const rep = repuestosAgregados.find(r => r.codigo === pendingActualizarCodigo);
  if (rep) rep.qty = qty;
  document.getElementById('modalActualizarRep').classList.remove('active');
  renderRepuestos();
});

['modalElimRepuesto', 'modalActualizarRep'].forEach(id => {
  document.getElementById(id).addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('active');
  });
});

// =====================================================================
// Autocomplete genérico
// =====================================================================
function setupAutocomplete({ inputId, listId, getData, itemLabel, inputValue, matchFn, onSelect }) {
  const input = document.getElementById(inputId);
  const list  = document.getElementById(listId);
  if (!input || !list) return;

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    list.innerHTML = '';
    if (!q) { list.classList.remove('open'); return; }

    const matches = getData().filter(d => matchFn(d, q));
    if (!matches.length) { list.classList.remove('open'); return; }

    matches.slice(0, 25).forEach(d => {
      const li = document.createElement('li');
      li.textContent = itemLabel(d);
      li.addEventListener('click', () => {
        input.value = inputValue(d);
        list.classList.remove('open');
        onSelect(d);
      });
      list.appendChild(li);
    });
    list.classList.add('open');
  });

  document.addEventListener('click', e => {
    if (!input.contains(e.target) && !list.contains(e.target)) list.classList.remove('open');
  });
}

function configurarAutocompletes() {
  // Cliente — se muestra toda la info; solo se usa la cédula en SQL.
  const clienteLabel = c => `${c.cedula} — ${c.nombre} — ${c.telefono || ''}`;
  const clienteMatch = (c, q) =>
    c.cedula.toLowerCase().includes(q) || (c.nombre || '').toLowerCase().includes(q);

  setupAutocomplete({
    inputId: 'buscarCliente', listId: 'listaClientes',
    getData: () => clientes, itemLabel: clienteLabel, inputValue: c => c.cedula, matchFn: clienteMatch,
    onSelect: c => {
      clienteSeleccionado = c;
      document.getElementById('clienteNombre').textContent   = c.nombre;
      document.getElementById('clienteTelefono').textContent = c.telefono || '—';
    },
  });
  setupAutocomplete({
    inputId: 'editBuscarCliente', listId: 'editListaClientes',
    getData: () => clientes, itemLabel: clienteLabel, inputValue: c => c.cedula, matchFn: clienteMatch,
    onSelect: c => {
      clienteSeleccionado = c;
      document.getElementById('dispNombre').textContent   = c.nombre;
      document.getElementById('dispTelefono').textContent = c.telefono || '—';
    },
  });

  // Técnico — se busca por código; se usa codigo_empleado en SQL.
  const tecnicoLabel = t => `${t.codigo} — ${t.full}`;
  const tecnicoMatch = (t, q) =>
    String(t.codigo).includes(q) || t.full.toLowerCase().includes(q);

  setupAutocomplete({
    inputId: 'buscarTecnico', listId: 'listaTecnicos',
    getData: () => tecnicos, itemLabel: tecnicoLabel, inputValue: t => String(t.codigo), matchFn: tecnicoMatch,
    onSelect: t => { tecnicoSeleccionado = t; },
  });
  setupAutocomplete({
    inputId: 'editBuscarTecnico', listId: 'editListaTecnicos',
    getData: () => tecnicos, itemLabel: tecnicoLabel, inputValue: t => String(t.codigo), matchFn: tecnicoMatch,
    onSelect: t => { tecnicoSeleccionado = t; },
  });

  // Repuesto — se busca por código y se agrega a la tabla.
  setupAutocomplete({
    inputId: 'buscarRepuesto', listId: 'listaRepuestos',
    getData: () => catalogo,
    itemLabel: r => `${r.codigo} — ${r.nombre}`,
    inputValue: () => '',
    matchFn: (r, q) => String(r.codigo).includes(q) || (r.nombre || '').toLowerCase().includes(q),
    onSelect: r => {
      document.getElementById('buscarRepuesto').value = '';
      const existente = repuestosAgregados.find(x => x.codigo === r.codigo);
      if (existente) existente.qty++;
      else repuestosAgregados.push({ codigo: r.codigo, nombre: r.nombre, qty: 1 });
      renderRepuestos();
    },
  });
}

// =====================================================================
// Carga inicial de catálogos + (si aplica) prellenado de edición
// =====================================================================
async function init() {
  // Cada catálogo se carga de forma independiente: si uno falla (p. ej.
  // técnicos, cuya vista consulta el nodo remoto), los demás siguen
  // funcionando, para que el buscador de clientes no quede vacío.
  const [rc, rt, rr] = await Promise.allSettled([
    clientesApi.list(),
    tecnicosApi.list(nodo),
    repuestosApi.list(),
  ]);

  if (rc.status === 'fulfilled') clientes = (rc.value.clientes || []).map(normCliente);
  if (rt.status === 'fulfilled') tecnicos = (rt.value.tecnicos || []).map(normTecnico);
  const repuestosOk = rr.status === 'fulfilled';
  if (repuestosOk) catalogo = (rr.value.repuestos || []).map(normRepuesto);

  configurarAutocompletes();

  if (modoEditar) {
    await prellenarEdicion();
  } else {
    // La fecha de hoy queda preseleccionada para ahorrar un clic.
    const hoy = new Date();
    selectedDate = hoy;
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    document.getElementById('fechaIngreso').value = `${hoy.getFullYear()}-${mm}-${dd}`;

    renderCalendar();
    if (repuestosOk) renderRepuestos();
    else renderTablaMensaje('bodyRepuestos', 4, mensajeDesconexion('Repuestos'));
  }
}

async function prellenarEdicion() {
  document.getElementById('pageTitle').textContent  = 'Modificar orden de servicio';
  document.getElementById('btnGuardar').textContent = 'Guardar Cambios';

  document.getElementById('sec1Nueva').style.display  = 'none';
  document.getElementById('sec1Editar').style.display = 'block';
  document.getElementById('sec2Nueva').style.display  = 'none';
  document.getElementById('sec2Editar').style.display = 'block';
  document.getElementById('sec4Editar').style.display = 'block';
  document.getElementById('calWrapper').style.display = 'none';

  const folio = sessionStorage.getItem('ordenSeleccionada');
  let orden = {};
  try { orden = JSON.parse(sessionStorage.getItem('ordenEditar') || '{}'); } catch (_) {}

  // Cliente (solo visualización; el SP de actualización NO cambia el cliente,
  // por eso el campo queda bloqueado en la pantalla de modificación).
  const editCli = document.getElementById('editBuscarCliente');
  editCli.readOnly = true;
  editCli.classList.add('input-bloqueado');
  editCli.title = 'El cliente de una orden no se puede modificar';

  document.getElementById('dispNombre').textContent   = orden.cliente || '—';
  document.getElementById('dispTelefono').textContent = '—';
  const cli = clientes.find(c => c.nombre === orden.cliente);
  if (cli) {
    clienteSeleccionado = cli;
    document.getElementById('editBuscarCliente').value  = cli.cedula;
    document.getElementById('dispTelefono').textContent = cli.telefono || '—';
  }

  // Técnico: derivar código a partir del nombre mostrado
  const tec = tecnicos.find(t => t.full === orden.tecnico);
  if (tec) {
    tecnicoSeleccionado = tec;
    document.getElementById('editBuscarTecnico').value = String(tec.codigo);
  }

  document.getElementById('editEstado').value      = orden.estado || 'Pendiente';
  document.getElementById('editDescripcion').value = orden.descripcion || '';
  document.getElementById('dispFecha').textContent    = orden.fecha || '';
  document.getElementById('dispNumOrden').textContent = folio || '';

  // Laboratorio (sede sur)
  if (sur) {
    document.getElementById('sec5Editar').style.display = 'block';
    document.getElementById('sec5Nueva').style.display  = 'none';
    if (orden.encriptacion) document.getElementById('editEncriptacion').value = orden.encriptacion;
    if (orden.protocolo)    document.getElementById('editProtocolo').value    = orden.protocolo;
    if (orden.horas != null) document.getElementById('editHoras').value       = orden.horas;
  }

  // Repuestos actuales de la orden
  try {
    const dd = await detallesApi.list(folio);
    repuestosAgregados = (dd.detalles || []).map(d => {
      const cat = catalogo.find(c => c.codigo === d.codigo_repuesto);
      return { codigo: d.codigo_repuesto, nombre: cat ? cat.nombre : '—', qty: d.cantidad };
    });
    repuestosOriginales = repuestosAgregados.map(r => ({ codigo: r.codigo, qty: r.qty }));
    renderRepuestos();
  } catch (err) {
    repuestosAgregados = [];
    renderTablaMensaje('bodyRepuestos', 4, mensajeDesconexion('Repuestos'));
  }
}

// =====================================================================
// Calendario (solo modo nueva)
// =====================================================================
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
        const d = day;
        const thisDate = new Date(year, month, d);
        const isFuture = thisDate > today;

        if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === d) {
          span.classList.add('today');
        }
        if (selectedDate &&
            selectedDate.getFullYear() === year &&
            selectedDate.getMonth() === month &&
            selectedDate.getDate() === d) {
          span.classList.add('selected');
        }

        if (isFuture) {
          span.classList.add('disabled-date');
        } else {
          span.addEventListener('click', () => {
            selectedDate = new Date(year, month, d);
            const mm = String(month + 1).padStart(2, '0');
            const dd = String(d).padStart(2, '0');
            document.getElementById('fechaIngreso').value = `${year}-${mm}-${dd}`;
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

// =====================================================================
// Guardar
// =====================================================================
document.getElementById('btnGuardar').addEventListener('click', async () => {
  if (modoEditar) await guardarEdicion();
  else await guardarNueva();
});

async function guardarNueva() {
  if (!clienteSeleccionado) { showError(null, 'Seleccione un cliente.'); return; }
  if (!tecnicoSeleccionado) { showError(null, 'Seleccione un técnico.'); return; }
  const descripcion = document.getElementById('descripcionFallo').value.trim();
  if (!descripcion) { showError(null, 'Ingrese la descripción del fallo.'); return; }
  const fecha = document.getElementById('fechaIngreso').value || null;
  if (!fecha) { showError(null, 'Seleccione la fecha de ingreso.'); return; }

  let encriptacion = null, protocolo = null, horas = null;
  if (sur) {
    encriptacion = document.getElementById('nivelEncriptacion').value || null;
    protocolo    = document.getElementById('protocoloSeguridad').value || null;
    if (!encriptacion) { showError(null, 'Seleccione el nivel de encriptación.'); return; }
    if (!protocolo)    { showError(null, 'Seleccione el protocolo de seguridad.'); return; }
    const h = parseInt(document.getElementById('horasLaboratorio').value);
    if (isNaN(h) || h <= 0) { showError(null, 'Las horas de laboratorio deben ser un valor mayor a 0.'); return; }
    horas = h;
  }

  const body = {
    fecha_ingreso: fecha,
    descripcion_fallo: descripcion,
    estado_orden: document.getElementById('estadoOrden').value,
    codigo_tecnico: tecnicoSeleccionado.codigo,
    cedula_cliente: clienteSeleccionado.cedula,
    codigo_sede: nodo,
    nivel_encriptacion: encriptacion,
    protocolo_seguridad: protocolo,
    horas_laboratorio: horas,
    repuestos: repuestosAgregados.map(r => ({ codigo_repuesto: r.codigo, cantidad: r.qty })),
  };

  await conCarga(document.getElementById('btnGuardar'), async () => {
    try {
      const resp = await ordenesApi.crear(body);
      document.getElementById('modalNumOrden').textContent = resp.numero_folio;
      document.getElementById('modalExito').classList.add('active');
    } catch (err) {
      showError(err);
    }
  });
}

async function guardarEdicion() {
  const folio = sessionStorage.getItem('ordenSeleccionada');
  const descripcion = document.getElementById('editDescripcion').value.trim();
  if (!descripcion) { showError(null, 'Ingrese la descripción del fallo.'); return; }
  if (!tecnicoSeleccionado) { showError(null, 'Seleccione un técnico válido (por código).'); return; }

  let encriptacion = null, protocolo = null, horas = null;
  if (sur) {
    encriptacion = document.getElementById('editEncriptacion').value || null;
    protocolo    = document.getElementById('editProtocolo').value || null;
    if (!encriptacion) { showError(null, 'Seleccione el nivel de encriptación.'); return; }
    if (!protocolo)    { showError(null, 'Seleccione el protocolo de seguridad.'); return; }
    const h = parseInt(document.getElementById('editHoras').value);
    if (isNaN(h) || h <= 0) { showError(null, 'Las horas de laboratorio deben ser un valor mayor a 0.'); return; }
    horas = h;
  }

  const { toUpdate, toAdd, toRemove } = diffRepuestos(repuestosOriginales, repuestosAgregados);

  await conCarga(document.getElementById('btnGuardar'), async () => {
    try {
      // 1) Cabecera + laboratorio + cantidades de repuestos existentes
      await ordenesApi.actualizar(folio, {
        descripcion_fallo: descripcion,
        estado_orden: document.getElementById('editEstado').value,
        codigo_tecnico: tecnicoSeleccionado.codigo,
        nivel_encriptacion: encriptacion,
        protocolo_seguridad: protocolo,
        horas_laboratorio: horas,
        repuestos: toUpdate.map(r => ({ codigo_repuesto: r.codigo, cantidad: r.qty })),
      });

      // 2) Repuestos nuevos -> POST
      for (const r of toAdd) {
        await detallesApi.agregar(folio, { codigo_repuesto: r.codigo, cantidad: r.qty });
      }
      // 3) Repuestos quitados -> DELETE
      for (const r of toRemove) {
        await detallesApi.eliminar(folio, r.codigo);
      }

      document.getElementById('modalNumOrdenEditar').textContent = folio;
      document.getElementById('modalExitoEditar').classList.add('active');
    } catch (err) {
      showError(err);
    }
  });
}

// ===== Cancelar / cierre de modales de éxito =====
document.getElementById('btnCancelar').addEventListener('click', () => {
  window.location.href = 'dashboard.html';
});
document.getElementById('btnAceptarExito')?.addEventListener('click', () => { window.location.href = 'dashboard.html'; });
document.getElementById('btnCerrarExito')?.addEventListener('click', () => { window.location.href = 'dashboard.html'; });
document.getElementById('btnAceptarExitoEditar')?.addEventListener('click', () => { window.location.href = 'dashboard.html'; });
document.getElementById('btnCerrarExitoEditar')?.addEventListener('click', () => { window.location.href = 'dashboard.html'; });

// ===== Bloquear teclas no numéricas en horas =====
const BLOCKED_KEYS = ['-', '+', 'e', 'E', '.', ','];
['horasLaboratorio', 'editHoras', 'actualizarRepQty'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('keydown', e => { if (BLOCKED_KEYS.includes(e.key)) e.preventDefault(); });
  // Al salir del campo, un valor de 0 (o vacío/negativo) se descarta.
  el.addEventListener('blur', () => {
    if (el.value !== '' && parseInt(el.value) <= 0) el.value = '';
  });
});

// ===== Inicializar =====
if (nodo) init();

// ===== Exportar helper para tests =====
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { diffRepuestos };
}
