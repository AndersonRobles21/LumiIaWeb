import { iniciarSesion } from '../servicios/autenticacion.service.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formulario-login');
  const inputCorreo = document.getElementById('correo');
  const inputPass = document.getElementById('contrasena');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const usuarioTexto = inputCorreo ? inputCorreo.value.trim().toLowerCase() : '';
      const passwordTexto = inputPass ? inputPass.value.trim() : '';

      if (!usuarioTexto || !passwordTexto) {
        alert('Por favor completa todos los campos.');
        return;
      }

      try {
        const { esAdmin } = await iniciarSesion(usuarioTexto, passwordTexto);

        localStorage.setItem('userEmail', usuarioTexto);
        localStorage.setItem('userRole', esAdmin ? 'admin' : 'estudiante');
        window.location.href = esAdmin ? './administrador.html' : './historial.html';

      } catch (err) {
        alert('Error al iniciar sesión: ' + err.message);
      }
    });
  }
});
