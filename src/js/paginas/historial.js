/**
 * historial.js
 * Lógica temporal de la página Historial
 * Por ahora usa localStorage (simulación)
 */

console.log('historial.js cargado');

document.addEventListener('DOMContentLoaded', () => {
  cargarResumen();
});

function cargarResumen() {
  const tareas = JSON.parse(localStorage.getItem('lumi_tareas') || '[]');

  const completadas = tareas.filter(t => t.completada).length;
  const pendientes = tareas.filter(t => !t.completada).length;

  // Actualizar números
  const elCompletadas = document.getElementById('hist-completadas');
  const elRacha = document.getElementById('hist-racha');
  const elHoras = document.getElementById('hist-horas');

  if (elCompletadas) elCompletadas.textContent = completadas;
  if (elRacha) elRacha.textContent = 0; // Más adelante lo calculamos
  if (elHoras) elHoras.textContent = '0h';

  // Lista de actividad (temporal)
  const lista = document.getElementById('lista-historial');
  if (!lista) return;

  if (tareas.length === 0) {
    lista.innerHTML = `
      <div class="historial-vacio">
        <p>Aún no hay actividad registrada.</p>
      </div>
    `;
    return;
  }

  // Mostrar las últimas tareas
  const recientes = [...tareas].reverse().slice(0, 10);

  lista.innerHTML = recientes.map(tarea => `
    <div class="historial-item">
      <div class="historial-estado ${tarea.completada ? 'completada' : 'pendiente'}">
        ${tarea.completada ? '✅' : '🕒'}
      </div>
      <div class="historial-info">
        <span class="historial-titulo">${tarea.titulo}</span>
        <span class="historial-meta">
          ${tarea.completada ? 'Completada' : 'Pendiente'}
          ${tarea.fecha ? ` · ${tarea.fecha}` : ''}
        </span>
      </div>
    </div>
  `).join('');
}
