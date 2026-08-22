/**
 * navbar.js
 * Componente reutilizable del Navbar de LUMI
 */

import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerUsuarioConPerfil } from '../servicios/usuario.service.js';

export async function crearNavbar() {
  const contenedor = document.getElementById('navbar-container');
  if (!contenedor) {
    return;
  }

  // Título según la página actual
  const paginaActual = window.location.pathname.split('/').pop() || 'dashboard.html';

  const titulos = {
    'dashboard.html': { titulo: 'Dashboard', subtitulo: 'Resumen de tu productividad' },
    'tareas.html': { titulo: 'Calendario', subtitulo: 'Organiza tus tareas por fecha' },
    'agregar-tarea.html': { titulo: 'Agregar tarea inteligente', subtitulo: 'Crea un plan de estudio personalizado' },
    'guia-detalle.html': { titulo: 'Guía de Estudio', subtitulo: 'Métodos y técnicas' },
    'historial.html': { titulo: 'Historial', subtitulo: 'Tu progreso a lo largo del tiempo' },
    'recompensas.html': { titulo: 'Recompensas', subtitulo: 'Celebra tus avances' },
    'perfil.html': { titulo: 'Mi Perfil', subtitulo: 'Información personal' },
    'configuracion.html': { titulo: 'Configuración', subtitulo: 'Ajustes de la aplicación' },
    'informacion.html': { titulo: 'Información, ayuda y privacidad', subtitulo: 'Conoce y controla tu experiencia en LUMI' },
  };

  const info = titulos[paginaActual] || { titulo: 'LUMI', subtitulo: 'Tu asistente de estudio' };
  let nombre = '';
  try {
    const usuario = await obtenerUsuarioActual();
    if (usuario?.id) {
      const respuesta = await obtenerUsuarioConPerfil(usuario.id);
      const datos = respuesta?.usuario || respuesta?.user || respuesta;
      nombre = [datos?.nombre, datos?.apellido].filter(Boolean).join(' ');
    }
  } catch (error) {
    console.warn('No se pudo cargar el usuario del navbar:', error.message);
  }

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
        <div class="navbar-avatar" title="${nombre}">
          ${nombre ? nombre.charAt(0).toUpperCase() : ''}
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
