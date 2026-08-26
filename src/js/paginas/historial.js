/**
 * historial.js
 * Lógica de la página Historial
 */

import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerEstadisticas } from '../servicios/estadisticas.service.js';
import { obtenerHistorialIA } from '../servicios/ia.service.js';
import { obtenerTareasDelUsuario, actualizarEstadoTarea } from '../servicios/tareas.service.js';

document.addEventListener('DOMContentLoaded', async () => {
  await cargarResumen();
});

async function cargarResumen() {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario?.id) throw new Error('La sesión no está autenticada.');
    const [estadisticasRespuesta, historial, tareas] = await Promise.all([
      obtenerEstadisticas(usuario.id),
      obtenerHistorialIA(usuario.id),
      obtenerTareasDelUsuario(usuario.id),
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

    lista.innerHTML = recientes.map(plan => {
      const planId = plan.id || plan.plan_id || '';
      const planTareas = tareas.filter(tarea => String(tarea.plan_id || tarea.plan_estudio_id || '') === String(planId));
      return `
    <div class="historial-item">
      <a href="guia-detalle.html?plan_id=${encodeURIComponent(plan.id || plan.plan_id || '')}">
        <div class="historial-estado completada">📚</div>
        <div class="historial-info">
          <span class="historial-titulo">${escapar(plan.nombre || plan.titulo || plan.metodo_estudio || 'Plan de estudio')}</span>
          <span class="historial-meta">${escapar(plan.metodo_estudio || '')}${plan.fecha_creacion ? ` · ${escapar(plan.fecha_creacion)}` : ''}</span>
        </div>
      </a>
      ${planTareas.length ? `<ul class="historial-subtareas">${planTareas.map(tarea => `<li><label><input type="checkbox" data-tarea-id="${escapar(tarea.id)}" ${tarea.completada ? 'checked' : ''}> ${escapar(tarea.nombre || tarea.titulo)}</label></li>`).join('')}</ul>` : ''}
    </div>
  `;
    }).join('');
    lista.querySelectorAll('[data-tarea-id]').forEach(control => control.addEventListener('click', event => event.stopPropagation()));
    lista.querySelectorAll('[data-tarea-id]').forEach(control => control.addEventListener('change', async () => {
      try { await actualizarEstadoTarea(control.dataset.tareaId, control.checked); }
      catch (error) { control.checked = !control.checked; alert(`No se pudo actualizar la subtarea: ${error.message}`); }
    }));
  } catch (error) {
    alert(`No se pudo cargar el historial: ${error.message}`);
  }
}

function escapar(valor) { return String(valor ?? '').replace(/[&<>'"]/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[caracter])); }
