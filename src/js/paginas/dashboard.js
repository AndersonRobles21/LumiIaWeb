/**
 * dashboard.js
 * Lógica del Dashboard
 * Por ahora usa localStorage (temporal)
 */

console.log('dashboard.js cargado');

document.addEventListener('DOMContentLoaded', () => {
  actualizarResumen();
});

function actualizarResumen() {
  const tareas = JSON.parse(localStorage.getItem('lumi_tareas') || '[]');

  const completadas = tareas.filter(t => t.completada).length;
  const pendientes = tareas.filter(t => !t.completada).length;
  const total = tareas.length;

  // Actualizar los números en las tarjetas
  const tarjetas = document.querySelectorAll('.tarjeta-resumen');

  if (tarjetas.length >= 4) {
    // Tareas completadas
    tarjetas[0].querySelector('.tarjeta-numero').textContent = completadas;

    // Tareas pendientes
    tarjetas[1].querySelector('.tarjeta-numero').textContent = pendientes;

    // Racha de días (por ahora dejamos 0, más adelante lo calculamos)
    tarjetas[2].querySelector('.tarjeta-numero').textContent = 0;

    // Tiempo de estudio (por ahora 0h)
    tarjetas[3].querySelector('.tarjeta-numero').textContent = '0h';
  }

  console.log(`Resumen → Completadas: ${completadas} | Pendientes: ${pendientes} | Total: ${total}`);
}
