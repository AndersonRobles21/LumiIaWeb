/**
 * sidebar.js
 * Componente reutilizable del Sidebar de LUMI
 */

import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerUsuarioConPerfil } from '../servicios/usuario.service.js';

export async function crearSidebar() {
  const contenedor = document.getElementById('sidebar-container');

  if (!contenedor) {
    return;
  }

  const paginaActual = window.location.pathname.split('/').pop() || 'dashboard.html';
  let nombreCompleto = '';
  let rol = '';
  try {
    const usuario = await obtenerUsuarioActual();
    if (usuario?.id) {
      const respuesta = await obtenerUsuarioConPerfil(usuario.id);
      const datos = respuesta?.usuario || respuesta?.user || respuesta;
      nombreCompleto = [datos?.nombre, datos?.apellido].filter(Boolean).join(' ');
      rol = datos?.rol || datos?.rol_nombre || (datos?.rol_id ? `Rol ${datos.rol_id}` : '');
    }
  } catch (error) {
    console.warn('No se pudo cargar el usuario del sidebar:', error.message);
  }

  const menu = [
    { nombre: 'Dashboard', href: 'dashboard.html', icono: '🏠' },
    { nombre: 'Calendario', href: 'tareas.html', icono: '📅' },
    { nombre: 'Agregar tarea inteligente', href: 'agregar-tarea.html', icono: '➕' },
    { nombre: 'Historial de IA', href: 'historial.html', icono: '📊' },
    { nombre: 'Recompensas', href: 'recompensas.html', icono: '🏆' },
    { nombre: 'Perfil', href: 'perfil.html', icono: '👤' },
    { nombre: 'Configuración', href: 'configuracion.html', icono: '⚙️' },
    { nombre: 'Ayuda y privacidad', href: 'informacion.html', icono: '❓' },
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
          <div class="avatar">${nombreCompleto ? nombreCompleto.charAt(0).toUpperCase() : ''}</div>
          <div class="info">
            <span class="nombre">${nombreCompleto}</span>
            <span class="rol">${rol}</span>
          </div>
        </div>
      </div>
    </div>
  `;

}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', crearSidebar);
} else {
  crearSidebar();
}