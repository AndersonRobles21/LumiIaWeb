import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerEstadisticas } from '../servicios/estadisticas.service.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario?.id) return;
    const resumen = await obtenerEstadisticas(usuario.id);
    const datos = resumen?.data || resumen || {};
    document.getElementById('puntos').textContent = datos.puntos ?? datos.points ?? 0;
    document.getElementById('nivel').textContent = datos.nivel ?? datos.level ?? 1;
    document.getElementById('progreso').textContent = `${datos.progreso ?? datos.progress ?? 0}%`;
    document.getElementById('completadas').textContent = datos.tareas_completadas ?? datos.completed_tasks ?? 0;
    document.getElementById('racha').textContent = `Racha actual: ${datos.racha ?? datos.streak ?? 0} días.`;
  } catch (error) {
    console.warn('No se pudieron cargar las recompensas:', error.message);
  }
});
