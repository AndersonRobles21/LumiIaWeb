/**
 * configuracion.js
 * Lógica temporal de la página Configuración
 */

import { cerrarSesion } from '../servicios/autenticacion.service.js';

document.addEventListener('DOMContentLoaded', () => {
  const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');

  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', async () => {
      const confirmar = confirm('¿Seguro que quieres cerrar sesión?');

      if (confirmar) {
        try {
          await cerrarSesion();
          window.location.href = 'login.html';
        } catch (error) {
          alert(`No se pudo cerrar sesión: ${error.message}`);
        }
      }
    });
  }
});
