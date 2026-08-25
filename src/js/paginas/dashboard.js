/**
 * dashboard.js
 * Lógica del Dashboard y renderizado dinámico de tareas registradas
 */

import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';

document.addEventListener('DOMContentLoaded', async () => {
  await cargarDashboard();
});

async function cargarDashboard() {
  let tareas = [];

  // 1. Obtener tareas guardadas en LocalStorage
  const tareasLocales = JSON.parse(localStorage.getItem('lumi_tareas') || '[]');
  tareas = tareasLocales;

  // 2. Personalizar saludo si el usuario está autenticado
  try {
    const usuario = await obtenerUsuarioActual();
    if (usuario) {
      const saludoH1 = document.querySelector('.dashboard-saludo h1');
      if (saludoH1) {
        const nombre = usuario.user_metadata?.nombre || usuario.email?.split('@')[0] || 'Usuario';
        saludoH1.textContent = `¡Hola ${nombre}!`;
      }
    }
  } catch (error) {
    console.warn('Usuario no autenticado o ejecutando en modo local.');
  }

  // 3. Renderizar tareas en el HTML exacto de dashboard.html
  renderizarPlanEstudioHoy(tareas);
}

/**
 * Renderiza las tareas dentro del contenedor .lista-tareas de dashboard.html
 */
function renderizarPlanEstudioHoy(tareas) {
  const contenedorLista = document.querySelector('.lista-tareas');

  if (!contenedorLista) {
    console.error('No se encontró el contenedor .lista-tareas en dashboard.html');
    return;
  }

  // Si no hay tareas guardadas
  if (!tareas || tareas.length === 0) {
    contenedorLista.innerHTML = `
      <div class="item-tarea-vacio" style="padding: 1.5rem; text-align: center; color: #94a3b8; width: 100%;">
        <p>No tienes tareas creadas para hoy.</p>
        <a href="agregar-tarea.html" style="color: #c084fc; text-decoration: underline; font-size: 0.9rem; display: inline-block; margin-top: 0.5rem;">
          + Crear tu primera tarea
        </a>
      </div>
    `;
    return;
  }

  // Iconos SVG reutilizables
  const iconosSVG = [
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`
  ];

  // Construir HTML con redirección corregida a calendario.html
  const htmlTareas = tareas.map((tarea, index) => {
    const titulo = tarea.titulo || tarea.nombre || 'Tarea sin título';
    const estado = tarea.estado || 'Sin empezar';
    const porcentaje = tarea.porcentaje || (estado === 'Completada' ? '100%' : '0%');
    const iconoSelect = iconosSVG[index % iconosSVG.length];

    let bloqueProgresoHTML = '';

    if (estado === 'Sin empezar' || porcentaje === '0%') {
      bloqueProgresoHTML = `<span class="estado-texto">Sin empezar</span>`;
    } else {
      const esCyan = porcentaje === '40%' ? ' cyan' : '';
      const numPorcentaje = parseInt(porcentaje, 10) || 0;

      bloqueProgresoHTML = `
        <div class="progreso-wrapper">
          <div class="barra-progreso">
            <div class="progreso-fill${esCyan}" style="width: ${numPorcentaje}%;"></div>
          </div>
          <span class="porcentaje">${porcentaje}</span>
        </div>
      `;
    }

    return `
      <div class="item-tarea" data-id="${tarea.id}">
        <div class="icono-tarea">
          ${iconoSelect}
        </div>
        <div class="info-tarea">
          <h3>${titulo}</h3>
          ${bloqueProgresoHTML}
        </div>
        <button class="btn-flecha-tarea" aria-label="Ver detalles" onclick="window.location.href='calendario.html'">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    `;
  }).join('');

  contenedorLista.innerHTML = htmlTareas;
}