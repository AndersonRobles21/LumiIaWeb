/**
 * tareas.js
 * Lógica de la página Mis Tareas
 * Por ahora usa localStorage (temporal)
 */

console.log('tareas.js cargado');

let tareas = [];
let filtroActual = 'todas';

document.addEventListener('DOMContentLoaded', () => {
  cargarTareas();
  inicializarFiltros();
  renderizarTareas();
});

function cargarTareas() {
  const guardadas = localStorage.getItem('lumi_tareas');
  tareas = guardadas ? JSON.parse(guardadas) : [];
  console.log('Tareas cargadas:', tareas);
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
    const prioridadClass = `prioridad-${tarea.prioridad}`;
    const completadaClass = tarea.completada ? 'completada' : '';

    return `
      <div class="tarea-card ${completadaClass}" data-id="${tarea.id}">
        <div class="tarea-check">
          <input type="checkbox" ${tarea.completada ? 'checked' : ''} onchange="toggleCompletada(${tarea.id})">
        </div>
        <div class="tarea-contenido">
          <h3 class="tarea-titulo">${tarea.titulo}</h3>
          ${tarea.descripcion ? `<p class="tarea-descripcion">${tarea.descripcion}</p>` : ''}
          <div class="tarea-meta">
            <span class="tarea-prioridad ${prioridadClass}">${tarea.prioridad}</span>
            ${tarea.fecha ? `<span class="tarea-fecha">📅 ${tarea.fecha}</span>` : ''}
            ${tarea.metodo ? `<span class="tarea-metodo">🎯 ${tarea.metodo}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Función global para el checkbox
window.toggleCompletada = function(id) {
  const index = tareas.findIndex(t => t.id === id);
  if (index === -1) return;

  tareas[index].completada = !tareas[index].completada;
  localStorage.setItem('lumi_tareas', JSON.stringify(tareas));
  renderizarTareas();
};
