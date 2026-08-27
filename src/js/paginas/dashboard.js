import { obtenerPlanesUsuarioBD } from '../servicios/planes.service.js';
import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerUsuarioConPerfil } from '../servicios/usuario.service.js';
import { estaTareaCompletada, obtenerEstadoTareaLocal, obtenerGamificacionLocal } from '../utilidades/progreso-tareas.js';

document.addEventListener('DOMContentLoaded', async () => {
  await inicializarDashboard();
});

/**
 * Carga los datos del usuario y sus planes de estudio
 */
async function inicializarDashboard() {
  try {
    // 1. Obtener la sesión del usuario actual desde Supabase Auth
    const usuario = await obtenerUsuarioActual();

    // 2. Personalizar el saludo con el nombre del usuario
    await actualizarSaludo(usuario);

    // 3. Cargar la lista de tareas / planes de estudio
    if (usuario) {
      const planes = await obtenerPlanesUsuarioBD(usuario.id);
      renderizarPlanesEstudio(planes);
    } else {
      // Fallback: cargar desde localStorage si aún no hay sesión activa en Supabase
      const tareasLocales = JSON.parse(localStorage.getItem('lumi_tareas') || '[]');
      renderizarPlanesEstudio(tareasLocales);
    }
    actualizarIndicadoresLocales();

  } catch (error) {
    console.error('Error al inicializar el Dashboard:', error);
  }
}

/**
 * Actualiza el encabezado con el nombre del estudiante
 */
async function actualizarSaludo(usuario) {
  const tituloSaludo = document.querySelector('.dashboard-saludo h1');
  if (!tituloSaludo) return;

  if (usuario) {
    let datos = usuario;
    try {
      const respuesta = await obtenerUsuarioConPerfil(usuario.id);
      const envoltura = respuesta?.data || respuesta || {};
      const perfil = envoltura.perfil || envoltura.perfil_estudio || {};
      const usuarioBackend = envoltura.usuario || envoltura.user || envoltura;
      datos = { ...usuario, ...usuarioBackend, ...perfil };
    } catch (error) {
      console.warn('No se pudo cargar el nombre del perfil:', error.message);
    }
    const nombre = [datos.nombre, datos.apellido].filter(Boolean).join(' ') ||
                   datos.user_metadata?.full_name ||
                   datos.email?.split('@')[0] ||
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

  const planesUnicos = [...new Map(planes.filter(plan => plan?.id).map(plan => [String(plan.id), plan])).values()];
  contenedorLista.innerHTML = planesUnicos.map(plan => {
    const planId = plan.id || plan.plan_id;
    const titulo = plan.nombre || plan.titulo || 'Tarea de estudio';
    const completadaLocal = estaTareaCompletada(planId) || obtenerEstadoTareaLocal(planId, plan.completada);
    const progreso = completadaLocal ? 100 : plan.progreso ?? plan.porcentaje ?? 0;
    const estado = completadaLocal ? '✅ Completada' : plan.estado || 'PENDIENTE';

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
      <div class="item-tarea ${completadaLocal ? 'tarea-completada' : ''}" data-id="${planId}">
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

  // Asignar eventos de clic a las flechas para abrir el plan en Historial IA
  contenedorLista.querySelectorAll('.btn-flecha-tarea').forEach(boton => {
    boton.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-plan-id');
      if (id) {
        window.location.href = `historial.html?plan_id=${encodeURIComponent(id)}`;
      }
    });
  });
}

function actualizarIndicadoresLocales() {
  const datos = obtenerGamificacionLocal();
  const indicadores = {
    'dashboard-completadas': datos.tareas_completadas,
    'dashboard-puntos': datos.puntos,
    'dashboard-racha': datos.racha,
    'dashboard-mejor-racha': datos.mejor_racha
  };
  Object.entries(indicadores).forEach(([id, valor]) => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
  });
  actualizarDiasRacha(datos.racha);
}

function actualizarDiasRacha(racha) {
  const dias = document.querySelectorAll('.dias-racha-grid .dia-item');
  const diasActivos = Math.min(7, Math.max(0, Number(racha) || 0));
  dias.forEach((dia, indice) => {
    dia.classList.toggle('activo', indice >= 7 - diasActivos);
    dia.querySelector('.circulo-fuego')?.classList.toggle('inactivo', indice < 7 - diasActivos);
  });
}

window.addEventListener('lumi:progreso-actualizado', actualizarIndicadoresLocales);
window.addEventListener('lumi:tarea-estado-actualizado', () => inicializarDashboard());