import { cerrarSesion, obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { comprobarAdmin } from '../servicios/administrador.service.js';

async function renderSidebar() {
  const sidebarContainer = document.getElementById('sidebar-container');
  if (!sidebarContainer) return;

  let esAdmin = false;
  try {
    const usuario = await obtenerUsuarioActual();
    if (usuario?.id) {
      esAdmin = Boolean((await comprobarAdmin(usuario.id))?.admin);
    }
  } catch (error) {
    if (error.status !== 403) console.warn('No se pudo comprobar el rol:', error.message);
  }

  const ruta = window.location.pathname;
  // Si está en la raíz o en index, asigna dashboard como activo por defecto
  const esDashboard = ruta.includes('dashboard') || ruta === '/' || ruta.endsWith('/index.html');

  const menuItems = [
    { href: 'dashboard.html', icono: 'D', texto: 'Dashboard', active: esDashboard },
    { href: 'calendario.html', icono: 'C', texto: 'Calendario', active: ruta.includes('calendario') },
    { href: 'tareas.html', icono: '✓', texto: 'Tareas', active: ruta.includes('tareas') },
    { href: 'agregar-tarea.html', icono: '+', texto: 'Agregar tarea', active: ruta.includes('agregar-tarea') },
    { href: 'historial.html', icono: 'H', texto: 'Historial de IA', active: ruta.includes('historial') },
    { href: 'gamificacion.html', icono: '*', texto: 'Tu Progreso', active: ruta.includes('gamificacion') || ruta.includes('recompensas') },
    { href: 'app-movil.html', icono: 'A', texto: 'App móvil', active: ruta.includes('app-movil') },
    { href: 'perfil.html', icono: 'P', texto: 'Perfil', active: ruta.includes('perfil') },
    { href: 'configuracion.html', icono: 'C', texto: 'Configuración', active: ruta.includes('configuracion') },
    { href: 'informacion.html', icono: '?', texto: 'Ayuda y privacidad', active: ruta.includes('informacion') },
    ...(esAdmin ? [{ href: 'administrador.html', icono: 'A', texto: 'Administrador', active: ruta.includes('administrador') }] : [])
  ];

  sidebarContainer.innerHTML = `
    <aside class="lumi-sidebar" aria-label="Navegación principal">
      <div class="sidebar-logo">
        <img src="../assets/Lumi-logo.png" alt="Logo LUMI" class="sidebar-logo-img">
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
          <span class="item-icono" aria-hidden="true">↪</span>
          <span class="item-texto">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  `;

  // Evento para cerrar sesión
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    try {
      await cerrarSesion();
    } catch (error) {
      console.warn('No se pudo cerrar la sesión en Supabase:', error.message);
    }
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
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