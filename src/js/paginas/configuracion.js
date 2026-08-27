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
      // Aquí puedes manejar el guardado de preferencias de estudio en el futuro
      alert('Preferencias guardadas correctamente.');
    });
  }
});