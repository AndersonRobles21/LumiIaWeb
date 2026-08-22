/**
 * historial.js
 * Lógica de la página Historial
 */

import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerEstadisticas } from '../servicios/estadisticas.service.js';
import { obtenerHistorialIA } from '../servicios/ia.service.js';

document.addEventListener('DOMContentLoaded', async () => {
  await cargarResumen();
});

async function cargarResumen() {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario?.id) throw new Error('La sesión no está autenticada.');
    const [estadisticasRespuesta, historial] = await Promise.all([
      obtenerEstadisticas(usuario.id),
      obtenerHistorialIA(usuario.id),
    ]);
    const estadisticas = estadisticasRespuesta?.estadisticas || estadisticasRespuesta?.data || estadisticasRespuesta || {};

    const elCompletadas = document.getElementById('hist-completadas');
    const elRacha = document.getElementById('hist-racha');
    const elHoras = document.getElementById('hist-horas');

    if (elCompletadas) elCompletadas.textContent = estadisticas.tareas_completadas ?? 0;
    if (elRacha) elRacha.textContent = estadisticas.racha ?? 0;
    if (elHoras) elHoras.textContent = `${estadisticas.horas_estudio ?? 0}h`;

    const lista = document.getElementById('lista-historial');
    if (!lista) return;

    if (historial.length === 0) {
      lista.innerHTML = `
      <div class="historial-vacio">
        <p>Aún no hay actividad registrada.</p>
      </div>
    `;
      return;
    }

    const recientes = [...historial].reverse().slice(0, 10);

    lista.innerHTML = recientes.map(plan => `
    <a class="historial-item" href="guia-detalle.html?plan_id=${encodeURIComponent(plan.id || plan.plan_id || '')}">
      <div class="historial-estado completada">📚</div>
      <div class="historial-info">
        <span class="historial-titulo">${plan.nombre || plan.titulo || plan.metodo_estudio || 'Plan de estudio'}</span>
        <span class="historial-meta">
          ${plan.metodo_estudio || ''}
          ${plan.fecha_creacion ? ` · ${plan.fecha_creacion}` : ''}
        </span>
      </div>
    </a>
  `).join('');
  } catch (error) {
    alert(`No se pudo cargar el historial: ${error.message}`);
  }
}
