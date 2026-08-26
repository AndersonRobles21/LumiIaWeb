import { cerrarSesion } from '../servicios/autenticacion.service.js';

document.addEventListener('DOMContentLoaded', () => {
  const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
  const formConfig = document.getElementById('form-configuracion');

  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', async () => {
      if (confirm('¿Seguro que quieres cerrar sesión?')) {
        try {
          await cerrarSesion();
          window.location.href = 'login.html';
        } catch (error) {
          alert(`No se pudo cerrar sesión: ${error.message}`);
        }
      }
    });
  }

  if (formConfig) {
    formConfig.addEventListener('submit', async (e) => {
      e.preventDefault();

      const claveActual = document.getElementById('clave-actual')?.value;
      const claveNueva = document.getElementById('clave-nueva')?.value;
      const claveConfirmar = document.getElementById('clave-confirmar')?.value;

      if (claveNueva || claveConfirmar) {
        if (claveNueva !== claveConfirmar) {
          alert('La nueva contraseña y su confirmación no coinciden.');
          return;
        }

        if (claveNueva.length < 6) {
          alert('La contraseña debe tener al menos 6 caracteres.');
          return;
        }

        try {
          // Aquí conectas tu llamada al backend/servicio de Supabase
          // await actualizarContrasena(claveNueva);
          alert('Contraseña actualizada correctamente.');
          formConfig.reset();
        } catch (error) {
          alert(`Error al actualizar la contraseña: ${error.message}`);
        }
      }
    });
  }
});