import { obtenerPlanesUsuarioBD } from '../servicios/planes.service.js';
import { obtenerTareasDelUsuario } from '../servicios/tareas.service.js';
import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerUsuarioConPerfil } from '../servicios/usuario.service.js';
import { obtenerEstadisticas, registrarRacha } from '../servicios/estadisticas.service.js';
import { obtenerProgresoTareas } from '../utilidades/progreso-tareas.js?v=reinicio-plan';

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
      renderizarPlanesEstudio([]);
    }
    await actualizarIndicadoresBackend(usuario);

  } catch (error) {
    console.error('Error al inicializar el Dashboard:', error);
    if (error.message === 'Auth session missing!') {
      window.location.href = 'login.html';
    }
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
    const completada = Boolean(plan.completada || plan.estado === 'COMPLETADO' || obtenerProgresoTareas()[String(planId)]?.completada);
    const progreso = completada ? 100 : plan.progreso ?? plan.porcentaje ?? 0;
    const estado = completada ? 'Completada' : plan.estado || 'PENDIENTE';

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
      <div class="item-tarea ${completada ? 'tarea-completada' : ''}" data-id="${planId}">
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

async function actualizarIndicadoresBackend(usuario) {
  let datos = {};
  if (usuario?.id) {
    try {
      await actualizarRachaDiaria(usuario.id);
      const respuesta = await obtenerEstadisticas(usuario.id);
      datos = respuesta?.estadisticas || respuesta?.data || respuesta || {};
    } catch (error) {
      console.warn('No se pudieron cargar las estadísticas:', error.message);
    }
  }
  const indicadores = {
    'dashboard-completadas': datos.tareas_completadas ?? 0,
    'dashboard-puntos': Math.max(Number(datos.puntos ?? 0), obtenerPuntosLocales()),
    'dashboard-racha': datos.racha ?? 0,
    'dashboard-mejor-racha': datos.mejor_racha ?? 0
  };
  Object.entries(indicadores).forEach(([id, valor]) => {
    const elemento = document.getElementById(id);
    if (elemento) elemento.textContent = valor;
  });
  actualizarDiasRacha(datos.racha);
}

function obtenerPuntosLocales() {
  return Object.values(obtenerProgresoTareas()).reduce((total, estado) => total + (estado?.completada ? Number(estado.puntos) || 10 : 0), 0);
}

async function actualizarRachaDiaria(usuarioId) {
  const clave = `lumi_racha_actualizada_${usuarioId}`;
  const fecha = new Date();
  const hoy = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  if (localStorage.getItem(clave) === hoy) return;

  try {
    await registrarRacha(usuarioId);
    localStorage.setItem(clave, hoy);
  } catch (error) {
    console.warn('No se pudo actualizar la racha:', error.message);
  }
}

function actualizarDiasRacha(racha) {
  const dias = document.querySelectorAll('.dias-racha-grid .dia-item');
  const diasActivos = Math.min(7, Math.max(0, Number(racha) || 0));
  const diaActual = (new Date().getDay() + 6) % 7;
  dias.forEach((dia, indice) => {
    const distancia = (diaActual - indice + 7) % 7;
    const activo = diasActivos > 0 && distancia < diasActivos;
    const circulo = dia.querySelector('.circulo-fuego');
    if (!circulo) return;
    dia.classList.toggle('activo', activo);
    circulo.classList.toggle('inactivo', !activo);
    circulo.innerHTML = activo ? '<img src="../assets/racha.png" alt="Día de racha activo">' : '';
  });
}
