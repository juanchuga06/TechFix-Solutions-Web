// Auth stub — se conectará al backend cuando la BD esté lista
document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();

  const usuario   = document.getElementById('usuario').value.trim();
  const contrasena = document.getElementById('contrasena').value;
  const sede      = document.getElementById('sede').value;
  const alert     = document.getElementById('loginAlert');

  if (!usuario || !contrasena || !sede) {
    alert.textContent = 'Por favor complete todos los campos.';
    alert.style.display = 'block';
    return;
  }

  alert.style.display = 'none';

  // TODO: llamar a la API cuando el backend esté listo
  // fetch('/api/login', { method: 'POST', body: JSON.stringify({ usuario, contrasena, sede }) })

  // Por ahora redirige directo al dashboard
  sessionStorage.setItem('sede', sede);
  sessionStorage.setItem('usuario', usuario);
  window.location.href = 'dashboard.html';
});
