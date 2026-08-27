/**
 * tareas.js
 * Lógica de la página Mis Tareas
 */

import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { eliminarTarea, obtenerTareasDelUsuario } from '../servicios/tareas.service.js';
import { eliminarPlanEstudioBD, eliminarPlanPorActividadBD, obtenerPlanesUsuarioBD } from '../servicios/planes.service.js?v=todas-eliminar';
import { eliminarProgresoPlan, obtenerProgresoTareas } from '../utilidades/progreso-tareas.js';

let tareas = [];
let filtroActual = 'todas';
const eliminacionesEnCurso = new Set();

document.addEventListener('DOMContentLoaded', async () => {
  await cargarTareas();
  inicializarFiltros();
  renderizarTareas();
});

async function cargarTareas() {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario?.id) throw new Error('La sesión no está autenticada.');
    const [tareasBackend, respuestaPlanes] = await Promise.all([obtenerTareasDelUsuario(usuario.id), obtenerPlanesUsuarioBD(usuario.id)]);
    const planes = Array.isArray(respuestaPlanes) ? respuestaPlanes : [];
    const actividadesConTarea = new Set(tareasBackend.map(tarea => String(tarea.actividad_id)).filter(Boolean));
    const progreso = obtenerProgresoTareas();
    const tareasDePlanes = planes.flatMap(plan => (plan.actividades || []).filter(actividad => !actividadesConTarea.has(String(actividad.id))).map(actividad => ({
      id: `plan-${plan.id}`,
      planId: plan.id,
      esPlan: true,
      titulo: actividad.titulo || plan.nombre || 'Tarea de estudio',
      descripcion: actividad.descripcion || plan.descripcion || '',
      fecha: actividad.fecha || plan.fecha_entrega || '',
      completada: Boolean(plan.completada || plan.estado === 'COMPLETADO' || progreso[String(plan.id)]?.completada),
    })));
    tareas = [...tareasBackend.map(tarea => ({ ...tarea, esPlan: false })), ...tareasDePlanes];
  } catch (error) {
    alert(`No se pudieron cargar las tareas: ${error.message}`);
    tareas = [];
  }
}

function inicializarFiltros() {
  const botonesFiltro = document.querySelectorAll('.filtro');

  botonesFiltro.forEach(boton => {
    boton.addEventListener('click', () => {
      botonesFiltro.forEach(b => b.classList.remove('activo'));
      boton.classList.add('activo');

      filtroActual = boton.dataset.filtro;
      renderizarTareas();
    });
  });
}

function renderizarTareas() {
  const contenedor = document.getElementById('lista-tareas');
  if (!contenedor) return;

  // Filtrar
  let tareasFiltradas = [...tareas];

  if (filtroActual === 'pendientes') {
    tareasFiltradas = tareas.filter(t => !t.completada);
  } else if (filtroActual === 'completadas') {
    tareasFiltradas = tareas.filter(t => t.completada);
  }

  // Si no hay tareas
  if (tareasFiltradas.length === 0) {
    contenedor.innerHTML = `
      <div class="tareas-vacio">
        <p>No tienes tareas ${filtroActual === 'todas' ? 'todavía' : 'en este filtro'}.</p>
        <a href="agregar-tarea.html">Crear una tarea</a>
      </div>
    `;
    return;
  }

  // Renderizar tarjetas
  contenedor.innerHTML = tareasFiltradas.map(tarea => {
    const completadaClass = tarea.completada ? 'completada' : '';

    return `
      <div class="tarea-card ${completadaClass}" data-id="${tarea.id}">
        <div class="tarea-ilustracion">
          <img src="../assets/tarea.png" alt="">
        </div>
        <div class="tarea-contenido">
          <h3 class="tarea-titulo">${escapar(tarea.titulo)}</h3>
          ${tarea.descripcion ? `<p class="tarea-descripcion">${escapar(tarea.descripcion)}</p>` : ''}
          <div class="tarea-meta">
            ${tarea.actividad?.fecha || tarea.fecha ? `<span class="tarea-fecha">${tarea.actividad?.fecha || tarea.fecha}</span>` : ''}
          </div>
        </div>
        <button type="button" class="btn-eliminar-tarea" data-id="${escapar(tarea.id)}" aria-label="Eliminar tarea" title="Eliminar tarea">Eliminar</button>
      </div>
    `;
  }).join('');
  contenedor.querySelectorAll('.btn-eliminar-tarea').forEach(boton => boton.addEventListener('click', async () => {
    const id = boton.dataset.id;
    const tarea = tareas.find(item => String(item.id) === id);
    if (!tarea || eliminacionesEnCurso.has(id) || !confirm(`¿Eliminar "${tarea.titulo}"?`)) return;
    eliminacionesEnCurso.add(id);
    boton.disabled = true;
    try {
      if (tarea.esPlan) {
        await eliminarPlanEstudioBD(tarea.planId);
        eliminarProgresoPlan(tarea.planId);
      } else {
        const actividadId = tarea.actividad_id ?? tarea.actividadId ?? tarea.actividad?.id;
        if (actividadId) {
          const planId = await eliminarPlanPorActividadBD(actividadId);
          eliminarProgresoPlan(planId);
        } else {
          await eliminarTarea(tarea.id);
        }
      }
      await cargarTareas();
      renderizarTareas();
    } catch (error) {
      boton.disabled = false;
      alert(`No se pudo eliminar la tarea: ${error.message}`);
    } finally {
      eliminacionesEnCurso.delete(id);
    }
  }));
}

function escapar(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caracter]);
}
