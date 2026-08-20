/**
 * sidebar.js
 * Componente reutilizable del Sidebar de LUMI
 */

console.log('sidebar.js cargado correctamente');

export function crearSidebar() {
  console.log('Ejecutando crearSidebar()...');

  const contenedor = document.getElementById('sidebar-container');

  if (!contenedor) {
    console.error('No se encontró #sidebar-container');
    return;
  }

  console.log('Contenedor encontrado, insertando sidebar...');

  const paginaActual = window.location.pathname.split('/').pop() || 'dashboard.html';

  const menu = [
    { nombre: 'Dashboard', href: 'dashboard.html', icono: '🏠' },
    { nombre: 'Mis Tareas', href: 'tareas.html', icono: '✅' },
    { nombre: 'Agregar Tarea', href: 'agregar-tarea.html', icono: '➕' },
    { nombre: 'Guía de Estudio', href: 'guia-detalle.html', icono: '📚' },
    { nombre: 'Historial', href: 'historial.html', icono: '📊' },
    { nombre: 'Perfil', href: 'perfil.html', icono: '👤' },
    { nombre: 'Configuración', href: 'configuracion.html', icono: '⚙️' },
  ];

  const linksHTML = menu.map(item => {
    const activo = paginaActual === item.href ? 'activo' : '';
    return `
      <a href="${item.href}" class="sidebar-link ${activo}">
        <span class="icono">${item.icono}</span>
        <span>${item.nombre}</span>
      </a>
    `;
  }).join('');

  contenedor.innerHTML = `
    <div class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">L</div>
        <div class="logo-texto">LUMI</div>
      </div>

      <nav class="sidebar-nav">
        ${linksHTML}
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-usuario">
          <div class="avatar">A</div>
          <div class="info">
            <span class="nombre">Anderson</span>
            <span class="rol">Estudiante</span>
          </div>
        </div>
      </div>
    </div>
  `;

  console.log('Sidebar insertado correctamente');
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', crearSidebar);
} else {
  crearSidebar();
}