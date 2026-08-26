import { supabase } from '../config/supabase.js';
import { obtenerPlanesUsuarioBD } from '../servicios/planes.service.js';

document.addEventListener('DOMContentLoaded', async () => {
  await inicializarDashboard();
});

/**
 * Carga los datos del usuario y sus planes de estudio
 */
async function inicializarDashboard() {
  try {
    // 1. Obtener la sesión del usuario actual desde Supabase Auth
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    const usuario = session?.user;

    // 2. Personalizar el saludo con el nombre del usuario
    actualizarSaludo(usuario);

    // 3. Cargar la lista de tareas / planes de estudio
    if (usuario) {
      const planes = await obtenerPlanesUsuarioBD(usuario.id);
      renderizarPlanesEstudio(planes);
    } else {
      // Fallback: cargar desde localStorage si aún no hay sesión activa en Supabase
      const tareasLocales = JSON.parse(localStorage.getItem('lumi_tareas') || '[]');
      renderizarPlanesEstudio(tareasLocales);
    }

  } catch (error) {
    console.error('Error al inicializar el Dashboard:', error);
  }
}

/**
 * Actualiza el encabezado con el nombre del estudiante
 */
function actualizarSaludo(usuario) {
  const tituloSaludo = document.querySelector('.dashboard-saludo h1');
  if (!tituloSaludo) return;

  if (usuario) {
    const nombre = usuario.user_metadata?.nombre || 
                   usuario.user_metadata?.full_name || 
                   usuario.email?.split('@')[0] || 
                   'Estudiante';
    tituloSaludo.textContent = `¡Hola ${nombre}!`;
  } else {
    tituloSaludo.textContent = '¡Hola!';
  }
}

/**
 * Renderiza dinámicamente la lista de tareas/planes de estudio en el HTML
 */
function renderizarPlanesEstudio(planes) {
  const contenedorLista = document.querySelector('.lista-tareas');
  if (!contenedorLista) return;

  if (!planes || planes.length === 0) {
    contenedorLista.innerHTML = `
      <div class="sin-tareas-mensaje" style="padding: 1.5rem; text-align: center; color: var(--texto-secundario, #8a8f9d);">
        <p>No tienes tareas o planes de estudio pendientes hoy.</p>
        <p><small>Haz clic en el botón <strong>"+"</strong> para crear tu primera tarea con Lumi IA.</small></p>
      </div>
    `;
    return;
  }

  contenedorLista.innerHTML = planes.map(plan => {
    const planId = plan.id || plan.plan_id;
    const titulo = plan.nombre || plan.titulo || 'Tarea de estudio';
    const progreso = plan.progreso ?? plan.porcentaje ?? 0;
    const estado = plan.estado || 'PENDIENTE';

    // SVG según el estado o tipo
    const svgIcono = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>`;

    // Renderizar barra de progreso si tiene avance, o estado en texto si está sin empezar
    let contenidoProgreso = '';
    if (progreso > 0) {
      const claseColor = progreso < 50 ? 'cyan' : '';
      contenidoProgreso = `
        <div class="progreso-wrapper">
          <div class="barra-progreso">
            <div class="progreso-fill ${claseColor}" style="width: ${progreso}%;"></div>
          </div>
          <span class="porcentaje">${progreso}%</span>
        </div>
      `;
    } else {
      contenidoProgreso = `<span class="estado-texto">${estado === 'PENDIENTE' ? 'Sin empezar' : estado}</span>`;
    }

    return `
      <div class="item-tarea" data-id="${planId}">
        <div class="icono-tarea">
          ${svgIcono}
        </div>
        <div class="info-tarea">
          <h3>${titulo}</h3>
          ${contenidoProgreso}
        </div>
        <button class="btn-flecha-tarea" aria-label="Ver detalles de ${titulo}" data-plan-id="${planId}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    `;
  }).join('');

  // Asignar eventos de clic a las flechas para navegar a la guía de detalle
  contenedorLista.querySelectorAll('.btn-flecha-tarea').forEach(boton => {
    boton.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-plan-id');
      if (id) {
        window.location.href = `guia-detalle.html?plan_id=${id}`;
      }
    });
  });
}