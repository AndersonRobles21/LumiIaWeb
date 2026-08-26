import { obtenerUsuarioActual } from '../servicios/autenticacion.service.js';
import { obtenerEstadisticas } from '../servicios/estadisticas.service.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const usuario = await obtenerUsuarioActual();
    if (!usuario?.id) return;
    const resumen = await obtenerEstadisticas(usuario.id);
    const datos = resumen?.estadisticas || resumen?.data?.estadisticas || resumen?.data || resumen || {};
    const completadas = Number(datos.tareas_completadas ?? datos.completed_tasks ?? 0);
    const xpBackend = datos.xp ?? datos.XP ?? datos.puntos ?? datos.points ?? datos.experiencia_total;
    const puntos = xpBackend === undefined || xpBackend === null ? completadas * 50 : Number(xpBackend);
    const nivel = Number(datos.nivel ?? datos.level ?? Math.max(1, Math.floor(puntos / 500) + 1));
    const progreso = Number(datos.progreso ?? datos.progress ?? (puntos % 500) / 5);
    const racha = Number(datos.racha ?? datos.streak ?? 0);
    document.getElementById('puntos').textContent = puntos;
    document.getElementById('nivel').textContent = nivel;
    document.getElementById('progreso').textContent = `${Math.round(progreso)}%`;
    document.getElementById('completadas').textContent = completadas;
    document.getElementById('racha').textContent = `Racha actual: ${racha} días.`;
    document.getElementById('racha-dias').textContent = `${racha} ${racha === 1 ? 'día' : 'días'}`;
    document.getElementById('xp-actual').textContent = `${puntos} XP`;
    document.getElementById('xp-barra-progreso').style.width = `${Math.min(100, Math.max(0, progreso))}%`;
    document.getElementById('xp-siguiente').textContent = `${Math.max(0, 500 - (puntos % 500))} XP para el siguiente nivel`;

    const logros = Array.isArray(datos.logros) ? datos.logros : crearLogros(completadas);
    renderizarLogros(logros);
  } catch (error) {
    console.warn('No se pudieron cargar las recompensas:', error.message);
  }
});

function crearLogros(completadas) {
  return [
    { id: 'primera-tarea', nombre: 'Primera tarea', descripcion: 'Completa tu primera tarea.', icono: '✦', desbloqueado: completadas >= 1, fecha: completadas >= 1 ? 'Conseguido' : null },
    { id: 'en-marcha', nombre: 'En marcha', descripcion: 'Completa 5 tareas.', icono: '◈', desbloqueado: completadas >= 5, fecha: completadas >= 5 ? 'Conseguido' : null },
    { id: 'constante', nombre: 'Constante', descripcion: 'Completa 10 tareas.', icono: '◎', desbloqueado: completadas >= 10, fecha: completadas >= 10 ? 'Conseguido' : null },
    { id: 'maestro', nombre: 'Maestro', descripcion: 'Completa 20 tareas.', icono: '◇', desbloqueado: completadas >= 20, fecha: completadas >= 20 ? 'Conseguido' : null },
  ];
}

function renderizarLogros(logros) {
  const contenedor = document.getElementById('logros');
  if (!contenedor) return;
  contenedor.innerHTML = logros.map((logro, indice) => `<button type="button" class="insignia-boton ${logro.desbloqueado ? '' : 'bloqueada'}" data-logro="${indice}"><span>${logro.icono || '✦'}</span><small>${escapar(logro.nombre || 'Logro')}</small></button>`).join('');
  document.getElementById('contador-logros').textContent = `${logros.filter(logro => logro.desbloqueado).length}/20 logros`;
  document.getElementById('insignias-contador').textContent = `${logros.filter(logro => logro.desbloqueado).length} desbloqueadas`;
  const seleccionar = indice => { document.querySelectorAll('.insignia-boton').forEach((boton, posicion) => boton.classList.toggle('seleccionada', posicion === indice)); const logro = logros[indice]; document.getElementById('inspector-insignia').textContent = logro.icono || '✦'; document.getElementById('inspector-nombre').textContent = logro.nombre || 'Logro'; document.getElementById('inspector-descripcion').textContent = logro.descripcion || 'Sin descripción disponible.'; document.getElementById('inspector-recompensa').textContent = `+${logro.xp ?? 50} XP`; document.getElementById('inspector-fecha').textContent = logro.fecha || 'Pendiente'; document.getElementById('inspector-estado').textContent = logro.desbloqueado ? 'Desbloqueado' : 'Pendiente'; };
  contenedor.querySelectorAll('[data-logro]').forEach(boton => boton.addEventListener('click', () => seleccionar(Number(boton.dataset.logro))));
  if (logros.length) seleccionar(0);
}

function escapar(valor) { return String(valor ?? '').replace(/[&<>'"]/g, caracter => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[caracter])); }
