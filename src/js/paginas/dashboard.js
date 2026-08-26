/**
 * dashboard.js
 * Lógica del Dashboard
 */

import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerTareasDelUsuario } from '../servicios/tareas.service.js';
import { obtenerEstadisticas } from '../servicios/estadisticas.service.js';

document.addEventListener('DOMContentLoaded', async () => {
  await actualizarResumen();
});

async function actualizarResumen() {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario?.id) throw new Error('La sesión no está autenticada.');
    const [estadisticasRespuesta, tareas] = await Promise.all([
      obtenerEstadisticas(usuario.id),
      obtenerTareasDelUsuario(usuario.id),
    ]);
    const estadisticas = estadisticasRespuesta?.estadisticas || estadisticasRespuesta?.data?.estadisticas || estadisticasRespuesta?.data || estadisticasRespuesta || {};

    const completadas = estadisticas.tareas_completadas ?? tareas.filter(t => t.completada).length;
    const pendientes = tareas.filter(t => !t.completada).length;
    const racha = estadisticas.racha ?? 0;
    const xpBackend = estadisticas.xp ?? estadisticas.XP ?? estadisticas.puntos ?? estadisticas.points ?? estadisticas.experiencia_total;
    const puntos = xpBackend === undefined || xpBackend === null ? completadas * 50 : Number(xpBackend);

    const tarjetas = document.querySelectorAll('.tarjeta-resumen');

    if (tarjetas.length >= 4) {
      tarjetas[0].querySelector('.tarjeta-numero').textContent = completadas;
      tarjetas[1].querySelector('.tarjeta-numero').textContent = pendientes;
      tarjetas[2].querySelector('.tarjeta-numero').textContent = racha;
      tarjetas[3].querySelector('.tarjeta-numero').textContent = puntos;
    }
    const saludo = document.querySelector('.dashboard-saludo h1');
    if (saludo) saludo.textContent = `¡Hola, ${usuario.user_metadata?.nombre || usuario.email?.split('@')[0] || 'Usuario'}!`;
  } catch (error) {
    alert(`No se pudo cargar el resumen: ${error.message}`);
  }
}
