import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerEstadisticas } from '../servicios/estadisticas.service.js';
import { obtenerGamificacionLocal, obtenerLogrosLocales } from '../utilidades/progreso-tareas.js';

let logrosDisponibles = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario?.id) return;
    const resumen = await obtenerEstadisticas(usuario.id);
    const datos = resumen?.data || resumen || {};
    const local = obtenerGamificacionLocal();
    const hayProgresoLocal = local.tareas_completadas > 0 || local.puntos > 0;
    const puntos = hayProgresoLocal ? local.puntos : datos.puntos ?? datos.points;
    const xpActual = datos.xp ?? datos.xp_actual ?? datos.experience;
    const nivel = datos.nivel ?? datos.level;
    const progreso = datos.progreso ?? datos.progress;
    const completadas = hayProgresoLocal ? local.tareas_completadas : datos.tareas_completadas ?? datos.completed_tasks;
    const racha = hayProgresoLocal ? local.racha : datos.racha ?? datos.streak;
    const mejorRacha = hayProgresoLocal ? local.mejor_racha : datos.mejor_racha ?? datos.best_streak;
    establecerTexto('puntos', puntos);
    establecerTexto('xp-actual', xpActual);
    establecerTexto('nivel', nivel);
    establecerTexto('progreso', progreso == null ? null : `${progreso}%`);
    establecerTexto('completadas', completadas);
    establecerTexto('racha', racha == null ? 'Racha no disponible.' : `${racha} días consecutivos.`);
    establecerTexto('racha-numero', racha);
    establecerTexto('mejor-racha', mejorRacha);
    const barra = document.getElementById('barra-progreso');
    if (barra && Number.isFinite(Number(progreso))) barra.value = Math.max(0, Math.min(100, Number(progreso)));
    renderizarLogros(hayProgresoLocal ? obtenerLogrosLocales() : datos.logros ?? datos.achievements ?? datos.medallas ?? datos.badges);
  } catch (error) {
    console.warn('No se pudieron cargar las recompensas:', error.message);
  }
});

window.addEventListener('lumi:progreso-actualizado', () => window.location.reload());

function renderizarLogros(logros) {
  const contenedor = document.getElementById('logros');
  const contador = document.getElementById('contador-logros');
  if (!Array.isArray(logros)) return;
  logrosDisponibles = logros;
  const desbloqueados = logros.filter(estaDesbloqueado).length;
  contador.textContent = `${desbloqueados}/${logros.length}`;
  if (!logros.length) return;
  contenedor.innerHTML = logros.map((logro, index) => {
    const desbloqueado = estaDesbloqueado(logro);
    const nombre = escapar(logro.nombre ?? logro.name ?? 'Nombre no disponible');
    return `<button class="insignia ${desbloqueado ? '' : 'bloqueada'}" type="button" data-logro-index="${index}" aria-pressed="false"><span class="insignia-icono">${desbloqueado ? '✦' : '◇'}</span><strong>${nombre}</strong><small>${desbloqueado ? 'Desbloqueada' : 'Bloqueada'}</small></button>`;
  }).join('');
  contenedor.querySelectorAll('[data-logro-index]').forEach(insignia => insignia.addEventListener('click', () => seleccionarLogro(Number(insignia.dataset.logroIndex))));
}

function seleccionarLogro(indice) {
  const logro = logrosDisponibles[indice];
  if (!logro) return;
  document.querySelectorAll('.insignia').forEach(insignia => insignia.setAttribute('aria-pressed', String(insignia.dataset.logroIndex === String(indice))));
  establecerTexto('inspector-nombre', logro.nombre ?? logro.name ?? 'Nombre no disponible');
  establecerTexto('inspector-descripcion', logro.descripcion ?? logro.description ?? 'Descripción no disponible.');
  const desbloqueado = estaDesbloqueado(logro);
  establecerTexto('inspector-estado', `Estado: ${desbloqueado ? 'Desbloqueada' : 'Bloqueada'}`);
  const recompensa = logro.recompensa ?? logro.reward;
  establecerTexto('inspector-recompensa', recompensa == null ? 'Recompensa: No disponible' : `Recompensa: ${recompensa}`);
  establecerTexto('inspector-xp', `XP: ${logro.xp ?? logro.experience ?? 'No disponible'}`);
  establecerTexto('inspector-fecha', `Fecha de obtención: ${logro.fecha_obtencion ?? logro.obtained_at ?? logro.unlocked_at ?? 'No disponible'}`);
}

function estaDesbloqueado(logro) {
  return Boolean(logro.desbloqueado ?? logro.unlocked ?? logro.obtenido ?? ['desbloqueada', 'desbloqueado', 'obtenida', 'obtenido'].includes(String(logro.estado ?? '').toLowerCase()));
}

function establecerTexto(id, valor) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.textContent = valor == null || valor === '' ? 'No disponible' : valor;
}

function escapar(valor) {
  return String(valor).replace(/[&<>"']/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[caracter]);
}
