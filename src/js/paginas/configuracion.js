/**
 * configuracion.js
 * Lógica temporal de la página Configuración
 */

console.log('configuracion.js cargado');

document.addEventListener('DOMContentLoaded', () => {
  const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');

  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener('click', () => {
      const confirmar = confirm('¿Seguro que quieres cerrar sesión?');

      if (confirmar) {
        // Por ahora solo limpiamos datos temporales
        localStorage.removeItem('lumi_perfil');
        localStorage.removeItem('lumi_tareas');

        // Más adelante: await autenticacionService.cerrarSesion();
        alert('Sesión cerrada (temporal)');
        window.location.href = 'login.html';
      }
    });
  }
});
