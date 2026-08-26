/**
 * tareas.js
 * Lógica de la página Mis Tareas
 */

import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerTareasDelUsuario, actualizarEstadoTarea } from '../servicios/tareas.service.js';
import { registrarTareaEstadistica } from '../servicios/estadisticas.service.js';

let tareas = [];
let filtroActual = 'todas';
const actualizacionesEnCurso = new Set();

document.addEventListener('DOMContentLoaded', async () => {
  await cargarTareas();
  inicializarFiltros();
  renderizarTareas();
});

async function cargarTareas() {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario?.id) throw new Error('La sesión no está autenticada.');
    tareas = await obtenerTareasDelUsuario(usuario.id);
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
    const prioridadClass = tarea.prioridad ? `prioridad-${tarea.prioridad}` : '';
    const completadaClass = tarea.completada ? 'completada' : '';

    return `
      <div class="tarea-card ${completadaClass}" data-id="${tarea.id}">
        <div class="tarea-check">
          <input type="checkbox" ${tarea.completada ? 'checked' : ''} onchange="toggleCompletada(${JSON.stringify(tarea.id)})">
        </div>
        <div class="tarea-contenido">
          <h3 class="tarea-titulo">${tarea.nombre}</h3>
          ${tarea.descripcion ? `<p class="tarea-descripcion">${tarea.descripcion}</p>` : ''}
          <div class="tarea-meta">
            <span class="tarea-prioridad ${prioridadClass}">${tarea.prioridad || ''}</span>
            ${tarea.fecha_entrega ? `<span class="tarea-fecha">📅 ${tarea.fecha_entrega}</span>` : ''}
            ${tarea.metodo ? `<span class="tarea-metodo">🎯 ${tarea.metodo}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Función global para el checkbox
window.toggleCompletada = async function(id) {
  const index = tareas.findIndex(t => t.id === id);
  if (index === -1 || actualizacionesEnCurso.has(id)) return;

  const estadoAnterior = tareas[index].completada;
  actualizacionesEnCurso.add(id);
  try {
    const estadoNuevo = !estadoAnterior;
    const respuesta = await actualizarEstadoTarea(id, estadoNuevo);
    if (estadoNuevo && !respuesta?.estadisticas && !respuesta?.stats && !respuesta?.progreso) {
      const usuario = await obtenerUsuarioActual();
      await registrarTareaEstadistica(usuario.id);
    }
    tareas[index].completada = estadoNuevo;
    renderizarTareas();
  } catch (error) {
    alert(`No se pudo actualizar la tarea: ${error.message}`);
    renderizarTareas();
  } finally {
    actualizacionesEnCurso.delete(id);
  }
};
