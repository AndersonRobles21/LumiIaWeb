/**
 * navbar.js
 * Componente reutilizable del Navbar de LUMI
 */

console.log('navbar.js cargado correctamente');

export function crearNavbar() {
  const contenedor = document.getElementById('navbar-container');
  if (!contenedor) {
    console.error('No se encontró #navbar-container');
    return;
  }

  // Título según la página actual
  const paginaActual = window.location.pathname.split('/').pop() || 'dashboard.html';

  const titulos = {
    'dashboard.html': { titulo: 'Dashboard', subtitulo: 'Resumen de tu productividad' },
    'tareas.html': { titulo: 'Mis Tareas', subtitulo: 'Organiza y completa tus pendientes' },
    'agregar-tarea.html': { titulo: 'Agregar Tarea', subtitulo: 'Crea una nueva tarea' },
    'guia-detalle.html': { titulo: 'Guía de Estudio', subtitulo: 'Métodos y técnicas' },
    'historial.html': { titulo: 'Historial', subtitulo: 'Tu progreso a lo largo del tiempo' },
    'perfil.html': { titulo: 'Mi Perfil', subtitulo: 'Información personal' },
    'configuracion.html': { titulo: 'Configuración', subtitulo: 'Ajustes de la aplicación' },
  };

  const info = titulos[paginaActual] || { titulo: 'LUMI', subtitulo: 'Tu asistente de estudio' };

  contenedor.innerHTML = `
    <div class="navbar">
      <div class="navbar-titulo">
        <h2>${info.titulo}</h2>
        <span>${info.subtitulo}</span>
      </div>

      <div class="navbar-acciones">
        <button class="navbar-btn" title="Notificaciones">
          🔔
        </button>
        <button class="navbar-btn" title="Ayuda">
          ❓
        </button>
        <div class="navbar-avatar" title="Anderson">
          A
        </div>
      </div>
    </div>
  `;

  console.log('Navbar insertado correctamente');
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', crearNavbar);
} else {
  crearNavbar();
}
