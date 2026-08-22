const formulario = document.getElementById('formulario-recuperacion');
const estado = document.getElementById('estado-recuperacion');
formulario?.addEventListener('submit', event => {
  event.preventDefault();
  const codigo = document.getElementById('codigo').value.trim();
  const nueva = document.getElementById('nueva-contrasena').value;
  if (!codigo) { estado.textContent = 'Introduce el código de verificación.'; return; }
  if (nueva.length < 8) { estado.textContent = 'La nueva contraseña debe tener al menos 8 caracteres.'; return; }
  estado.textContent = 'Contraseña actualizada. Ya puedes iniciar sesión.';
});
