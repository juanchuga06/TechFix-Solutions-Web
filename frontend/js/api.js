// =====================================================================
// api.js — Cliente HTTP compartido para el frontend de TechFix
// ---------------------------------------------------------------------
// Punto único de integración con el backend FastAPI. Todas las páginas
// usan estas funciones para leer/escribir en la base de datos distribuida
// a través de los procedimientos almacenados.
//
// El API se busca en el MISMO host desde el que se cargó la página, en el
// puerto 8000. Así funciona tanto en local (localhost) como cuando un
// compañero abre la app por la IP de la VPN (p. ej. http://26.239.167.8:5500):
// su navegador llamará al API en esa misma IP, no en su propia máquina.
// El backend habilita CORS para cualquier origen.
// =====================================================================

const API_PORT = 8000;
const API_HOST = (typeof window !== 'undefined' && window.location && window.location.hostname)
  ? window.location.hostname
  : 'localhost';
const API_BASE = `http://${API_HOST}:${API_PORT}`;

// ---------------------------------------------------------------------
// parseSqlError: extrae el número de error y el mensaje del SP desde el
// texto crudo que devuelve pyodbc en el campo "detail" de FastAPI.
//
// Ejemplo de detail:
//   ('42000', "[42000] [Microsoft][ODBC Driver 17 for SQL Server]
//    [SQL Server]Error: El cliente ya existe en el sistema. (50007)
//    (SQLExecDirectW)")
//
// Devuelve: { numero: '50007'|null, mensaje: 'Error: ...' }
// ---------------------------------------------------------------------
function parseSqlError(detail) {
  if (detail === undefined || detail === null) {
    return { numero: null, mensaje: 'Ocurrió un error inesperado.' };
  }

  const texto = String(detail);

  // El número de los THROW personalizados está en el rango 50000-50999
  // y ODBC lo agrega entre paréntesis: "(50007)".
  let numero = null;
  const mNum = texto.match(/\((5\d{4})\)/);
  if (mNum) numero = mNum[1];

  // 1) Mensaje entre "[SQL Server]" y el número de error entre paréntesis.
  let mensaje = null;
  const mSql = texto.match(/\[SQL Server\](.*?)\s*\(\d{5}\)/s);
  if (mSql && mSql[1].trim()) {
    mensaje = mSql[1].trim();
  }

  // 2) Fallback: capturar desde "Error:" hasta antes del paréntesis.
  if (!mensaje) {
    const mErr = texto.match(/Error:\s*[^()]+/);
    if (mErr) mensaje = mErr[0].trim().replace(/\.\s*$/, '.');
  }

  // 3) Fallback final: usar el texto completo.
  if (!mensaje) mensaje = texto;

  return { numero, mensaje };
}

// ---------------------------------------------------------------------
// apiFetch: envoltura de fetch que serializa JSON, interpreta la
// respuesta y, ante un error, lanza un objeto { numero, mensaje }.
// ---------------------------------------------------------------------
async function apiFetch(path, options = {}) {
  const opts = {
    method: options.method || 'GET',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  };
  if (options.body !== undefined) {
    opts.body = JSON.stringify(options.body);
  }

  let resp;
  try {
    resp = await fetch(API_BASE + path, opts);
  } catch (redError) {
    // Falla de red / servidor apagado
    throw {
      numero: null,
      mensaje: 'No se pudo conectar con el servidor. Verifique que el backend esté en ejecución.',
    };
  }

  // 204 No Content u otras respuestas sin cuerpo
  let data = null;
  const text = await resp.text();
  if (text) {
    try { data = JSON.parse(text); } catch (_) { data = text; }
  }

  if (!resp.ok) {
    const detail = data && data.detail !== undefined ? data.detail : data;
    throw parseSqlError(detail);
  }

  return data;
}

// ---------------------------------------------------------------------
// Envoltorios por entidad
// ---------------------------------------------------------------------
const clientesApi = {
  list: () => apiFetch('/clientes/'),
  buscar: (cedula) => apiFetch('/clientes/?cedula=' + encodeURIComponent(cedula)),
  crear: (cliente) => apiFetch('/clientes/', { method: 'POST', body: cliente }),
  actualizar: (cedula, cliente) =>
    apiFetch('/clientes/' + encodeURIComponent(cedula), { method: 'PUT', body: cliente }),
  eliminar: (cedula) =>
    apiFetch('/clientes/' + encodeURIComponent(cedula), { method: 'DELETE' }),
};

const repuestosApi = {
  list: () => apiFetch('/repuestos/'),
  crear: (repuesto) => apiFetch('/repuestos/', { method: 'POST', body: repuesto }),
  actualizar: (codigo, repuesto) =>
    apiFetch('/repuestos/' + encodeURIComponent(codigo), { method: 'PUT', body: repuesto }),
  eliminar: (codigo) =>
    apiFetch('/repuestos/' + encodeURIComponent(codigo), { method: 'DELETE' }),
};

const tecnicosApi = {
  list: (sede) => apiFetch('/tecnicos/' + (sede ? '?sede=' + encodeURIComponent(sede) : '')),
  crear: (tecnico) => apiFetch('/tecnicos/', { method: 'POST', body: tecnico }),
  actualizar: (codigo, tecnico) =>
    apiFetch('/tecnicos/' + encodeURIComponent(codigo), { method: 'PUT', body: tecnico }),
  eliminar: (codigo) =>
    apiFetch('/tecnicos/' + encodeURIComponent(codigo), { method: 'DELETE' }),
};

const sedesApi = {
  list: () => apiFetch('/sedes/'),
};

const ordenesApi = {
  dashboard: (sede, estado, fecha) => {
    const params = new URLSearchParams();
    if (sede) params.append('sede', sede);
    if (estado) params.append('estado', estado);
    if (fecha) params.append('fecha', fecha);
    const qs = params.toString();
    return apiFetch('/ordenes/dashboard' + (qs ? '?' + qs : ''));
  },
  crear: (orden) => apiFetch('/ordenes/', { method: 'POST', body: orden }),
  actualizar: (folio, orden) =>
    apiFetch('/ordenes/' + encodeURIComponent(folio), { method: 'PUT', body: orden }),
  eliminar: (folio) =>
    apiFetch('/ordenes/' + encodeURIComponent(folio), { method: 'DELETE' }),
};

const detallesApi = {
  list: (folio) => apiFetch('/ordenes/' + encodeURIComponent(folio) + '/repuestos/'),
  agregar: (folio, detalle) =>
    apiFetch('/ordenes/' + encodeURIComponent(folio) + '/repuestos/', { method: 'POST', body: detalle }),
  actualizar: (folio, codigo, cantidad) =>
    apiFetch('/ordenes/' + encodeURIComponent(folio) + '/repuestos/' + encodeURIComponent(codigo),
      { method: 'PUT', body: { cantidad } }),
  eliminar: (folio, codigo) =>
    apiFetch('/ordenes/' + encodeURIComponent(folio) + '/repuestos/' + encodeURIComponent(codigo),
      { method: 'DELETE' }),
};

// Exportar para Node (tests) manteniendo compatibilidad en el navegador.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    API_BASE, parseSqlError, apiFetch,
    clientesApi, repuestosApi, tecnicosApi, sedesApi, ordenesApi, detallesApi,
  };
}
