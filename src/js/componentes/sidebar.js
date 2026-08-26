function renderSidebar() {
  const sidebarContainer = document.getElementById('sidebar-container');
  if (!sidebarContainer) return;

  const ruta = window.location.pathname;
  // Si está en la raíz o en index, asigna dashboard como activo por defecto
  const esDashboard = ruta.includes('dashboard') || ruta === '/' || ruta.endsWith('/index.html');

  const menuItems = [
    { href: 'dashboard.html', icono: '🏠', texto: 'Dashboard', active: esDashboard },
    { href: 'calendario.html', icono: '📅', texto: 'Calendario', active: ruta.includes('calendario') },
    { href: 'agregar-tarea.html', icono: '➕', texto: 'Agregar tarea', active: ruta.includes('agregar-tarea') },
    { href: 'historial.html', icono: '📊', texto: 'Historial de IA', active: ruta.includes('historial') },
    { href: 'gamificacion.html', icono: '✦', texto: 'Gamificación', active: ruta.includes('gamificacion') },
    { href: 'recompensas.html', icono: '🏆', texto: 'Recompensas', active: ruta.includes('recompensas') },
    { href: 'app-movil.html', icono: '📱', texto: 'App móvil', active: ruta.includes('app-movil') },
    { href: 'perfil.html', icono: '👤', texto: 'Perfil', active: ruta.includes('perfil') },
    { href: 'configuracion.html', icono: '⚙️', texto: 'Configuración', active: ruta.includes('configuracion') },
    { href: 'informacion.html', icono: '❓', texto: 'Ayuda y privacidad', active: ruta.includes('informacion') }
  ];

  sidebarContainer.innerHTML = `
    <aside class="lumi-sidebar" aria-label="Navegación principal">
      <div class="sidebar-logo">
        <div class="logo-icon-glow">
          <span class="logo-letra">L</span>
        </div>
        <span class="logo-texto">LUMI</span>
      </div>

      <nav class="sidebar-menu">
        ${menuItems.map(item => `
          <a href="${item.href}" 
             class="menu-item ${item.active ? 'active' : ''}" 
             ${item.active ? 'aria-current="page"' : ''}>
            <span class="item-icono" aria-hidden="true">${item.icono}</span>
            <span class="item-texto">${item.texto}</span>
          </a>
        `).join('')}
      </nav>

      <div class="sidebar-footer">
        <button id="btn-logout" class="menu-item btn-cerrar-sesion" type="button">
          <span class="item-icono" aria-hidden="true">🚪</span>
          <span class="item-texto">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  `;

  // Evento para cerrar sesión
  document.getElementById('btn-logout')?.addEventListener('click', () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'login.html';
  });
}

// Ejecución segura sin importar cómo o cuándo se cargue el script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderSidebar);
} else {
  renderSidebar();
}